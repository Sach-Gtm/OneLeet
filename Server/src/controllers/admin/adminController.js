const mongoose = require("mongoose");
const User = require("../../models/userModel");
const Attempt = require("../../models/attemptModel");
const Test = require("../../models/testModel");
const AiQuery = require("../../models/aiQueryModel");
const Blocklist = require("../../models/blocklistModel");
const aiRuntime = require("../../services/ai/aiRuntime");
const { SUPERADMIN_EMAIL } = require("../../config/roles");
const { timeSummary } = require("../activity/activityController");

// A malformed :id would otherwise make Mongoose throw a CastError → 500. Treat
// it as a plain not-found instead.
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/admin/overview — headline numbers for the admin dashboard.
async function overview(req, res, next) {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [totalStudents, totalTeachers, premium, activeToday, agg] =
            await Promise.all([
                User.countDocuments({ role: "student" }),
                User.countDocuments({ role: "teacher" }),
                User.countDocuments({ role: "student", plan: "pro" }),
                User.countDocuments({
                    role: "student",
                    "stats.lastActiveAt": { $gte: startOfDay },
                }),
                User.aggregate([
                    { $match: { role: "student" } },
                    {
                        $group: {
                            _id: null,
                            testsTaken: { $sum: "$stats.testsTaken" },
                            pyqsSolved: { $sum: "$stats.pyqsSolved" },
                            avgAccuracy: { $avg: "$stats.accuracy" },
                        },
                    },
                ]),
            ]);

        const totals = agg[0] || {};
        return res.status(200).json({
            success: true,
            overview: {
                totalStudents,
                totalTeachers,
                premium,
                activeToday,
                testsTaken: totals.testsTaken || 0,
                pyqsSolved: totals.pyqsSolved || 0,
                avgAccuracy: Math.round(totals.avgAccuracy || 0),
            },
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/admin/students?search=&page=&limit= — paginated, searchable list of
// students with their progress stats.
async function listStudents(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const search = (req.query.search || "").trim();

        const filter = { role: "student" };
        if (search) {
            const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
        }

        const [students, total] = await Promise.all([
            User.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select(
                    "name email phone college branch plan isVerified stats achievements createdAt avatar passportPhoto"
                ),
            User.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            students,
            total,
            page,
            pages: Math.ceil(total / limit) || 1,
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/admin/students/:id/plan — move a student in/out of the premium
// batch (e.g. to unlock premium perks).
async function setStudentPlan(req, res, next) {
    try {
        const { plan } = req.body;
        if (!["free", "pro"].includes(plan)) {
            return res
                .status(400)
                .json({ success: false, message: "Plan must be 'free' or 'pro'" });
        }
        if (!isValidId(req.params.id)) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        const student = await User.findOneAndUpdate(
            { _id: req.params.id, role: "student" },
            { plan },
            { returnDocument: "after" }
        ).select("name email plan");
        if (!student) {
            return res
                .status(404)
                .json({ success: false, message: "Student not found" });
        }
        return res.status(200).json({
            success: true,
            message: `Moved to ${plan === "pro" ? "premium" : "free"} plan`,
            student,
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/admin/users/role — promote/demote a user by email.
//   • Super Admin may set any account to student / teacher / admin.
//   • Admin may only manage students — they can turn a student into a mentor
//     (teacher) but can't grant admin, and can't touch mentor/admin accounts.
// The Super Admin account itself can never be re-roled through this endpoint.
async function setUserRole(req, res, next) {
    try {
        const role = req.body.role;
        const email = (req.body.email || "").toLowerCase().trim();
        if (!["student", "teacher", "admin"].includes(role)) {
            return res
                .status(400)
                .json({ success: false, message: "Role must be student, teacher or admin" });
        }
        const target = await User.findOne({ email });
        if (!target) {
            return res.status(404).json({
                success: false,
                message: "No account found with that email — ask them to register first",
            });
        }
        // Guard against accidentally locking yourself out.
        if (target._id.toString() === req.user._id.toString()) {
            return res
                .status(400)
                .json({ success: false, message: "You can't change your own role" });
        }
        if (target.role === "superadmin") {
            return res.status(403).json({
                success: false,
                message: "The Super Admin account can't be changed",
            });
        }
        const isSuper = req.user.role === "superadmin";
        if (!isSuper) {
            // Admins are limited to student accounts and can't mint new admins.
            if (target.role !== "student") {
                return res.status(403).json({
                    success: false,
                    message: "Only the Super Admin can change mentor or admin accounts",
                });
            }
            if (role === "admin") {
                return res.status(403).json({
                    success: false,
                    message: "Only the Super Admin can grant admin access",
                });
            }
        }
        target.role = role;
        await target.save({ validateBeforeSave: false });
        return res.status(200).json({
            success: true,
            message: `${target.name} is now ${role}`,
            user: {
                _id: target._id,
                name: target.name,
                email: target.email,
                role: target.role,
            },
        });
    } catch (error) {
        next(error);
    }
}

// DELETE /api/admin/users/:id — remove an account.
//   • Super Admin may remove anyone (except themselves / another Super Admin).
//   • Admin may remove students only ("revoke a student profile").
// Their test attempts are removed too, so leaderboards/analytics don't show a
// ghost row with no name.
async function removeUser(req, res, next) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const target = await User.findById(req.params.id);
        if (!target) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (target._id.toString() === req.user._id.toString()) {
            return res
                .status(400)
                .json({ success: false, message: "You can't remove your own account" });
        }
        if (target.role === "superadmin") {
            return res
                .status(403)
                .json({ success: false, message: "The Super Admin account can't be removed" });
        }
        const isSuper = req.user.role === "superadmin";
        if (!isSuper && target.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only the Super Admin can remove mentor or admin accounts",
            });
        }
        await Promise.all([
            User.deleteOne({ _id: target._id }),
            Attempt.deleteMany({ user: target._id }),
        ]);
        // Block the email so the removed person can't just re-register as a
        // student and slip back in. A Super Admin can lift this later.
        await Blocklist.updateOne(
            { email: target.email },
            {
                $setOnInsert: {
                    email: String(target.email).toLowerCase().trim(),
                    reason: `Removed by ${req.user.name || "an administrator"}`,
                    createdBy: req.user._id,
                },
            },
            { upsert: true }
        ).catch(() => {});
        return res.status(200).json({
            success: true,
            message: `${target.name} has been removed and blocked from re-registering`,
            id: target._id,
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/admin/staff — the mentor/admin roster ("who is admin and mentor").
// Read-only for admins; the Super Admin uses it to manage the team.
async function listStaff(req, res, next) {
    try {
        const staff = await User.find({
            role: { $in: ["teacher", "admin", "superadmin"] },
        })
            .sort({ role: -1, createdAt: -1 })
            .select("name email role avatar createdAt");
        return res.status(200).json({ success: true, staff });
    } catch (error) {
        next(error);
    }
}

// GET /api/admin/students/:id/activity — a full picture of one student for the
// admin: profile, recent tests, what they've asked the AI (recent + top
// topics), and time spent. Admins + super admin only (route-gated).
async function studentActivity(req, res, next) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        const student = await User.findOne({ _id: req.params.id, role: "student" }).select(
            "name email phone college branch yearOfStudy targetExam plan stats achievements avatar passportPhoto createdAt"
        );
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        const [attempts, aiRecent, aiTopics, time] = await Promise.all([
            Attempt.find({ user: student._id })
                .sort({ submittedAt: -1 })
                .limit(10)
                .select("testTitle score totalMarks accuracy submittedAt durationTakenSeconds"),
            AiQuery.find({ user: student._id })
                .sort({ createdAt: -1 })
                .limit(10)
                .select("tool subject topic difficulty createdAt"),
            AiQuery.aggregate([
                { $match: { user: student._id, topic: { $nin: ["", null] } } },
                {
                    $group: {
                        _id: { $toLower: "$topic" },
                        label: { $first: "$topic" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 8 },
            ]),
            timeSummary(student._id),
        ]);

        return res.status(200).json({
            success: true,
            student,
            attempts,
            ai: {
                recent: aiRecent,
                topTopics: aiTopics.map((t) => ({ topic: t.label, count: t.count })),
            },
            time,
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/admin/leaderboards — every competitive (scheduled, graded) test with
// its leaderboard status and participant count. The admin's "view all
// leaderboard records" screen.
async function leaderboards(req, res, next) {
    try {
        const tests = await Test.find({ mode: "test", closeAt: { $ne: null } })
            .sort({ closeAt: -1 })
            .limit(100)
            .select("title closeAt leaderboardPublished leaderboardPublishedAt");
        const ids = tests.map((t) => t._id);
        const counts = await Attempt.aggregate([
            { $match: { test: { $in: ids } } },
            { $group: { _id: "$test", participants: { $addToSet: "$user" } } },
            { $project: { participants: { $size: "$participants" } } },
        ]);
        const countMap = new Map(counts.map((c) => [String(c._id), c.participants]));
        const out = tests.map((t) => ({
            _id: t._id,
            title: t.title,
            closeAt: t.closeAt,
            published: t.leaderboardPublished,
            publishedAt: t.leaderboardPublishedAt || null,
            participants: countMap.get(String(t._id)) || 0,
        }));
        return res.status(200).json({ success: true, leaderboards: out });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/admin/students/:id/achievements/reset — zero one student's Top-3
// counters. (They never reset on their own — only here.)
async function resetStudentAchievements(req, res, next) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        const student = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { "achievements.rank1": 0, "achievements.rank2": 0, "achievements.rank3": 0 } },
            { returnDocument: "after" }
        ).select("name email achievements");
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        return res.status(200).json({
            success: true,
            message: `Cleared achievements for ${student.name}`,
            student,
        });
    } catch (error) {
        next(error);
    }
}

// POST /api/admin/hall-of-fame/reset — wipe EVERY user's Top-3 counters, clearing
// the Hall of Fame and all profile badges. Destructive → Super-Admin only.
async function resetHallOfFame(req, res, next) {
    try {
        const r = await User.updateMany(
            {},
            { $set: { "achievements.rank1": 0, "achievements.rank2": 0, "achievements.rank3": 0 } }
        );
        return res.status(200).json({
            success: true,
            message: "Hall of Fame and all achievement counters have been reset",
            modified: r.modifiedCount ?? 0,
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/admin/achievements/export — CSV of every student's achievement +
// headline stats, for offline records.
async function exportAchievements(req, res, next) {
    try {
        const students = await User.find({ role: "student" })
            .sort({ "achievements.rank1": -1, "achievements.rank2": -1, "achievements.rank3": -1 })
            .select("name email achievements stats createdAt");
        const esc = (v) => {
            const s = String(v ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const header = [
            "Name", "Email", "Rank1", "Rank2", "Rank3", "TestsTaken", "Accuracy", "Joined",
        ];
        const rows = students.map((u) =>
            [
                u.name,
                u.email,
                u.achievements?.rank1 || 0,
                u.achievements?.rank2 || 0,
                u.achievements?.rank3 || 0,
                u.stats?.testsTaken || 0,
                u.stats?.accuracy || 0,
                u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : "",
            ]
                .map(esc)
                .join(",")
        );
        const csv = [header.join(","), ...rows].join("\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="oneleet-achievements.csv"');
        return res.status(200).send(csv);
    } catch (error) {
        next(error);
    }
}

// GET /api/admin/blocklist — emails blocked from holding an account.
async function listBlocklist(req, res, next) {
    try {
        const items = await Blocklist.find()
            .sort({ createdAt: -1 })
            .limit(300)
            .populate("createdBy", "name");
        return res.status(200).json({ success: true, blocklist: items });
    } catch (error) {
        next(error);
    }
}

// POST /api/admin/blocklist — manually block an email from registering.
async function blockEmail(req, res, next) {
    try {
        const email = String(req.body.email || "").toLowerCase().trim();
        if (!email) {
            return res.status(400).json({ success: false, message: "An email is required" });
        }
        if (email === SUPERADMIN_EMAIL) {
            return res.status(400).json({ success: false, message: "The Super Admin email can't be blocked" });
        }
        await Blocklist.updateOne(
            { email },
            {
                $setOnInsert: {
                    email,
                    reason: String(req.body.reason || "Blocked by an administrator").slice(0, 200),
                    createdBy: req.user._id,
                },
            },
            { upsert: true }
        );
        return res.status(200).json({ success: true, message: `${email} is now blocked` });
    } catch (error) {
        next(error);
    }
}

// POST /api/admin/blocklist/unblock — lift a block so the email can register again.
async function unblockEmail(req, res, next) {
    try {
        const email = String(req.body.email || "").toLowerCase().trim();
        if (!email) {
            return res.status(400).json({ success: false, message: "An email is required" });
        }
        await Blocklist.deleteOne({ email });
        return res.status(200).json({ success: true, message: `${email} has been unblocked` });
    } catch (error) {
        next(error);
    }
}

// GET /api/admin/ai-usage — AI spend dashboard: today + this-month calls, cache
// hit-rate, estimated cost, per-feature breakdown and the heaviest users.
async function aiUsage(req, res, next) {
    try {
        const summary = await aiRuntime.usageSummary();
        return res.status(200).json({ success: true, ...summary });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    overview,
    listStudents,
    setStudentPlan,
    setUserRole,
    removeUser,
    listStaff,
    studentActivity,
    leaderboards,
    resetStudentAchievements,
    resetHallOfFame,
    exportAchievements,
    aiUsage,
    listBlocklist,
    blockEmail,
    unblockEmail,
};
