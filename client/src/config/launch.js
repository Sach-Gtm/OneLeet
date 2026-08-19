// Single source of truth for launch dates. Change them here and the countdown,
// the pricing gate and the scholarship splash all follow.

// Early-bird pricing unlocks at this instant (IST). Until then, /pricing shows
// the animated countdown + scholarship registration instead of prices.
export const LAUNCH_AT = new Date("2026-08-25T22:00:00+05:30");
export const LAUNCH_TS = LAUNCH_AT.getTime();
export const hasLaunched = () => Date.now() >= LAUNCH_TS;

// The All-India Scholarship Test itself.
export const SCHOLARSHIP_TEST_DATE = "30 Aug 2026";
// The promo splash stops showing after the test day (end of 30 Aug 2026, IST).
export const SCHOLARSHIP_HIDE_AFTER = new Date("2026-08-30T23:59:59+05:30").getTime();
