import api from "./axios";

// A stable per-browser id for anonymous visitors, so landing-page time counts
// as aggregate traffic without any account.
const ANON_KEY = "oneleet_anon";
export function getAnonId() {
    try {
        let id = localStorage.getItem(ANON_KEY);
        if (!id) {
            id =
                (crypto.randomUUID && crypto.randomUUID()) ||
                `a-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            localStorage.setItem(ANON_KEY, id);
        }
        return id;
    } catch {
        return null;
    }
}

// Best-effort — a blocked/failed heartbeat must never affect the page.
export async function sendHeartbeat({ path, seconds, anonId }) {
    try {
        await api.post("/activity/heartbeat", { path, seconds, anonId });
    } catch {
        /* ignore */
    }
}

export async function getMyAnalytics() {
    const { data } = await api.get("/activity/me");
    return data;
}
