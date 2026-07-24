// Extract the 11-char id from any YouTube URL (or a bare id). Mirrors the
// server's parser (Server/src/utils/youtube.js) so the staff form can preview
// the thumbnail and validate before saving. Returns "" if none is found.
export function parseYouTubeId(input) {
    if (!input) return "";
    const s = String(input).trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
    const patterns = [
        /[?&]v=([a-zA-Z0-9_-]{11})/, // watch?v=ID
        /youtu\.be\/([a-zA-Z0-9_-]{11})/, // youtu.be/ID
        /\/embed\/([a-zA-Z0-9_-]{11})/, // /embed/ID
        /\/shorts\/([a-zA-Z0-9_-]{11})/, // /shorts/ID
        /\/live\/([a-zA-Z0-9_-]{11})/, // /live/ID
        /\/v\/([a-zA-Z0-9_-]{11})/, // /v/ID (legacy)
    ];
    for (const re of patterns) {
        const m = s.match(re);
        if (m) return m[1];
    }
    return "";
}

// A YouTube thumbnail for a card. hqdefault exists for every video.
export const youTubeThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// Privacy-enhanced embed URL — youtube-nocookie plus rel=0/modestbranding keeps
// the player minimal and on-brand so videos play inside OneLeet, not on YouTube.
export const youTubeEmbed = (id) =>
    `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
