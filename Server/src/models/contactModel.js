const mongoose = require("mongoose");

// Every inbound request from the site — bug reports, contributions, and callback
// requests — is stored here so staff can browse them in the admin dashboard,
// independent of whether the notification email was delivered.
const ContactSubmissionSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["bug", "contribution", "callback"],
            required: true,
            index: true,
        },
        name: { type: String, trim: true, maxlength: 160 },
        email: { type: String, trim: true, maxlength: 200 },
        phone: { type: String, trim: true, maxlength: 40 },
        // A short label (e.g. the contribution type) shown next to the row.
        subject: { type: String, trim: true, maxlength: 200 },
        // The main body: bug description / contribution details / callback reason.
        message: { type: String, trim: true, maxlength: 5000 },
        attachmentUrl: { type: String },
        read: { type: Boolean, default: false, index: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ContactSubmission", ContactSubmissionSchema);
