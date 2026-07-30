// Mirror of the server's config/testFormats.js — the fixed test sizes a mentor
// can pick, each locked to an exact question count. "Warm-up" is the Quick Shot
// entry level. Used by the Studio picker and the student Tests filters/badges.
export const TEST_FORMATS = {
    "quick-shot": { key: "quick-shot", label: "Quick Shot", tag: "Warm-up", emoji: "⚡", count: 10 },
    practice: { key: "practice", label: "Practice Mode", emoji: "📘", count: 25 },
    challenge: { key: "challenge", label: "Challenge Mode", emoji: "🔥", count: 40 },
    survivor: { key: "survivor", label: "Survivor Mode", emoji: "🛡️", count: 50 },
    "real-exam": { key: "real-exam", label: "Real Exam Mode", emoji: "🎯", count: 100 },
};

export const TEST_FORMAT_KEYS = ["quick-shot", "practice", "challenge", "survivor", "real-exam"];

export const formatMeta = (key) => TEST_FORMATS[key] || null;
