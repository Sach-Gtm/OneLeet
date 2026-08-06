const Enrollment = require("../../models/enrollmentModel");
const Course = require("../../models/courseModel");
const User = require("../../models/userModel");

// Rebuild the student's `exams` cache (a client-convenience mirror of the exam
// codes they can see content for) from their ACTIVE enrollments. Enrollments are
// the source of truth; this keeps the many `user.exams` client readers working.
async function syncUserExams(userId) {
    const rows = await Enrollment.find({ student: userId, status: "active" }, "examCode").lean();
    const codes = [...new Set(rows.map((r) => r.examCode))];
    await User.updateOne({ _id: userId }, { $set: { exams: codes } });
    return codes;
}

// POST /api/enrollments  { courseId } or { slug } — free enrollment (idempotent).
async function enroll(req, res, next) {
    try {
        const { courseId, slug } = req.body || {};
        const query = courseId ? { _id: courseId } : slug ? { slug: String(slug).toLowerCase() } : null;
        if (!query) return res.status(400).json({ success: false, message: "courseId or slug is required" });
        const course = await Course.findOne({ ...query, published: true }).lean();
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        await Enrollment.findOneAndUpdate(
            { student: req.user._id, course: course._id },
            { $set: { examCode: course.examCode, status: "active" } },
            { upsert: true, setDefaultsOnInsert: true }
        );
        const exams = await syncUserExams(req.user._id);
        return res.status(200).json({ success: true, message: `Enrolled in ${course.name}`, examCode: course.examCode, exams });
    } catch (e) {
        next(e);
    }
}

// DELETE /api/enrollments/:courseId — leave a batch.
async function unenroll(req, res, next) {
    try {
        const removed = await Enrollment.findOneAndDelete({ student: req.user._id, course: req.params.courseId });
        if (!removed) return res.status(404).json({ success: false, message: "You are not enrolled in this course" });
        const exams = await syncUserExams(req.user._id);
        return res.status(200).json({ success: true, message: "Left the batch", exams });
    } catch (e) {
        next(e);
    }
}

// GET /api/enrollments/me — the student's active enrollments (with their courses).
async function myEnrollments(req, res, next) {
    try {
        const rows = await Enrollment.find({ student: req.user._id, status: "active" })
            .sort({ createdAt: -1 })
            .populate("course")
            .lean();
        const courses = rows
            .filter((r) => r.course) // drop enrollments whose course was deleted
            .map((r) => ({
                enrollmentId: r._id,
                enrolledAt: r.createdAt,
                examCode: r.examCode,
                course: {
                    _id: r.course._id,
                    name: r.course.name,
                    slug: r.course.slug,
                    examCode: r.course.examCode,
                    examName: r.course.examName || "",
                    tagline: r.course.tagline || "",
                    coverImage: r.course.coverImage?.url ? { url: r.course.coverImage.url } : null,
                    startDate: r.course.startDate || null,
                },
            }));
        return res.status(200).json({ success: true, courses });
    } catch (e) {
        next(e);
    }
}

module.exports = { enroll, unenroll, myEnrollments };
