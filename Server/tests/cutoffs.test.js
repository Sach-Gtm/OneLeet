// Integration tests for the cut-off feature: the IPU seed publishes round-wise
// cut-offs, students can list + fetch them, categories decode to full-form
// labels, colleges are alphabetical, ranks are sane, and unknown exams 404.
// Run: node tests/cutoffs.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const app = require("../app");
const request = require("supertest")(app);
const User = require("../src/models/userModel");
const generateToken = require("../src/utils/generateToken");
const { ensureIpuCutoffsSeeded } = require("../src/config/seedIpuCutoffs");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const admin = await User.create({ name: "Boss", email: "boss@oneleet.local", role: "admin", isVerified: true });
    const student = await User.create({ name: "Riya", email: "riya@test.com", role: "student", isVerified: true });
    const studentToken = generateToken(student._id);

    // ---- Seed idempotent ---------------------------------------------------
    await ensureIpuCutoffsSeeded();
    await ensureIpuCutoffsSeeded();
    const CutoffMatrix = require("../src/models/cutoffMatrixModel");
    assert.strictEqual(await CutoffMatrix.countDocuments({ examCode: "ipu-leet" }), 1, "exactly one IPU cut-off doc");
    ok("IPU cut-offs seed exactly once (idempotent)");

    // ---- Auth required -----------------------------------------------------
    assert.strictEqual((await request.get("/api/cutoffs")).status, 401);
    ok("listing requires authentication (401)");

    // ---- Index -------------------------------------------------------------
    const index = await request.get("/api/cutoffs").set(...auth(studentToken));
    assert.strictEqual(index.status, 200);
    const ipu = (index.body.cutoffs || []).find((c) => c.examCode === "ipu-leet");
    assert.ok(ipu, "index includes ipu-leet");
    assert.strictEqual(ipu.totalRounds, 3, "3 rounds");
    ok("index lists IPU cut-offs (3 rounds)");

    // ---- Full matrix -------------------------------------------------------
    const res = await request.get("/api/cutoffs/ipu-leet").set(...auth(studentToken));
    assert.strictEqual(res.status, 200);
    const c = res.body.cutoff;
    assert.strictEqual(c.rounds.length, 3);
    assert.ok(c.legend.length >= 5, "legend decodes categories");

    // Legend uses full-form labels, not raw codes.
    const general = c.legend.find((l) => l.code === "OPNOHS");
    assert.ok(general && /General/i.test(general.label), "OPNOHS decodes to General");
    const minority = c.legend.find((l) => l.code === "NOSMAI");
    assert.ok(minority && /Sikh/i.test(minority.label), "NOSMAI decodes to Sikh Minority");
    ok("categories decode to full-form labels (General, Sikh Minority, …)");

    // Round 1 colleges alphabetical.
    const r1 = c.rounds[0];
    const names = r1.colleges.map((x) => x.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    assert.deepStrictEqual(names, sorted, "round-1 colleges are alphabetical");

    // Every rank is sane: opening <= closing.
    let cells = 0;
    for (const rnd of c.rounds)
        for (const col of rnd.colleges)
            for (const b of col.branches)
                for (const cell of b.cells) {
                    assert.ok(cell.min <= cell.max, `${col.name}/${b.branch}/${cell.code}: opening <= closing`);
                    cells += 1;
                }
    assert.ok(cells > 500, "hundreds of rank cells present");
    ok(`all ${cells} rank cells are sane (opening <= closing)`);

    // Spot check: BPIT CSE, round 1, General (Delhi) closing rank = 293.
    const bpit = r1.colleges.find((x) => /Bhagwan Parshuram/.test(x.name));
    const cse = bpit.branches.find((b) => /Computer Science & Engineering/.test(b.branch));
    const opnohs = cse.cells.find((x) => x.code === "OPNOHS");
    assert.strictEqual(opnohs.max, 293, "BPIT CSE R1 General closing rank is 293");
    ok("spot-check: BPIT CSE round-1 General closing rank = 293");

    // ---- Unknown 404 -------------------------------------------------------
    assert.strictEqual((await request.get("/api/cutoffs/nope").set(...auth(studentToken))).status, 404);
    ok("unknown exam returns 404");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} cut-off checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
