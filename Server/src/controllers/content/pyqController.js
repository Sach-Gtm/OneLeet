const fs = require("fs");
const cloudinary = require("../../config/cloudinary");
const Pyq = require("../../models/pyqModel");

// Turn a query param that may be a comma-separated list ("2023,2022") into a
// Mongo filter clause. Returns undefined when empty so we can skip the key.
const listFilter = (value) => {
    if (!value) return undefined;
    const arr = String(value)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    return arr.length ? { $in: arr } : undefined;
};

// GET /api/pyqs  — filterable, searchable, paginated archive
async function getPyqs(req, res, next) {
    try {
        const {
            year,
            stateExam,
            branch,
            subject,
            difficulty,
            q,
            sort = "newest",
            page = 1,
            limit = 9,
        } = req.query;

        const filter = {};

        const yearArr = listFilter(year);
        if (yearArr) filter.year = { $in: yearArr.$in.map(Number) };

        const stateFilter = listFilter(stateExam);
        if (stateFilter) filter.stateExam = stateFilter;

        const branchFilter = listFilter(branch);
        if (branchFilter) filter.branch = branchFilter;

        const subjectFilter = listFilter(subject);
        if (subjectFilter) filter.subject = subjectFilter;

        const difficultyFilter = listFilter(difficulty);
        if (difficultyFilter) filter.difficulty = difficultyFilter;

        if (q && q.trim()) {
            const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            filter.$or = [{ title: rx }, { topic: rx }, { subject: rx }];
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 9));
        const skip = (pageNum - 1) * limitNum;

        const sortMap = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            "year-desc": { year: -1 },
            "year-asc": { year: 1 },
        };
        const sortBy = sortMap[sort] || sortMap.newest;

        const [pyqs, total] = await Promise.all([
            Pyq.find(filter)
                .select("title year stateExam branch subject topic difficulty tag questionsCount fileUrl createdAt")
                .populate("uploadedBy", "name")
                .sort(sortBy)
                .skip(skip)
                .limit(limitNum),
            Pyq.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            pyqs,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum) || 1,
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/pyqs/filters — distinct values for the filter sidebar
async function getFilters(req, res, next) {
    try {
        const [years, stateExams, branches, subjects] = await Promise.all([
            Pyq.distinct("year"),
            Pyq.distinct("stateExam"),
            Pyq.distinct("branch"),
            Pyq.distinct("subject"),
        ]);

        return res.status(200).json({
            success: true,
            filters: {
                years: years.filter((y) => y != null).sort((a, b) => b - a),
                stateExams: stateExams.filter(Boolean).sort(),
                branches: branches.filter(Boolean).sort(),
                subjects: subjects.filter(Boolean).sort(),
                difficulties: ["easy", "moderate", "hard"],
            },
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/pyqs/:id
async function getPyqById(req, res, next) {
    try {
        const pyq = await Pyq.findById(req.params.id).populate("uploadedBy", "name");
        if (!pyq) {
            return res.status(404).json({ success: false, message: "PYQ not found" });
        }
        return res.status(200).json({ success: true, pyq });
    } catch (error) {
        next(error);
    }
}

// POST /api/pyqs  — upload a paper (teacher only). Mirrors the note upload:
// local temp file via multer, then Cloudinary, then persist. PDF is optional
// (metadata-only papers are allowed).
async function uploadPyq(req, res, next) {
    let localFilePath;
    try {
        const { title, year, stateExam, branch, subject, topic, difficulty, tag } = req.body;

        let fileFields = {};
        if (req.file) {
            localFilePath = req.file.path;
            const uploadResult = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "raw",
                folder: "oneleet/pyqs",
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

        const pyq = await Pyq.create({
            title,
            year,
            stateExam,
            branch,
            subject,
            topic,
            difficulty,
            tag,
            uploadedBy: req.user._id,
            ...fileFields,
        });

        if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

        return res.status(201).json({ success: true, message: "PYQ uploaded", pyq });
    } catch (error) {
        if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        next(error);
    }
}

module.exports = { getPyqs, getFilters, getPyqById, uploadPyq };
