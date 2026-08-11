const { processJustWentLive, processClosingSoon } = require("../services/test/testLifecycleService");

// Fires the test-lifecycle notifications (audit M4): "went live" the minute a
// scheduled test opens, and "2 hours left" as a competitive test nears close.
// Same best-effort ticker shape as the leaderboard scheduler — a missed tick
// (free-tier sleep) is caught by the next one, and every send is idempotent, so
// nothing double-fires. Skipped entirely under the test harness.
const INTERVAL_MS = 60 * 1000; // once a minute
let timer = null;
let running = false;

async function tick() {
    if (running) return; // never overlap runs
    running = true;
    try {
        const live = await processJustWentLive();
        const closing = await processClosingSoon();
        if (live > 0) console.log(`[test-lifecycle] notified ${live} test(s) went live`);
        if (closing > 0) console.log(`[test-lifecycle] sent ${closing} "2 hours left" alert(s)`);
    } catch (err) {
        console.error("[test-lifecycle] scheduler tick failed:", err.message);
    } finally {
        running = false;
    }
}

function startTestLifecycleScheduler() {
    if (timer) return;
    if (process.env.NODE_ENV === "test") return; // never run under the test harness
    timer = setInterval(tick, INTERVAL_MS);
    if (timer.unref) timer.unref();
    const kick = setTimeout(tick, 6000); // catch anything due while we were asleep
    if (kick.unref) kick.unref();
}

function stopTestLifecycleScheduler() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

module.exports = { startTestLifecycleScheduler, stopTestLifecycleScheduler };
