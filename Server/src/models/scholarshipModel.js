const mongoose = require("mongoose");

// A registration for the All-India Scholarship Test. Kept as its own collection
// (separate from the User account it also creates) so staff can browse / export
// just the scholarship leads. One row per email — a repeat submit updates it.
const ScholarshipRegistrationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 80 },
        email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
        phone: { type: String, trim: true, maxlength: 20 },
        diplomaBranch: { type: String, trim: true, maxlength: 80 },
        state: { type: String, trim: true, maxlength: 60 },
        preparingFor: { type: String, trim: true, maxlength: 80 },
        // The website account auto-created / linked at registration, so the same
        // person shows up in the normal registered-candidates list too.
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        source: { type: String, trim: true, default: "web" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ScholarshipRegistration", ScholarshipRegistrationSchema);
