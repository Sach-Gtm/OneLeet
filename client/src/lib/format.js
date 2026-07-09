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
