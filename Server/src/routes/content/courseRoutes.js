const express = require("express");
const router = express.Router();

const { verifyToken, optionalAuth } = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/content/courseController");

// PUBLIC — the published course catalog (annotates `enrolled` when signed in).
router.get("/", optionalAuth, ctrl.listPublished);

// ADMIN — full list (published + drafts) to manage. Before "/:slug" so the
// literal path isn't swallowed as a slug.
router.get("/manage", verifyToken, requireAdmin, ctrl.listAll);
router.post("/", verifyToken, requireAdmin, ctrl.createCourse);
router.patch("/:id", verifyToken, requireAdmin, ctrl.updateCourse);
router.delete("/:id", verifyToken, requireAdmin, ctrl.deleteCourse);

// PUBLIC — one course by slug (the overview page). Keep LAST.
router.get("/:slug", optionalAuth, ctrl.getBySlug);

module.exports = router;
