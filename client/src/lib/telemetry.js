import api from "@/Api/axios";
import { getAnonId } from "@/Api/ActivityApi";

// Best-effort client crash reporting to our own backend (audit C3): so a broken
// deploy on some phone surfaces in the admin panel instead of silently losing a
// student. No third-party SDK. Everything here is defensive — it must NEVER
// throw or slow the app, and it de-dupes + caps so a render loop can't spam.
// (A seam to also forward to Sentry/PostHog can layer on inside reportError.)

const seen = new Set();
let sent = 0;
const MAX_PER_SESSION = 20;

export function reportError(error, meta) {
    try {
        if (sent >= MAX_PER_SESSION) return;
        const message = (error && (error.message || String(error))) || "Unknown error";
        const stack = error && error.stack ? String(error.stack) : undefined;
        // Collapse repeats of the same error (message + top of stack).
        const key = `${message}|${(stack || "").slice(0, 200)}`.slice(0, 300);
        if (seen.has(key)) return;
        seen.add(key);
        sent += 1;

        api
            .post("/telemetry/client-error", {
                message: String(message).slice(0, 1000),
                stack: stack ? stack.slice(0, 6000) : undefined,
                url: typeof window !== "undefined" ? window.location.href : undefined,
                release: import.meta.env.VITE_RELEASE || undefined,
                meta: meta && typeof meta === "object" ? meta : undefined,
            })
            .catch(() => {}); // observability must never break the app
    } catch {
        // Never throw from the error reporter itself.
    }
}

// Fire a funnel analytics event (audit C3): land → register → onboarding →
// first test → paywall → payment. Best-effort and non-blocking; carries the
// stable anon browser id so pre-login steps join to the user later. Unknown
// names are ignored server-side, so callers never need to guard.
export function track(name, props) {
    try {
        api
            .post("/telemetry/event", {
                name,
                anonId: getAnonId(),
                path: typeof window !== "undefined" ? window.location.pathname : undefined,
                props: props && typeof props === "object" ? props : undefined,
            })
            .catch(() => {});
    } catch {
        // never throw from analytics
    }
}

// Attach the global browser handlers once (from main.jsx). Catches errors that
// escape React entirely — event handlers, async callbacks, promise rejections.
export function installGlobalErrorReporting() {
    if (typeof window === "undefined" || window.__olErrorReporting) return;
    window.__olErrorReporting = true;

    window.addEventListener("error", (e) => {
        // Only real script errors carry an Error; ignore resource 404s (img/script
        // load failures fire "error" with no e.error).
        if (e && e.error) reportError(e.error, { kind: "onerror" });
        else if (e && e.message && e.filename) reportError(new Error(e.message), { kind: "onerror" });
    });

    window.addEventListener("unhandledrejection", (e) => {
        const r = e && e.reason;
        const err = r instanceof Error ? r : new Error(typeof r === "string" ? r : "Unhandled promise rejection");
        reportError(err, { kind: "unhandledrejection" });
    });
}
