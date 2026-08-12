/* eslint-disable react-refresh/only-export-components -- context module intentionally exports the provider component and the useCelebrate hook together */
import { createContext, useCallback, useContext, useState } from "react";
import CelebrationOverlay from "@/Components/App/celebrate/CelebrationOverlay";

// Global "Google-Doodle" celebration layer. Any page can fire a milestone
// celebration via useCelebrate():
//   const { celebrate, celebrateOnce } = useCelebrate();
//   celebrate("course", { name: "IPU LEET" });                 // always shows
//   celebrateOnce(`rank-${attemptId}`, "rank", { rank });      // shows once ever
// celebrateOnce dedupes on a key persisted in localStorage, so a per-day streak
// or a per-attempt rank celebration never re-fires on refresh.

const CelebrationCtx = createContext(null);
const LS_KEY = "oneleet_celebrated";

function seenKeys() {
    try {
        return new Set(JSON.parse(localStorage.getItem(LS_KEY) || "[]"));
    } catch {
        return new Set();
    }
}
function remember(key) {
    try {
        const s = seenKeys();
        s.add(key);
        // keep the list bounded so it can't grow forever
        localStorage.setItem(LS_KEY, JSON.stringify([...s].slice(-300)));
    } catch {
        /* ignore */
    }
}

export function CelebrationProvider({ children }) {
    const [current, setCurrent] = useState(null);

    const celebrate = useCallback((type, opts = {}) => {
        setCurrent({ type, opts, id: `${type}-${Date.now()}` });
    }, []);

    const celebrateOnce = useCallback((key, type, opts = {}) => {
        if (!key || seenKeys().has(key)) return false;
        remember(key);
        setCurrent({ type, opts, id: key });
        return true;
    }, []);

    return (
        <CelebrationCtx.Provider value={{ celebrate, celebrateOnce }}>
            {children}
            <CelebrationOverlay celebration={current} onClose={() => setCurrent(null)} />
        </CelebrationCtx.Provider>
    );
}

// Safe no-op if used outside the provider, so a page never crashes on it.
export function useCelebrate() {
    return useContext(CelebrationCtx) || { celebrate: () => {}, celebrateOnce: () => false };
}
