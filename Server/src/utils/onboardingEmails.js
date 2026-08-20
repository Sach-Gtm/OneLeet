const { sendMail } = require("./email");
const User = require("../models/userModel");

// Lifecycle emails: a warm welcome on sign-up and a confirmation when a student
// joins a batch. Both are fire-and-forget and delegate to sendMail(), which
// no-ops cleanly when email isn't configured — so they never block or break a
// request. Copy is motivating but honest (only claims OneLeet can back up).
const SITE = (process.env.EMAIL_SITE_URL || "https://www.oneleet.in").replace(/\/+$/, "");
const HELP = "help@oneleet.in";

const firstName = (name) => (String(name || "").trim().split(/\s+/)[0] || "there");
const esc = (s) => String(s == null ? "" : s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));

// Shared, mobile-friendly shell — table layout + inline styles for email-client
// compatibility. `bodyRows` is trusted HTML built by the senders below.
function shell({ preheader, bodyRows }) {
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#eef2f7;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
        <tr><td style="padding:26px 32px 6px;">
          <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;"><span style="color:#EC7A54;">One</span><span style="color:#3FB0D6;">Leet</span></span>
        </td></tr>
        ${bodyRows}
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #eef2f7;">
          <p style="margin:0;color:#94a3b8;font-size:12.5px;line-height:1.6;">Questions? Just reply to this email or write to <a href="mailto:${HELP}" style="color:#6366f1;text-decoration:none;">${HELP}</a>.<br>— Team OneLeet · your diploma-to-B.Tech shortcut</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const button = (text, url) =>
    `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#4f46e5;"><a href="${url}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">${text}</a></td></tr></table>`;

// Sent once per account, right after sign-up completes (verified / OTP-off /
// Google). Atomic guard so a double-fire never double-sends.
async function sendWelcomeEmail(user) {
    try {
        if (!user || !user._id || !user.email) return;
        const r = await User.updateOne(
            { _id: user._id, welcomeEmailSentAt: { $exists: false } },
            { $set: { welcomeEmailSentAt: new Date() } }
        );
        if (!r.modifiedCount) return; // already welcomed

        const fn = esc(firstName(user.name));
        const bodyRows = `
        <tr><td style="padding:10px 32px 0;">
          <h1 style="margin:0 0 6px;font-size:24px;line-height:1.25;color:#0f172a;">Welcome aboard, ${fn} 👋</h1>
          <p style="margin:14px 0 0;color:#475569;font-size:15.5px;line-height:1.65;">You just did what most diploma students never do — you decided your diploma is a launchpad, not a ceiling. LEET is your route straight into <b>2nd-year B.Tech</b>, and we're here to help you crack it.</p>
          <p style="margin:16px 0 0;color:#475569;font-size:15.5px;line-height:1.65;">Everything you need is now in one place:</p>
          <ul style="margin:10px 0 0;padding-left:20px;color:#475569;font-size:15px;line-height:1.7;">
            <li><b>Real past papers</b> — practise exactly what the exam asks</li>
            <li><b>Exam-pattern mock tests</b> with an all-India rank</li>
            <li><b>An AI coach</b> that builds a plan around your exam date</li>
            <li><b>Notes, flashcards &amp; mentors</b> who cracked LEET themselves</li>
          </ul>
          <p style="margin:16px 0 0;color:#475569;font-size:15.5px;line-height:1.65;">OneLeet was built by a LEET rank-holder who cleared <b>AIR 54 with zero coaching</b> and has since guided 100+ students into colleges they'd only dreamed of. You don't need expensive coaching to crack LEET — you need the right papers, the right practice, and a plan.</p>
          <p style="margin:18px 0 0;color:#0f172a;font-size:16px;line-height:1.6;font-weight:700;">The students who make it aren't the ones who study everything — they're the ones who start today.</p>
        </td></tr>
        <tr><td style="padding:22px 32px 4px;">${button("Start preparing free →", `${SITE}/courses`)}</td></tr>
        <tr><td style="padding:16px 32px 4px;">
          <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">Ready to go all-in? <b>OneLeet Premium</b> unlocks the full test series, the complete master course, your AI mentor and a Success Promise backed by clear, per-exam terms. <a href="${SITE}/pricing" style="color:#6366f1;font-weight:600;text-decoration:none;">See the plans →</a></p>
        </td></tr>`;

        await sendMail({
            to: user.email,
            subject: "Welcome to OneLeet 🎉 Your diploma-to-B.Tech journey starts now",
            html: shell({
                preheader: "Real past papers, exam-pattern mocks and an AI coach — everything to crack LEET, free to start.",
                bodyRows,
            }),
            text:
`Welcome aboard, ${firstName(user.name)}!

You just decided your diploma is a launchpad, not a ceiling. LEET is your route into 2nd-year B.Tech — and everything you need is now in one place:

- Real past papers
- Exam-pattern mock tests with an all-India rank
- An AI coach that plans your prep around your exam date
- Notes, flashcards and mentors who cracked LEET themselves

OneLeet was built by a LEET rank-holder (AIR 54, zero coaching) who has guided 100+ students into colleges they'd only dreamed of. You don't need expensive coaching to crack LEET — you need the right papers, the right practice, and a plan.

The students who make it aren't the ones who study everything — they're the ones who start today.

Start preparing free: ${SITE}/courses
Go all-in with OneLeet Premium: ${SITE}/pricing

Questions? Reply here or write to ${HELP}.
— Team OneLeet`,
        });
    } catch (e) {
        console.error("[welcome-email] skipped:", e.message);
    }
}

// Sent when a student joins a batch (first enrollment in that course).
async function sendEnrollmentEmail(user, course) {
    try {
        if (!user || !user.email || !course) return;
        const fn = esc(firstName(user.name));
        const cn = esc(course.name || "your batch");
        const exam = esc(course.examName || course.name || "your exam");
        const bodyRows = `
        <tr><td style="padding:10px 32px 0;">
          <h1 style="margin:0 0 6px;font-size:24px;line-height:1.25;color:#0f172a;">You're in, ${fn} 🎉</h1>
          <p style="margin:14px 0 0;color:#475569;font-size:15.5px;line-height:1.65;">Your seat in the <b>${cn}</b> is confirmed. This is where diploma students turn into B.Tech rank-holders — and your prep starts today.</p>
          <p style="margin:16px 0 6px;color:#0f172a;font-size:15.5px;font-weight:700;">Start strong in 3 steps:</p>
          <ol style="margin:0;padding-left:20px;color:#475569;font-size:15px;line-height:1.7;">
            <li>Open a <b>real past paper</b> and see exactly what ${exam} asks.</li>
            <li>Take your first <b>exam-pattern mock</b> for an honest baseline.</li>
            <li>Let the <b>AI coach</b> build a plan around your exam date.</li>
          </ol>
          <p style="margin:18px 0 0;color:#0f172a;font-size:16px;line-height:1.6;font-weight:700;">Every topper started with one paper. Open yours today.</p>
        </td></tr>
        <tr><td style="padding:22px 32px 4px;">${button("Open my batch →", `${SITE}/dashboard`)}</td></tr>
        <tr><td style="padding:16px 32px 4px;">
          <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">Want the full arsenal? <b>OneLeet Premium</b> unlocks unlimited mocks, the complete master course and your AI mentor — plus a Success Promise backed by clear, per-exam terms. <a href="${SITE}/pricing" style="color:#6366f1;font-weight:600;text-decoration:none;">Go Premium →</a></p>
        </td></tr>`;

        await sendMail({
            to: user.email,
            subject: `You're in the ${course.name || "batch"} 🎯`,
            html: shell({
                preheader: `Your seat is confirmed. Here's how to start cracking ${course.examName || "LEET"} today.`,
                bodyRows,
            }),
            text:
`You're in, ${firstName(user.name)}!

Your seat in the ${course.name || "batch"} is confirmed. Start strong in 3 steps:
1. Open a real past paper and see exactly what ${course.examName || "the exam"} asks.
2. Take your first exam-pattern mock for an honest baseline.
3. Let the AI coach build a plan around your exam date.

Every topper started with one paper. Open yours today.

Open your batch: ${SITE}/dashboard
Go Premium (full mocks, master course, AI mentor + Success Promise): ${SITE}/pricing

Questions? Reply here or write to ${HELP}.
— Team OneLeet`,
        });
    } catch (e) {
        console.error("[enroll-email] skipped:", e.message);
    }
}

const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const prettyDate = (d) => {
    try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return ""; }
};

// Sent on the FIRST successful payment for an order — a warm receipt that
// confirms the purchase, welcomes them to Premium and points them at the work.
// Fire-and-forget; no-ops cleanly when email isn't configured.
async function sendPurchaseEmail(user, order) {
    try {
        if (!user || !user.email || !order) return;
        const fn = esc(firstName(user.name));
        const names = (order.items || []).map((i) => i.courseName).filter(Boolean);
        const list = names.length
            ? names.map((n) => `<li style="margin:2px 0;"><b>${esc(n)}</b></li>`).join("")
            : `<li><b>your OneLeet batch</b></li>`;
        const paid = rupee(order.amountPaid);
        const until = prettyDate(order.grantsPremiumUntil);
        const isSplit = order.paymentPlan === "split" && order.status === "partially_paid";
        const second = (order.installments || []).find((i) => i.n === 2);
        const splitNote = isSplit && second
            ? `<p style="margin:14px 0 0;color:#475569;font-size:14.5px;line-height:1.6;">You chose the 2-part plan, so full access is on now. Your second installment of <b>${rupee(second.amount)}</b> is due by <b>${prettyDate(second.dueAt)}</b> — we'll remind you before then.</p>`
            : "";

        const bodyRows = `
        <tr><td style="padding:10px 32px 0;">
          <h1 style="margin:0 0 6px;font-size:24px;line-height:1.25;color:#0f172a;">Payment received — you're Premium now, ${fn} 🎉</h1>
          <p style="margin:14px 0 0;color:#475569;font-size:15.5px;line-height:1.65;">Your purchase is confirmed and <b>OneLeet Premium is unlocked</b>. This is the moment your prep stops being "someday" and becomes a plan.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 2px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
            <tr><td style="padding:16px 18px;">
              <p style="margin:0 0 6px;color:#0f172a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;">You unlocked</p>
              <ul style="margin:6px 0 12px;padding-left:18px;color:#334155;font-size:15px;line-height:1.6;">${list}</ul>
              <p style="margin:0;color:#475569;font-size:14.5px;">Paid: <b style="color:#0f172a;">${paid}</b>${until ? ` &nbsp;·&nbsp; Premium access until <b style="color:#0f172a;">${until}</b>` : ""}</p>
            </td></tr>
          </table>
          ${splitNote}
          <p style="margin:16px 0 0;color:#475569;font-size:15.5px;line-height:1.65;">Everything is open now — the full test series, the complete master course, your AI mentor and the Success Promise. Here's the fastest way to feel it working:</p>
          <ol style="margin:10px 0 0;padding-left:20px;color:#475569;font-size:15px;line-height:1.7;">
            <li>Take one <b>exam-pattern mock</b> today for an honest baseline.</li>
            <li>Let the <b>AI coach</b> build a plan around your exam date.</li>
            <li>Come back tomorrow. Consistency &gt; intensity.</li>
          </ol>
          <p style="margin:18px 0 0;color:#0f172a;font-size:16px;line-height:1.6;font-weight:700;">You didn't just buy a course — you backed yourself. Now let's get you that rank.</p>
        </td></tr>
        <tr><td style="padding:22px 32px 4px;">${button("Start now →", `${SITE}/dashboard`)}</td></tr>
        <tr><td style="padding:16px 32px 4px;">
          <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">Need your invoice or have a question about your order? Just reply — a human reads every email.</p>
        </td></tr>`;

        await sendMail({
            to: user.email,
            subject: "Payment received 🎉 Welcome to OneLeet Premium",
            html: shell({ preheader: `Your purchase is confirmed and Premium is unlocked${until ? ` until ${until}` : ""}. Here's how to start.`, bodyRows }),
            text:
`Payment received — you're Premium now, ${firstName(user.name)}!

Your purchase is confirmed and OneLeet Premium is unlocked.

You unlocked:
${names.length ? names.map((n) => `- ${n}`).join("\n") : "- your OneLeet batch"}
Paid: ${paid}${until ? ` · Premium access until ${until}` : ""}
${isSplit && second ? `\nYou chose the 2-part plan, so full access is on now. Second installment of ${rupee(second.amount)} is due by ${prettyDate(second.dueAt)}.\n` : ""}
Fastest way to feel it working:
1. Take one exam-pattern mock today for an honest baseline.
2. Let the AI coach build a plan around your exam date.
3. Come back tomorrow. Consistency > intensity.

You didn't just buy a course — you backed yourself. Now let's get you that rank.

Start now: ${SITE}/dashboard

Questions or need an invoice? Just reply to this email.
— Team OneLeet`,
        });
    } catch (e) {
        console.error("[purchase-email] skipped:", e.message);
    }
}

module.exports = { sendWelcomeEmail, sendEnrollmentEmail, sendPurchaseEmail };
