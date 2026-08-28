// The Success Promise, Terms of Service and No-Refund policy, drafted to be
// protective under Indian consumer law (Consumer Protection Act 2019 + CCPA
// 2022 guidelines on misleading ads and ASCI's coaching-sector norms). This is
// content-as-data so the page, the checkout T&C and future edits share one
// source.
//
// Reviewed with legal counsel before launch. If the founder's advocate supplies
// revised wording, keep this file in sync — it's the single source for the page
// and the checkout ticks.

export const LEGAL_UPDATED = "Last updated: August 2026";

// The company behind OneLeet (used in the legal wording).
export const LEGAL_ENTITY = "StaplerLabs Private Limited (“OneLeet”)";

// Per-exam Success Promise — what we commit to, and the reward if it isn't met.
// Framed as a performance-linked partial-refund / scholarship-back, NOT an
// unconditional guarantee, to stay within advertising norms.
export const SUCCESS_PROMISE_TABLE = [
    {
        exam: "IPU LEET",
        commitment:
            "Score well and secure admission in a top-6 IPU college for a CSE-family branch (CSE, CST, IT, AI-DS, DS, AIML, ITE): USICT, MAIT, MSIT, BVCOE, BPIT, ADGITM or USAR; or a top-3 college (USICT, MAIT, MSIT) for any other branch.",
        reward: "Refund policy: if you don't score and secure the promised admission, your course fee is refunded. See the course page for the exact terms.",
    },
    {
        exam: "DTU / NSUT LEET",
        commitment: "A top-10 rank, or admission on any seat through the exam.",
        reward: "Top-10 rank → 100% refund. Admission on any seat → 60% refund.",
    },
    {
        exam: "CUET / UP LEET (AKTU)",
        commitment: "A top-10 rank, or admission in a top-3 college.",
        reward: "Top-10 rank → 100% refund. Admission in a top-3 college → 40% refund.",
    },
    {
        exam: "Haryana LEET (HSTES)",
        commitment: "Admission in YMCA (J.C. Bose University), or a top-50 rank.",
        reward: "Admission in YMCA → 50% refund. Top-50 rank without YMCA → 30% refund.",
    },
    {
        exam: "Bihar LEET (BCECE-LE)",
        commitment: "Admission in a top-2 college: MIT Muzaffarpur or BCE Bhagalpur.",
        reward: "Admission in a top-2 college → 50% refund.",
    },
    {
        exam: "Gujarat LEET · SLIET LEET",
        commitment: "A performance-linked Success Reward; exact thresholds are confirmed on the course page before purchase.",
        reward: "Partial refund on meeting the stated threshold. See the course page.",
    },
];

// The student's side of the bargain — the Promise applies ONLY if ALL are met.
export const ELIGIBILITY_CONDITIONS = [
    "Be eligible for the relevant LEET examination per the official university notification, and complete the exam registration independently.",
    "Provide correct, verifiable information while registering on OneLeet.",
    "Attempt at least 100 tests on the platform (short and long combined).",
    "Attempt each Previous-Year Paper (PYQ) at least 10 times, and in the final month before the exam score 100% on a PYQ on at least 3 occasions.",
    "In the final month, fully attempt every test set by your mentor (no partial attempts) and follow the mentor's guidance.",
    "Complete the mandatory study plan, required mock tests, required PYQs, mentor assignments and the AI study plan (where applicable), and meet the minimum participation requirements.",
    "Carry out the counselling process as guided by OneLeet and your mentor: attend the OneLeet 1:1 online counselling meeting, share the choices you fill, and fill choices as agreed.",
];

// When the Success Promise reward becomes void.
export const VOID_CONDITIONS = [
    {
        head: "Exam participation",
        items: ["Does not appear in, leaves incomplete, misses, or is disqualified from the examination.", "Is found using unfair means."],
    },
    {
        head: "Counselling",
        items: ["Does not participate in every counselling round they are eligible for.", "Fills choices carelessly, or misses university document deadlines.", "Does not follow the official counselling process."],
    },
    {
        head: "Documents (OneLeet is not responsible for)",
        items: ["Document verification failure, wrong or missing documents.", "Category / EWS / OBC / SC / ST validity, medical, migration or character-certificate issues.", "Any document rejected by the university."],
    },
    {
        head: "Eligibility (refund not applicable if admission is denied due to)",
        items: ["Age, diploma percentage, backlogs, reservation policy or any university eligibility rule.", "Incorrect information submitted by the student, or any criterion under the official admission brochure."],
    },
    {
        head: "University & external decisions (outside OneLeet's control)",
        items: ["Cancellation of the exam; change of syllabus, pattern, seat matrix or seat count.", "Counselling cancellation, admission-rule / government / reservation-policy changes.", "University technical issues, server outages or delays."],
    },
    {
        head: "Misconduct (voids the reward)",
        items: ["Account sharing or selling access; leaking / illegally sharing premium content or notes.", "Using multiple unauthorised devices, bypassing platform security, or using bots / automated tools."],
    },
    {
        head: "Personal reasons (no refund)",
        items: ["Changed mind, joined another coaching, stopped studying, got busy or got a job.", "Family issues or lack of internet access."],
    },
];

// Protections OneLeet reserves.
export const PROTECTIONS = [
    { head: "Force majeure", body: "No refund obligation arising solely from events outside OneLeet's reasonable control: natural disasters, war, internet outages or widespread government restrictions affecting the examination." },
    { head: "Single attempt", body: "The Success Promise applies only to the single examination attempt associated with the purchased course, unless stated otherwise on the course page." },
    { head: "Data authenticity", body: "Providing forged or altered documents immediately and permanently voids the Success Promise." },
    { head: "Interpretation", body: "Where there is any ambiguity, the official university notification and admission brochure prevail over any interpretation on OneLeet." },
];

// How a valid reward is claimed.
export const CLAIM_PROCESS = [
    "Apply through the official OneLeet refund process within the defined window after the counselling result (15 to 30 days, as stated at checkout).",
    "Submit your official scorecard, official rank card, official counselling result and (if applicable) admission letter, plus identity proof matching your OneLeet account.",
    "Approved rewards are paid to the original payment method / registered payer only.",
];

// Terms of Service — concise, protective.
export const TERMS_OF_SERVICE = [
    { head: "Your account", body: "You must give accurate details, keep your login secure, and use OneLeet on a single authorised device. One account is for one student. Sharing, reselling or transferring access is prohibited and may void the Success Promise and terminate access without refund." },
    { head: "What you get", body: "A paid membership unlocks the full premium content for your selected course for the stated validity period, including future updates for that exam during the cycle. Free features remain available to everyone." },
    { head: "Content & IP", body: "All content is owned by or licensed to OneLeet and is for your personal preparation only. Copying, recording, redistributing, leaking or commercially using any content is strictly prohibited and monitored." },
    { head: "Acceptable use", body: "No bots, scraping, automated tools, security bypassing, or use of multiple unauthorised devices. OneLeet may suspend or terminate accounts that violate these terms." },
    { head: "Availability", body: "We aim for high availability but do not guarantee uninterrupted service. Features may change, improve or be withdrawn as the product evolves." },
    { head: "Liability", body: "OneLeet's total liability for any claim is limited to the fee paid for the relevant course. OneLeet is an independent preparation platform and is not affiliated with, nor responsible for the decisions of, any university or examination authority." },
    { head: "Governing law", body: "These terms are governed by the laws of India; courts at the company's registered seat have jurisdiction, subject to applicable consumer-protection law." },
];

// No-Refund policy — refunds ONLY via the Success Promise.
export const REFUND_POLICY = [
    "All course purchases are final. OneLeet does not offer refunds except strictly under the Success Promise, and only when every eligibility condition is met and no void condition applies.",
    "No refund is due for change of mind, discontinued use, dissatisfaction, duplicate purchase caused by user error, or any personal reason listed in the Success Promise.",
    "Discounts, coupons and referral benefits are promotional, non-transferable and hold no cash value.",
];
