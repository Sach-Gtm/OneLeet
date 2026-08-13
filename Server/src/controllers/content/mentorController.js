const Mentor = require("../../models/mentorModel");
const cloudinary = require("../../config/cloudinary");
const { uploadBufferToCloudinary } = require("../../utils/cloudinaryUpload");

// ── helpers ────────────────────────────────────────────────────────────────

const slugify = (s) =>
    String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "mentor";

// A slug unique across mentors (numeric suffix on collision). `ignoreId` lets an
// update keep its own slug without colliding with itself.
async function uniqueSlug(base, ignoreId) {
    const root = slugify(base);
    let slug = root;
    let n = 1;
    // eslint-disable-next-line no-await-in-loop
    while (await Mentor.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) })) {
        n += 1;
        slug = `${root}-${n}`;
    }
    return slug;
}

// Multipart fields arrive as JSON strings; a JSON body sends real arrays. Parse
// either safely and cap the shape so nothing unbounded reaches the DB.
const asArray = (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string" && v.trim()) {
        try {
            const parsed = JSON.parse(v);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};
const cleanHighlights = (v) =>
    asArray(v)
        .map((x) => String(x || "").trim())
        .filter(Boolean)
        .slice(0, 10)
        .map((s) => s.slice(0, 160));
const cleanStats = (v) =>
    asArray(v)
        .map((s) => ({ value: String(s?.value || "").trim().slice(0, 24), label: String(s?.label || "").trim().slice(0, 48) }))
        .filter((s) => s.value || s.label)
        .slice(0, 6);
const cleanLinks = (v) =>
    asArray(v)
        .map((l) => ({ label: String(l?.label || "").trim().slice(0, 48), url: String(l?.url || "").trim().slice(0, 300) }))
        .filter((l) => l.url && /^https?:\/\//i.test(l.url))
        .slice(0, 6);

// Card shape for the public list — light (no long story).
const cardShape = (m) => ({
    _id: m._id,
    slug: m.slug,
    name: m.name,
    role: m.role,
    exam: m.exam,
    tagline: m.tagline,
    description: m.description,
    handle: m.handle,
    photo: m.photo?.url || null,
    highlights: (m.highlights || []).slice(0, 3),
    order: m.order,
});

// Full shape for a single journey page (and the admin editor).
const detailShape = (m) => ({
    _id: m._id,
    slug: m.slug,
    name: m.name,
    role: m.role,
    exam: m.exam,
    tagline: m.tagline,
    description: m.description,
    story: m.story,
    highlights: m.highlights || [],
    stats: m.stats || [],
    links: m.links || [],
    handle: m.handle,
    photo: m.photo?.url || null,
    published: m.published,
    order: m.order,
});

// ── public ─────────────────────────────────────────────────────────────────

// GET /api/mentors — PUBLIC. The Mentors page reads this without auth.
async function listMentors(req, res, next) {
    try {
        const mentors = await Mentor.find({ published: true }).sort({ order: 1, createdAt: 1 }).lean();
        return res.status(200).json({ success: true, mentors: mentors.map(cardShape) });
    } catch (e) {
        next(e);
    }
}

// GET /api/mentors/:slug — PUBLIC. One mentor's full journey.
async function getMentor(req, res, next) {
    try {
        const mentor = await Mentor.findOne({ slug: String(req.params.slug || "").toLowerCase(), published: true }).lean();
        if (!mentor) return res.status(404).json({ success: false, message: "Mentor not found" });
        return res.status(200).json({ success: true, mentor: detailShape(mentor) });
    } catch (e) {
        next(e);
    }
}

// ── admin ──────────────────────────────────────────────────────────────────

// GET /api/mentors/admin/all — ADMIN. Full data for every mentor (incl.
// unpublished) so the editor can load everything.
async function adminListMentors(req, res, next) {
    try {
        const mentors = await Mentor.find({}).sort({ order: 1, createdAt: 1 }).lean();
        return res.status(200).json({ success: true, mentors: mentors.map(detailShape) });
    } catch (e) {
        next(e);
    }
}

// Stream an uploaded photo to Cloudinary → { url, publicId }.
async function uploadPhoto(file) {
    const result = await uploadBufferToCloudinary(file.buffer, {
        folder: "oneleet/mentors",
        resource_type: "image",
        transformation: [{ width: 512, height: 512, crop: "fill", gravity: "face" }],
    });
    return { url: result.secure_url, publicId: result.public_id };
}

// POST /api/mentors — ADMIN ONLY. Multipart.
async function createMentor(req, res, next) {
    try {
        const b = req.body || {};
        if (!b.name || !String(b.name).trim()) {
            return res.status(400).json({ success: false, message: "Give the mentor a name." });
        }
        const name = String(b.name).trim();
        const slug = await uniqueSlug(b.slug || name);

        let photo;
        if (req.file) photo = await uploadPhoto(req.file);

        const mentor = await Mentor.create({
            name,
            slug,
            role: b.role ? String(b.role).trim() : undefined,
            exam: b.exam ? String(b.exam).trim() : undefined,
            tagline: b.tagline ? String(b.tagline).trim() : undefined,
            description: b.description ? String(b.description).trim() : undefined,
            story: b.story ? String(b.story).trim() : undefined,
            highlights: cleanHighlights(b.highlights),
            stats: cleanStats(b.stats),
            links: cleanLinks(b.links),
            handle: b.handle ? String(b.handle).trim() : undefined,
            photo,
            published: b.published === undefined ? true : b.published === "false" ? false : Boolean(b.published),
            order: Number(b.order) || 0,
            createdBy: req.user._id,
        });
        return res.status(201).json({ success: true, message: "Mentor added", mentor: detailShape(mentor) });
    } catch (e) {
        next(e);
    }
}

// PATCH /api/mentors/:id — ADMIN ONLY. Multipart; only sent fields change.
async function updateMentor(req, res, next) {
    try {
        const mentor = await Mentor.findById(req.params.id);
        if (!mentor) return res.status(404).json({ success: false, message: "Mentor not found" });

        const b = req.body || {};
        const set = (field, val) => {
            if (val !== undefined) mentor[field] = val;
        };

        if (b.name !== undefined && String(b.name).trim()) mentor.name = String(b.name).trim();
        // Regenerate the slug only when explicitly given (keeps existing links stable otherwise).
        if (b.slug !== undefined && String(b.slug).trim()) mentor.slug = await uniqueSlug(b.slug, mentor._id);
        set("role", b.role !== undefined ? String(b.role).trim() : undefined);
        set("exam", b.exam !== undefined ? String(b.exam).trim() : undefined);
        set("tagline", b.tagline !== undefined ? String(b.tagline).trim() : undefined);
        set("description", b.description !== undefined ? String(b.description).trim() : undefined);
        set("story", b.story !== undefined ? String(b.story).trim() : undefined);
        set("handle", b.handle !== undefined ? String(b.handle).trim() : undefined);
        if (b.highlights !== undefined) mentor.highlights = cleanHighlights(b.highlights);
        if (b.stats !== undefined) mentor.stats = cleanStats(b.stats);
        if (b.links !== undefined) mentor.links = cleanLinks(b.links);
        if (b.order !== undefined) mentor.order = Number(b.order) || 0;
        if (b.published !== undefined) mentor.published = !(b.published === "false" || b.published === false);

        if (req.file) {
            const oldId = mentor.photo?.publicId;
            mentor.photo = await uploadPhoto(req.file);
            if (oldId) cloudinary.uploader.destroy(oldId).catch((e) => console.warn("[mentor] old photo cleanup:", e.message));
        }

        // A legacy record may still be missing a slug — backfill on first edit.
        if (!mentor.slug) mentor.slug = await uniqueSlug(mentor.name, mentor._id);

        await mentor.save();
        return res.status(200).json({ success: true, message: "Mentor updated", mentor: detailShape(mentor) });
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
            cloudinary.uploader.destroy(publicId).catch((e) => console.warn("[mentor] photo cleanup failed:", e.message));
        }
        return res.status(200).json({ success: true, message: "Mentor removed" });
    } catch (e) {
        next(e);
    }
}

module.exports = { listMentors, getMentor, adminListMentors, createMentor, updateMentor, deleteMentor };
