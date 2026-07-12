// Integration tests for the staff question bank. Run with:
//   node tests/question.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const app = require("../app");
const request = require("supertest");
const User = require("../src/models/userModel");
const generateToken = require("../src/utils/generateToken");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    const agent = request(app);

    const mkToken = async (role, email) => {
        const u = await User.create({ name: role, email, password: "secret123", role });
        return generateToken(u._id);
    };
    const teacher = await mkToken("teacher", "t@test.com");
    const student = await mkToken("student", "s@test.com");
    const bearer = (t) => "Bearer " + t;

    const goodQ = { text: "2 + 2 = ?", options: ["3", "4", "5"], correctIndex: 1, subject: "Maths", difficulty: "easy" };

    let r = await agent.post("/api/questions").send(goodQ);
    assert.strictEqual(r.status, 401, "no auth must 401");
    ok("rejects unauthenticated (401)");

    r = await agent.post("/api/questions").set("Authorization", bearer(student)).send(goodQ);
    assert.strictEqual(r.status, 403, "students must be forbidden");
    ok("students cannot add questions (403)");

    r = await agent.post("/api/questions").set("Authorization", bearer(teacher)).send(goodQ);
    assert.strictEqual(r.status, 201, "teacher create should 201");
    assert.strictEqual(r.body.question.correctIndex, 1);
    assert.strictEqual(r.body.question.options.length, 3);
    ok("teacher adds a question (201) with the right correct option");

    // Empty options are dropped and correctIndex re-mapped by the client, but the
    // server also guards an out-of-range index.
    r = await agent.post("/api/questions").set("Authorization", bearer(teacher))
        .send({ text: "x", options: ["a", "b"], correctIndex: 5 });
    assert.strictEqual(r.status, 400, "out-of-range correctIndex must 400");
    ok("out-of-range correctIndex rejected (400)");

    r = await agent.post("/api/questions").set("Authorization", bearer(teacher))
        .send({ text: "x", options: ["only one"], correctIndex: 0 });
    assert.strictEqual(r.status, 400, "fewer than 2 options must 400");
    ok("fewer than 2 options rejected (400)");

    r = await agent.get("/api/questions").set("Authorization", bearer(teacher));
    assert.strictEqual(r.status, 200);
    assert.ok(r.body.total >= 1, "bank should list the created question");
    ok("list returns the question bank");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} question checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
