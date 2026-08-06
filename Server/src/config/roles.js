// Central role definitions and permission groups. Route guards check against
// these arrays so each capability's audience is expressed once, not scattered
// as loose "admin"/"teacher" strings across the codebase.
//
// Tiers (low → high privilege):
//   student    — the learner (default)
//   teacher    — "mentor" in product language: creates content + pushes
//                notifications, but must NOT see student data or the inbox
//   admin      — manages students (view activity, remove student accounts) and
//                the contact inbox; cannot touch mentor/admin accounts
//   superadmin — everything, incl. removing mentors/admins and toggling premium

const SUPERADMIN_EMAIL = "sachin.gautam8292@gmail.com";

const ROLES = {
    STUDENT: "student",
    TEACHER: "teacher",
    ADMIN: "admin",
    SUPERADMIN: "superadmin",
};

// Content creation + notification broadcast (mentors included).
const STAFF = [ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPERADMIN];
// Student data + contact inbox (mentors excluded).
const ADMINS = [ROLES.ADMIN, ROLES.SUPERADMIN];
// Top tier only (premium toggle, removing staff).
const SUPERADMINS = [ROLES.SUPERADMIN];

// Who may OPEN content marked `premium`: any staff member (they author and need
// to preview it) or a student on the paid "pro" plan. Free students still SEE
// premium items in their lists — shown locked — but can't open them until they
// upgrade. This is the single source of truth for premium access on the server.
const isPremiumUser = (user) => {
    if (!user) return false;
    if (STAFF.includes(user.role)) return true; // staff author + preview premium
    if (user.plan !== "pro") return false;
    if (user.premiumLocked) return false; // admin kill-switch
    // A set expiry in the past = lapsed (e.g. split-payment 2nd installment never
    // paid). No expiry (null) = perpetual pro (legacy / staff-granted).
    if (user.premiumUntil && new Date(user.premiumUntil).getTime() < Date.now()) return false;
    return true;
};

module.exports = { SUPERADMIN_EMAIL, ROLES, STAFF, ADMINS, SUPERADMINS, isPremiumUser };
