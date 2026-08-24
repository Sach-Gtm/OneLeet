const MbaRegistration = require("../../models/mbaRegistrationModel");

const clean = (v, max) => String(v == null ? "" : v).trim().slice(0, max);

// POST /api/mba/register — AUTH. The logged-in student registers for the OneLeet
// MBA batch by picking their college (IIM / top B-school). Idempotent per user:
// a repeat submit just updates the college. Name/email come from their account.
async function register(req, res, next) {
    try {
        const college = clean(req.body?.college, 120);
        const phone = clean(req.body?.phone, 20);
        if (!college) {
            return res.status(400).json({ success: false, message: "Please select your college to register." });
        }
        const name = clean(req.user?.name, 80) || "Student";
        const email = clean(req.user?.email, 120).toLowerCase();

        const reg = await MbaRegistration.findOneAndUpdate(
            { user: req.user._id },
            { $set: { name, email, phone, college, source: "web" } },
            { upsert: true, setDefaultsOnInsert: true, new: true }
        );

        return res.status(200).json({ success: true, registered: true, college: reg.college });
    } catch (e) {
        // Unique-user race → already registered; treat as success.
        if (e && e.code === 11000) {
            return res.status(200).json({ success: true, registered: true });
        }
        next(e);
    }
}

// GET /api/mba/status — AUTH. Has this user registered for the MBA batch, and
// with which college? Lets the page skip the registration step for a returning
// student and go straight to the program.
async function status(req, res, next) {
    try {
        const reg = await MbaRegistration.findOne({ user: req.user._id }).select("college").lean();
        return res.status(200).json({ success: true, registered: !!reg, college: reg?.college || "" });
    } catch (e) {
        next(e);
    }
}

// GET /api/mba/admin — ADMIN. Every MBA batch registration (lead list).
async function adminList(req, res, next) {
    try {
        const registrations = await MbaRegistration.find({}).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ success: true, count: registrations.length, registrations });
    } catch (e) {
        next(e);
    }
}

module.exports = { register, status, adminList };
