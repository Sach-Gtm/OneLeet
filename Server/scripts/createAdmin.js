// Creates (or upgrades) an admin account. Admin logins are created by YOU, not
// self-registered. Run with credentials in env so the password isn't left in
// shell history:
//
//   ADMIN_NAME="Sachin" ADMIN_PHONE="9876543210" ADMIN_PASSWORD="strongpass" \
//     npm run create:admin
//
// Optional: ADMIN_EMAIL=you@example.com (else a placeholder is generated).
// Admins log in with their phone (or email) + password, and can change the
// password later from their profile.
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const User = require("../src/models/userModel");

async function main() {
    const name = process.env.ADMIN_NAME || process.argv[2];
    const phone = process.env.ADMIN_PHONE || process.argv[3];
    const password = process.env.ADMIN_PASSWORD || process.argv[4];
    const email = (
        process.env.ADMIN_EMAIL ||
        process.argv[5] ||
        `admin_${phone}@oneleet.local`
    )
        .toString()
        .toLowerCase()
        .trim();

    if (!name || !phone || !password) {
        console.error(
            'Usage: ADMIN_NAME="..." ADMIN_PHONE="..." ADMIN_PASSWORD="..." [ADMIN_EMAIL="..."] npm run create:admin'
        );
        process.exit(1);
    }
    if (password.length < 6) {
        console.error("Password must be at least 6 characters.");
        process.exit(1);
    }

    await connectDB();

    let user = await User.findOne({ $or: [{ phone }, { email }] }).select(
        "+password"
    );
    if (user) {
        user.name = name;
        user.role = "admin";
        user.phone = phone;
        user.email = email;
        user.password = password; // re-hashed by the pre-save hook
        user.isVerified = true;
        await user.save();
        console.log(`✓ Upgraded existing account to admin: ${email}`);
    } else {
        user = await User.create({
            name,
            email,
            phone,
            password,
            role: "admin",
            isVerified: true,
            authProvider: "local",
        });
        console.log(`✓ Created admin: ${email}`);
    }

    console.log(`  Login with phone ${phone} (or ${email}) + the password you set.`);
    await mongoose.disconnect();
    process.exit(0);
}

main().catch((e) => {
    console.error("Failed to create admin:", e.message);
    process.exit(1);
});
