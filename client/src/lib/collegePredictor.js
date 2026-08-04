// Pure logic for the "college predictor": given a candidate's rank, category and
// region, decide which cut-off cells they'd clear. Kept separate from the UI so
// it's easy to reason about (and reuse).

export const PREDICTOR_CATEGORIES = [
    { key: "general", label: "General / Open" },
    { key: "obc", label: "OBC (Non-Creamy Layer)" },
    { key: "ews", label: "EWS" },
    { key: "sc", label: "Scheduled Caste (SC)" },
    { key: "st", label: "Scheduled Tribe (ST)" },
    { key: "defence", label: "Defence (CW)" },
    { key: "pwd", label: "PwD / Divyang" },
    { key: "minority", label: "Sikh Minority" },
];

export const PREDICTOR_REGIONS = [
    { key: "delhi", label: "Delhi Region" },
    { key: "outside", label: "Outside Delhi" },
];

export const catLabel = (key) =>
    (PREDICTOR_CATEGORIES.find((c) => c.key === key) || {}).label || "General / Open";
export const regionLabel = (key) =>
    (PREDICTOR_REGIONS.find((r) => r.key === key) || {}).label || "Delhi Region";

// Which cut-off category codes a candidate can use. Everyone can take the open
// (General) seats for their region; a reserved candidate ALSO gets their own
// category. (This IPU dataset only carries Outside-Delhi columns for General and
// SC; the other reservations are Delhi-region only.)
export function eligibleCodes(category, region) {
    const open = region === "outside" ? "OPNOOS" : "OPNOHS";
    const codes = new Set([open]);
    switch (category) {
        case "obc":
            codes.add("BCNOHS");
            break;
        case "ews":
            codes.add("EWNOHS");
            break;
        case "sc":
            codes.add(region === "outside" ? "SCNOOS" : "SCNOHS");
            break;
        case "st":
            codes.add("STNOHS");
            break;
        case "defence":
            codes.add("OPDFHS");
            break;
        case "pwd":
            codes.add("OPPHHS");
            break;
        case "minority":
            codes.add("NOSMAI");
            break;
        default:
            break; // general → open seats only
    }
    return codes;
}

// The best (most-margin) eligible cell a rank clears in a branch, or null. `safe`
// when the rank clears comfortably (≤ 85% of the closing rank), else it's close.
export function evaluateBranch(cells, rank, codes) {
    let best = null;
    for (const c of cells || []) {
        if (!codes.has(c.code)) continue;
        if (rank <= c.max) {
            if (!best || c.max > best.max) best = c;
        }
    }
    if (!best) return null;
    return { code: best.code, min: best.min, max: best.max, safe: rank <= best.max * 0.85 };
}
