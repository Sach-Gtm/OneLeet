import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { sendHeartbeat, getAnonId } from "@/Api/ActivityApi";

// Measures active time on each page and reports it to the backend in small
// batches. Only counts seconds while the tab is actually visible. Mounted once
// at the app root so it runs on every page — public/landing included — which is
// why anonymous visits are counted as aggregate traffic (via getAnonId).
export default function ActivityTracker() {
    const location = useLocation();
    const seconds = useRef(0);
    const pathRef = useRef(location.pathname);

    const flush = useCallback(() => {
        const s = seconds.current;
        if (s <= 0) return;
        seconds.current = 0;
        sendHeartbeat({ path: pathRef.current, seconds: s, anonId: getAnonId() });
    }, []);

    // On navigation, attribute the accumulated time to the page we're leaving,
    // then switch attribution to the new path.
    useEffect(() => {
        flush();
        pathRef.current = location.pathname;
    }, [location.pathname, flush]);

    useEffect(() => {
        const tick = setInterval(() => {
            if (document.visibilityState === "visible") seconds.current += 1;
        }, 1000);
        const flushTimer = setInterval(flush, 20000);
        const onVisibility = () => {
            if (document.visibilityState === "hidden") flush();
        };
        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("pagehide", flush);
        return () => {
            clearInterval(tick);
            clearInterval(flushTimer);
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("pagehide", flush);
            flush();
        };
    }, [flush]);

    return null;
}
