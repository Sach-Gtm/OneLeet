import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Cloudflare Turnstile CAPTCHA. Renders only when VITE_TURNSTILE_SITE_KEY is
// configured — otherwise it's a no-op, so login/register work without it until
// you turn it on. Reports the solved token via onToken (and "" when it
// expires/errors so the form can re-require it).
//
// Turnstile tokens are SINGLE-USE: once the backend verifies one, it can't be
// verified again (Cloudflare returns "timeout-or-duplicate"). So after any
// failed submit the parent must call reset() (exposed via ref) to mint a fresh
// token before the user retries.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
export const TURNSTILE_ENABLED = Boolean(SITE_KEY);

let scriptPromise;
function loadScript() {
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise((resolve, reject) => {
        if (window.turnstile) return resolve();
        const s = document.createElement("script");
        s.src =
            "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        s.async = true;
        s.defer = true;
        s.onload = () => resolve();
        s.onerror = reject;
        document.head.appendChild(s);
    });
    return scriptPromise;
}

const Turnstile = forwardRef(function Turnstile({ onToken }, ref) {
    const boxRef = useRef(null);
    const widgetId = useRef(null);
    // Keep the latest callback without re-rendering the widget.
    const cbRef = useRef(onToken);
    cbRef.current = onToken;

    // Let the parent mint a fresh token after a failed submit (tokens are
    // single-use, so retrying with the same one always fails).
    useImperativeHandle(ref, () => ({
        reset() {
            if (widgetId.current && window.turnstile) {
                try {
                    window.turnstile.reset(widgetId.current);
                } catch {
                    // widget not ready
                }
            }
            cbRef.current?.("");
        },
    }));

    useEffect(() => {
        if (!SITE_KEY) return;
        let cancelled = false;
        loadScript()
            .then(() => {
                if (cancelled || !boxRef.current || !window.turnstile) return;
                widgetId.current = window.turnstile.render(boxRef.current, {
                    sitekey: SITE_KEY,
                    callback: (t) => cbRef.current?.(t),
                    "expired-callback": () => cbRef.current?.(""),
                    "error-callback": () => cbRef.current?.(""),
                });
            })
            .catch(() => {});
        return () => {
            cancelled = true;
            if (widgetId.current && window.turnstile) {
                try {
                    window.turnstile.remove(widgetId.current);
                } catch {
                    // widget already gone
                }
            }
        };
    }, []);

    if (!SITE_KEY) return null;
    return <div ref={boxRef} className="flex justify-center" />;
});

export default Turnstile;
