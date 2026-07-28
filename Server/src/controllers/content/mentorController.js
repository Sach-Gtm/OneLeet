const Mentor = require("../../models/mentorModel");
const cloudinary = require("../../config/cloudinary");
const { uploadBufferToCloudinary } = require("../../utils/cloudinaryUpload");

const publicShape = (m) => ({
    _id: m._id,
    name: m.name,
    exam: m.exam,
    description: m.description,
    handle: m.handle,
    photo: m.photo?.url || null,
    order: m.order,
});

// GET /api/mentors — PUBLIC. The Mentors page reads this without auth.
async function listMentors(req, res, next) {
    try {
        const mentors = await Mentor.find({ published: true })
            .sort({ order: 1, createdAt: 1 })
            .lean();
        return res.status(200).json({ success: true, mentors: mentors.map(publicShape) });
    } catch (e) {
        next(e);
    }
}

// POST /api/mentors — ADMIN ONLY. Multipart: name (required), exam, description,
// handle, and an optional "photo" image (streamed to Cloudinary).
async function createMentor(req, res, next) {
    try {
        const { name, exam, description, handle, order } = req.body || {};
        if (!name || !String(name).trim()) {
            return res.status(400).json({ success: false, message: "Give the mentor a name." });
        }

        let photo;
        if (req.file) {
            const result = await uploadBufferToCloudinary(req.file.buffer, {
                folder: "oneleet/mentors",
                resource_type: "image",
                transformation: [{ width: 512, height: 512, crop: "fill", gravity: "face" }],
            });
            photo = { url: result.secure_url, publicId: result.public_id };
        }

        const mentor = await Mentor.create({
            name: String(name).trim(),
            exam: exam ? String(exam).trim() : undefined,
            description: description ? String(description).trim() : undefined,
            handle: handle ? String(handle).trim() : undefined,
            photo,
            order: Number(order) || 0,
            createdBy: req.user._id,
        });
        return res.status(201).json({ success: true, message: "Mentor added", mentor: publicShape(mentor) });
    } catch (e) {
        next(e);
    }
}

// DELETE /api/mentors/:id — ADMIN ONLY. Removes the record and its photo asset.
async function deleteMentor(req, res, next) {
    try {
        const existing = await Mentor.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: "Mentor not found" });

        const publicId = existing.photo?.publicId;
        await existing.deleteOne();
        if (publicId) {
            cloudinary.uploader
                .destroy(publicId)
                .catch((e) => console.warn("[mentor] photo cleanup failed:", e.message));
        }
        return res.status(200).json({ success: true, message: "Mentor removed" });
    } catch (e) {
        next(e);
    }
}

module.exports = { listMentors, createMentor, deleteMentor };
