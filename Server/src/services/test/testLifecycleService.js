const Test = require("../../models/testModel");
const User = require("../../models/userModel");
const Attempt = require("../../models/attemptModel");
const Notification = require("../../models/notificationModel");
const { sendPushToUsers } = require("../push/webPushService");
const { sendMail } = require("../../utils/email");

// Test-lifecycle notifications (audit M4). Two moments matter to a student:
//   • a scheduled graded test just went LIVE     → in-app + web push
//   • a competitive test has ~2 HOURS LEFT        → in-app + web push + email
// Both fire EXACTLY ONCE via an atomic claim on a marker field (mirrors the
// leaderboard-finalize pattern), so ticks/restarts never double-send. Every
// delivery channel already exists and no-ops safely when unconfigured (push
// without VAPID, email without a provider) — the in-app bell always works.

const CLOSING_WINDOW_MS = 2 * 60 * 60 * 1000; // "2 hours left"
// "Went live" only looks back a short window, so a first deploy (or a long
// sleep) can't blast every already-open test at once — only genuinely-recent
// openings notify. The minute-by-minute scheduler + keep-awake ping keep this
// comfortably wider than normal tick gaps.
const LIVE_LOOKBACK_MS = 100 * 60 * 1000;

function siteUrl(path = "") {
    const base = (process.env.CLIENT_URL || "https://www.oneleet.in").replace(/\/$/, "");
    return `${base}${path}`;
}

// The students this test is FOR: universal tests reach everyone; targeted tests
// reach students enrolled in a matching exam (plus legacy "all"). Mirrors
// exams.visibilityQuery in reverse (test.targets → matching users).
async function recipientsForTest(test) {
    const targets = (test.targets || []).filter((t) => t && t !== "all");
    const q = { role: "student" };
    if (targets.length) q.exams = { $in: [...targets, "all"] };
    return User.find(q).select("_id email name");
}

// A scheduled graded test whose openAt just passed → "it's live, come take it".
async function processJustWentLive(now = Date.now()) {
    const due = await Test.find({
        mode: "test",
        status: "published",
        isPublished: true,
        liveNotifiedAt: null,
        openAt: { $ne: null, $lte: new Date(now), $gte: new Date(now - LIVE_LOOKBACK_MS) },
    });

    let count = 0;
    for (const test of due) {
        // Atomic claim: only the first caller past the marker sends.
        const claimed = await Test.findOneAndUpdate(
            { _id: test._id, liveNotifiedAt: null },
            { $set: { liveNotifiedAt: new Date() } },
            { returnDocument: "after" }
        );
        if (!claimed) continue; // lost the race — already notified

        try {
            const users = await recipientsForTest(test);
            const ids = users.map((u) => u._id);
            if (!ids.length) continue;

            const title = `📝 Live now: ${test.title}`.slice(0, 120);
            const body = `"${test.title}" is now live.${test.closeAt ? " Attempt it before it closes." : " Tap to attempt it."}`.slice(0, 1000);
            await Notification.create({
                title,
                body,
                type: "test-live",
                test: test._id,
                recipients: ids,
                createdBy: test.createdBy || undefined,
            });
            sendPushToUsers(ids, { title, body, url: `/tests/${test._id}` }).catch(() => {});
            count += 1;
        } catch (err) {
            console.error(`[test-lifecycle] live notify failed for ${test._id}:`, err.message);
        }
    }
    return count;
}

// A competitive test with ~2 hours to go → last-call reminder, to eligible
// students who HAVEN'T attempted yet (no point nudging someone who's done).
// In-app + push + email.
async function processClosingSoon(now = Date.now()) {
    const due = await Test.find({
        mode: "test",
        status: "published",
        closingSoonNotifiedAt: null,
        closeAt: { $gt: new Date(now), $lte: new Date(now + CLOSING_WINDOW_MS) },
    });

    let count = 0;
    for (const test of due) {
        const claimed = await Test.findOneAndUpdate(
            { _id: test._id, closingSoonNotifiedAt: null },
            { $set: { closingSoonNotifiedAt: new Date() } },
            { returnDocument: "after" }
        );
        if (!claimed) continue;

        try {
            const users = await recipientsForTest(test);
            const attempted = new Set(
                (await Attempt.find({ test: test._id }).select("user").lean()).map((a) => String(a.user))
            );
            const pending = users.filter((u) => !attempted.has(String(u._id)));
            const ids = pending.map((u) => u._id);
            if (!ids.length) continue;

            const title = `⏳ 2 hours left: ${test.title}`.slice(0, 120);
            const body = `Only about 2 hours left to attempt "${test.title}". Take it now to make the leaderboard.`.slice(0, 1000);
            await Notification.create({
                title,
                body,
                type: "test-closing",
                test: test._id,
                recipients: ids,
                createdBy: test.createdBy || undefined,
            });
            sendPushToUsers(ids, { title, body, url: `/tests/${test._id}` }).catch(() => {});

            // Email each pending student (best-effort; a no-op with no provider).
            const url = siteUrl(`/tests/${test._id}`);
            await Promise.allSettled(
                pending
                    .filter((u) => u.email)
                    .map((u) =>
                        sendMail({
                            to: u.email,
                            subject: `2 hours left: ${test.title}`,
                            html: `<p>Hi ${u.name || "there"},</p><p>Only about <b>2 hours</b> are left to attempt <b>${test.title}</b> on OneLeet.</p><p><a href="${url}">Attempt the test now</a> to make it onto the leaderboard.</p><p>— OneLeet</p>`,
                            text: `Only about 2 hours left to attempt "${test.title}" on OneLeet. Attempt it now: ${url}`,
                        }).catch(() => {})
                    )
            );
            count += 1;
        } catch (err) {
            console.error(`[test-lifecycle] closing notify failed for ${test._id}:`, err.message);
        }
    }
    return count;
}

module.exports = {
    CLOSING_WINDOW_MS,
    LIVE_LOOKBACK_MS,
    recipientsForTest,
    processJustWentLive,
    processClosingSoon,
};
