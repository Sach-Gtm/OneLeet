// Client-side role helpers mirroring the server's permission tiers
// (Server/src/config/roles.js). These gate the UI only — the API is the real
// authority — but keeping them in sync means we never render a control that
// would just 403. "Mentor" is the product word for the `teacher` role.

export const isStudent = (u) => !u?.role || u.role === "student";
export const isMentor = (u) => u?.role === "teacher";
export const isAdmin = (u) => u?.role === "admin" || u?.role === "superadmin";
export const isSuperadmin = (u) => u?.role === "superadmin";

// Anyone who can create content / push notifications (mentor, admin, super).
export const isStaff = (u) => isMentor(u) || isAdmin(u);

// Capability gates.
export const canSeeStudentData = (u) => isAdmin(u); // admin + super admin
export const canManagePremium = (u) => isSuperadmin(u);
export const canManageStaff = (u) => isSuperadmin(u); // remove/demote mentors & admins

export function roleLabel(u) {
    switch (u?.role) {
        case "superadmin":
            return "Super Admin";
        case "admin":
            return "Admin";
        case "teacher":
            return "Mentor";
        default:
            return u?.plan === "pro" ? "Premium Student" : "Student";
    }
}
