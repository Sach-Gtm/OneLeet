// Verifies the C3 error-capture pipeline: a browser crash report is stored
// (attributed when logged in), server faults are captured, and the admin health
// panel can read them (with 24h counts) while students cannot.
// Run: node tests/telemetry.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const app = require("../app");
const request = require("supertest")(app);
const User = require("../src/models/userModel");
const ErrorLog = require("../src/models/errorLogModel");
const generateToken = require("../src/utils/generateToken");
const { saveError, logServerError } = require("../src/controllers/telemetry/telemetryController");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const admin = await User.create({ name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001", role: "superadmin", isVerified: true, authProvider: "local" });
    const student = await User.create({ name: "S", email: "s@t.com", password: "secret123", phone: "9000000002", role: "student", isVerified: true, authProvider: "local" });
    const adminT = generateToken(admin._id);
    const studentT = generateToken(student._id);

    // Anonymous browser crash report is accepted and stored.
    const anon = await request.post("/api/telemetry/client-error").send({ message: "boom on landing", stack: "Error: boom\n at x", url: "https://www.oneleet.in/" });
    assert.strictEqual(anon.status, 204, "anonymous client-error accepted (204)");
    const anonDoc = await ErrorLog.findOne({ message: "boom on landing" });
    assert.ok(anonDoc && anonDoc.source === "client", "stored as a client error");
    assert.strictEqual(anonDoc.user, undefined, "anonymous → no user attributed");
    ok("an anonymous browser crash is captured");

    // A logged-in crash is attributed to the user.
    await request.post("/api/telemetry/client-error").set(...auth(studentT)).send({ message: "crash in dashboard", stack: "Error: crash" });
    const userDoc = await ErrorLog.findOne({ message: "crash in dashboard" });
    assert.strictEqual(String(userDoc.user), String(student._id), "a signed-in crash is attributed to the student");
    ok("a signed-in crash is attributed to its user");

    // Server faults are captured (the central error handler calls this).
    await saveError({ source: "server", message: "db exploded", stack: "Error: db", statusCode: 500 });
    logServerError(new Error("route blew up"), { originalUrl: "/api/x", method: "GET", get: () => "curl" }, 500);
    await new Promise((r) => setTimeout(r, 60)); // logServerError is fire-and-forget
    assert.ok(await ErrorLog.findOne({ message: "db exploded", source: "server" }), "a server fault is captured");
    assert.ok(await ErrorLog.findOne({ message: "route blew up" }), "a thrown route error is captured");
    ok("server faults are captured");

    // Admin can read the health panel with 24h counts.
    const view = await request.get("/api/admin/errors").set(...auth(adminT));
    assert.strictEqual(view.status, 200, "admin can read errors");
    assert.ok(view.body.errors.length >= 4, "returns the captured errors");
    assert.ok(view.body.last24h.client >= 2 && view.body.last24h.server >= 2, "reports 24h counts by source");
    ok("the admin health panel lists errors with 24h counts");

    // Source filter works; students are locked out.
    const clientOnly = await request.get("/api/admin/errors?source=client").set(...auth(adminT));
    assert.ok(clientOnly.body.errors.every((e) => e.source === "client"), "?source=client filters to client errors");
    const denied = await request.get("/api/admin/errors").set(...auth(studentT));
    assert.strictEqual(denied.status, 403, "a student cannot read the error panel");
    ok("source filter works and the panel is staff-only");

    // --- Funnel analytics ---
    // Two anon browsers land; one registers (as the student) and pays.
    await request.post("/api/telemetry/event").send({ name: "land", anonId: "browserA" });
    await request.post("/api/telemetry/event").send({ name: "land", anonId: "browserB" });
    await request.post("/api/telemetry/event").send({ name: "land", anonId: "browserA" }); // dupe → still 1 identity
    await request.post("/api/telemetry/event").set(...auth(studentT)).send({ name: "register_done" });
    await request.post("/api/telemetry/event").set(...auth(studentT)).send({ name: "payment_done" });
    // Unknown event names are accepted-but-ignored (not stored).
    const ignored = await request.post("/api/telemetry/event").send({ name: "definitely_not_a_funnel_step" });
    assert.strictEqual(ignored.status, 204, "unknown events are accepted (204) but ignored");

    const fun = await request.get("/api/admin/funnel?days=7").set(...auth(adminT));
    assert.strictEqual(fun.status, 200, "admin can read the funnel");
    const step = (n) => fun.body.steps.find((s) => s.name === n);
    assert.strictEqual(step("land").count, 2, "two distinct identities landed (dupe collapsed)");
    assert.strictEqual(step("register_done").count, 1, "one registered");
    assert.strictEqual(step("payment_done").count, 1, "one paid");
    assert.strictEqual(step("register_done").pctOfTop, 50, "conversion vs top is computed (1/2 = 50%)");
    assert.strictEqual((await require("../src/models/eventModel").countDocuments({ name: "definitely_not_a_funnel_step" })), 0, "junk events are never stored");
    const funDenied = await request.get("/api/admin/funnel").set(...auth(studentT));
    assert.strictEqual(funDenied.status, 403, "a student cannot read the funnel");
    ok("the funnel counts distinct identities per step with conversion, staff-only");

    console.log(`\n✅ All ${passed} telemetry checks passed`);
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
