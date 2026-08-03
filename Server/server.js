require("dotenv").config();
const app = require("./app");
const connectDB = require("./src/config/db");
const bootstrapSuperadmin = require("./src/config/bootstrapSuperadmin");
const { startEmailHealthChecks } = require("./src/utils/email");
const { startKeepAwake } = require("./src/utils/keepAwake");
const { startLeaderboardScheduler } = require("./src/jobs/leaderboardScheduler");
const { ensureExamsSeeded } = require("./src/config/exams");
const { ensureMentorsSeeded } = require("./src/config/seedMentors");
const { ensureIpuSyllabusSeeded } = require("./src/config/seedIpuSyllabus");
const { ensureIpuExamPatternSeeded } = require("./src/config/seedIpuExamPattern");
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

// Provision the Super Admin out-of-band once the DB is up, seed the LEET exam
// catalog + founding mentors + IPU LEET syllabus and exam pattern on first run,
// then start the competitive-leaderboard ticker. The syllabus/pattern seeds are
// attributed to an admin, so they run after the Super Admin is provisioned.
connectDB().then(async () => {
    await bootstrapSuperadmin();
    ensureExamsSeeded();
    ensureMentorsSeeded();
    ensureIpuSyllabusSeeded();
    ensureIpuExamPatternSeeded();
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
    startLeaderboardScheduler();
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
