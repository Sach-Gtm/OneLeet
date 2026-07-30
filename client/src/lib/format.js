// A number of minutes as a compact duration, e.g. "0m", "44m", "1h 29m".
// Used wherever we surface "time spent studying" so every screen agrees.
export function fmtDuration(min) {
    const m = Math.max(0, Math.round(min || 0));
    const h = Math.floor(m / 60);
    return h ? `${h}h ${m % 60}m` : `${m}m`;
}

// Compact relative time, e.g. "just now", "5m ago", "3h ago", "2d ago".
export function timeAgo(dateInput) {
    if (!dateInput) return "";
    const diff = (Date.now() - new Date(dateInput).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateInput).toLocaleDateString();
}
