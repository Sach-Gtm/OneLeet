const fs = require("fs");
const mongoose = require("mongoose");
const Syllabus = require("../../models/syllabusModel");
const SyllabusProgress = require("../../models/syllabusProgressModel");
const aiService = require("../../services/ai/aiService");
const { runAiFeature } = require("../../services/ai/aiRuntime");
const { STAFF } = require("../../config/roles");

const isStaff = (u) => STAFF.includes(u?.role);

// Roll up one syllabus against a student's completed-topic set.
function summarize(syllabus, completedSet) {
    let totalTopics = 0, doneTopics = 0, totalHours = 0, doneHours = 0;
    for (const ch of syllabus.chapters || []) {
        for (const t of ch.topics || []) {
            totalTopics += 1;
            totalHours += t.estimatedHours || 0;
            if (completedSet.has(String(t._id))) {
                doneTopics += 1;
                doneHours += t.estimatedHours || 0;
            }
        }
    }
    return {
        totalTopics,
        doneTopics,
        totalHours,
        doneHours,
        percent: totalTopics ? Math.round((doneTopics / totalTopics) * 100) : 0,
    };
}

// Sanitise chapters/topics from the client. Preserve subdoc _ids when provided
// so editing a syllabus doesn't orphan students' completed-topic marks.
function normalizeChapters(input) {
    if (!Array.isArray(input)) return [];
    return input
        .map((ch, ci) => {
            const chap = {
                title: String(ch?.title || "").trim().slice(0, 200),
                order: ci,
                topics: Array.isArray(ch?.topics)
                    ? ch.topics
                          .map((t, ti) => {
                              const topic = {
                                  title: String(t?.title || "").trim().slice(0, 200),
                                  estimatedHours: Math.max(0, Math.min(500, Number(t?.estimatedHours) || 0)),
                                  order: ti,
                              };
                              if (t?._id && mongoose.isValidObjectId(t._id)) topic._id = t._id;
                              return topic;
                          })
                          .filter((t) => t.title)
                    : [],
            };
            if (ch?._id && mongoose.isValidObjectId(ch._id)) chap._id = ch._id;
            return chap;
        })
        .filter((ch) => ch.title);
}

async function progressMap(userId, syllabi) {
    const rows = await SyllabusProgress.find({
        user: userId,
        syllabus: { $in: syllabi.map((s) => s._id) },
    }).lean();
    return new Map(rows.map((p) => [String(p.syllabus), new Set((p.completedTopics || []).map(String))]));
}

// GET /api/syllabus — list syllabi (students see published only) + my progress.
async function listSyllabi(req, res, next) {
    try {
        const filter = isStaff(req.user) ? {} : { published: true };
        const syllabi = await Syllabus.find(filter).sort({ order: 1, createdAt: 1 }).lean();
        const map = await progressMap(req.user._id, syllabi);
        const out = syllabi.map((s) => {
            const set = map.get(String(s._id)) || new Set();
            return { ...s, progress: summarize(s, set), completedTopics: [...set] };
        });
        return res.status(200).json({ success: true, syllabi: out });
    } catch (e) {
        next(e);
    }
}

// GET /api/syllabus/me/summary — overall coverage across published syllabi.
async function myProgressSummary(req, res, next) {
    try {
        const syllabi = await Syllabus.find({ published: true }).lean();
        const map = await progressMap(req.user._id, syllabi);
        let totalTopics = 0, doneTopics = 0, totalHours = 0, doneHours = 0;
        for (const s of syllabi) {
            const sum = summarize(s, map.get(String(s._id)) || new Set());
            totalTopics += sum.totalTopics;
            doneTopics += sum.doneTopics;
            totalHours += sum.totalHours;
            doneHours += sum.doneHours;
        }
        return res.status(200).json({
            success: true,
            summary: {
                syllabusCount: syllabi.length,
                totalTopics,
                doneTopics,
                totalHours,
                doneHours,
                percent: totalTopics ? Math.round((doneTopics / totalTopics) * 100) : 0,
            },
        });
    } catch (e) {
        next(e);
    }
}

// GET /api/syllabus/:id — one syllabus + my completed topics.
async function getSyllabus(req, res, next) {
    try {
        const syllabus = await Syllabus.findById(req.params.id).lean();
        if (!syllabus || (!syllabus.published && !isStaff(req.user))) {
            return res.status(404).json({ success: false, message: "Syllabus not found" });
        }
        const progress = await SyllabusProgress.findOne({ user: req.user._id, syllabus: syllabus._id }).lean();
        const set = new Set((progress?.completedTopics || []).map(String));
        return res.status(200).json({
            success: true,
            syllabus: { ...syllabus, progress: summarize(syllabus, set), completedTopics: [...set] },
        });
    } catch (e) {
        next(e);
    }
}

// POST /api/syllabus — create (staff).
async function createSyllabus(req, res, next) {
    try {
        const { title, subject, description, exam, chapters, published } = req.body;
        if (!title || !String(title).trim()) {
            return res.status(400).json({ success: false, message: "Give the syllabus a title." });
        }
        const syllabus = await Syllabus.create({
            title: String(title).trim(),
            subject,
            description,
            exam: exam || "LEET",
            chapters: normalizeChapters(chapters),
            published: published !== false,
            createdBy: req.user._id,
        });
        return res.status(201).json({ success: true, message: "Syllabus created", syllabus });
    } catch (e) {
        next(e);
    }
}

// PUT /api/syllabus/:id — update (staff).
async function updateSyllabus(req, res, next) {
    try {
        const { title, subject, description, exam, chapters, published } = req.body;
        const update = {};
        if (title != null) update.title = String(title).trim();
        if (subject != null) update.subject = subject;
        if (description != null) update.description = description;
        if (exam != null) update.exam = exam;
        if (published != null) update.published = !!published;
        if (chapters != null) update.chapters = normalizeChapters(chapters);

        const syllabus = await Syllabus.findByIdAndUpdate(req.params.id, update, {
            returnDocument: "after",
            runValidators: true,
        });
        if (!syllabus) return res.status(404).json({ success: false, message: "Syllabus not found" });
        return res.status(200).json({ success: true, message: "Syllabus updated", syllabus });
    } catch (e) {
        next(e);
    }
}

// DELETE /api/syllabus/:id — delete (staff) + its progress rows.
async function deleteSyllabus(req, res, next) {
    try {
        const syllabus = await Syllabus.findByIdAndDelete(req.params.id);
        if (!syllabus) return res.status(404).json({ success: false, message: "Syllabus not found" });
        await SyllabusProgress.deleteMany({ syllabus: syllabus._id });
        return res.status(200).json({ success: true, message: "Syllabus deleted" });
    } catch (e) {
        next(e);
    }
}

// POST /api/syllabus/ai-draft — AI-structure pasted syllabus text (staff).
async function aiDraftSyllabus(req, res, next) {
    try {
        const { text, subject } = req.body || {};
        if (!text || !String(text).trim()) {
            return res.status(400).json({ success: false, message: "Paste the syllabus text to refine." });
        }
        const { result, cacheHit } = await runAiFeature({
            user: req.user,
            feature: "syllabusDraft",
            cacheParams: { text, subject },
            inputText: text,
            generate: () => aiService.structureSyllabus({ text: String(text), subject }),
        });
        return res.status(200).json({ success: true, cacheHit, draft: result });
    } catch (e) {
        if (e.status === 429) return res.status(429).json({ success: false, message: e.message, quota: e.quota });
        next(e);
    }
}

// POST /api/syllabus/ai-scan — scan an uploaded PDF into a syllabus (staff).
async function aiScanSyllabus(req, res, next) {
    let path;
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "Upload a PDF to scan." });
        path = req.file.path;
        const base64 = fs.readFileSync(path).toString("base64");
        const { subject } = req.body || {};
        const { result } = await runAiFeature({
            user: req.user,
            feature: "syllabusScan",
            cacheParams: { file: req.file.originalname, size: req.file.size, subject },
            inputText: req.file.originalname || "",
            generate: () =>
                aiService.structureSyllabus({
                    subject,
                    fileData: { mimeType: req.file.mimetype, data: base64 },
                }),
        });
        if (path && fs.existsSync(path)) fs.unlinkSync(path);
        return res.status(200).json({ success: true, draft: result });
    } catch (e) {
        if (path && fs.existsSync(path)) fs.unlinkSync(path);
        if (e.status === 429) return res.status(429).json({ success: false, message: e.message, quota: e.quota });
        next(e);
    }
}

// POST /api/syllabus/:id/toggle — mark a topic complete/incomplete (student).
async function toggleTopic(req, res, next) {
    try {
        const { topicId, done } = req.body || {};
        if (!topicId || !mongoose.isValidObjectId(topicId)) {
            return res.status(400).json({ success: false, message: "Invalid topic." });
        }
        const syllabus = await Syllabus.findById(req.params.id).lean();
        if (!syllabus) return res.status(404).json({ success: false, message: "Syllabus not found" });

        const belongs = (syllabus.chapters || []).some((c) =>
            (c.topics || []).some((t) => String(t._id) === String(topicId))
        );
        if (!belongs) return res.status(400).json({ success: false, message: "That topic isn't in this syllabus." });

        const op = done
            ? { $addToSet: { completedTopics: topicId } }
            : { $pull: { completedTopics: topicId } };
        const progress = await SyllabusProgress.findOneAndUpdate(
            { user: req.user._id, syllabus: syllabus._id },
            op,
            { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
        );
        const set = new Set((progress.completedTopics || []).map(String));
        return res.status(200).json({ success: true, progress: summarize(syllabus, set), completedTopics: [...set] });
    } catch (e) {
        next(e);
    }
}

module.exports = {
    listSyllabi,
    myProgressSummary,
    getSyllabus,
    createSyllabus,
    updateSyllabus,
    deleteSyllabus,
    aiDraftSyllabus,
    aiScanSyllabus,
    toggleTopic,
};
