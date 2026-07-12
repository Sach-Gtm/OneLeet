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

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export default api;
