import axios from "axios";

// Prefer the configured API URL, but fall back to the known production/dev API
// so a missing or mis-scoped VITE_API_URL env var (e.g. accidentally marked
// "Sensitive" in Vercel, which stops Vite from inlining it) can't silently
// break every API call.
const API_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
        ? "https://oneleet-api.onrender.com/api"
        : "http://localhost:3000/api");

// --- Auth token (Bearer) -------------------------------------------------
// The frontend (Vercel) and the API (Render) are on different sites, so the
// httpOnly auth cookie is a THIRD-PARTY cookie — Safari blocks it outright and
// Chrome/mobile increasingly do too, which left users "logged in" on the server
// but bounced back to /login on the client. So alongside the cookie we also keep
// the JWT (returned by every login response) in localStorage and send it as a
// Bearer header; the backend's auth middleware accepts either. This makes login
// work on every device/browser regardless of third-party-cookie policy.
const TOKEN_KEY = "oneleet_token";
// Also hold the token in memory. Managed/"School" Chrome profiles and privacy
// extensions can silently no-op (or wipe) localStorage; the in-memory copy keeps
// the current session authenticated even when persistence is blocked, and every
// localStorage access is wrapped so a throw (private mode) never breaks login.
let memToken = null;
export const setToken = (t) => {
    if (!t) return;
    memToken = t;
    try {
        localStorage.setItem(TOKEN_KEY, t);
    } catch {
        /* storage blocked — memToken still carries the session */
    }
};
export const clearToken = () => {
    memToken = null;
    try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY); // a cleared token means no session — drop the cached user too
    } catch {
        /* ignore */
    }
};
export const getToken = () => {
    if (memToken) return memToken;
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
};

// --- Persisted user (optimistic session) --------------------------------
// Cache the last-known user alongside the token so a reload / PWA relaunch shows
// the app immediately from the stored session, instead of blanking to a spinner
// and — if the first /auth/me is slow or fails (e.g. a Render cold start) —
// bouncing a perfectly valid login back to /login. It's only a hint: /auth/me
// still validates in the background and a real 401 clears it (via clearToken).
const USER_KEY = "oneleet_user";
export const setStoredUser = (u) => {
    try {
        if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
        else localStorage.removeItem(USER_KEY);
    } catch {
        /* storage blocked — the in-memory context state still holds the user */
    }
};
export const getStoredUser = () => {
    try {
        const s = localStorage.getItem(USER_KEY);
        return s ? JSON.parse(s) : null;
    } catch {
        return null;
    }
};

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const t = getToken();
    if (t) config.headers.Authorization = `Bearer ${t}`;
    return config;
});

// Single-device login: the server rotates a session id on every login, so when
// this account signs in on another device our token becomes stale and the API
// answers 401 with { code: "SESSION_REVOKED" }. Drop the dead token and bounce
// to /login with a flag the page turns into a friendly "signed out elsewhere"
// notice. Guard against a redirect loop (already on /login) and against the
// browser's own restrictions in odd embed contexts.
let handlingRevoked = false;
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.data?.code === "SESSION_REVOKED") {
            clearToken();
            if (!handlingRevoked && typeof window !== "undefined") {
                const path = window.location.pathname;
                if (path !== "/login") {
                    handlingRevoked = true;
                    window.location.assign("/login?revoked=1");
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
