const Review = require("../../models/reviewModel");
const cloudinary = require("../../config/cloudinary");
const { uploadBufferToCloudinary } = require("../../utils/cloudinaryUpload");

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB for review screenshots/photos

// ── helpers ────────────────────────────────────────────────────────────────

const slugify = (s) =>
    String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "story";

async function uniqueSlug(base, ignoreId) {
    const root = slugify(base);
    let slug = root;
    let n = 1;
    // eslint-disable-next-line no-await-in-loop
    while (await Review.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) })) {
        n += 1;
        slug = `${root}-${n}`;
    }
    return slug;
}

const str = (v, max) => (v === undefined || v === null ? undefined : String(v).trim().slice(0, max));
const asBool = (v) => v === true || v === "true" || v === "1";

// The student details block, shared by every shape.
const detailsOf = (r) => ({
    author: r.author,
    exam: r.exam,
    rank: r.rank,
    college: r.college,
    branch: r.branch,
});

// Card shape for the wall / lists — light (no long caseStory).
const cardShape = (r) => ({
    _id: r._id,
    type: r.type,
    text: r.text,
    title: r.title,
    ...detailsOf(r),
    video: r.video?.url || null,
    image: r.image?.url || null,
    isCase: !!r.isCase,
    slug: r.slug || null,
    caseTitle: r.caseTitle,
    order: r.order,
    createdAt: r.createdAt,
});

// Full shape for a single case page + the admin editor.
const fullShape = (r) => ({
    ...cardShape(r),
    caseStory: r.caseStory,
    published: r.published,
});

// ── public ─────────────────────────────────────────────────────────────────

// GET /api/reviews — PUBLIC. Everything published (the wall filters by type).
async function listReviews(req, res, next) {
    try {
        const reviews = await Review.find({ published: true }).sort({ order: 1, createdAt: -1 }).lean();
        return res.status(200).json({ success: true, reviews: reviews.map(cardShape) });
    } catch (e) {
        next(e);
    }
}

// GET /api/reviews/cases — PUBLIC. Only the featured success stories.
async function listCases(req, res, next) {
    try {
        const cases = await Review.find({ published: true, isCase: true, slug: { $ne: null } })
            .sort({ order: 1, createdAt: -1 })
            .lean();
        return res.status(200).json({ success: true, cases: cases.map(cardShape) });
    } catch (e) {
        next(e);
    }
}

// GET /api/reviews/cases/:slug — PUBLIC. One success story (the /success/:slug page).
async function getCase(req, res, next) {
    try {
        const c = await Review.findOne({ slug: String(req.params.slug || "").toLowerCase(), published: true, isCase: true }).lean();
        if (!c) return res.status(404).json({ success: false, message: "Story not found" });
        return res.status(200).json({ success: true, case: fullShape(c) });
    } catch (e) {
        next(e);
    }
}

// ── admin ──────────────────────────────────────────────────────────────────

// GET /api/reviews/admin/all — ADMIN. Full data (incl. unpublished) for the editor.
async function adminListReviews(req, res, next) {
    try {
        const reviews = await Review.find({}).sort({ order: 1, createdAt: -1 }).lean();
        return res.status(200).json({ success: true, reviews: reviews.map(fullShape) });
    } catch (e) {
        next(e);
    }
}

// Collect the shared, optional fields from a multipart/JSON body.
function readFields(b) {
    return {
        title: str(b.title, 160),
        author: str(b.author, 100),
        text: str(b.text, 600),
        exam: str(b.exam, 80),
        rank: str(b.rank, 40),
        college: str(b.college, 120),
        branch: str(b.branch, 80),
        caseTitle: str(b.caseTitle, 160),
        caseStory: str(b.caseStory, 8000),
        order: b.order !== undefined ? Number(b.order) || 0 : undefined,
    };
}

async function uploadImage(file) {
    const result = await uploadBufferToCloudinary(file.buffer, { folder: "oneleet/reviews", resource_type: "image" });
    return { url: result.secure_url, publicId: result.public_id };
}
async function uploadVideo(file) {
    const result = await uploadBufferToCloudinary(file.buffer, { folder: "oneleet/reviews", resource_type: "video" });
    return { url: result.secure_url, publicId: result.public_id };
}

// POST /api/reviews — ADMIN ONLY. A text / image / video review, optionally a case.
async function createReview(req, res, next) {
    try {
        const b = req.body || {};
        const kind = b.type === "video" || b.type === "image" ? b.type : "text";
        const videoFile = req.files?.video?.[0];
        const imageFile = req.files?.image?.[0];
        const f = readFields(b);
        const isCase = asBool(b.isCase);

        const doc = { type: kind, ...f, isCase, createdBy: req.user._id };
        if (doc.order === undefined) delete doc.order;

        if (kind === "video") {
            if (!videoFile) return res.status(400).json({ success: false, message: "Upload a video clip for a video review." });
            doc.video = await uploadVideo(videoFile);
        } else if (kind === "image") {
            if (!imageFile) return res.status(400).json({ success: false, message: "Upload an image for an image review." });
            if (imageFile.size > MAX_IMAGE_BYTES) return res.status(400).json({ success: false, message: "Image must be 8 MB or smaller." });
            doc.image = await uploadImage(imageFile);
        } else if (!doc.text) {
            return res.status(400).json({ success: false, message: "Write the review message." });
        }

        if (isCase) {
            if (!doc.caseStory) return res.status(400).json({ success: false, message: "Write the story for a case." });
            doc.slug = await uniqueSlug(f.caseTitle || f.author || f.title || "story");
        }

        const review = await Review.create(doc);
        return res.status(201).json({ success: true, message: "Review added", review: fullShape(review) });
    } catch (e) {
        next(e);
    }
}

// PATCH /api/reviews/:id — ADMIN ONLY. Edit any field; optional new media.
async function updateReview(req, res, next) {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: "Review not found" });

        const b = req.body || {};
        const f = readFields(b);
        // Only overwrite fields that were actually sent.
        ["title", "author", "text", "exam", "rank", "college", "branch", "caseTitle", "caseStory"].forEach((k) => {
            if (b[k] !== undefined) review[k] = f[k];
        });
        if (b.order !== undefined) review.order = f.order;
        if (b.published !== undefined) review.published = !(b.published === "false" || b.published === false);
        if (b.isCase !== undefined) review.isCase = asBool(b.isCase);

        // New media (replaces the old asset).
        const videoFile = req.files?.video?.[0];
        const imageFile = req.files?.image?.[0];
        if (videoFile) {
            const old = review.video?.publicId;
            review.video = await uploadVideo(videoFile);
            if (old) cloudinary.uploader.destroy(old, { resource_type: "video" }).catch((e) => console.warn("[review] old video:", e.message));
        }
        if (imageFile) {
            if (imageFile.size > MAX_IMAGE_BYTES) return res.status(400).json({ success: false, message: "Image must be 8 MB or smaller." });
            const old = review.image?.publicId;
            review.image = await uploadImage(imageFile);
            if (old) cloudinary.uploader.destroy(old, { resource_type: "image" }).catch((e) => console.warn("[review] old image:", e.message));
        }

        // A case needs a story + a slug; give it one the first time it's promoted.
        if (review.isCase) {
            if (!review.caseStory) return res.status(400).json({ success: false, message: "Write the story for a case." });
            if (!review.slug) review.slug = await uniqueSlug(review.caseTitle || review.author || review.title || "story", review._id);
        }

        await review.save();
        return res.status(200).json({ success: true, message: "Review updated", review: fullShape(review) });
    } catch (e) {
        next(e);
    }
}

// DELETE /api/reviews/:id — ADMIN ONLY. Removes the record and its media assets.
async function deleteReview(req, res, next) {
    try {
        const existing = await Review.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: "Review not found" });

        const videoId = existing.video?.publicId;
        const imageId = existing.image?.publicId;
        await existing.deleteOne();
        if (videoId) cloudinary.uploader.destroy(videoId, { resource_type: "video" }).catch((e) => console.warn("[review] video cleanup failed:", e.message));
        if (imageId) cloudinary.uploader.destroy(imageId, { resource_type: "image" }).catch((e) => console.warn("[review] image cleanup failed:", e.message));
        return res.status(200).json({ success: true, message: "Review deleted" });
    } catch (e) {
        next(e);
    }
}

module.exports = { listReviews, listCases, getCase, adminListReviews, createReview, updateReview, deleteReview };
