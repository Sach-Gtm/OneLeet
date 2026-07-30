const Video = require("../../models/videoModel");
const { STAFF, isPremiumUser } = require("../../config/roles");
const { sanitizeExams, visibilityQuery } = require("../../config/exams");
const { parseYouTubeId } = require("../../utils/youtube");

const isStaff = (u) => STAFF.includes(u?.role);

// GET /api/videos — the video library. Staff see everything (incl. unpublished
// drafts); students see only published videos targeted at the universities they
// picked (no preference set → all). Ordered subject → order → newest so the
// client can group them chapter-wise.
async function listVideos(req, res, next) {
    try {
        const filter = isStaff(req.user)
            ? {}
            : { published: true, ...visibilityQuery(req.user?.exams) };
        const videos = await Video.find(filter)
            .sort({ subject: 1, order: 1, createdAt: 1 })
            .lean();
        // Premium videos stay visible to everyone (shown locked), but a free
        // student never receives the playable youtubeId — so it can't be embedded.
        const canPremium = isPremiumUser(req.user);
        const out = videos.map((v) => {
            const locked = !!v.premium && !canPremium;
            return locked ? { ...v, youtubeId: undefined, locked: true } : { ...v, locked: false };
        });
        return res.status(200).json({ success: true, videos: out });
    } catch (e) {
        next(e);
    }
}

// POST /api/videos — add a video. STAFF ONLY (guarded by the route).
async function createVideo(req, res, next) {
    try {
        const { title, url, youtubeId: rawId, subject, chapter, topic, description, author, targets, published, premium, order } =
            req.body || {};
        if (!title || !String(title).trim()) {
            return res.status(400).json({ success: false, message: "Give the video a title." });
        }
        const youtubeId = parseYouTubeId(rawId || url);
        if (!youtubeId) {
            return res.status(400).json({ success: false, message: "Paste a valid YouTube link." });
        }
        const video = await Video.create({
            title: String(title).trim(),
            youtubeId,
            subject: subject ? String(subject).trim() : undefined,
            chapter: chapter ? String(chapter).trim() : undefined,
            topic: topic ? String(topic).trim() : undefined,
            description: description ? String(description).trim() : undefined,
            author: author && String(author).trim() ? String(author).trim() : "OneLeet",
            targets: sanitizeExams(targets),
            published: published !== false,
            premium: !!premium, // free unless staff mark it premium
            order: Number(order) || 0,
            createdBy: req.user._id,
        });
        return res.status(201).json({ success: true, message: "Video added", video });
    } catch (e) {
        next(e);
    }
}

// PUT /api/videos/:id — edit. STAFF ONLY (guarded by the route).
async function updateVideo(req, res, next) {
    try {
        const existing = await Video.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: "Video not found" });

        const { title, url, youtubeId: rawId, subject, chapter, topic, description, author, targets, published, premium, order } =
            req.body || {};

        if (title != null) existing.title = String(title).trim();
        if (rawId != null || url != null) {
            const yid = parseYouTubeId(rawId || url);
            if (!yid) return res.status(400).json({ success: false, message: "Paste a valid YouTube link." });
            existing.youtubeId = yid;
        }
        if (subject != null) existing.subject = String(subject).trim();
        if (chapter != null) existing.chapter = String(chapter).trim();
        if (topic != null) existing.topic = String(topic).trim();
        if (description != null) existing.description = String(description).trim();
        if (author != null) existing.author = String(author).trim() || "OneLeet";
        if (targets != null) existing.targets = sanitizeExams(targets);
        if (published != null) existing.published = !!published;
        if (premium != null) existing.premium = !!premium; // one-click free⇄premium toggle
        if (order != null) existing.order = Number(order) || 0;
        await existing.save();

        return res.status(200).json({ success: true, message: "Video updated", video: existing });
    } catch (e) {
        next(e);
    }
}

// DELETE /api/videos/:id — remove. STAFF ONLY (guarded by the route).
async function deleteVideo(req, res, next) {
    try {
        const existing = await Video.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: "Video not found" });
        await existing.deleteOne();
        return res.status(200).json({ success: true, message: "Video deleted" });
    } catch (e) {
        next(e);
    }
}

module.exports = { listVideos, createVideo, updateVideo, deleteVideo };
