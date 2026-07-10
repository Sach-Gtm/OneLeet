import { useEffect, useRef } from "react";

// Cloudflare Turnstile CAPTCHA. Renders only when VITE_TURNSTILE_SITE_KEY is
// configured — otherwise it's a no-op, so login/register work without it until
// you turn it on. Reports the solved token via onToken (and "" when it
// expires/errors so the form can re-require it).
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

export default function Turnstile({ onToken }) {
    const boxRef = useRef(null);
    const widgetId = useRef(null);
    // Keep the latest callback without re-rendering the widget.
    const cbRef = useRef(onToken);
    cbRef.current = onToken;

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
}
