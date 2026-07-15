const { processDueLeaderboards } = require("../services/leaderboard/leaderboardService");

// Best-effort ticker that publishes competitive leaderboards ~5 minutes after
// their window closes. On free-tier hosting the instance can sleep, so this is
// paired with a lazy fallback on read (getTestLeaderboard finalises on demand) —
// together they guarantee a board is always correct even if a tick is missed.
const INTERVAL_MS = 60 * 1000; // check once a minute
let timer = null;
let running = false;

async function tick() {
    if (running) return; // never overlap runs
    running = true;
    try {
        const n = await processDueLeaderboards();
        if (n > 0) console.log(`[leaderboard] finalised ${n} test leaderboard(s)`);
    } catch (err) {
        console.error("[leaderboard] scheduler tick failed:", err.message);
    } finally {
        running = false;
    }
}

function startLeaderboardScheduler() {
    if (timer) return;
    if (process.env.NODE_ENV === "test") return; // never run under the test harness
    timer = setInterval(tick, INTERVAL_MS);
    if (timer.unref) timer.unref(); // don't keep the process alive on its own
    // Catch anything that closed while the instance was asleep/restarting.
    const kick = setTimeout(tick, 5000);
    if (kick.unref) kick.unref();
}

function stopLeaderboardScheduler() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

module.exports = { startLeaderboardScheduler, stopLeaderboardScheduler };
