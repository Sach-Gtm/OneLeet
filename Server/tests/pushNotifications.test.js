// Verifies Web Push (background notifications): the VAPID public-key endpoint,
// storing/refreshing/removing a browser subscription, and the send service
// (fan-out + pruning of gone subscriptions), with the push transport mocked.
// Run: node tests/pushNotifications.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;

// Configure VAPID BEFORE requiring the app (config/webPush reads env at load).
const webpush = require("web-push");
const { publicKey, privateKey } = webpush.generateVAPIDKeys();
process.env.VAPID_PUBLIC_KEY = publicKey;
process.env.VAPID_PRIVATE_KEY = privateKey;
process.env.VAPID_SUBJECT = "mailto:test@oneleet.in";

const app = require("../app");
const request = require("supertest")(app);
const User = require("../src/models/userModel");
const PushSubscription = require("../src/models/pushSubscriptionModel");
const { sendPushToUsers, sendBroadcastPush } = require("../src/services/push/webPushService");
const generateToken = require("../src/utils/generateToken");
const auth = (t) => ["Authorization", `Bearer ${t}`];

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };

// Mock the actual network send so the test never hits a real push service.
let sent = [];
let failNext = null; // { statusCode } to simulate a gone subscription
webpush.sendNotification = async (sub, data) => {
    if (failNext) { const e = new Error("gone"); e.statusCode = failNext.statusCode; throw e; }
    sent.push({ endpoint: sub.endpoint, data });
    return {};
};

const sub = (endpoint) => ({ endpoint, keys: { p256dh: "p256dh-" + endpoint, auth: "auth-" + endpoint } });

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const user = await User.create({ name: "S", email: "s@t.com", password: "secret123", phone: "9000000001", role: "student", isVerified: true, authProvider: "local" });
    const token = generateToken(user._id);

    // VAPID public key is exposed (and marked enabled).
    const key = await request.get("/api/push/vapid-public-key");
    assert.strictEqual(key.status, 200);
    assert.strictEqual(key.body.enabled, true, "push reports enabled when VAPID is set");
    assert.strictEqual(key.body.publicKey, publicKey, "returns the configured public key");
    ok("exposes the VAPID public key + enabled flag");

    // Subscribe requires auth and a well-formed subscription.
    assert.strictEqual((await request.post("/api/push/subscribe").send(sub("https://push/a"))).status, 401, "subscribe needs auth");
    assert.strictEqual((await request.post("/api/push/subscribe").set(...auth(token)).send({ endpoint: "x" })).status, 400, "missing keys → 400");
    assert.strictEqual((await request.post("/api/push/subscribe").set(...auth(token)).send(sub("https://push/a"))).status, 201, "valid subscribe → 201");
    assert.strictEqual(await PushSubscription.countDocuments({ user: user._id }), 1, "one subscription stored");
    // Re-subscribing the same endpoint updates rather than duplicates.
    await request.post("/api/push/subscribe").set(...auth(token)).send(sub("https://push/a"));
    assert.strictEqual(await PushSubscription.countDocuments({ user: user._id }), 1, "re-subscribe is idempotent (upsert by endpoint)");
    // A second device.
    await request.post("/api/push/subscribe").set(...auth(token)).send(sub("https://push/b"));
    assert.strictEqual(await PushSubscription.countDocuments({ user: user._id }), 2, "a second device adds a subscription");
    ok("stores/refreshes a subscription (idempotent by endpoint, auth required)");

    // Fan-out: a targeted send reaches every subscription of the user.
    sent = [];
    await sendPushToUsers([user._id], { title: "Hi", body: "There", url: "/dashboard" });
    assert.strictEqual(sent.length, 2, "targeted send hits both devices");
    // Broadcast reaches everyone too.
    sent = [];
    await sendBroadcastPush({ title: "All", body: "Hands" });
    assert.strictEqual(sent.length, 2, "broadcast hits every subscription");
    ok("sends to a user's devices (targeted) and to everyone (broadcast)");

    // A gone subscription (410) is pruned automatically.
    failNext = { statusCode: 410 };
    await sendBroadcastPush({ title: "x", body: "y" });
    failNext = null;
    assert.strictEqual(await PushSubscription.countDocuments({}), 0, "410-gone subscriptions are pruned");
    ok("prunes subscriptions the push service reports as gone (410)");

    // Re-add, then unsubscribe removes it.
    await request.post("/api/push/subscribe").set(...auth(token)).send(sub("https://push/c"));
    await request.post("/api/push/unsubscribe").set(...auth(token)).send({ endpoint: "https://push/c" });
    assert.strictEqual(await PushSubscription.countDocuments({}), 0, "unsubscribe removes the subscription");
    ok("unsubscribe removes this browser's subscription");

    // Empty/no-target sends are safe no-ops.
    await sendPushToUsers([], { title: "n", body: "n" });
    ok("empty targeted send is a no-op (no throw)");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} web-push checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ WEB PUSH TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
