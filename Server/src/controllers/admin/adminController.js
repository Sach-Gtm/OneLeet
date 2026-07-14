const mongoose = require("mongoose");
const User = require("../../models/userModel");
const Attempt = require("../../models/attemptModel");
const AiQuery = require("../../models/aiQueryModel");
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
                    "name email phone college branch plan isVerified stats createdAt avatar passportPhoto"
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
        return res.status(200).json({
            success: true,
            message: `${target.name} has been removed`,
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
            "name email phone college branch yearOfStudy targetExam plan stats avatar passportPhoto createdAt"
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

module.exports = {
    overview,
    listStudents,
    setStudentPlan,
    setUserRole,
    removeUser,
    listStaff,
    studentActivity,
};
