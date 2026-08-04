// Integration tests for the seat-matrix feature: the IPU seed publishes the
// college→branch matrix, students can list + fetch it, unknown exams 404, and
// the data is internally consistent (total = general + mq everywhere).
// Run: node tests/seatMatrix.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const app = require("../app");
const request = require("supertest")(app);
const User = require("../src/models/userModel");
const generateToken = require("../src/utils/generateToken");
const { ensureIpuSeatMatrixSeeded } = require("../src/config/seedIpuSeatMatrix");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    // An admin must exist for the seed to attribute the matrix.
    const admin = await User.create({ name: "Boss", email: "boss@oneleet.local", role: "admin", isVerified: true });
    const student = await User.create({ name: "Riya", email: "riya@test.com", role: "student", isVerified: true });
    const studentToken = generateToken(student._id);

    // ---- Seed is idempotent ------------------------------------------------
    await ensureIpuSeatMatrixSeeded();
    await ensureIpuSeatMatrixSeeded(); // second run must not duplicate
    const SeatMatrix = require("../src/models/seatMatrixModel");
    assert.strictEqual(await SeatMatrix.countDocuments({ examCode: "ipu-leet" }), 1, "exactly one IPU matrix");
    ok("IPU seat matrix seeds exactly once (idempotent)");

    // ---- Unauthenticated is rejected --------------------------------------
    assert.strictEqual((await request.get("/api/seat-matrix")).status, 401);
    ok("listing requires authentication (401)");

    // ---- Index lists the IPU matrix ---------------------------------------
    const index = await request.get("/api/seat-matrix").set(...auth(studentToken));
    assert.strictEqual(index.status, 200);
    const ipu = (index.body.matrices || []).find((m) => m.examCode === "ipu-leet");
    assert.ok(ipu, "index includes ipu-leet");
    assert.strictEqual(ipu.totalColleges, 21, "21 colleges");
    assert.ok(ipu.totalSeats > 1000, "reports a sizeable seat total");
    ok(`index lists IPU matrix (${ipu.totalColleges} colleges, ${ipu.totalSeats} seats)`);

    // ---- Full matrix: shape, ordering, integrity --------------------------
    const res = await request.get("/api/seat-matrix/ipu-leet").set(...auth(studentToken));
    assert.strictEqual(res.status, 200);
    const m = res.body.matrix;
    assert.strictEqual(m.colleges.length, 21);
    assert.strictEqual(m.session, "2026-27");

    // Colleges are alphabetical.
    const names = m.colleges.map((c) => c.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    assert.deepStrictEqual(names, sorted, "colleges are alphabetical");

    // Every branch satisfies total = general + mq; totals add up to the header.
    let seatSum = 0;
    let branchCount = 0;
    for (const c of m.colleges) {
        for (const b of c.branches) {
            assert.strictEqual(b.total, b.general + b.mq, `${c.name} / ${b.branch}: total = general + mq`);
            seatSum += b.total;
            branchCount += 1;
        }
    }
    assert.strictEqual(seatSum, m.totalSeats, "header seat total matches the sum of branches");
    assert.strictEqual(branchCount, m.totalBranches, "header branch count matches");
    assert.strictEqual(branchCount, 132, "132 college×branch rows");
    ok(`full matrix is consistent (${branchCount} branches, ${seatSum} seats, total = general + mq)`);

    // A spot check on a known college (MAIT has the largest intake).
    const mait = m.colleges.find((c) => /Maharaja Agrasen/.test(c.name));
    assert.ok(mait && mait.branches.length === 12, "MAIT has 12 branches");
    ok("spot-check: Maharaja Agrasen Institute of Technology has 12 branches");

    // ---- Unknown exam 404 --------------------------------------------------
    const missing = await request.get("/api/seat-matrix/does-not-exist").set(...auth(studentToken));
    assert.strictEqual(missing.status, 404);
    ok("unknown exam returns 404");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} seat-matrix checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
