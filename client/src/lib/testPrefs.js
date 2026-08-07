// The student's remembered Tests preferences (mode + format), chosen once via
// the popup and kept until they log out. Stored in localStorage so it survives
// navigating away and back; cleared on logout (see context/AuthContext) so the
// next login asks again.

const KEY = "oneleet_test_prefs";

export const DEFAULT_TEST_PREFS = { mode: "all", format: "all" };

// Returns the saved prefs, or null if the student hasn't chosen yet (→ show popup).
export const loadTestPrefs = () => {
    try {
        const raw = JSON.parse(localStorage.getItem(KEY));
        return raw && typeof raw === "object" && raw.mode ? raw : null;
    } catch {
        return null;
    }
};

export const saveTestPrefs = (prefs) => {
    try {
        localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
        /* storage blocked — prefs still live in component state this session */
    }
};

export const clearTestPrefs = () => {
    try {
        localStorage.removeItem(KEY);
    } catch {
        /* ignore */
    }
};
