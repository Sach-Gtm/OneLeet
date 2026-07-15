// AI cost controls — the one place to tune spend.
//
// The lever you asked for: free students get a small daily allowance, premium a
// large one, staff unlimited. A CACHED/repeat request is free and never counts
// against the quota, so the more students reuse popular generations, the less
// you pay.

// Daily AI generations per plan. Change these numbers anytime.
const DAILY_LIMITS = {
    free: 5,
    pro: 100,
};

// Reuse a generated response for this long. LEET MCQs/explanations are evergreen,
// so repeated requests ("5 moderate questions on Logic Gates") are served from
// cache — this is effectively a free, self-growing question bank.
const CACHE_TTL_DAYS = 30;

// Rough Gemini flash-lite pricing (USD per 1M tokens), used ONLY for the admin
// "estimated spend" dashboard. It's an estimate — update if you change model.
const COST_PER_MTOK = { input: 0.1, output: 0.4 };

// Hard cap on pasted/source input so a single request can't balloon token cost.
const MAX_INPUT_CHARS = 12000;

// The daily limit for a user, or null for "unlimited" (staff). Students on the
// premium (pro) plan get the pro allowance; everyone else the free one.
function dailyLimitFor(user) {
    if (!user) return DAILY_LIMITS.free;
    if (user.role && user.role !== "student") return null; // mentors/admins: unlimited
    return user.plan === "pro" ? DAILY_LIMITS.pro : DAILY_LIMITS.free;
}

module.exports = { DAILY_LIMITS, CACHE_TTL_DAYS, COST_PER_MTOK, MAX_INPUT_CHARS, dailyLimitFor };
