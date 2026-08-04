const SeatMatrix = require("../../models/seatMatrixModel");

// GET /api/seat-matrix — lightweight index of which exams have a published seat
// matrix (used to show/hide the "Seat Matrix" button on the exam-pattern page).
async function listAvailable(req, res, next) {
    try {
        const rows = await SeatMatrix.find({ published: true })
            .select("examCode examName session totalSeats totalColleges totalBranches updatedAt")
            .sort({ examName: 1 })
            .lean();
        return res.status(200).json({ success: true, matrices: rows });
    } catch (err) {
        next(err);
    }
}

// GET /api/seat-matrix/:examCode — the full college→branch seat matrix for one
// exam. Colleges are returned alphabetically so the viewer can render them as-is.
async function getByExamCode(req, res, next) {
    try {
        const examCode = String(req.params.examCode || "").trim();
        const matrix = await SeatMatrix.findOne({ examCode, published: true }).lean();
        if (!matrix) {
            return res.status(404).json({ success: false, message: "No seat matrix for this exam yet" });
        }
        const colleges = [...(matrix.colleges || [])].sort((a, b) =>
            (a.name || "").localeCompare(b.name || "", "en", { sensitivity: "base" })
        );
        return res.status(200).json({ success: true, matrix: { ...matrix, colleges } });
    } catch (err) {
        next(err);
    }
}

module.exports = { listAvailable, getByExamCode };
