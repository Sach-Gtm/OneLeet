// Tests for the account block-list: removing a user blocks their email from
// re-registering (email + the same check guards Google sign-in), a Super Admin
// can manually block/unblock, and the Super Admin email can never be blocked.
// Run: node tests/blocklist.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
delete process.env.EMAIL_USER; // OTP off → register returns a token directly
delete process.env.EMAIL_PASS;
delete process.env.TURNSTILE_SECRET_KEY;

const app = require("../app");
const request = require("supertest")(app);
const User = require("../src/models/userModel");
const Blocklist = require("../src/models/blocklistModel");
const generateToken = require("../src/utils/generateToken");
const { SUPERADMIN_EMAIL } = require("../src/config/roles");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];
const register = (email) =>
    request.post("/api/auth/register").send({ name: "Someone", email, password: "secret123", phone: "9876543210" });

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const superAdmin = await User.create({
        name: "Boss", email: "boss@test.com", password: "secret123", phone: "9000000000",
        role: "superadmin", isVerified: true, authProvider: "local",
    });
    const superToken = generateToken(superAdmin._id);
    const victim = await User.create({
        name: "Victim", email: "victim@test.com", password: "secret123", phone: "9000000001",
        role: "student", isVerified: true, authProvider: "local",
    });

    // Removing a user blocks their email.
    const removed = await request.delete(`/api/admin/users/${victim._id}`).set(...auth(superToken));
    assert.strictEqual(removed.status, 200);
    assert.ok(/block/i.test(removed.body.message), "removal message mentions the block");
    assert.ok(await Blocklist.findOne({ email: "victim@test.com" }), "email added to block-list");
    ok("removing a user blocks their email");

    // ...so they can't re-register.
    const reReg = await register("victim@test.com");
    assert.strictEqual(reReg.status, 403, "blocked email can't register");
    assert.ok(/contact/i.test(reReg.body.message));
    ok("a removed/blocked email cannot re-register");

    // Super Admin unblocks → registration works again.
    const unblock = await request
        .post("/api/admin/blocklist/unblock")
        .set(...auth(superToken))
        .send({ email: "victim@test.com" });
    assert.strictEqual(unblock.status, 200);
    const reReg2 = await register("victim@test.com");
    assert.strictEqual(reReg2.status, 201, "unblocked email can register again");
    ok("Super Admin can unblock, restoring registration");

    // The Super Admin email can never be blocked.
    const blockSuper = await request
        .post("/api/admin/blocklist")
        .set(...auth(superToken))
        .send({ email: SUPERADMIN_EMAIL });
    assert.strictEqual(blockSuper.status, 400);
    ok("the Super Admin email can't be blocked");

    // Manual block of an arbitrary email prevents its registration.
    const manual = await request
        .post("/api/admin/blocklist")
        .set(...auth(superToken))
        .send({ email: "Spammer@Test.com", reason: "spam" });
    assert.strictEqual(manual.status, 200);
    const spamReg = await register("spammer@test.com"); // case-insensitive
    assert.strictEqual(spamReg.status, 403, "manual block is case-insensitive");
    ok("a manually-blocked email is blocked (case-insensitive)");

    // The list endpoint surfaces blocks.
    const list = await request.get("/api/admin/blocklist").set(...auth(superToken));
    assert.strictEqual(list.status, 200);
    assert.ok(list.body.blocklist.some((b) => b.email === "spammer@test.com"));
    ok("Super Admin can list the block-list");

    // A blocked email can't log in even if an account lingers.
    await User.create({
        name: "Ghost", email: "ghost@test.com", password: "secret123", phone: "9000000002",
        role: "student", isVerified: true, authProvider: "local",
    });
    await request.post("/api/admin/blocklist").set(...auth(superToken)).send({ email: "ghost@test.com" });
    const login = await request.post("/api/auth/login").send({ identifier: "ghost@test.com", password: "secret123" });
    assert.strictEqual(login.status, 403, "blocked email can't log in");
    ok("a blocked email is refused at login too");

    // A regular admin is NOT allowed to manage the block-list (super admin only).
    const admin = await User.create({
        name: "Admin", email: "admin@test.com", password: "secret123", phone: "9000000003",
        role: "admin", isVerified: true, authProvider: "local",
    });
    const adminList = await request.get("/api/admin/blocklist").set(...auth(generateToken(admin._id)));
    assert.strictEqual(adminList.status, 403, "only the Super Admin manages the block-list");
    ok("block-list management is Super-Admin only");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} block-list checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ BLOCKLIST TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
