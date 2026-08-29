const AmbassadorApplication = require("../../models/ambassadorModel");
const { isEmailBlocked } = require("../../utils/blocklist");

const EMAIL_RE = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
const clean = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
const STATUSES = ["new", "shortlisted", "selected", "rejected"];

// POST /api/ambassador/apply — PUBLIC. Records a Campus Ambassador application.
// Idempotent per email (a repeat submit updates the same row).
async function apply(req, res, next) {
    try {
        const b = req.body || {};
        const name = clean(b.name, 80);
        const email = clean(b.email, 120).toLowerCase();
        const phone = clean(b.phone, 20);
        const college = clean(b.college, 120);

        if (!name || !email || !phone || !college) {
            return res.status(400).json({ success: false, message: "Please fill your name, phone, email and college." });
        }
        if (!EMAIL_RE.test(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email address." });
        }
        if (await isEmailBlocked(email)) {
            return res.status(403).json({ success: false, message: "This email can't be used to apply. Contact help@oneleet.in." });
        }

        const set = {
            name,
            phone,
            college,
            year: clean(b.year, 40),
            socialHandle: clean(b.socialHandle, 160),
            socialReach: clean(b.socialReach, 40),
            whyJoin: clean(b.whyJoin, 800),
            work: clean(b.work, 600),
            source: "web",
        };

        await AmbassadorApplication.findOneAndUpdate(
            { email },
            { $set: set },
            { upsert: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json({
            success: true,
            message: "Application received! We'll review it and reach out. Keep an eye on your email and WhatsApp.",
        });
    } catch (e) {
        // Unique-email race → they've already applied; treat as success.
        if (e && e.code === 11000) {
            return res.status(200).json({ success: true, message: "You've already applied, we'll be in touch!" });
        }
        next(e);
    }
}

// GET /api/admin/ambassador — ADMIN. The full list of applications.
async function adminList(req, res, next) {
    try {
        const applications = await AmbassadorApplication.find({}).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ success: true, count: applications.length, applications });
    } catch (e) {
        next(e);
    }
}

// PATCH /api/admin/ambassador/:id — ADMIN. Set an applicant's selection status.
async function adminSetStatus(req, res, next) {
    try {
        const status = clean(req.body?.status, 20);
        if (!STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status." });
        }
        const application = await AmbassadorApplication.findByIdAndUpdate(
            req.params.id,
            { $set: { status } },
            { new: true }
        ).lean();
        if (!application) return res.status(404).json({ success: false, message: "Application not found." });
        return res.status(200).json({ success: true, application });
    } catch (e) {
        next(e);
    }
}

// GET /api/admin/ambassador/export — ADMIN. CSV of every application.
async function adminExport(req, res, next) {
    try {
        const rows = await AmbassadorApplication.find({}).sort({ createdAt: -1 }).lean();
        const esc = (v) => {
            const s = String(v ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const header = ["Name", "Email", "Phone", "College", "Year", "Social handle", "Reach", "Why join", "Work", "Status", "Applied On"];
        const lines = rows.map((r) =>
            [
                r.name, r.email, r.phone, r.college, r.year, r.socialHandle, r.socialReach,
                r.whyJoin, r.work, r.status,
                r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : "",
            ].map(esc).join(",")
        );
        const csv = [header.join(","), ...lines].join("\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="oneleet-ambassador-applications.csv"');
        return res.status(200).send(csv);
    } catch (e) {
        next(e);
    }
}

module.exports = { apply, adminList, adminSetStatus, adminExport };
