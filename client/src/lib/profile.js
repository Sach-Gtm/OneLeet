// Profile fields power the completion meter on the Profile page. NOTHING here is
// mandatory to use the app — name + phone are already captured at signup, and the
// academic details + a profile photo are optional extras that personalise prep.
// (The photo is auto-imported from Google on Google sign-in and can be changed.)
import { isStaff } from "@/lib/roles";

export { isStaff };

export const PROFILE_FIELDS = [
    { key: "name", label: "Full name", staff: true },
    { key: "phone", label: "Phone number", staff: true },
    { key: "college", label: "College name", staff: false },
    { key: "branch", label: "Branch / stream", staff: false },
    { key: "yearOfStudy", label: "Year of study", staff: false },
    { key: "targetExam", label: "Target exam", staff: false },
    { key: "photo", label: "Profile photo", staff: false },
];

// A field counts as filled if it has a value; "photo" is satisfied by either the
// avatar (e.g. a Google picture) or an uploaded passport photo.
const hasField = (user, key) => {
    if (key === "photo") return Boolean(user?.avatar || user?.passportPhoto?.url);
    return String(user?.[key] || "").trim().length > 0;
};

const fieldsFor = (user) => (isStaff(user) ? PROFILE_FIELDS.filter((f) => f.staff) : PROFILE_FIELDS);

// The still-missing fields ({key,label}) — used only to nudge, never to block.
export function missingProfileFields(user) {
    if (!user) return [];
    return fieldsFor(user).filter((f) => !hasField(user, f.key));
}

// Completion as a percentage, rounded to the nearest 10 so it reads as
// "10% complete, 20% …". Returns { percent, filled, total, missing }.
export function profileCompletion(user) {
    if (!user) return { percent: 0, filled: 0, total: 0, missing: [] };
    const fields = fieldsFor(user);
    const missing = fields.filter((f) => !hasField(user, f.key));
    const filled = fields.length - missing.length;
    const raw = fields.length ? (filled / fields.length) * 100 : 100;
    return { percent: Math.round(raw / 10) * 10, filled, total: fields.length, missing };
}

// Kept for backwards-compatibility: the profile is never a hard gate any more, so
// the app always "opens". The completion meter (above) is the soft signal instead.
export function isProfileComplete() {
    return true;
}
