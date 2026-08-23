const webpush = require("web-push");

// Web Push (background notifications) is enabled only when VAPID keys are set in
// the environment — otherwise everything below no-ops and the app falls back to
// the foreground/in-app notifications. Generate a keypair once with
// `npx web-push generate-vapid-keys` and set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
// (and optionally VAPID_SUBJECT, a mailto: or https: contact) on the server.
const PUBLIC = process.env.VAPID_PUBLIC_KEY || "";
const PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:help@oneleet.in";

let configured = false;
if (PUBLIC && PRIVATE) {
    try {
        webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
        configured = true;
    } catch (e) {
        console.warn("[web-push] invalid VAPID keys, background push disabled:", e.message);
    }
}

const pushEnabled = () => configured;
const getPublicKey = () => (configured ? PUBLIC : null);

module.exports = { webpush, pushEnabled, getPublicKey };
