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

// Provision the Super Admin out-of-band once the DB is up, seed the LEET exam
// catalog + founding mentors + IPU LEET syllabus on first run, then start the
// competitive-leaderboard ticker. The syllabus seed is attributed to an admin,
// so it runs after the Super Admin is provisioned.
connectDB().then(async () => {
    await bootstrapSuperadmin();
    ensureExamsSeeded();
    ensureMentorsSeeded();
    ensureIpuSyllabusSeeded();
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
