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
export const setToken = (t) => {
    if (t) localStorage.setItem(TOKEN_KEY, t);
};
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
export const getToken = () => localStorage.getItem(TOKEN_KEY);

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const t = getToken();
    if (t) config.headers.Authorization = `Bearer ${t}`;
    return config;
});

export default api;
