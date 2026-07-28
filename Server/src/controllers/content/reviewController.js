const Review = require("../../models/reviewModel");
const cloudinary = require("../../config/cloudinary");
const { uploadBufferToCloudinary } = require("../../utils/cloudinaryUpload");

// Only the fields the public strip needs (never createdBy / internals).
const publicShape = (r) => ({
    _id: r._id,
    type: r.type,
    text: r.text,
    title: r.title,
    author: r.author,
    video: r.video?.url || null,
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

// POST /api/reviews — ADMIN ONLY. A text review (message) or a video review
// (an uploaded clip, streamed to Cloudinary and played inline on the site).
async function createReview(req, res, next) {
    try {
        const { type, text, title, author, order } = req.body || {};
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
            if (!req.file) {
                return res.status(400).json({ success: false, message: "Upload a video clip for a video review." });
            }
            const result = await uploadBufferToCloudinary(req.file.buffer, {
                folder: "oneleet/reviews",
                resource_type: "video",
            });
            doc.video = { url: result.secure_url, publicId: result.public_id };
        } else if (!doc.text) {
            return res.status(400).json({ success: false, message: "Write the review message." });
        }

        const review = await Review.create(doc);
        return res.status(201).json({ success: true, message: "Review added", review: publicShape(review) });
    } catch (e) {
        next(e);
    }
}

// DELETE /api/reviews/:id — ADMIN ONLY. Removes the record and its video asset.
async function deleteReview(req, res, next) {
    try {
        const existing = await Review.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: "Review not found" });

        const publicId = existing.video?.publicId;
        await existing.deleteOne();
        if (publicId) {
            cloudinary.uploader
                .destroy(publicId, { resource_type: "video" })
                .catch((e) => console.warn("[review] video cleanup failed:", e.message));
        }
        return res.status(200).json({ success: true, message: "Review deleted" });
    } catch (e) {
        next(e);
    }
}

module.exports = { listReviews, createReview, deleteReview };
