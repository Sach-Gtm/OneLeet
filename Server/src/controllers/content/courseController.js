const Course = require("../../models/courseModel");
const Enrollment = require("../../models/enrollmentModel");
const { isValidExam, getExams } = require("../../config/exams");
const { STAFF } = require("../../config/roles");

// Staff (admin/superadmin/teacher) bypass enrollment gating and can preview drafts.
const isStaff = (u) => !!u && STAFF.includes(u.role);

// A URL-safe slug from a course name (falls back to a timestamp-free random-ish
// suffix only if the name is empty).
const slugify = (s) =>
    String(s || "")
        .toLowerCase()
        .trim()
        .replace(/['".]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);

const str = (v, max) => {
    if (v === undefined || v === null) return undefined;
    const s = String(v).trim();
    return s ? s.slice(0, max) : "";
};
const num = (v) => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
};

const shape = (c, { enrolled } = {}) => ({
    _id: c._id,
    name: c.name,
    slug: c.slug,
    examCode: c.examCode,
    examName: c.examName || "",
    kind: c.kind || "exam",
    tagline: c.tagline || "",
    description: c.description || "",
    whatsInside: c.whatsInside || [],
    termsAndConditions: c.termsAndConditions || "",
    successPromise: c.successPromise || "",
    validityDays: c.validityDays || 365,
    coverImage: c.coverImage?.url ? { url: c.coverImage.url } : null,
    price: c.price || 0,
    mrp: c.mrp || 0,
    seatCap: c.seatCap || 0,
    order: c.order || 0,
    startDate: c.startDate || null,
    published: c.published,
    createdAt: c.createdAt,
    ...(enrolled !== undefined ? { enrolled } : {}),
});

// Which of these course ids the (optional) signed-in student is actively enrolled in.
async function enrolledSet(user, courseIds) {
    if (!user || isStaff(user) || !courseIds.length) return new Set();
    const rows = await Enrollment.find(
        { student: user._id, status: "active", course: { $in: courseIds } },
        "course"
    ).lean();
    return new Set(rows.map((r) => String(r.course)));
}

// GET /api/courses — published courses (public). Annotates `enrolled` when signed in.
async function listPublished(req, res, next) {
    try {
        const courses = await Course.find({ published: true }).sort({ order: 1, createdAt: 1 }).lean();
        const enrolled = await enrolledSet(req.user, courses.map((c) => c._id));
        return res.status(200).json({
            success: true,
            courses: courses.map((c) => shape(c, { enrolled: enrolled.has(String(c._id)) })),
        });
    } catch (e) {
        next(e);
    }
}

// GET /api/courses/:slug — one published course (public); staff can preview drafts.
async function getBySlug(req, res, next) {
    try {
        const course = await Course.findOne({ slug: String(req.params.slug || "").toLowerCase() }).lean();
        if (!course || (!course.published && !isStaff(req.user))) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        const enrolled = await enrolledSet(req.user, [course._id]);
        return res.status(200).json({ success: true, course: shape(course, { enrolled: enrolled.has(String(course._id)) }) });
    } catch (e) {
        next(e);
    }
}

// GET /api/courses/manage — ADMIN. Every course (published or not).
async function listAll(req, res, next) {
    try {
        const courses = await Course.find({}).sort({ order: 1, createdAt: 1 }).lean();
        return res.status(200).json({ success: true, courses: courses.map((c) => shape(c)) });
    } catch (e) {
        next(e);
    }
}

// Build a unique slug (append -2, -3… on collision).
async function uniqueSlug(base, ignoreId) {
    const root = slugify(base) || "course";
    let slug = root;
    for (let i = 2; ; i++) {
        const clash = await Course.findOne({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) }).select("_id").lean();
        if (!clash) return slug;
        slug = `${root}-${i}`;
    }
}

// POST /api/courses — ADMIN. Create a course for a catalog exam-code (never "all").
async function createCourse(req, res, next) {
    try {
        const b = req.body || {};
        const kind = b.kind === "counselling" ? "counselling" : "exam";
        const examCode = String(b.examCode || "").trim();
        // Exam batches must target one real exam; counselling packs have none.
        if (kind === "exam" && (examCode === "all" || !isValidExam(examCode))) {
            return res.status(400).json({ success: false, message: "A course must target one valid exam (not 'all')." });
        }
        const name = str(b.name, 140);
        if (!name) return res.status(400).json({ success: false, message: "Course name is required." });
        const examName = kind === "exam" ? getExams().find((e) => e.code === examCode)?.name || "" : "";
        const course = await Course.create({
            name,
            slug: await uniqueSlug(b.slug || name),
            examCode: kind === "exam" ? examCode : "",
            examName,
            kind,
            tagline: str(b.tagline, 200),
            description: str(b.description, 4000),
            whatsInside: Array.isArray(b.whatsInside) ? b.whatsInside.map((x) => str(x, 200)).filter(Boolean).slice(0, 30) : [],
            termsAndConditions: str(b.termsAndConditions, 8000),
            successPromise: str(b.successPromise, 2000),
            validityDays: num(b.validityDays) ?? 365,
            price: num(b.price) ?? 0,
            mrp: num(b.mrp) ?? 0,
            seatCap: num(b.seatCap) ?? 0,
            startDate: b.startDate ? new Date(b.startDate) : undefined,
            order: num(b.order) ?? 0,
            published: b.published === true || b.published === "true",
            createdBy: req.user._id,
        });
        return res.status(201).json({ success: true, course: shape(course) });
    } catch (e) {
        next(e);
    }
}

// PATCH /api/courses/:id — ADMIN.
async function updateCourse(req, res, next) {
    try {
        const b = req.body || {};
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        if (b.examCode !== undefined) {
            const code = String(b.examCode).trim();
            if (code === "all" || !isValidExam(code)) {
                return res.status(400).json({ success: false, message: "A course must target one valid exam (not 'all')." });
            }
            course.examCode = code;
            course.examName = getExams().find((e) => e.code === code)?.name || course.examName;
        }
        if (b.name !== undefined) course.name = str(b.name, 140) || course.name;
        if (b.slug !== undefined) course.slug = await uniqueSlug(b.slug || course.name, course._id);
        if (b.tagline !== undefined) course.tagline = str(b.tagline, 200);
        if (b.description !== undefined) course.description = str(b.description, 4000);
        if (b.whatsInside !== undefined)
            course.whatsInside = Array.isArray(b.whatsInside) ? b.whatsInside.map((x) => str(x, 200)).filter(Boolean).slice(0, 30) : [];
        if (b.termsAndConditions !== undefined) course.termsAndConditions = str(b.termsAndConditions, 8000);
        if (b.price !== undefined) course.price = num(b.price) ?? course.price;
        if (b.mrp !== undefined) course.mrp = num(b.mrp) ?? course.mrp;
        if (b.successPromise !== undefined) course.successPromise = str(b.successPromise, 2000);
        if (b.validityDays !== undefined) course.validityDays = num(b.validityDays) ?? course.validityDays;
        if (b.kind !== undefined && ["exam", "counselling"].includes(b.kind)) course.kind = b.kind;
        if (b.seatCap !== undefined) course.seatCap = num(b.seatCap) ?? course.seatCap;
        if (b.startDate !== undefined) course.startDate = b.startDate ? new Date(b.startDate) : undefined;
        if (b.order !== undefined) course.order = num(b.order) ?? course.order;
        if (b.published !== undefined) course.published = b.published === true || b.published === "true";

        await course.save();
        return res.status(200).json({ success: true, course: shape(course) });
    } catch (e) {
        next(e);
    }
}

// DELETE /api/courses/:id — ADMIN. Removes the course and its enrollments.
async function deleteCourse(req, res, next) {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });
        await Enrollment.deleteMany({ course: course._id });
        return res.status(200).json({ success: true, message: "Course deleted" });
    } catch (e) {
        next(e);
    }
}

module.exports = { listPublished, getBySlug, listAll, createCourse, updateCourse, deleteCourse };
