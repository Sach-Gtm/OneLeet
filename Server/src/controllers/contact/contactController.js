const { sendMail } = require("../../utils/email");
const { uploadBufferToCloudinary } = require("../../utils/cloudinaryUpload");
const ContactSubmission = require("../../models/contactModel");

// Where form submissions are ALSO emailed. Set CONTACT_EMAIL to an inbox you
// actually read; falls back to the site address. Note: every submission is
// stored in the database and browsable in the admin dashboard regardless, so
// nothing is lost even if email isn't configured or a message bounces.
const ADMIN_EMAIL = process.env.CONTACT_EMAIL || "admin@oneleet.in";

// Persist a submission so it always shows up in the admin inbox. Wrapped so a
// DB hiccup can't fail the user's request (they're still emailed + logged).
async function saveSubmission(fields) {
    try {
        return await ContactSubmission.create(fields);
    } catch (e) {
        console.error("[contact] db save failed:", e.message);
        return null;
    }
}

const esc = (s) =>
    String(s == null ? "" : s).replace(
        /[<>&]/g,
        (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])
    );

async function uploadAttachment(file, folder) {
    if (!file) return null;
    const result = await uploadBufferToCloudinary(file.buffer, {
        folder,
        resource_type: "auto", // image or raw (pdf)
    });
    return result.secure_url;
}

// Always logs the submission (so it survives even if email hiccups), then emails
// it. Never throws on a mail failure — the user still gets a success response.
async function notify({ subject, rows, attachmentUrl }) {
    const flat =
        rows.map(([k, v]) => `${k}: ${v || "—"}`).join(" | ") +
        (attachmentUrl ? ` | Attachment: ${attachmentUrl}` : "");
    console.log(`[contact] ${subject} :: ${flat}`);

    const body = rows
        .map(
            ([k, v]) =>
                `<tr><td style="padding:4px 14px 4px 0;color:#64748b;vertical-align:top">${esc(
                    k
                )}</td><td style="padding:4px 0;color:#0f172a">${esc(v) || "—"}</td></tr>`
        )
        .join("");
    const att = attachmentUrl
        ? `<p style="margin-top:14px"><a href="${attachmentUrl}" style="color:#4f46e5">View attachment ↗</a></p>`
        : "";
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;padding:16px">
        <h2 style="color:#4f46e5;margin:0 0 12px">${esc(subject)}</h2>
        <table style="font-size:14px">${body}</table>${att}
      </div>`;
    const text = rows.map(([k, v]) => `${k}: ${v || "—"}`).join("\n") +
        (attachmentUrl ? `\nAttachment: ${attachmentUrl}` : "");

    try {
        await sendMail({ to: ADMIN_EMAIL, subject, html, text });
    } catch (e) {
        console.error("[contact] email delivery failed:", e.message);
    }
}

// POST /api/contact/bug — report a bug (optional screenshot)
async function bugReport(req, res, next) {
    try {
        const { name, email, description } = req.body;
        if (!description || !description.trim()) {
            return res.status(400).json({ success: false, message: "Please describe the bug." });
        }
        const attachmentUrl = await uploadAttachment(req.file, "oneleet/bug-reports");
        await saveSubmission({ type: "bug", name, email, message: description, attachmentUrl });
        await notify({
            subject: "🐛 New bug report — OneLeet",
            rows: [["Name", name], ["Email", email], ["Description", description]],
            attachmentUrl,
        });
        return res.status(200).json({ success: true, message: "Thanks! Your bug report is in — we'll look into it." });
    } catch (error) {
        next(error);
    }
}

// POST /api/contact/contribution — contribute a PYQ / question / material
async function contribution(req, res, next) {
    try {
        const { name, email, type, description } = req.body;
        if (!description || !description.trim()) {
            return res.status(400).json({ success: false, message: "Please tell us what you're contributing." });
        }
        const attachmentUrl = await uploadAttachment(req.file, "oneleet/contributions");
        await saveSubmission({ type: "contribution", name, email, subject: type, message: description, attachmentUrl });
        await notify({
            subject: "🎁 New contribution — OneLeet",
            rows: [["Name", name], ["Email", email], ["Type", type], ["Details", description]],
            attachmentUrl,
        });
        return res.status(200).json({ success: true, message: "Thank you for contributing — we'll review it soon!" });
    } catch (error) {
        next(error);
    }
}

// POST /api/contact/callback — request a callback
async function callback(req, res, next) {
    try {
        const { name, phone, reason } = req.body;
        if (!name || !name.trim() || !phone || !phone.trim()) {
            return res.status(400).json({ success: false, message: "Name and phone number are required." });
        }
        await saveSubmission({ type: "callback", name, phone, message: reason });
        await notify({
            subject: "📞 Callback request — OneLeet",
            rows: [["Name", name], ["Phone", phone], ["Reason", reason]],
        });
        return res.status(200).json({ success: true, message: "Got it! We'll call you back shortly." });
    } catch (error) {
        next(error);
    }
}

// ---- Admin inbox (staff only) ----------------------------------------------

// GET /api/contact/inbox?type=&page=  — list submissions, newest first, with an
// overall unread count and per-type tallies for the dashboard badges.
async function listInbox(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const filter = {};
        if (["bug", "contribution", "callback"].includes(req.query.type)) {
            filter.type = req.query.type;
        }

        const [items, total, unread, byType] = await Promise.all([
            ContactSubmission.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            ContactSubmission.countDocuments(filter),
            ContactSubmission.countDocuments({ read: false }),
            ContactSubmission.aggregate([
                { $group: { _id: "$type", count: { $sum: 1 } } },
            ]),
        ]);

        const counts = byType.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
        return res.status(200).json({
            success: true,
            items,
            total,
            unread,
            counts,
            page,
            pages: Math.max(1, Math.ceil(total / limit)),
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/contact/inbox/:id/read  — mark one submission read (or unread).
async function markInboxRead(req, res, next) {
    try {
        const read = req.body?.read !== false; // default true
        const doc = await ContactSubmission.findByIdAndUpdate(
            req.params.id,
            { read },
            { new: true }
        );
        if (!doc) {
            return res.status(404).json({ success: false, message: "Not found" });
        }
        return res.status(200).json({ success: true, item: doc });
    } catch (error) {
        next(error);
    }
}

// DELETE /api/contact/inbox/:id  — remove a handled submission.
async function deleteInbox(req, res, next) {
    try {
        const doc = await ContactSubmission.findByIdAndDelete(req.params.id);
        if (!doc) {
            return res.status(404).json({ success: false, message: "Not found" });
        }
        return res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    bugReport,
    contribution,
    callback,
    listInbox,
    markInboxRead,
    deleteInbox,
};
