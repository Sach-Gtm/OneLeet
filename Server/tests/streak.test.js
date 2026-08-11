// Unit test for the streak day-math (utils/streak). No DB — pure logic. Covers
// the four bugs the audit's M1 was about: shared-field poisoning, no decay on
// read, UTC-vs-IST boundary, and advance-only-on-submit.
const assert = require("assert");
const { istDayKey, daysBetween, bumpStreak, liveStreak } = require("../src/utils/streak");

let passed = 0;
const ok = (label, cond) => {
    assert.ok(cond, label);
    console.log(`  ✓ ${label}`);
    passed += 1;
};

// A UTC instant; helper to build one.
const at = (iso) => new Date(iso);

// --- IST day boundary (the UTC-vs-IST bug) ---
// 2026-03-02T00:30:00Z is 06:00 IST on the 2nd.
ok("00:30 UTC maps to the IST day that already started", istDayKey(at("2026-03-02T00:30:00Z")) === "2026-03-02");
// 2026-03-01T20:00:00Z is 01:30 IST on the 2nd — still "the 2nd" for an Indian student.
ok("late-evening UTC is already tomorrow in IST", istDayKey(at("2026-03-01T20:00:00Z")) === "2026-03-02");
// 2026-03-01T18:00:00Z is 23:30 IST on the 1st.
ok("pre-18:30 UTC is still today in IST", istDayKey(at("2026-03-01T18:00:00Z")) === "2026-03-01");

ok("daysBetween counts calendar days", daysBetween("2026-03-01", "2026-03-03") === 2);

// --- bumpStreak across days ---
const s = {};
bumpStreak(s, at("2026-03-01T10:00:00Z"));
ok("first activity starts the streak at 1", s.streak === 1 && s.streakLastDay === "2026-03-01");

// same day again — no change (idempotent within a day; this is the heartbeat case)
const changed = bumpStreak(s, at("2026-03-01T15:00:00Z"));
ok("same-day activity does not advance or rewrite", changed === false && s.streak === 1);

// next IST day — advances to 2 (the branch that was dead code before)
bumpStreak(s, at("2026-03-02T09:00:00Z"));
ok("next day advances the streak", s.streak === 2 && s.streakLastDay === "2026-03-02");

// skip a day — resets to 1
bumpStreak(s, at("2026-03-04T09:00:00Z"));
ok("a missed day resets the streak to 1", s.streak === 1 && s.streakLastDay === "2026-03-04");

// --- liveStreak decay on read (the "not live" bug) ---
ok("streak reads live on its last active day", liveStreak(s, at("2026-03-04T20:00:00Z")) === 1);
ok("streak still shows the day after (can continue today)", liveStreak(s, at("2026-03-05T09:00:00Z")) === 1);
ok("streak reads 0 once two+ days lapse, without any write", liveStreak(s, at("2026-03-06T09:00:00Z")) === 0);
ok("a fresh user with no history reads 0", liveStreak({}, at("2026-03-06T09:00:00Z")) === 0);

console.log(`\n✅ All ${passed} streak checks passed`);
