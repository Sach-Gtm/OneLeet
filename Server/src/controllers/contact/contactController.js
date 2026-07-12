const { sendMail } = require("../../utils/email");
const { uploadBufferToCloudinary } = require("../../utils/cloudinaryUpload");

// Where form submissions are delivered. Set CONTACT_EMAIL to an inbox you
// actually read; falls back to the site address.
const ADMIN_EMAIL = process.env.CONTACT_EMAIL || "admin@oneleet.in";

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
        await notify({
            subject: "📞 Callback request — OneLeet",
            rows: [["Name", name], ["Phone", phone], ["Reason", reason]],
        });
        return res.status(200).json({ success: true, message: "Got it! We'll call you back shortly." });
    } catch (error) {
        next(error);
    }
}

module.exports = { bugReport, contribution, callback };
