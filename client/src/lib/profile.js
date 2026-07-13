// Which profile fields every user must fill before they can use the app. Name
// and phone are collected at signup; the academic fields + passport photo are
// completed on the Profile page. Staff (admin/teacher) only need name + phone.

export const PROFILE_FIELDS = [
    { key: "name", label: "Full name", staff: true },
    { key: "phone", label: "Phone number", staff: true },
    { key: "college", label: "College name", staff: false },
    { key: "branch", label: "Branch / stream", staff: false },
    { key: "yearOfStudy", label: "Year of study", staff: false },
    { key: "targetExam", label: "Target exam", staff: false },
];

export function isStaff(user) {
    return user?.role === "admin" || user?.role === "teacher";
}

// Returns the list of still-missing required fields ({key,label}) for this user.
export function missingProfileFields(user) {
    if (!user) return [];
    const staff = isStaff(user);
    const fields = staff ? PROFILE_FIELDS.filter((f) => f.staff) : PROFILE_FIELDS;
    const missing = fields.filter((f) => !String(user[f.key] || "").trim());
    // Students must also upload a passport photo.
    if (!staff && !user?.passportPhoto?.url) {
        missing.push({ key: "passportPhoto", label: "Passport photo" });
    }
    return missing;
}

export function isProfileComplete(user) {
    return missingProfileFields(user).length === 0;
}
