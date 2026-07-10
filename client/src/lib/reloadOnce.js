// Recover from a "stale chunk" 404: a tab opened before a deploy still points at
// the old hashed chunk files, so navigating to a lazy route 404s and blanks the
// screen. We reload once to pull the fresh index.html + chunk manifest.
//
// Two things matter here:
//  - Guard with sessionStorage so a genuinely broken chunk can't loop forever.
//  - Defer the reload (setTimeout 0). Calling reload() synchronously while the
//    failed dynamic import is still throwing up the stack leaves the navigation
//    stranded (page blanks but never reloads); letting the task unwind first
//    makes the reload actually commit.
export function reloadOnceForStaleChunk() {
    const KEY = "oneleet_chunk_reload_at";
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last > 10000) {
        sessionStorage.setItem(KEY, String(Date.now()));
        setTimeout(() => window.location.reload(), 0);
        return true;
    }
    return false;
}
