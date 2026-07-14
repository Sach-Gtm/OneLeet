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

module.exports = { SUPERADMIN_EMAIL, ROLES, STAFF, ADMINS, SUPERADMINS };
