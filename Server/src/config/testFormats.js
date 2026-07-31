// The fixed test "formats" (a.k.a. modes) a staff member can pick when building
// a mock test. Each locks the test to an EXACT number of questions — a Quick
// Shot is always 10, a Real Exam always 100 — so no one can publish more or
// fewer. Shared by the studio controller (enforcement) and the seed.
//
// This is about SIZE. It's separate from the test's `mode` (test vs practice),
// which controls when answers are revealed.
const TEST_FORMATS = {
    "quick-shot": { key: "quick-shot", label: "Quick Shot", tag: "Warm-up", emoji: "⚡", count: 10 },
    practice: { key: "practice", label: "Oneleet Challenger", emoji: "📘", count: 25 },
    challenge: { key: "challenge", label: "Advance Practice", emoji: "🔥", count: 40 },
    survivor: { key: "survivor", label: "Master Practice", emoji: "🛡️", count: 50 },
    "real-exam": { key: "real-exam", label: "Exam Ready", emoji: "🎯", count: 100 },
};

// Order for pickers / filters.
const TEST_FORMAT_KEYS = ["quick-shot", "practice", "challenge", "survivor", "real-exam"];

// A valid format key, or null (a "custom" test with no locked count).
const normalizeFormat = (v) => (v && TEST_FORMATS[v] ? v : null);

// Required question count for a format, or null if the format is custom/unknown.
const formatCount = (v) => (TEST_FORMATS[v] ? TEST_FORMATS[v].count : null);

module.exports = { TEST_FORMATS, TEST_FORMAT_KEYS, normalizeFormat, formatCount };
