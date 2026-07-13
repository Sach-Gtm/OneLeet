// Integration tests for the contact/requests inbox: public submissions are
// stored, and staff can list / filter / mark-read / delete them (others can't).
// Run: node tests/contact.inbox.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
// No email configured → OTP off, and contact email just no-ops (still stored).
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;
delete process.env.BREVO_API_KEY;

const app = require("../app");
const request = require("supertest")(app);
const User = require("../src/models/userModel");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    await User.create({
        name: "Boss", email: "boss@oneleet.local", phone: "9990001111",
        password: "adminpass", role: "admin", isVerified: true, authProvider: "local",
    });
    const adminToken = (await request.post("/api/auth/login")
        .send({ identifier: "boss@oneleet.local", password: "adminpass" })).body.token;

    // A regular student (should NOT reach the inbox)
    const stu = await request.post("/api/auth/register").send({
        name: "Stu", email: "stu@x.com", phone: "8887776666",
        password: "studentpass", confirmPassword: "studentpass", role: "student",
    });
    const studentToken = stu.body.token;

    // --- public submissions get stored -------------------------------------
    const cb = await request.post("/api/contact/callback")
        .send({ name: "Riya", phone: "9812345678", reason: "Fees query" });
    assert.strictEqual(cb.status, 200, "callback should succeed");
    ok("callback request is accepted");

    const bug = await request.post("/api/contact/bug")
        .send({ name: "Amit", email: "amit@x.com", description: "Login button broken" });
    assert.strictEqual(bug.status, 200, "bug should succeed");
    ok("bug report is accepted");

    const contrib = await request.post("/api/contact/contribution")
        .send({ name: "Neha", email: "neha@x.com", type: "PYQ", description: "2023 paper" });
    assert.strictEqual(contrib.status, 200);
    ok("contribution is accepted");

    // --- auth gate ----------------------------------------------------------
    const noAuth = await request.get("/api/contact/inbox");
    assert.strictEqual(noAuth.status, 401, "inbox needs a login");
    ok("inbox rejects anonymous access (401)");

    const asStudent = await request.get("/api/contact/inbox").set(...auth(studentToken));
    assert.strictEqual(asStudent.status, 403, "students can't see the inbox");
    ok("inbox rejects non-staff (403)");

    // --- staff can list everything -----------------------------------------
    const list = await request.get("/api/contact/inbox").set(...auth(adminToken));
    assert.strictEqual(list.status, 200);
    assert.strictEqual(list.body.total, 3, "all three submissions stored");
    assert.strictEqual(list.body.unread, 3, "all unread initially");
    assert.strictEqual(list.body.counts.callback, 1);
    assert.strictEqual(list.body.counts.bug, 1);
    assert.strictEqual(list.body.counts.contribution, 1);
    ok("admin sees all 3 requests with correct counts");

    // newest first
    assert.strictEqual(list.body.items[0].type, "contribution", "newest is first");
    ok("items are newest-first");

    // --- filter by type -----------------------------------------------------
    const bugsOnly = await request.get("/api/contact/inbox?type=bug").set(...auth(adminToken));
    assert.strictEqual(bugsOnly.body.total, 1);
    assert.strictEqual(bugsOnly.body.items[0].message, "Login button broken");
    ok("filtering by type=bug returns only bugs");

    // --- mark read ----------------------------------------------------------
    const target = list.body.items[0]._id;
    const read = await request.patch(`/api/contact/inbox/${target}/read`).set(...auth(adminToken)).send({});
    assert.strictEqual(read.status, 200);
    assert.strictEqual(read.body.item.read, true);
    const afterRead = await request.get("/api/contact/inbox").set(...auth(adminToken));
    assert.strictEqual(afterRead.body.unread, 2, "unread drops after marking read");
    ok("marking read decrements the unread count");

    // --- delete -------------------------------------------------------------
    const del = await request.delete(`/api/contact/inbox/${target}`).set(...auth(adminToken));
    assert.strictEqual(del.status, 200);
    const afterDel = await request.get("/api/contact/inbox").set(...auth(adminToken));
    assert.strictEqual(afterDel.body.total, 2, "delete removes the item");
    ok("deleting removes the submission");

    console.log(`\n✅ All ${passed} inbox checks passed`);
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
})().catch((e) => {
    console.error("❌ test failed:", e);
    process.exit(1);
});
