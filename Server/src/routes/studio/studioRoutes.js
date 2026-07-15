const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireStaff } = require("../../middlewares/roleMiddleware");
const studio = require("../../controllers/studio/studioController");

// The Content Studio is staff-only (mentors, admins, super admin). Mentors
// draft/publish their own content; admins & super admin can manage all of it.
router.use(verifyToken, requireStaff);

router.post("/ai-draft", studio.aiDraft);
router.get("/tests", studio.listMine);
router.post("/tests", studio.createTest);
router.get("/tests/:id", studio.getTest);
router.patch("/tests/:id", studio.updateTest);
router.post("/tests/:id/publish", studio.publishTest);
router.delete("/tests/:id", studio.removeTest);

module.exports = router;
