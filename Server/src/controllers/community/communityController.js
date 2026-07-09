const Post = require("../../models/postModel");

// GET /api/community/posts — paginated, searchable list (no full replies)
async function listPosts(req, res, next) {
    try {
        const { q, subject, sort = "newest", page = 1, limit = 10 } = req.query;
        const match = {};
        if (subject) match.subject = subject;
        if (q && q.trim()) {
            const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            match.$or = [{ title: rx }, { body: rx }];
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;
        const sortStage = sort === "top" ? { upvoteCount: -1, createdAt: -1 } : { createdAt: -1 };

        const [posts, total] = await Promise.all([
            Post.aggregate([
                { $match: match },
                {
                    $project: {
                        title: 1,
                        authorName: 1,
                        subject: 1,
                        createdAt: 1,
                        snippet: { $substrCP: ["$body", 0, 180] },
                        upvoteCount: { $size: { $ifNull: ["$upvotes", []] } },
                        replyCount: { $size: { $ifNull: ["$replies", []] } },
                    },
                },
                { $sort: sortStage },
                { $skip: skip },
                { $limit: limitNum },
            ]),
            Post.countDocuments(match),
        ]);

        return res.status(200).json({
            success: true,
            posts,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum) || 1,
        });
    } catch (error) {
        next(error);
    }
}

// POST /api/community/posts
async function createPost(req, res, next) {
    try {
        const { title, body, subject } = req.body || {};
        if (!title || !title.trim() || !body || !body.trim()) {
            return res.status(400).json({ success: false, message: "Title and body are required" });
        }
        const post = await Post.create({
            title: title.trim(),
            body: body.trim(),
            subject: subject?.trim() || undefined,
            author: req.user._id,
            authorName: req.user.name,
        });
        return res.status(201).json({ success: true, post });
    } catch (error) {
        next(error);
    }
}

// GET /api/community/posts/:id — full post with replies + viewer's upvote state
async function getPost(req, res, next) {
    try {
        const post = await Post.findById(req.params.id).lean();
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const upvotes = post.upvotes || [];
        return res.status(200).json({
            success: true,
            post: {
                ...post,
                upvotes: undefined,
                upvoteCount: upvotes.length,
                upvoted: upvotes.some((u) => String(u) === String(req.user._id)),
            },
        });
    } catch (error) {
        next(error);
    }
}

// POST /api/community/posts/:id/replies
async function addReply(req, res, next) {
    try {
        const { body } = req.body || {};
        if (!body || !body.trim()) {
            return res.status(400).json({ success: false, message: "Reply body is required" });
        }
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        post.replies.push({ author: req.user._id, authorName: req.user.name, body: body.trim() });
        await post.save();

        const reply = post.replies[post.replies.length - 1];
        return res.status(201).json({ success: true, reply });
    } catch (error) {
        next(error);
    }
}

// POST /api/community/posts/:id/upvote — toggle
async function toggleUpvote(req, res, next) {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const uid = String(req.user._id);
        const idx = post.upvotes.findIndex((u) => String(u) === uid);
        let upvoted;
        if (idx >= 0) {
            post.upvotes.splice(idx, 1);
            upvoted = false;
        } else {
            post.upvotes.push(req.user._id);
            upvoted = true;
        }
        await post.save();
        return res.status(200).json({ success: true, upvoted, upvoteCount: post.upvotes.length });
    } catch (error) {
        next(error);
    }
}

module.exports = { listPosts, createPost, getPost, addReply, toggleUpvote };
