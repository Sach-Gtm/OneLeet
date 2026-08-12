const fs = require("fs");
const cloudinary = require("../../config/cloudinary");
const Note = require("../../models/noteModel");
const { isPremiumUser } = require("../../config/roles");

const ALLOWED_CATEGORIES = ["pyqs", "important-questions", "notes"];

async function uploadPdf (req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No PDF file uploaded or file extension is invalid." });
        }

        const uploadedBy = req.user._id;
        const { title, category, subject } = req.body;
        if (!ALLOWED_CATEGORIES.includes(category)) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: `Invalid category. Must be one of: ${ALLOWED_CATEGORIES.join(", ")}` });
        }
        const localFilePath = req.file.path;

        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "raw", 
            folder: `oneleet/notes/${category}`,
            use_filename: true,
            unique_filename: false,
            overwrite: true, 
        });

        const note = await Note.create({
            title,
            category,
            subject,
            fileUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            uploadedBy: uploadedBy,
        });

        fs.unlinkSync(localFilePath);

        res.status(201).json({ message: "Note uploaded successfully", note });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(err);
    }
};

async function getPdf (req, res) {
    try {
        const { category } = req.params;

        if (!ALLOWED_CATEGORIES.includes(category)) {
            return res.status(400).json({
                message: `Invalid category: ${category}. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`
            });
        }

        const filter = { category };

        if (req.query.subject) {
            filter.subject = String(req.query.subject);
        }

        const notes = await Note.find(filter)
            .select('title subject premium fileUrl uploadedBy createdAt')
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Same paywall as the modern /api/notes reader: a premium note stays in the
        // list (shown locked) but a free student never receives its fileUrl.
        const canPremium = isPremiumUser(req.user);
        const out = notes.map((n) =>
            n.premium && !canPremium ? { ...n, fileUrl: undefined, locked: true } : { ...n, locked: false }
        );

        res.status(200).json({
            success: true,
            count: out.length,
            notes: out
        });

    } catch (error) {
        console.error("GET NOTES BY CATEGORY ERROR:", error);
        res.status(500).json({ message: "Failed to fetch content." });
    }
};

module.exports={
    uploadPdf,
    getPdf
}