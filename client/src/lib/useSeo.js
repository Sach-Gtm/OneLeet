import { useEffect } from "react";

// Per-route <head> control for the public SPA pages. The static /leet and
// /guides pages ship their own fully-rendered head, and index.html covers the
// homepage — this hook lets the remaining client-rendered public routes
// (e.g. /mentor) present a route-specific title, description and canonical to
// crawlers that execute JavaScript (Googlebot, Bingbot). It intentionally only
// touches tags it's given, and never runs on authenticated app routes.
const BASE = "https://www.oneleet.in";

function upsertMeta(attr, key, content) {
    if (!content) return;
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute("content", content);
}

export function useSeo({ title, description, path }) {
    useEffect(() => {
        if (title) {
            document.title = title;
            upsertMeta("property", "og:title", title);
            upsertMeta("name", "twitter:title", title);
        }
        if (description) {
            upsertMeta("name", "description", description);
            upsertMeta("property", "og:description", description);
        }
        if (path) {
            const href = `${BASE}${path}`;
            let link = document.head.querySelector('link[rel="canonical"]');
            if (!link) {
                link = document.createElement("link");
                link.setAttribute("rel", "canonical");
                document.head.appendChild(link);
            }
            link.setAttribute("href", href);
            upsertMeta("property", "og:url", href);
        }
    }, [title, description, path]);
}
