import api from "@/Api/axios";

// Client half of premium content protection. A browser genuinely CANNOT block an
// OS screenshot or screen recording, so the strategy is: (1) stamp a per-student
// identity watermark over the content so any leak is traceable, and (2) detect
// and REPORT the capture attempts we can observe so admins can follow up. This
// module owns the reporting (throttled) and the watermark image.

// Collapse repeated reports of the same type so a held-down key or a burst of
// events doesn't hammer the API. The server de-dupes per day too; this just
// keeps the network quiet.
const REPORT_THROTTLE_MS = 15000;
const lastSent = new Map();

// Fire-and-forget: report a detected capture attempt on premium content. Never
// throws and never blocks the UI — protection must not get in the user's way if
// the network is down.
export function reportAbuse({ type, contentType = "general", contentRef = "" } = {}) {
    if (!type) return;
    const now = Date.now();
    const prev = lastSent.get(type) || 0;
    if (now - prev < REPORT_THROTTLE_MS) return;
    lastSent.set(type, now);

    const path =
        typeof window !== "undefined" ? window.location.pathname : "";
    api.post("/security/report", { type, contentType, contentRef, path }).catch(() => {
        /* logging endpoint — ignore failures */
    });
}

// The identity line stamped across premium content. Prefers name + a contact
// handle (email or phone) so a leaked screenshot points straight at the account.
export function watermarkText(user) {
    if (!user) return "OneLeet Premium";
    const who = user.name || "OneLeet student";
    const handle = user.email || user.phone || "";
    return handle ? `${who} · ${handle}` : who;
}

// A tiled, semi-transparent diagonal SVG watermark as a data URI, ready for
// `background-image`. Repeating it across the content gives the classic
// watermark "wall" that survives screenshots and photos of the screen.
export function watermarkImage(line1, line2 = "") {
    const esc = (s) =>
        String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='330' height='190'>
  <g transform='rotate(-28 165 95)' fill='#0f172a' fill-opacity='0.10' font-family='Arial, Helvetica, sans-serif' font-weight='600'>
    <text x='12' y='92' font-size='15'>${esc(line1)}</text>
    <text x='12' y='114' font-size='11' fill-opacity='0.09'>${esc(line2)}</text>
  </g>
</svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

// A short, stable "opened at" stamp for the second watermark line (local time,
// no seconds) so a leak can be tied to roughly when it was viewed.
export function openedStamp() {
    try {
        return `OneLeet · ${new Date().toLocaleString()}`;
    } catch {
        return "OneLeet Premium";
    }
}
