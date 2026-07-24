// Pull the 11-character video id out of whatever YouTube link a staff member
// pastes — watch URLs, youtu.be short links, /embed, /shorts, /live — or accept
// a bare id. Returns "" when nothing valid is found, so callers can reject it.
// We store only the id and build the embed ourselves, so videos always play
// inside OneLeet rather than bouncing the student to youtube.com.
function parseYouTubeId(input) {
    if (!input) return "";
    const s = String(input).trim();

    // Already a bare id.
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;

    const patterns = [
        /[?&]v=([a-zA-Z0-9_-]{11})/, // youtube.com/watch?v=ID
        /youtu\.be\/([a-zA-Z0-9_-]{11})/, // youtu.be/ID
        /\/embed\/([a-zA-Z0-9_-]{11})/, // youtube.com/embed/ID
        /\/shorts\/([a-zA-Z0-9_-]{11})/, // youtube.com/shorts/ID
        /\/live\/([a-zA-Z0-9_-]{11})/, // youtube.com/live/ID
        /\/v\/([a-zA-Z0-9_-]{11})/, // youtube.com/v/ID (legacy)
    ];
    for (const re of patterns) {
        const m = s.match(re);
        if (m) return m[1];
    }
    return "";
}

module.exports = { parseYouTubeId };
