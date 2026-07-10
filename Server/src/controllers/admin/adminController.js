const User = require("../../models/userModel");

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
                .select("name email phone college branch plan isVerified stats createdAt"),
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

// PATCH /api/admin/users/role — promote/demote a user by email. Admin-only
// (enforced on the route). Used to grant teammates admin/teacher access.
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

module.exports = { overview, listStudents, setStudentPlan, setUserRole };
