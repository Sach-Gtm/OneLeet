const CutoffMatrix = require("../models/cutoffMatrixModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");
const data = require("./ipuCutoffData.json");

// One-time publish of the IPU LEET 2026 round-wise cut-offs (closing/opening
// ranks by college → branch → category, rounds 1-3). Guarded by a SeedFlag so it
// runs once and never resurrects an admin-deleted matrix.
const SEED_KEY = "ipu-cutoffs-2026-r1-3-v1";

async function ensureIpuCutoffsSeeded() {
    try {
        if (await SeedFlag.exists({ key: SEED_KEY })) return;

        if (await CutoffMatrix.exists({ examCode: data.examCode })) {
            await SeedFlag.create({ key: SEED_KEY });
            return;
        }

        const owner = await User.findOne({ role: { $in: ["superadmin", "admin"] } })
            .sort({ createdAt: 1 })
            .select("_id")
            .lean();
        if (!owner) {
            console.warn("[ipu-cutoffs] no admin to attribute yet; will seed on a later boot");
            return;
        }

        await CutoffMatrix.create({
            ...data,
            totalRounds: (data.rounds || []).length,
            published: true,
            updatedBy: owner._id,
        });
        await SeedFlag.create({ key: SEED_KEY });
        console.log(`[ipu-cutoffs] seeded IPU LEET cut-offs — ${(data.rounds || []).length} rounds`);
    } catch (e) {
        console.warn("[ipu-cutoffs] seed skipped:", e.message);
    }
}

module.exports = { ensureIpuCutoffsSeeded };
