const mongoose = require("mongoose");

// A tiny record that a one-time data seed/migration has run. Lets a boot-time
// seed publish content exactly once — so it can add alongside existing content
// without duplicating on later boots, and won't resurrect anything staff delete.
const SeedFlagSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("SeedFlag", SeedFlagSchema);
