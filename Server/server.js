require("dotenv").config();

// Safety net: several protections (secure/SameSite cookies, HSTS, hidden 500
// error details, and NOT returning password-reset tokens in the API response)
// only engage when NODE_ENV === "production". Render does not set it for you —
// warn loudly if a hosted deploy is missing it so it can't ship silently downgraded.
if (process.env.NODE_ENV !== "production" && (process.env.RENDER || process.env.RENDER_EXTERNAL_URL)) {
    console.warn(
        "\n⚠️  NODE_ENV is not 'production' on a hosted deploy — set NODE_ENV=production in the " +
        "Render dashboard. Otherwise password-reset tokens are returned in API responses, secure " +
        "cookies + HSTS are disabled, and raw error details leak on 500s.\n"
    );
}

const app = require("./app");
const connectDB = require("./src/config/db");
const { saveError } = require("./src/controllers/telemetry/telemetryController");

// Crash safety-nets (audit C3): the process had none. Log + capture async faults
// that escape a request's try/catch so they're visible in the admin error panel
// instead of vanishing. Log-and-continue matches the app's availability posture
// (a rejected background promise shouldn't take down every in-flight student);
// if the process is ever truly unstable, Render's health checks recycle it.
process.on("unhandledRejection", (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    console.error("Unhandled promise rejection:", err);
    saveError({ source: "server", message: `unhandledRejection: ${err.message}`, stack: err.stack });
});
process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    saveError({ source: "server", message: `uncaughtException: ${err.message}`, stack: err.stack });
});
const bootstrapSuperadmin = require("./src/config/bootstrapSuperadmin");
const { startEmailHealthChecks } = require("./src/utils/email");
const { startKeepAwake } = require("./src/utils/keepAwake");
const { startLeaderboardScheduler } = require("./src/jobs/leaderboardScheduler");
const { startTestLifecycleScheduler } = require("./src/jobs/testLifecycleScheduler");
const { ensureExamsSeeded } = require("./src/config/exams");
const { ensureMentorsSeeded } = require("./src/config/seedMentors");
const { ensureMentorJourneysSeeded } = require("./src/config/seedMentorJourneys");
const { ensureTeamCofounderSeeded } = require("./src/config/seedTeamCofounder");
const { ensureSuccessStoriesSeeded } = require("./src/config/seedSuccessStories");
const { ensureIpuSyllabusSeeded } = require("./src/config/seedIpuSyllabus");
const { ensureIpuExamPatternSeeded } = require("./src/config/seedIpuExamPattern");
const { ensureIpuSeatMatrixSeeded } = require("./src/config/seedIpuSeatMatrix");
const { ensureIpuCutoffsSeeded } = require("./src/config/seedIpuCutoffs");
const { ensureAnalogyTestSeeded } = require("./src/config/seedAnalogyTest");
const { ensureReasoningQuickShotsSeeded, ensureQuickShotWindowsCleared } = require("./src/config/seedReasoningQuickShots");
const { ensureAnalogyMockTestsSeeded } = require("./src/config/seedAnalogyMockTests");
const { ensureClassificationMockTestsSeeded } = require("./src/config/seedClassificationMockTests");
const { ensureOddOneOutMockTestsSeeded } = require("./src/config/seedOddOneOutMockTests");
const { ensureReasoningTopicTestsSeeded } = require("./src/config/seedReasoningTopicTests");
const { ensureTestTopicsBackfilled } = require("./src/config/seedTestTopicBackfill");
const { ensureMechanicsTestsSeeded } = require("./src/config/seedMechanicsTests");
const { ensureMechanicsExamTestsSeeded } = require("./src/config/seedMechanicsExamTests");
const { ensureAppliedMathTestsSeeded } = require("./src/config/seedAppliedMathTests");
const { ensureAppliedMathAdvancedTestsSeeded } = require("./src/config/seedAppliedMathAdvancedTests");
const { ensureComputerAppTestsSeeded } = require("./src/config/seedComputerAppTests");
const { ensureDtuNsutMerged } = require("./src/config/seedMergeDtuNsut");
const { ensureDtuNsutSyllabusSeeded } = require("./src/config/seedDtuNsutSyllabus");
const { ensureLeet2024PyqSeeded } = require("./src/config/seedLeet2024Pyq");
const { ensureFoundationCoursesSeeded } = require("./src/config/seedFoundationCourses");
const { ensurePaidCoursesSeeded } = require("./src/config/seedPaidCourses");
const { ensureEnrollmentBackfill } = require("./src/config/seedEnrollmentBackfill");

// Provision the Super Admin out-of-band once the DB is up, seed the LEET exam
// catalog + founding mentors + IPU LEET syllabus and exam pattern on first run,
// then start the competitive-leaderboard ticker. The syllabus/pattern seeds are
// attributed to an admin, so they run after the Super Admin is provisioned.
connectDB().then(async () => {
    await bootstrapSuperadmin();
    // Seed the exam catalog, then fold the old split DTU/NSUT exams into the
    // single combined one (awaited in order so the merge sees a seeded catalog).
    await ensureExamsSeeded();
    await ensureDtuNsutMerged();
    // Awaited in order: the journeys migration must see the founding mentors the
    // base seed inserts (otherwise a fresh DB could double-create them).
    await ensureMentorsSeeded();
    await ensureMentorJourneysSeeded();
    await ensureTeamCofounderSeeded();
    ensureSuccessStoriesSeeded();
    ensureIpuSyllabusSeeded();
    ensureDtuNsutSyllabusSeeded();
    ensureIpuExamPatternSeeded();
    ensureIpuSeatMatrixSeeded();
    ensureIpuCutoffsSeeded();
    ensureAnalogyTestSeeded();
    ensureReasoningQuickShotsSeeded();
    ensureQuickShotWindowsCleared();
    ensureAnalogyMockTestsSeeded();
    ensureClassificationMockTestsSeeded();
    ensureOddOneOutMockTestsSeeded();
    ensureReasoningTopicTestsSeeded();
    ensureTestTopicsBackfilled();
    ensureMechanicsTestsSeeded();
    ensureMechanicsExamTestsSeeded();
    ensureAppliedMathTestsSeeded();
    ensureAppliedMathAdvancedTestsSeeded();
    ensureComputerAppTestsSeeded();
    ensureLeet2024PyqSeeded();
    // Publish the batches first, THEN backfill existing students onto them
    // (auto-enroll into matching batches; reset legacy "All LEET" users).
    await ensureFoundationCoursesSeeded();
    await ensurePaidCoursesSeeded();
    await ensureEnrollmentBackfill();
    startLeaderboardScheduler();
    startTestLifecycleScheduler();
});

// Probe email deliverability so OTP only turns on when mail can actually be
// sent from this host (and turns itself back off if that changes).
startEmailHealthChecks();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`App is running on the Port ${PORT}`);
    // Keep the free-tier instance from sleeping (no-ops off Render / in dev).
    startKeepAwake();
});
