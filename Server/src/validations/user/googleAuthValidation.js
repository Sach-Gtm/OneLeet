const { z } = require("zod");

// The client sends the Google-issued OAuth access token ONLY. The server
// exchanges it with Google for the verified identity (email, sub, name,
// picture) — we never trust a client-supplied email/googleId, since anyone
// could POST someone else's address to this public endpoint and impersonate
// them (including staff / the Super Admin).
const googleAuthValidation = z.object({
    accessToken: z
        .string({ required_error: "Google access token is required" })
        .min(20, "Invalid Google access token"),
});

module.exports = googleAuthValidation;
