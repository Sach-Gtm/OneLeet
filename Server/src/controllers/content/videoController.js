const Video = require("../../models/videoModel");
const VideoProgress = require("../../models/videoProgressModel");
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
        // The caller's watch progress for these videos (percent + completed).
        let progByVideo = new Map();
        if (req.user && videos.length) {
            const rows = await VideoProgress.find({ user: req.user._id, video: { $in: videos.map((v) => v._id) } })
                .select("video percent completed")
                .lean();
            progByVideo = new Map(rows.map((p) => [String(p.video), p]));
        }
        const out = videos.map((v) => {
            const locked = !!v.premium && !canPremium;
            const p = progByVideo.get(String(v._id));
            const progress = { percent: p?.percent || 0, completed: !!p?.completed };
            const base = locked ? { ...v, youtubeId: undefined, locked: true } : { ...v, locked: false };
            return { ...base, progress };
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

// POST /api/videos/bulk — add many videos in one shot, ALL under a single
// subject (each link becomes its own card). STAFF ONLY (guarded by the route).
// Body: { subject, targets, premium, published, items: [{ url, title, chapter, topic }] }.
// Invalid links are skipped and reported back rather than failing the whole batch.
async function bulkCreateVideos(req, res, next) {
    try {
        const { subject, targets, premium, published, items } = req.body || {};
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "Add at least one YouTube link." });
        }
        if (items.length > 100) {
            return res.status(400).json({ success: false, message: "Please add at most 100 links at a time." });
        }
        // One subject for the whole batch — that is the whole point of bulk add.
        const subj = subject ? String(subject).trim() : "";
        const cleanTargets = sanitizeExams(targets);
        const isPremium = !!premium;
        const isPublished = published !== false;

        const toCreate = [];
        const failed = [];
        items.forEach((it, i) => {
            const youtubeId = parseYouTubeId(it?.youtubeId || it?.url);
            if (!youtubeId) {
                failed.push({ index: i, url: it?.url || "", error: "Not a valid YouTube link" });
                return;
            }
            const chapter = it?.chapter ? String(it.chapter).trim() : "";
            const topic = it?.topic ? String(it.topic).trim() : "";
            // Title is optional per link — fall back to the chapter/topic/subject so
            // staff can bulk-add with just links + chapter names.
            const title = (it?.title && String(it.title).trim()) || chapter || topic || subj || "Video lecture";
            toCreate.push({
                title,
                youtubeId,
                subject: subj || undefined,
                chapter: chapter || undefined,
                topic: topic || undefined,
                author: it?.author && String(it.author).trim() ? String(it.author).trim() : "OneLeet",
                targets: cleanTargets,
                published: isPublished,
                premium: isPremium,
                order: Number(it?.order) || 0,
                createdBy: req.user._id,
            });
        });

        let created = [];
        if (toCreate.length) created = await Video.insertMany(toCreate);
        return res.status(201).json({
            success: true,
            message: `${created.length} video${created.length === 1 ? "" : "s"} added${failed.length ? `, ${failed.length} skipped` : ""}.`,
            createdCount: created.length,
            failed,
            videos: created,
        });
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

// POST /api/videos/:id/progress — a student records watch progress. Keeps the
// furthest point reached; auto-marks complete near the end (≥90%).
async function saveProgress(req, res, next) {
    try {
        const video = await Video.findById(req.params.id).select("_id premium");
        if (!video) return res.status(404).json({ success: false, message: "Video not found" });
        if (video.premium && !isPremiumUser(req.user)) {
            return res.status(403).json({ success: false, code: "PREMIUM_REQUIRED", message: "This is a Premium video." });
        }
        const watched = Math.max(0, Math.round(Number(req.body?.watchedSeconds) || 0));
        const duration = Math.max(0, Math.round(Number(req.body?.durationSeconds) || 0));

        const existing = await VideoProgress.findOne({ user: req.user._id, video: video._id });
        const bestWatched = Math.max(watched, existing?.watchedSeconds || 0);
        const dur = duration || existing?.durationSeconds || 0;
        const percent = dur > 0 ? Math.min(100, Math.round((bestWatched / dur) * 100)) : existing?.percent || 0;
        const completed = existing?.completed || percent >= 90;

        const doc = await VideoProgress.findOneAndUpdate(
            { user: req.user._id, video: video._id },
            { $set: { watchedSeconds: bestWatched, durationSeconds: dur, percent, completed } },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );
        return res.status(200).json({ success: true, progress: { percent: doc.percent, completed: doc.completed } });
    } catch (e) {
        next(e);
    }
}

// POST /api/videos/:id/complete — manually mark complete / incomplete (reversible).
async function toggleComplete(req, res, next) {
    try {
        const completed = req.body?.completed !== false; // default true
        const set = completed ? { completed: true, percent: 100 } : { completed: false };
        const doc = await VideoProgress.findOneAndUpdate(
            { user: req.user._id, video: req.params.id },
            { $set: set },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );
        return res.status(200).json({ success: true, progress: { percent: doc.percent, completed: doc.completed } });
    } catch (e) {
        next(e);
    }
}

module.exports = { listVideos, createVideo, bulkCreateVideos, updateVideo, deleteVideo, saveProgress, toggleComplete };
