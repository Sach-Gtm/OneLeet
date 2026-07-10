const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireRole } = require("../../middlewares/roleMiddleware");
const admin = require("../../controllers/admin/adminController");

// Everything here is for staff only (admins + teachers).
router.use(verifyToken, requireRole("admin", "teacher"));

router.get("/overview", admin.overview);
router.get("/students", admin.listStudents);
router.patch("/students/:id/plan", admin.setStudentPlan);
// Role changes are admin-only (teachers can view but not grant access).
router.patch("/users/role", requireRole("admin"), admin.setUserRole);

module.exports = router;
