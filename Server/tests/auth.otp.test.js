// Integration tests for Phase 1 auth: mobile-mandatory registration, graceful
// no-email behaviour, and the full email-OTP verify/login gate. Run with:
//   node tests/auth.otp.test.js
// Uses an in-memory MongoDB and stubs the email transport (captures the OTP
// from the outgoing message so the verify step can use the real code).
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

// Minimal env the app needs to sign JWTs during the test.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Stub nodemailer BEFORE the app is required so createTransport is intercepted.
const sent = [];
require.cache[require.resolve("nodemailer")] = {
    id: require.resolve("nodemailer"),
    filename: require.resolve("nodemailer"),
    loaded: true,
    exports: {
        createTransport: () => ({
            sendMail: async (msg) => {
                sent.push(msg);
                return { messageId: "test" };
            },
            verify: async () => true,
        }),
    },
};

let passed = 0;
const ok = (label) => {
    console.log("  ✓ " + label);
    passed++;
};

async function withEmail(fn, enabled) {
    // email.js reads env at module load, so set env then load a fresh module.
    delete require.cache[require.resolve("../src/utils/email")];
    if (enabled) {
        process.env.EMAIL_USER = "test@oneleet.dev";
        process.env.EMAIL_PASS = "app-password";
    } else {
        delete process.env.EMAIL_USER;
        delete process.env.EMAIL_PASS;
    }
    // Reload controller + routes + app so they pick up the fresh email module.
    for (const p of [
        "../src/utils/email",
        "../src/controllers/user/authController",
        "../src/routes/user/userRoutes",
        "../app",
    ]) {
        delete require.cache[require.resolve(p)];
    }
    const app = require("../app");
    // Prime the deliverability probe (OTP is gated on it) before running fn.
    await require("../src/utils/email").refreshDeliverability();
    return fn(require("supertest")(app));
}

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    // ---- No email configured: signup works without OTP (backwards compatible)
    await withEmail(async (agent) => {
        const noPhone = await agent
            .post("/api/auth/register")
            .send({ name: "No Phone", email: "a@test.com", password: "secret123" });
        assert.strictEqual(noPhone.status, 400, "register without phone must 400");
        ok("phone is mandatory (400 when missing)");

        const reg = await agent.post("/api/auth/register").send({
            name: "Grace",
            email: "grace@test.com",
            password: "secret123",
            phone: "9876543210",
        });
        assert.strictEqual(reg.status, 201);
        assert.ok(reg.body.token, "should get a token when OTP is off");
        assert.strictEqual(reg.body.user.isVerified, true);
        ok("no-email: register returns a logged-in, verified user");

        const login = await agent
            .post("/api/auth/login")
            .send({ email: "grace@test.com", password: "secret123" });
        assert.strictEqual(login.status, 200);
        ok("no-email: login works immediately");
    }, false);

    // ---- Email configured: OTP gate enforced end-to-end
    await withEmail(async (agent) => {
        sent.length = 0;
        const reg = await agent.post("/api/auth/register").send({
            name: "Otto",
            email: "otto@test.com",
            password: "secret123",
            phone: "9998887776",
        });
        assert.strictEqual(reg.status, 201);
        assert.strictEqual(reg.body.needsVerification, true, "must need verification");
        assert.ok(!reg.body.token, "must NOT be logged in before verifying");
        ok("email-on: register returns needsVerification, no token");

        const otpMsg = sent.find((m) => m.to === "otto@test.com");
        assert.ok(otpMsg, "an OTP email should have been sent");
        const otp = (otpMsg.text.match(/\b(\d{6})\b/) || [])[1];
        assert.ok(otp, "OTP email should contain a 6-digit code");
        ok("email-on: a 6-digit OTP email was sent");

        const earlyLogin = await agent
            .post("/api/auth/login")
            .send({ email: "otto@test.com", password: "secret123" });
        assert.strictEqual(earlyLogin.status, 403);
        assert.strictEqual(earlyLogin.body.needsVerification, true);
        ok("email-on: login blocked (403) until verified");

        const badOtp = await agent
            .post("/api/auth/verify-otp")
            .send({ email: "otto@test.com", otp: "000000" });
        assert.strictEqual(badOtp.status, 400);
        ok("email-on: wrong OTP rejected (400)");

        const verify = await agent
            .post("/api/auth/verify-otp")
            .send({ email: "otto@test.com", otp });
        assert.strictEqual(verify.status, 200);
        assert.ok(verify.body.token, "verify should log the user in");
        assert.strictEqual(verify.body.user.isVerified, true);
        ok("email-on: correct OTP verifies + logs in");

        const afterLogin = await agent
            .post("/api/auth/login")
            .send({ email: "otto@test.com", password: "secret123" });
        assert.strictEqual(afterLogin.status, 200);
        ok("email-on: login works after verification");
    }, true);

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} auth/OTP checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
