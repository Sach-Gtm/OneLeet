const User = require("../models/userModel");
const { SUPERADMIN_EMAIL } = require("./roles");

// Provision the Super Admin OUT OF BAND at startup, so the role is never
// derived from a client-supplied email on a public endpoint.
//
// The safety invariant: superadmin is only ever assigned to a FRESH account.
// A pre-existing account is NEVER promoted — it could have been squatted (a
// stranger self-registering the address while OTP is off), and promoting it
// would also escalate any session token that account already holds. So:
//   • No account + SUPERADMIN_PASSWORD set → create a password-login superadmin.
//   • Account already exists → do nothing but warn. Provision on a fresh
//     address (or via a verified Google sign-in to an unused address).
//   • No account + no password → no-op.
//
// Set SUPERADMIN_PASSWORD and deploy BEFORE the address is ever registered, so
// the operator claims it first.
async function bootstrapSuperadmin() {
    try {
        const email = (process.env.SUPERADMIN_EMAIL || SUPERADMIN_EMAIL || "")
            .toLowerCase()
            .trim();
        if (!email) return;

        const existing = await User.findOne({ email });
        if (existing) {
            if (existing.role !== "superadmin") {
                console.warn(
                    `[bootstrap] ${email} already exists as role="${existing.role}"; ` +
                        "NOT auto-promoting (could be a squatted account). Provision the " +
                        "Super Admin on a fresh address or via verified Google sign-in."
                );
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
