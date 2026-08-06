const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const ctrl = require("../../controllers/content/enrollmentController");

// All enrollment actions require a signed-in student.
router.get("/me", verifyToken, ctrl.myEnrollments);
router.post("/", verifyToken, ctrl.enroll);
router.delete("/:courseId", verifyToken, ctrl.unenroll);

module.exports = router;
