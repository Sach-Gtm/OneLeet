// Keeps this Render free-tier instance from spinning down. When the service is
// idle ~15 minutes Render puts it to sleep, and the next visitor pays a 30-60s
// cold start — which is what left logins hanging and bouncing people back to
// /login. While the process is running we ping our own PUBLIC health URL just
// under that idle window, so the instance keeps registering inbound traffic and
// never goes to sleep. (A GitHub Actions cron is the external backup that can
// wake it if it ever does sleep despite this.)

const KEEPALIVE_MINUTES = 13; // comfortably under Render's ~15-min idle window

// Render injects the public URL as RENDER_EXTERNAL_URL; SELF_URL overrides it on
// other hosts. Returns null when neither is set (e.g. local dev) so keep-awake
// simply no-ops off-platform.
function buildPingUrl() {
    const base = process.env.SELF_URL || process.env.RENDER_EXTERNAL_URL;
    if (!base) return null;
    return `${base.replace(/\/+$/, "")}/api/health`;
}

async function pingOnce(url) {
    const res = await fetch(url, { method: "GET" });
    await res.text().catch(() => {}); // drain, ignore body
    return res.status;
}

function startKeepAwake() {
    const url = buildPingUrl();
    if (!url) return; // off-platform / not configured
    if (typeof fetch !== "function") return; // ancient Node without global fetch

    const run = () =>
        pingOnce(url).catch((err) =>
            console.error("[keepAwake] ping failed:", err.message)
        );

    const timer = setInterval(run, KEEPALIVE_MINUTES * 60 * 1000);
    if (timer.unref) timer.unref(); // don't hold the process open just for this

    // register activity shortly after boot, too
    const boot = setTimeout(run, 20 * 1000);
    if (boot.unref) boot.unref();

    console.log(`[keepAwake] self-ping every ${KEEPALIVE_MINUTES}m -> ${url}`);
}

module.exports = { startKeepAwake, buildPingUrl, pingOnce, KEEPALIVE_MINUTES };
