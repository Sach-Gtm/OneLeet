const Review = require("../../models/reviewModel");
const { parseYouTubeId } = require("../../utils/youtube");

// Only the fields the public landing strip needs (never createdBy / internals).
const publicShape = (r) => ({
    _id: r._id,
    type: r.type,
    text: r.text,
    title: r.title,
    author: r.author,
    youtubeId: r.youtubeId,
    createdAt: r.createdAt,
});

// GET /api/reviews — PUBLIC. The landing page fetches this without auth, so it
// returns only published reviews and only safe fields.
async function listReviews(req, res, next) {
    try {
        const reviews = await Review.find({ published: true })
            .sort({ order: 1, createdAt: -1 })
            .lean();
        return res.status(200).json({ success: true, reviews: reviews.map(publicShape) });
    } catch (e) {
        next(e);
    }
}

// POST /api/reviews — ADMIN ONLY (guarded by the route). Adds a text or video
// review.
async function createReview(req, res, next) {
    try {
        const { type, text, title, author, url, youtubeId: rawId, order } = req.body || {};
        const kind = type === "video" ? "video" : "text";

        const doc = {
            type: kind,
            title: title ? String(title).trim() : undefined,
            author: author ? String(author).trim() : undefined,
            text: text ? String(text).trim() : undefined,
            order: Number(order) || 0,
            createdBy: req.user._id,
        };

        if (kind === "video") {
            const youtubeId = parseYouTubeId(rawId || url);
            if (!youtubeId) {
                return res.status(400).json({ success: false, message: "Paste a valid YouTube link." });
            }
            if (!doc.title) {
                return res.status(400).json({ success: false, message: "Add a subject / title for the video." });
            }
            doc.youtubeId = youtubeId;
        } else if (!doc.text) {
            return res.status(400).json({ success: false, message: "Write the review message." });
        }

        const review = await Review.create(doc);
        return res.status(201).json({ success: true, message: "Review added", review: publicShape(review) });
    } catch (e) {
        next(e);
    }
}

// DELETE /api/reviews/:id — ADMIN ONLY (guarded by the route).
async function deleteReview(req, res, next) {
    try {
        const existing = await Review.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: "Review not found" });
        await existing.deleteOne();
        return res.status(200).json({ success: true, message: "Review deleted" });
    } catch (e) {
        next(e);
    }
}

module.exports = { listReviews, createReview, deleteReview };
