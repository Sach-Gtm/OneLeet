// Single source of truth for OneLeet Premium Membership pricing — the pricing
// page, cart and checkout all read from here. Prices are the founder's
// launch numbers; `mrp` is the struck-through original, `price` the early-bird
// launch offer. `successPromise` is a SHORT summary shown on the card; the full
// legal Success Promise + Terms live on their own page (needs advocate sign-off).
//
// slug must match the enrollable Course in the DB so "Get access" can deep-link.

// ── CET-exam batches (full membership) — IPU leads, then the rest ──
export const EXAM_COURSES = [
    {
        slug: "ipu-leet-2027-foundation",
        code: "ipu-leet",
        name: "IPU LEET",
        subtitle: "GGSIPU lateral entry",
        price: 999,
        mrp: 8999,
        featured: true,
        promise:
            "Refund policy: if you don't score and secure the promised admission (a top-6 IPU college for a CSE-family branch, or a top-3 college for other branches), you get your fee refunded. For details, connect on WhatsApp Business.",
    },
    { slug: "dtu-nsut-leet-2027-foundation", code: "dtu-nsut-leet", name: "DTU / NSUT LEET", subtitle: "Delhi lateral entry", price: 799, mrp: 7999,
      promise: "Top-10 rank → 100% back. Admission on any seat → 60% back." },
    { slug: "bihar-leet-2027", code: "bihar-leet", name: "Bihar LEET", subtitle: "BCECE-LE", price: 699, mrp: 4999,
      promise: "Admission in a top-2 college (MIT Muzaffarpur / BCE Bhagalpur) → 50% back." },
    { slug: "haryana-leet-2027", code: "haryana-leet", name: "Haryana LEET", subtitle: "HSTES", price: 999, mrp: 8999,
      promise: "Admission in YMCA → 50% back. Top-50 rank (not YMCA) → 30% back." },
    { slug: "up-leet-2027", code: "up-leet", name: "CUET / UP LEET", subtitle: "AKTU lateral entry", price: 1499, mrp: 12999,
      promise: "Top-10 rank → 100% back. Admission in a top-3 college → 40% back." },
    { slug: "gujarat-d2d-2027", code: "gujarat-d2d", name: "Gujarat LEET", subtitle: "ACPDC D2D", price: 599, mrp: 9999,
      promise: "Performance-based Success Reward — see the full terms." },
    { slug: "sliet-leet-2027", code: "sliet-leet", name: "SLIET LEET", subtitle: "Longowal", price: 999, mrp: 8999,
      promise: "Performance-based Success Reward — see the full terms." },
];

// ── Counselling & Interview-prep only (these colleges admit via interview, not a
//    written LEET, so there's no exam course — just counselling + interview prep) ──
export const COUNSELLING_COURSES = [
    { slug: "igdtuw-counselling", name: "IGDTUW", subtitle: "Counselling & interview prep", price: 399 },
    { slug: "bit-mesra-counselling", name: "BIT Mesra", subtitle: "Counselling & interview prep", price: 199 },
    { slug: "dseu-counselling", name: "DSEU", subtitle: "Counselling & interview prep", price: 49 },
];

// Counselling-only add-on for an exam college = 20% of that course's price.
export const COUNSELLING_ONLY_RATE = 0.2;
export const counsellingOnlyPrice = (coursePrice) => Math.round((coursePrice * COUNSELLING_ONLY_RATE) / 10) * 10;

// ── Multi-course cart discount: the more batches, the bigger the extra % off ──
export const CART_TIERS = [
    { count: 2, off: 20 },
    { count: 3, off: 30 },
    { count: 4, off: 40 },
    { count: 5, off: 50 }, // 5 or more
];
export const cartExtraOff = (n) => {
    if (n >= 5) return 50;
    const t = [...CART_TIERS].reverse().find((x) => n >= x.count);
    return t ? t.off : 0;
};

// The tier % applies to the WHOLE cart subtotal, but the rupee discount is
// capped at ₹DISCOUNT_CAP (the margin protector — founder's call).
export const DISCOUNT_CAP = 1000;
// Split Payment (pay in two) costs this % more than paying once — shown at
// checkout so the total is never a surprise. Mirrors the server.
export const SPLIT_SURCHARGE = 30;
export const computeCart = (items = []) => {
    const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0), 0);
    const pct = cartExtraOff(items.length);
    const rawDiscount = Math.round((subtotal * pct) / 100);
    const discount = Math.min(rawDiscount, DISCOUNT_CAP);
    return { subtotal, pct, rawDiscount, discount, capped: rawDiscount > discount, total: subtotal - discount };
};

// ── OneLeet Premium Membership — the pitch, kept short so students actually read
//    it. Each group is one line + a few chips. (Full feature detail lives inside.) ──
export const MEMBERSHIP_GROUPS = [
    { icon: "sparkles", title: "AI Personal Mentor", tag: "Your USP", items: ["Doubt solver", "Explains wrong answers", "Study & revision planner", "Weak-topic detection", "Interview prep"] },
    { icon: "book", title: "Complete Master Course", items: ["Chapter notes", "Short notes & formula sheets", "Mind maps", "Concept revision", "PYQ discussions", "Assignment sets"] },
    { icon: "clipboard", title: "Complete Test Series", items: ["Chapter / topic / weekly tests", "Full-length mocks", "PYP & exam-pattern tests", "Unlimited practice"] },
    { icon: "files", title: "Official PYQ Library", items: ["Year / subject / topic-wise", "Official keys & solutions", "Difficulty tags", "FAQs"] },
    { icon: "chart", title: "Smart Analytics", items: ["Daily & weekly progress", "Accuracy & speed", "Strong / weak topics", "AI suggestions"] },
    { icon: "target", title: "Rank & College Predictor Pro", items: ["Expected rank & trends", "Round & category-wise", "Safe / dream / backup colleges"] },
    { icon: "compass", title: "Counselling Hub", items: ["Process & key dates", "Documents & choice-filling", "Freeze / float guide", "Round updates"] },
    { icon: "users", title: "Live Sessions & Mentor Support", items: ["Live classes & doubt sessions", "1:1 / 1:M mentorship", "Premium WhatsApp support — 6-hour response", "Career & college guidance", "Premium community"] },
];

// Kept FREE (SEO + trust): what anyone can see without paying.
export const FREE_FEATURES = [
    "Exam pattern, eligibility & syllabus", "Seat matrix & previous-year cut-offs",
    "Basic college info & important dates", "20–30 free PYQs", "2 free mock tests",
    "2–3 sample videos", "Demo AI, dashboard & rank predictor",
];

// The one-line promise the membership makes (shown at the top of the page).
export const MEMBERSHIP_PROMISE = [
    "Complete LEET preparation", "AI personal mentor", "Premium PYQs & mock series",
    "Rank & College Predictor Pro", "Counselling support", "Mentor community",
    "Performance analytics", "Personalised study plan", "Future updates for your exam",
];
