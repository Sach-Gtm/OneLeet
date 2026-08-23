const SecurityEvent = require("../../models/securityEventModel");
const User = require("../../models/userModel");
const Notification = require("../../models/notificationModel");
const { ADMINS } = require("../../config/roles");
const { sendPushToUsers } = require("../../services/push/webPushService");
const { sendMail } = require("../../utils/email");

const escapeHtml = (s) =>
    String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const EVENT_TYPES = SecurityEvent.EVENT_TYPES;

// Human-readable action for the admin notification / panel.
const LABELS = {
    screenshot: "took a screenshot (PrintScreen)",
    copy: "tried to copy premium content",
    print: "tried to print / save premium content as PDF",
    save: "tried to save the page",
    "context-menu": "opened the right-click menu on premium content",
    devtools: "opened developer tools on premium content",
    "tab-hidden": "left the tab while viewing premium content (possible recording)",
    download: "tried to download a premium asset",
};

const dayKey = () => new Date().toISOString().slice(0, 10);

// POST /api/security/report  (student, authenticated)
// The client reports a detected capture attempt on premium content. This is a
// logging endpoint: it must never surface an error to the student (that would
// just tell them what's being watched), so it always answers 200.
async function report(req, res) {
    try {
        const type = String((req.body && req.body.type) || "").trim();
        if (!EVENT_TYPES.includes(type)) {
            return res.status(400).json({ success: false, message: "Unknown event type" });
        }
        const now = new Date();
        const clip = (v, n) => String(v || "").slice(0, n);
        const contentType = clip((req.body && req.body.contentType) || "general", 40);
        const contentRef = clip(req.body && req.body.contentRef, 200);
        const path = clip(req.body && req.body.path, 200);
        const userAgent = clip(req.headers["user-agent"], 300);

        const doc = await SecurityEvent.findOneAndUpdate(
            { user: req.user._id, type, day: dayKey() },
            {
                $inc: { count: 1 },
                $set: {
                    name: req.user.name,
                    email: req.user.email,
                    phone: req.user.phone,
                    contentType,
                    contentRef,
                    path,
                    userAgent,
                    lastAt: now,
                },
                $setOnInsert: { firstAt: now },
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );

        // Notify admins at most once per student / type / day — the first hit of
        // the day inserts the row, so count === 1. Best-effort; a notify failure
        // must not fail the report.
        if (doc && doc.count === 1) {
            notifyAdmins(doc).catch((e) =>
                console.warn("[security] admin notify failed:", e.message)
            );
        }
        return res.status(200).json({ success: true });
    } catch (err) {
        // A duplicate-key race (two reports landing at once) is harmless.
        if (err && err.code === 11000) {
            return res.status(200).json({ success: true });
        }
        console.warn("[security] report error:", err.message);
        return res.status(200).json({ success: true });
    }
}

// Build + send the "student attempted capture" alert to every admin/superadmin
// across ALL channels: the in-app bell, a browser push, and email.
async function notifyAdmins(doc) {
    const admins = await User.find({ role: { $in: ADMINS } }).select("_id email");
    const ids = admins.map((a) => a._id);
    if (!ids.length) return;

    const who = doc.name || doc.email || doc.phone || "A student";
    const action = LABELS[doc.type] || `triggered a ${doc.type} event`;
    const where =
        doc.contentType && doc.contentType !== "general"
            ? ` on ${doc.contentType} content`
            : "";
    const title = "⚠️ Premium content protection alert";
    const body = `${who} ${action}${where}. Review it in the admin panel.`;

    // 1) In-app bell (targeted to admins) + 2) browser push.
    await Notification.create({ title, body, type: "security", recipients: ids });
    sendPushToUsers(ids, { title, body, url: "/admin", tag: "security" }).catch(() => {});

    // 3) Email — so alerts land even when nobody has the app open. Best-effort;
    // a mail failure must never break the report.
    emailAdmins(admins, doc, { who, action, where }).catch((e) =>
        console.warn("[security] alert email failed:", e.message)
    );
}

// Emails the alert to each admin's address plus a configurable alerts inbox
// (SECURITY_ALERT_EMAIL → CONTACT_EMAIL → admin@oneleet.in). No-ops silently
// when email isn't configured (sendMail handles that).
async function emailAdmins(admins, doc, { who, action, where }) {
    const fallback =
        process.env.SECURITY_ALERT_EMAIL || process.env.CONTACT_EMAIL || "admin@oneleet.in";
    const recipients = new Set([fallback.toLowerCase()]);
    for (const a of admins) if (a.email) recipients.add(a.email.toLowerCase());

    const when = new Date(doc.lastAt || Date.now()).toLocaleString();
    const subject = "⚠️ OneLeet: premium content protection alert";
    const rows = [
        ["Student", who],
        ["Email", doc.email || "-"],
        ["Phone", doc.phone || "-"],
        ["Action", `${action}${where}`],
        ["Content", doc.contentRef || doc.contentType || "-"],
        ["Page", doc.path || "-"],
        ["When", when],
    ];
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px">
          <h2 style="color:#b45309">⚠️ Premium content protection alert</h2>
          <p style="color:#475569">A student attempted to capture premium content. Their view is watermarked with their identity, and this attempt was logged.</p>
          <table style="border-collapse:collapse;width:100%;margin:12px 0">
            ${rows
                .map(
                    ([k, v]) =>
                        `<tr><td style="padding:6px 10px;color:#64748b;font-size:13px;border-bottom:1px solid #eef2f7">${k}</td><td style="padding:6px 10px;color:#0f172a;font-size:13px;border-bottom:1px solid #eef2f7">${escapeHtml(v)}</td></tr>`
                )
                .join("")}
          </table>
          <p style="color:#64748b;font-size:13px">Review all attempts in the admin dashboard → Content protection alerts.</p>
        </div>`;
    const text = `Premium content protection alert\n${rows
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")}\n\nReview in the admin dashboard.`;

    await Promise.allSettled(
        Array.from(recipients).map((to) => sendMail({ to, subject, html, text }))
    );
}

// GET /api/security/alerts?days=30  (admin)
// Recent attempts, newest first, plus a per-student rollup for summary cards.
async function listAlerts(req, res, next) {
    try {
        const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 120);
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const alerts = await SecurityEvent.find({ lastAt: { $gte: since } })
            .sort({ lastAt: -1 })
            .limit(500)
            .lean();

        // Roll up by student so the panel can lead with "who".
        const byUser = new Map();
        for (const a of alerts) {
            const key = String(a.user);
            const cur =
                byUser.get(key) || {
                    user: key,
                    name: a.name,
                    email: a.email,
                    phone: a.phone,
                    total: 0,
                    types: {},
                    lastAt: a.lastAt,
                };
            cur.total += a.count || 0;
            cur.types[a.type] = (cur.types[a.type] || 0) + (a.count || 0);
            if (new Date(a.lastAt) > new Date(cur.lastAt)) cur.lastAt = a.lastAt;
            byUser.set(key, cur);
        }
        const students = Array.from(byUser.values()).sort(
            (x, y) => new Date(y.lastAt) - new Date(x.lastAt)
        );

        return res.status(200).json({ success: true, days, alerts, students });
    } catch (err) {
        next(err);
    }
}

module.exports = { report, listAlerts };
