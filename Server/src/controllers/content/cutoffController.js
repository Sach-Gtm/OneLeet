const CutoffMatrix = require("../../models/cutoffMatrixModel");

// GET /api/cutoffs — which exams have published cut-offs (to gate the button).
async function listAvailable(req, res, next) {
    try {
        const rows = await CutoffMatrix.find({ published: true })
            .select("examCode examName session totalRounds updatedAt")
            .sort({ examName: 1 })
            .lean();
        return res.status(200).json({ success: true, cutoffs: rows });
    } catch (err) {
        next(err);
    }
}

// GET /api/cutoffs/:examCode — full round-wise cut-off matrix, colleges sorted
// alphabetically within each round so the viewer renders them as-is.
async function getByExamCode(req, res, next) {
    try {
        const examCode = String(req.params.examCode || "").trim();
        const doc = await CutoffMatrix.findOne({ examCode, published: true }).lean();
        if (!doc) {
            return res.status(404).json({ success: false, message: "No cut-offs for this exam yet" });
        }
        const rounds = (doc.rounds || []).map((r) => ({
            ...r,
            colleges: [...(r.colleges || [])].sort((a, b) =>
                (a.name || "").localeCompare(b.name || "", "en", { sensitivity: "base" })
            ),
        }));
        return res.status(200).json({ success: true, cutoff: { ...doc, rounds } });
    } catch (err) {
        next(err);
    }
}

module.exports = { listAvailable, getByExamCode };
