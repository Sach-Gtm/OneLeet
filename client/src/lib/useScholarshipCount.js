import { useCallback, useEffect, useRef, useState } from "react";
import { getScholarshipCount } from "@/Api/ScholarshipApi";

// Live tally of scholarship registrations for the landing's social proof. The
// API already reports the count ×3, so a single real sign-up shows as "3". Polls
// every ~30s (and on tab refocus) so the number visibly rises, and only ever
// moves up within a session to avoid a jarring dip if a poll races a write.
// `bump()` lets a just-registered visitor see their own +3 immediately.
export function useScholarshipCount(pollMs = 30000) {
    const [count, setCount] = useState(null);
    const mounted = useRef(true);

    const apply = useCallback((n) => {
        setCount((prev) => (prev == null ? n : Math.max(prev, n)));
    }, []);

    const refresh = useCallback(async () => {
        const n = await getScholarshipCount();
        if (mounted.current) apply(n);
    }, [apply]);

    const bump = useCallback(() => {
        setCount((prev) => (prev == null ? 3 : prev + 3));
    }, []);

    useEffect(() => {
        mounted.current = true;
        refresh();
        const t = setInterval(refresh, pollMs);
        const onVis = () => { if (document.visibilityState === "visible") refresh(); };
        document.addEventListener("visibilitychange", onVis);
        return () => {
            mounted.current = false;
            clearInterval(t);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, [refresh, pollMs]);

    return { count, bump, refresh };
}
