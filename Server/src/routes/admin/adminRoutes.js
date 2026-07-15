const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const {
    requireAdmin,
    requireSuperadmin,
} = require("../../middlewares/roleMiddleware");
const admin = require("../../controllers/admin/adminController");

// Student data + the team roster are admin / super-admin only. Mentors
// (teachers) are deliberately excluded from all of it.
router.use(verifyToken, requireAdmin);

router.get("/overview", admin.overview);
router.get("/students", admin.listStudents);
router.get("/students/:id/activity", admin.studentActivity);
router.get("/staff", admin.listStaff);

// Competitive leaderboards + achievement records.
router.get("/leaderboards", admin.leaderboards);
router.get("/achievements/export", admin.exportAchievements);

// AI spend dashboard.
router.get("/ai-usage", admin.aiUsage);
router.patch("/students/:id/achievements/reset", admin.resetStudentAchievements);

// Premium and the full Hall-of-Fame wipe are Super-Admin-only levers.
router.patch("/students/:id/plan", requireSuperadmin, admin.setStudentPlan);
router.post("/hall-of-fame/reset", requireSuperadmin, admin.resetHallOfFame);

// Role changes and removals are gated to admins here, then further narrowed by
// the *target's* role inside the controller (an admin may only manage students;
// only the Super Admin may touch mentor/admin accounts).
router.patch("/users/role", admin.setUserRole);
router.delete("/users/:id", admin.removeUser);

module.exports = router;
