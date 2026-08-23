const crypto = require("crypto");
const ScholarshipRegistration = require("../../models/scholarshipModel");
const User = require("../../models/userModel");
const { isEmailBlocked } = require("../../utils/blocklist");

const EMAIL_RE = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
const clean = (v, max) => String(v == null ? "" : v).trim().slice(0, max);

// POST /api/scholarship/register — PUBLIC. Registers a candidate for the
// All-India Scholarship Test: stores the scholarship lead AND auto-creates (or
// links) a website account with the same name/email/phone, so they appear in the
// normal registered-candidates list too. Idempotent per email.
async function register(req, res, next) {
    try {
        const b = req.body || {};
        const name = clean(b.name, 80);
        const email = clean(b.email, 120).toLowerCase();
        const phone = clean(b.phone, 20);
        const diplomaBranch = clean(b.diplomaBranch, 80);
        const state = clean(b.state, 60);
        const preparingFor = clean(b.preparingFor, 80);

        if (!name || !email) {
            return res.status(400).json({ success: false, message: "Please enter your name and email." });
        }
        if (!EMAIL_RE.test(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email address." });
        }
        if (await isEmailBlocked(email)) {
            return res.status(403).json({ success: false, message: "This email can't be used to register. Contact help@oneleet.in." });
        }

        // Auto-register / link the website account (registered candidate).
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                name,
                email,
                phone: phone || undefined,
                role: "student",
                authProvider: "local",
                isVerified: true, // a real candidate, no OTP wall
                branch: diplomaBranch || undefined,
                targetExam: preparingFor || undefined,
                // Random, unusable password so bcrypt has something to hash; the
                // candidate sets a real one later via "forgot password" or Google.
                password: crypto.randomBytes(18).toString("hex"),
            });
        } else {
            // Enrich only empty profile fields — never clobber their existing data.
            const set = {};
            if (!user.phone && phone) set.phone = phone;
            if (!user.branch && diplomaBranch) set.branch = diplomaBranch;
            if (!user.targetExam && preparingFor) set.targetExam = preparingFor;
            if (Object.keys(set).length) await User.updateOne({ _id: user._id }, { $set: set });
        }

        // Store the scholarship lead separately (one row per email).
        await ScholarshipRegistration.findOneAndUpdate(
            { email },
            { $set: { name, phone, diplomaBranch, state, preparingFor, user: user._id, source: "web" } },
            { upsert: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json({
            success: true,
            message: "You're registered for the All-India Scholarship Test!",
        });
    } catch (e) {
        // Unique-email race → they're already registered; treat as success.
        if (e && e.code === 11000) {
            return res.status(200).json({ success: true, message: "You're already registered, see you at the test!" });
        }
        next(e);
    }
}

// GET /api/scholarship/status — AUTH. Has the logged-in user already registered
// for the scholarship test? Lets the client stop showing the splash / form to
// someone who is already in (matched on their email or linked account).
async function status(req, res, next) {
    try {
        const or = [];
        const email = String(req.user?.email || "").toLowerCase();
        if (email) or.push({ email });
        if (req.user?._id) or.push({ user: req.user._id });
        const registered = or.length ? await ScholarshipRegistration.exists({ $or: or }) : null;
        return res.status(200).json({ success: true, registered: !!registered });
    } catch (e) {
        next(e);
    }
}

// GET /api/scholarship/count — PUBLIC. A social-proof tally for the landing.
// Reported as 3× the real number of sign-ups (every registrant tends to pull in
// a couple of batchmates), so the page shows real momentum and urgency. The
// admin panel always sees the true count — this inflation is public-only.
async function count(req, res, next) {
    try {
        const real = await ScholarshipRegistration.countDocuments({});
        return res.status(200).json({ success: true, count: real * 3 });
    } catch (e) {
        next(e);
    }
}

// GET /api/admin/scholarship — ADMIN. The scholarship registrations list.
async function adminList(req, res, next) {
    try {
        const registrations = await ScholarshipRegistration.find({}).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ success: true, count: registrations.length, registrations });
    } catch (e) {
        next(e);
    }
}

// GET /api/admin/scholarship/export — ADMIN. CSV of every scholarship lead.
async function adminExport(req, res, next) {
    try {
        const rows = await ScholarshipRegistration.find({}).sort({ createdAt: -1 }).lean();
        const esc = (v) => {
            const s = String(v ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const header = ["Name", "Email", "Phone", "Diploma Branch", "State", "Preparing For", "Registered On"];
        const lines = rows.map((r) =>
            [
                r.name,
                r.email,
                r.phone,
                r.diplomaBranch,
                r.state,
                r.preparingFor,
                r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : "",
            ]
                .map(esc)
                .join(",")
        );
        const csv = [header.join(","), ...lines].join("\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="oneleet-scholarship-registrations.csv"');
        return res.status(200).send(csv);
    } catch (e) {
        next(e);
    }
}

module.exports = { register, status, count, adminList, adminExport };
