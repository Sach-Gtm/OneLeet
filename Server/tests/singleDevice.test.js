// Integration tests for single-device login (one active session per account).
// A fresh login anywhere rotates a server-side session id that's baked into the
// issued JWT; the auth middleware rejects any token whose `sid` no longer
// matches, so logging in on a second device signs the first one out. This is
// what stops a paid account from being shared across many devices. Run with:
//   node tests/singleDevice.test.js
// Uses an in-memory MongoDB and stubs the Google userinfo endpoint.
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
// Email off → register logs the user straight in (no OTP gate), which keeps
// these tests focused on session behaviour.
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;

const app = require("../app");
const request = require("supertest");
const User = require("../src/models/userModel");
const generateToken = require("../src/utils/generateToken");

let passed = 0;
const ok = (label) => {
    console.log("  ✓ " + label);
    passed++;
};

// Authenticated GET /auth/me with an explicit Bearer token, so we can act as a
// specific "device" (each device holds its own token).
const me = (token, ua) => {
    const r = request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    return ua ? r.set("User-Agent", ua) : r;
};

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    // Ensure the email deliverability probe has run (OTP stays off with no creds).
    await require("../src/utils/email").refreshDeliverability();

    // ---- Password login: a second device kicks the first --------------------
    {
        const reg = await request(app)
            .post("/api/auth/register")
            .set("User-Agent", "Device-Register")
            .send({ name: "Solo", email: "solo@test.com", password: "secret123", phone: "9876500000" });
        assert.strictEqual(reg.status, 201, "register should succeed with OTP off");
        assert.ok(reg.body.token, "register returns a token");
        const tokenReg = reg.body.token;

        // The registering device works...
        assert.strictEqual((await me(tokenReg)).status, 200);
        ok("registering device is authenticated");

        // ...until a login elsewhere (device 1) supersedes it.
        const dev1 = await request(app)
            .post("/api/auth/login")
            .set("User-Agent", "Device-1")
            .send({ identifier: "solo@test.com", password: "secret123" });
        assert.strictEqual(dev1.status, 200);
        const token1 = dev1.body.token;
        assert.notStrictEqual(token1, tokenReg, "each login mints a new token");

        assert.strictEqual((await me(token1)).status, 200);
        ok("device 1 (latest login) is authenticated");

        const staleReg = await me(tokenReg);
        assert.strictEqual(staleReg.status, 401, "the earlier device is now rejected");
        assert.strictEqual(staleReg.body.code, "SESSION_REVOKED");
        ok("earlier device is signed out with SESSION_REVOKED");

        // Now a THIRD login (device 2) must in turn kick device 1.
        const dev2 = await request(app)
            .post("/api/auth/login")
            .set("User-Agent", "Device-2")
            .send({ identifier: "solo@test.com", password: "secret123" });
        assert.strictEqual(dev2.status, 200);
        const token2 = dev2.body.token;

        assert.strictEqual((await me(token2)).status, 200);
        const stale1 = await me(token1);
        assert.strictEqual(stale1.status, 401);
        assert.strictEqual(stale1.body.code, "SESSION_REVOKED");
        ok("logging in on device 2 signs device 1 out");

        // The active session records which device holds it.
        const doc = await User.findOne({ email: "solo@test.com" });
        assert.strictEqual(doc.sessionDevice.userAgent, "Device-2", "device is identified");
        assert.ok(doc.sessionDevice.loginAt, "login time is recorded");
        ok("the active device (user-agent + time) is recorded");

        // /auth/me must not leak the session id.
        const meBody = (await me(token2)).body;
        assert.strictEqual(meBody.user.sessionId, undefined, "session id is not leaked in /me");
        ok("session id is never exposed to the client");

        // ---- Logout invalidates the token server-side, not just the cookie ---
        const out = await request(app)
            .post("/api/auth/logout")
            .set("Authorization", `Bearer ${token2}`);
        assert.strictEqual(out.status, 200);
        const afterLogout = await me(token2);
        assert.strictEqual(afterLogout.status, 401, "the logged-out token is dead");
        assert.strictEqual(afterLogout.body.code, "SESSION_REVOKED");
        ok("logout rotates the session so the token can't be replayed");
    }

    // ---- Google login is single-device too ----------------------------------
    {
        const realFetch = global.fetch;
        global.fetch = async () => ({
            ok: true,
            json: async () => ({
                sub: "google-oauth-123",
                email: "goog@test.com",
                email_verified: true,
                name: "Goog User",
                picture: "",
            }),
        });
        try {
            const g1 = await request(app)
                .post("/api/auth/google-login")
                .set("User-Agent", "GDevice-1")
                .send({ accessToken: "fake-google-access-token-1234567890" });
            assert.strictEqual(g1.status, 201, "first google sign-in creates the account");
            const gt1 = g1.body.token;
            assert.strictEqual((await me(gt1)).status, 200);
            ok("google device 1 is authenticated");

            const g2 = await request(app)
                .post("/api/auth/google-login")
                .set("User-Agent", "GDevice-2")
                .send({ accessToken: "fake-google-access-token-1234567890" });
            assert.strictEqual(g2.status, 200, "second google sign-in logs into the same account");
            const gt2 = g2.body.token;

            assert.strictEqual((await me(gt2)).status, 200);
            const gStale = await me(gt1);
            assert.strictEqual(gStale.status, 401);
            assert.strictEqual(gStale.body.code, "SESSION_REVOKED");
            ok("a second google login signs the first google device out");
        } finally {
            global.fetch = realFetch;
        }
    }

    // ---- Migration grace: pre-existing tokens keep working until next login --
    {
        // A user who has never logged in since the feature shipped has no
        // sessionId yet; their already-issued (sid-less) token must still work,
        // so nobody is force-logged-out by the deploy itself.
        const legacy = await User.create({
            name: "Legacy",
            email: "legacy@test.com",
            password: "secret123",
            phone: "9000011111",
            isVerified: true,
        });
        const legacyToken = generateToken(legacy._id); // no sid, like an old token
        assert.strictEqual((await me(legacyToken)).status, 200, "legacy token still works pre-login");
        ok("pre-existing (sid-less) token keeps working until the account re-logs in");

        // The moment they log in, single-device activates and the old token dies.
        const relog = await request(app)
            .post("/api/auth/login")
            .set("User-Agent", "Legacy-New-Device")
            .send({ identifier: "legacy@test.com", password: "secret123" });
        assert.strictEqual(relog.status, 200);
        const legacyStale = await me(legacyToken);
        assert.strictEqual(legacyStale.status, 401);
        assert.strictEqual(legacyStale.body.code, "SESSION_REVOKED");
        ok("once the account logs in, the old sid-less token is invalidated");
    }

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} single-device checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
