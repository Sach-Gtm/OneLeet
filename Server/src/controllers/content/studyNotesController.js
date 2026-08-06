const fs = require("fs");
const cloudinary = require("../../config/cloudinary");
const Note = require("../../models/noteModel");
const aiService = require("../../services/ai/aiService");
const { runAiFeature } = require("../../services/ai/aiRuntime");
const { sanitizeExams, visibilityQuery } = require("../../config/exams");
const { STAFF, isPremiumUser } = require("../../config/roles");

const CATEGORY = "notes";

const isStaff = (u) => STAFF.includes(u?.role);

// A premium note stays visible to free students (shown locked), but they never
// receive its file/content and can't open it — this 403 is the enforcement.
const premiumBlocked = (req, note) => note.premium && !isPremiumUser(req.user);

const listFilter = (value) => {
    if (!value) return undefined;
    const arr = String(value).split(",").map((v) => v.trim()).filter(Boolean);
    return arr.length ? { $in: arr } : undefined;
};

// GET /api/notes
async function getNotes(req, res, next) {
    try {
        const { subject, difficulty, format, teacher, q, sort = "newest", page = 1, limit = 9 } = req.query;

        const filter = { category: CATEGORY };
        const subjectF = listFilter(subject);
        if (subjectF) filter.subject = subjectF;
        const difficultyF = listFilter(difficulty);
        if (difficultyF) filter.difficulty = difficultyF;
        const formatF = listFilter(format);
        if (formatF) filter.format = formatF;
        const teacherF = listFilter(teacher);
        if (teacherF) filter.teacher = teacherF;

        // Students see notes targeted at the exams they're enrolled in (zero
        // enrollments → universal notes only); staff see every note. The visibility
        // clause and the free-text search clause are BOTH $or-shaped, so AND them
        // together (a bare filter.$or would let the search silently drop visibility).
        const clauses = [];
        if (!isStaff(req.user)) clauses.push(visibilityQuery(req.user?.exams));
        if (q && q.trim()) {
            const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            clauses.push({ $or: [{ title: rx }, { description: rx }, { subject: rx }, { teacher: rx }] });
        }
        if (clauses.length) filter.$and = clauses;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 9));
        const skip = (pageNum - 1) * limitNum;
        const sortBy = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

        const [notes, total] = await Promise.all([
            Note.find(filter)
                .select("title subject description teacher branch level difficulty format fileUrl premium createdAt")
                .populate("uploadedBy", "name")
                .sort(sortBy)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Note.countDocuments(filter),
        ]);

        // Premium notes stay in the list (shown locked) but a free student never
        // gets the fileUrl — so the PDF can't be opened until they upgrade.
        const canPremium = isPremiumUser(req.user);
        const out = notes.map((n) => {
            const locked = !!n.premium && !canPremium;
            return locked ? { ...n, fileUrl: undefined, locked: true } : { ...n, locked: false };
        });

        return res.status(200).json({
            success: true,
            notes: out,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum) || 1,
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/notes/filters
async function getNotesFilters(req, res, next) {
    try {
        const [subjects, teachers] = await Promise.all([
            Note.distinct("subject", { category: CATEGORY }),
            Note.distinct("teacher", { category: CATEGORY }),
        ]);
        return res.status(200).json({
            success: true,
            filters: {
                subjects: subjects.filter(Boolean).sort(),
                teachers: teachers.filter(Boolean).sort(),
                difficulties: ["beginner", "intermediate", "advanced"],
                formats: ["pdf", "handwritten", "slides"],
            },
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/notes/:id
async function getNoteById(req, res, next) {
    try {
        const note = await Note.findOne({ _id: req.params.id, category: CATEGORY }).populate("uploadedBy", "name");
        if (!note) return res.status(404).json({ success: false, message: "Note not found" });
        if (premiumBlocked(req, note)) {
            return res.status(403).json({
                success: false,
                code: "PREMIUM_REQUIRED",
                message: "This is a Premium note. Upgrade to Premium to unlock it.",
            });
        }
        return res.status(200).json({ success: true, note });
    } catch (error) {
        next(error);
    }
}

// POST /api/notes  (staff only) — publish a note. Two ways to provide the body:
//   • Normal mode: attach a PDF (req.file), and/or type the content.
//   • AI mode:     the AI-drafted `content` text (source: "ai"), no file needed.
// A note must have EITHER a file or written content.
async function uploadNote(req, res, next) {
    let localFilePath;
    try {
        const { title, subject, description, teacher, branch, level, difficulty, format, content, source, targets, premium } = req.body;

        // `targets` arrives as a JSON string over multipart; accept an array too.
        let targetList = targets;
        if (typeof targetList === "string") {
            try {
                targetList = JSON.parse(targetList);
            } catch {
                targetList = [];
            }
        }

        const body = typeof content === "string" ? content.trim() : "";
        if (!req.file && !body) {
            return res.status(400).json({
                success: false,
                message: "Attach a PDF or write the note content before publishing.",
            });
        }

        let fileFields = {};
        if (req.file) {
            localFilePath = req.file.path;
            const uploadResult = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "raw",
                folder: "oneleet/notes",
                use_filename: true,
                unique_filename: false,
                overwrite: true,
            });
            fileFields = {
                fileUrl: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
            };
        }

        const note = await Note.create({
            title,
            category: CATEGORY,
            subject,
            description,
            teacher,
            branch,
            level,
            difficulty,
            // A written note with no file is a "text" note; otherwise default to pdf.
            format: format || (req.file ? "pdf" : "text"),
            content: body || undefined,
            source: source === "ai" ? "ai" : "manual",
            targets: sanitizeExams(targetList),
            // Multipart sends everything as strings; treat "true" as premium.
            premium: premium === true || premium === "true",
            uploadedBy: req.user._id,
            ...fileFields,
        });

        if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        return res.status(201).json({ success: true, message: "Note published", note });
    } catch (error) {
        if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        next(error);
    }
}

// POST /api/notes/generate  (staff only) — AI-draft note content from a FREEFORM
// instruction (any format: short/long/MCQs/summary/…), optionally reading an
// attached image or PDF. Does NOT save; the author reviews/edits, then publishes
// via POST /. Routed through the AI runtime (cached + cost-logged; staff are
// unlimited, so no quota applies).
async function generateNoteDraft(req, res, next) {
    let filePath;
    try {
        const { prompt, subject } = req.body || {};
        const hasFile = Boolean(req.file);
        if ((!prompt || !String(prompt).trim()) && !hasFile) {
            return res.status(400).json({
                success: false,
                message: "Tell the AI what to write — or attach an image/PDF for it to read.",
            });
        }

        let fileData;
        if (hasFile) {
            filePath = req.file.path;
            fileData = { mimeType: req.file.mimetype, data: fs.readFileSync(filePath).toString("base64") };
        }

        const { result, cacheHit } = await runAiFeature({
            user: req.user,
            feature: "noteDraft",
            cacheParams: { prompt, subject, file: req.file?.originalname, size: req.file?.size },
            inputText: `${prompt || ""} ${subject || ""}`,
            generate: () => aiService.generateStudyNote({ prompt, subject, fileData }),
        });

        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(200).json({ success: true, cacheHit, draft: result });
    } catch (error) {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (error.status === 429) {
            return res.status(429).json({ success: false, message: error.message, quota: error.quota });
        }
        next(error);
    }
}

// PATCH /api/notes/:id  (staff only) — edit a note's metadata. Powers the
// one-click free⇄premium toggle in the library; also allows light text edits.
// The file itself isn't swapped here (re-upload for that).
async function updateNote(req, res, next) {
    try {
        const note = await Note.findOne({ _id: req.params.id, category: CATEGORY });
        if (!note) return res.status(404).json({ success: false, message: "Note not found" });
        const b = req.body || {};
        if ("premium" in b) note.premium = b.premium === true || b.premium === "true";
        if (b.title != null) note.title = String(b.title).trim();
        if (b.subject != null) note.subject = b.subject;
        if (b.description != null) note.description = b.description;
        if (b.teacher != null) note.teacher = b.teacher;
        if (b.branch != null) note.branch = b.branch;
        if (b.level != null) note.level = b.level;
        if (b.difficulty != null) note.difficulty = b.difficulty;
        if (b.content != null) note.content = String(b.content);
        if (b.targets != null) note.targets = sanitizeExams(b.targets);
        await note.save();
        return res.status(200).json({ success: true, message: "Note updated", note });
    } catch (error) {
        next(error);
    }
}

// DELETE /api/notes/:id  (staff only) — remove a note, best-effort cleaning up
// its Cloudinary file so we don't orphan the asset.
async function deleteNote(req, res, next) {
    try {
        const note = await Note.findOne({ _id: req.params.id, category: CATEGORY });
        if (!note) return res.status(404).json({ success: false, message: "Note not found" });
        if (note.publicId) {
            cloudinary.uploader
                .destroy(note.publicId, { resource_type: "raw" })
                .catch(() =>
                    cloudinary.uploader.destroy(note.publicId).catch((e) =>
                        console.warn("[notes] file cleanup failed:", e.message)
                    )
                );
        }
        await note.deleteOne();
        return res.status(200).json({ success: true, message: "Note deleted" });
    } catch (error) {
        next(error);
    }
}

// POST /api/notes/:id/summary  — AI summary via the provider-agnostic service
async function summarizeNote(req, res, next) {
    try {
        const note = await Note.findOne({ _id: req.params.id, category: CATEGORY });
        if (!note) return res.status(404).json({ success: false, message: "Note not found" });
        if (premiumBlocked(req, note)) {
            return res.status(403).json({ success: false, code: "PREMIUM_REQUIRED", message: "This is a Premium note. Upgrade to Premium to unlock it." });
        }

        const result = await aiService.summarizeNote({
            title: note.title,
            subject: note.subject,
            description: note.description,
        });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
}

// POST /api/notes/:id/flashcards  — AI flashcards
async function generateFlashcards(req, res, next) {
    try {
        const note = await Note.findOne({ _id: req.params.id, category: CATEGORY });
        if (!note) return res.status(404).json({ success: false, message: "Note not found" });
        if (premiumBlocked(req, note)) {
            return res.status(403).json({ success: false, code: "PREMIUM_REQUIRED", message: "This is a Premium note. Upgrade to Premium to unlock it." });
        }

        const count = Math.min(Math.max(parseInt(req.body?.count, 10) || 6, 1), 20);
        const result = await aiService.generateFlashcards({
            title: note.title,
            subject: note.subject,
            description: note.description,
            count,
        });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getNotes,
    getNotesFilters,
    getNoteById,
    uploadNote,
    updateNote,
    deleteNote,
    generateNoteDraft,
    summarizeNote,
    generateFlashcards,
};
