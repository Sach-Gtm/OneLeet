const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authMiddleware");
const c = require("../../controllers/community/communityController");

router.get("/posts", verifyToken, c.listPosts);
router.post("/posts", verifyToken, c.createPost);
router.get("/posts/:id", verifyToken, c.getPost);
router.post("/posts/:id/replies", verifyToken, c.addReply);
router.post("/posts/:id/upvote", verifyToken, c.toggleUpvote);

module.exports = router;
