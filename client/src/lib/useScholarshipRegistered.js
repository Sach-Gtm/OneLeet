import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getScholarshipStatus } from "@/Api/ScholarshipApi";

// Remembers that this browser registered for the scholarship test, so we never
// nag the same person with the splash / form again. Two signals:
//   1. a localStorage flag set the moment they register (works even while
//      anonymous, and instantly on the same device), and
//   2. a server check for logged-in users (covers other devices / earlier
//      registrations tied to their email).
const LS_KEY = "oneleet_scholarship_registered";

export const markScholarshipRegistered = () => {
    try { localStorage.setItem(LS_KEY, "1"); } catch { /* private mode: ignore */ }
};

export function useScholarshipRegistered() {
    const { isAuthenticated } = useAuth();
    const [registered, setRegistered] = useState(() => {
        try { return localStorage.getItem(LS_KEY) === "1"; } catch { return false; }
    });

    useEffect(() => {
        if (registered || !isAuthenticated) return; // already known, or nothing to ask the server
        let alive = true;
        getScholarshipStatus().then((r) => {
            if (alive && r) { setRegistered(true); markScholarshipRegistered(); }
        });
        return () => { alive = false; };
    }, [isAuthenticated, registered]);

    return registered;
}
