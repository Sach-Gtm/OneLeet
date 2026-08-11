// Streak day-math, done in IST (Asia/Kolkata). India is a fixed UTC+5:30 with
// no DST, but the API runs on Render in UTC — so "today" for a student in India
// is not the server's UTC day. We derive the day key by shifting the instant by
// +5:30 and reading the resulting calendar date. Every streak read/write goes
// through here so the boundary is consistent everywhere.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// "YYYY-MM-DD" for the IST calendar day containing `date`.
function istDayKey(date = new Date()) {
    return new Date(new Date(date).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

// Whole calendar days from day-key `a` to day-key `b` (b - a), each "YYYY-MM-DD".
function daysBetween(a, b) {
    return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

// Advance a stats sub-doc's streak for activity happening at `now`. Idempotent
// within an IST day (safe to call on every heartbeat). Anchored on its own
// `streakLastDay` field — NOT on `lastActiveAt`, which the heartbeat overwrites
// for a different purpose ("last seen"). Returns true if it changed anything, so
// callers can skip a DB write when nothing moved.
function bumpStreak(stats, now = new Date()) {
    const today = istDayKey(now);
    const lastDay = stats.streakLastDay || null;
    if (lastDay === today) {
        if (!stats.streak) {
            stats.streak = 1; // heal a 0/blank counter recorded earlier today
            return true;
        }
        return false;
    }
    if (lastDay && daysBetween(lastDay, today) === 1) {
        stats.streak = (stats.streak || 0) + 1; // yesterday → continue
    } else {
        stats.streak = 1; // first ever, or a gap of 2+ days → restart at 1
    }
    stats.streakLastDay = today;
    return true;
}

// The *live* streak to show on read: the stored value while the last active day
// is today or yesterday (still going), otherwise 0 (it has lapsed). This makes
// the displayed number reflect reality instead of freezing at the last write —
// a lapsed streak reads 0 immediately, without waiting for the next activity.
function liveStreak(stats, now = new Date()) {
    if (!stats || !stats.streakLastDay) return 0;
    const gap = daysBetween(stats.streakLastDay, istDayKey(now));
    return gap <= 1 ? stats.streak || 0 : 0; // today(0)/yesterday(1) alive; else lapsed
}

module.exports = { istDayKey, daysBetween, bumpStreak, liveStreak };
