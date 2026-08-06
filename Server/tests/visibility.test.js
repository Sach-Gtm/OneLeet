// The enrollment-model visibility invariant, unit-tested against the pure
// exams.js helpers (no DB). The load-bearing rule: a student with ZERO exam
// codes sees ONLY universal content — never everything. Run: node tests/visibility.test.js
const assert = require("assert");
const { visibilityQuery, isVisibleTo } = require("../src/config/exams");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };

// A Mongo $or clause matches a content item's `targets` iff at least one branch does.
const matches = (clause, targets) => {
    if (Object.keys(clause).length === 0) return true; // {} = no filter (staff bypass)
    return clause.$or.some((b) => {
        if (b.targets && b.targets.$exists === false) return targets === undefined;
        if (b.targets && b.targets.$size === 0) return Array.isArray(targets) && targets.length === 0;
        if (b.targets === "all") return Array.isArray(targets) && targets.includes("all");
        if (b.targets && b.targets.$in) return Array.isArray(targets) && targets.some((t) => b.targets.$in.includes(t));
        return false;
    });
};

const UNIVERSAL = [undefined, [], ["all"]];
const IPU = ["ipu-leet"];
const DTU = ["dtu-nsut-leet"];

(async () => {
    // ── visibilityQuery ──────────────────────────────────────────────────────

    // Zero codes → a real filter (NOT {}), matching only universal content.
    const zero = visibilityQuery([]);
    assert.ok(zero.$or && Object.keys(zero).length === 1, "empty codes returns an $or filter, not {}");
    for (const t of UNIVERSAL) assert.ok(matches(zero, t), `zero-code student sees universal ${JSON.stringify(t)}`);
    assert.ok(!matches(zero, IPU), "zero-code student does NOT see IPU-targeted content");
    assert.ok(!matches(zero, DTU), "zero-code student does NOT see DTU-targeted content");
    assert.deepStrictEqual(visibilityQuery(undefined), zero, "undefined behaves like empty");
    ok("zero enrollments → universal content ONLY (never everything)");

    // N codes → universal + those codes, but not other exams'.
    const ipuView = visibilityQuery(IPU);
    for (const t of UNIVERSAL) assert.ok(matches(ipuView, t), `IPU student still sees universal ${JSON.stringify(t)}`);
    assert.ok(matches(ipuView, IPU), "IPU student sees IPU-targeted content");
    assert.ok(matches(ipuView, ["ipu-leet", "dtu-nsut-leet"]), "content targeted at IPU+DTU is seen by an IPU student");
    assert.ok(!matches(ipuView, DTU), "IPU student does NOT see DTU-only content");
    ok("N enrollments → universal + those exams' content, nothing else");

    // Legacy "all" → see everything (kept until the backfill migration re-enrolls).
    assert.deepStrictEqual(visibilityQuery(["all"]), {}, "'all' collapses to no filter (see everything)");
    assert.deepStrictEqual(visibilityQuery(["all", "ipu-leet"]), {}, "'all' anywhere in the list means see everything");
    ok("legacy 'all' still means see-everything (migration compatibility)");

    // ── isVisibleTo (the in-memory mirror) ───────────────────────────────────

    // Zero codes → only universal items are visible.
    for (const t of UNIVERSAL) assert.strictEqual(isVisibleTo(t, []), true, `universal ${JSON.stringify(t)} visible to zero-code student`);
    assert.strictEqual(isVisibleTo(IPU, []), false, "IPU-targeted item hidden from a zero-code student");
    assert.strictEqual(isVisibleTo(IPU, undefined), false, "undefined codes behave like empty");
    ok("isVisibleTo: zero codes → only universal items are visible");

    // N codes.
    assert.strictEqual(isVisibleTo(IPU, IPU), true, "IPU item visible to IPU student");
    assert.strictEqual(isVisibleTo(DTU, IPU), false, "DTU item hidden from IPU student");
    assert.strictEqual(isVisibleTo([], IPU), true, "universal item visible to IPU student");
    ok("isVisibleTo: N codes → universal + matching-target items");

    // Legacy "all".
    assert.strictEqual(isVisibleTo(DTU, ["all"]), true, "'all' student sees any exam's item");
    ok("isVisibleTo: legacy 'all' sees everything");

    console.log(`\n✅ All ${passed} visibility-invariant checks passed`);
    process.exit(0);
})().catch((e) => {
    console.error("\n❌ VISIBILITY TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
