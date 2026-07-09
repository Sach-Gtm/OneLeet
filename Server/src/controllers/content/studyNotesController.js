const fs = require("fs");
const cloudinary = require("../../config/cloudinary");
const Note = require("../../models/noteModel");
const aiService = require("../../services/ai/aiService");

const CATEGORY = "notes";

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

        if (q && q.trim()) {
            const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            filter.$or = [{ title: rx }, { description: rx }, { subject: rx }, { teacher: rx }];
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 9));
        const skip = (pageNum - 1) * limitNum;
        const sortBy = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

        const [notes, total] = await Promise.all([
            Note.find(filter)
                .select("title subject description teacher branch level difficulty format fileUrl createdAt")
                .populate("uploadedBy", "name")
                .sort(sortBy)
                .skip(skip)
                .limit(limitNum),
            Note.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            notes,
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
        return res.status(200).json({ success: true, note });
    } catch (error) {
        next(error);
    }
}

// POST /api/notes  (teacher only)
async function uploadNote(req, res, next) {
    let localFilePath;
    try {
        const { title, subject, description, teacher, branch, level, difficulty, format } = req.body;

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
            format,
            uploadedBy: req.user._id,
            ...fileFields,
        });

        if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        return res.status(201).json({ success: true, message: "Note uploaded", note });
    } catch (error) {
        if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        next(error);
    }
}

// POST /api/notes/:id/summary  — AI summary via the provider-agnostic service
async function summarizeNote(req, res, next) {
    try {
        const note = await Note.findOne({ _id: req.params.id, category: CATEGORY });
        if (!note) return res.status(404).json({ success: false, message: "Note not found" });

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
    summarizeNote,
    generateFlashcards,
};
