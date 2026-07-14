const User = require("../models/userModel");
const { SUPERADMIN_EMAIL } = require("./roles");

// Provision the Super Admin OUT OF BAND at startup, so the role is never
// derived from a client-supplied email on a public endpoint.
//
// Address: SUPERADMIN_EMAIL env (operator override) → the built-in config email.
//   • Account already exists  → promote it to superadmin (idempotent).
//   • No account + SUPERADMIN_PASSWORD set → create a password-login superadmin.
//   • No account + no password → no-op (Google sign-in with the verified
//     matching address can still provision it — see googleAuthController).
//
// Run this once at boot, BEFORE opening public registration, so the operator
// claims the address first.
async function bootstrapSuperadmin() {
    try {
        const email = (process.env.SUPERADMIN_EMAIL || SUPERADMIN_EMAIL || "")
            .toLowerCase()
            .trim();
        if (!email) return;

        const existing = await User.findOne({ email });
        if (existing) {
            if (existing.role !== "superadmin") {
                existing.role = "superadmin";
                await existing.save({ validateBeforeSave: false });
                console.log(`[bootstrap] promoted ${email} to superadmin`);
            }
            return;
        }

        const password = process.env.SUPERADMIN_PASSWORD;
        if (!password) return;
        await User.create({
            name: "Super Admin",
            email,
            password,
            phone: process.env.SUPERADMIN_PHONE || "0000000000",
            role: "superadmin",
            isVerified: true,
            authProvider: "local",
        });
        console.log(`[bootstrap] created superadmin ${email}`);
    } catch (err) {
        console.error("[bootstrap] superadmin bootstrap failed:", err.message);
    }
}

module.exports = bootstrapSuperadmin;
