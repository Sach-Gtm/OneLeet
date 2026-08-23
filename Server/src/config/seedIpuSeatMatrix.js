const SeatMatrix = require("../models/seatMatrixModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");
const data = require("./ipuSeatMatrixData.json");

// One-time publish of the IPU LEET 2026-27 seat matrix (college → branch →
// General/MQ seats), extracted from GGSIPU Notification No. 14/2026. Guarded by a
// SeedFlag so it runs exactly once and never resurrects an admin-deleted matrix.
const SEED_KEY = "ipu-seat-matrix-2026-27-v1";

async function ensureIpuSeatMatrixSeeded() {
    try {
        if (await SeedFlag.exists({ key: SEED_KEY })) return;

        // Never clobber a matrix an admin may already have created for this exam.
        if (await SeatMatrix.exists({ examCode: data.examCode })) {
            await SeedFlag.create({ key: SEED_KEY });
            return;
        }

        const owner = await User.findOne({ role: { $in: ["superadmin", "admin"] } })
            .sort({ createdAt: 1 })
            .select("_id")
            .lean();
        if (!owner) {
            console.warn("[ipu-seat-matrix] no admin to attribute yet; will seed on a later boot");
            return;
        }

        await SeatMatrix.create({ ...data, published: true, updatedBy: owner._id });
        await SeedFlag.create({ key: SEED_KEY });
        console.log(
            `[ipu-seat-matrix] seeded IPU LEET seat matrix, ${data.totalColleges} colleges, ${data.totalBranches} branches, ${data.totalSeats} seats`
        );
    } catch (e) {
        console.warn("[ipu-seat-matrix] seed skipped:", e.message);
    }
}

module.exports = { ensureIpuSeatMatrixSeeded };
