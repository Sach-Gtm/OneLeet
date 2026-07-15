// ---------------------------------------------------------------------------
// OneLeet SEO data model.
//
// This is the single source of truth for the programmatic landing pages. Every
// page is generated from these structures, so growing the site's topical
// coverage is a matter of adding entries here — not hand-writing HTML.
//
// EDITORIAL RULE (important): OneLeet is a *preparation* platform, not an
// official exam board. So the copy focuses on what we can state accurately and
// evergreen — what LEET / lateral entry is, who is generally eligible, the
// subjects usually tested, how to prepare, and the opportunities a diploma
// holder unlocks. Anything that changes year to year (exact dates, fees, seat
// matrices, cut-offs) is deliberately NOT hard-coded; pages point students to
// the official notification instead. That keeps us useful and honest.
// ---------------------------------------------------------------------------

export const BASE = "https://www.oneleet.in";
export const BRAND = "OneLeet";
export const APP_REGISTER = `${BASE}/register`;

// States / UTs where diploma holders pursue lateral entry into B.Tech / B.E.
// `authority` is only filled where it is well-established; where it varies or
// we are not certain, it stays null and the page uses neutral, evergreen copy.
export const STATES = [
    { slug: "bihar", name: "Bihar", authority: "Bihar Combined Entrance Competitive Examination Board (BCECEB)", exam: "DCECE (Lateral Entry)", featured: true },
    { slug: "uttar-pradesh", name: "Uttar Pradesh", authority: "Joint Entrance Examination Council, Uttar Pradesh (JEECUP)", exam: "JEECUP Lateral Entry", featured: true },
    { slug: "delhi", name: "Delhi", authority: null, exam: "CET / lateral entry counselling", featured: true },
    { slug: "haryana", name: "Haryana", authority: null, exam: "lateral entry counselling", featured: true },
    { slug: "punjab", name: "Punjab", authority: "I. K. Gujral Punjab Technical University", exam: "PTU LEET", featured: true },
    { slug: "rajasthan", name: "Rajasthan", authority: null, exam: "lateral entry counselling", featured: true },
    { slug: "madhya-pradesh", name: "Madhya Pradesh", authority: null, exam: "lateral entry counselling", featured: true },
    { slug: "maharashtra", name: "Maharashtra", authority: "State CET Cell, Maharashtra", exam: "DSE (Direct Second Year Engineering)", featured: true },
    { slug: "gujarat", name: "Gujarat", authority: "Admission Committee for Professional Courses (ACPC)", exam: "D2D (Diploma to Degree)", featured: true },
    { slug: "himachal-pradesh", name: "Himachal Pradesh", authority: null, exam: "lateral entry counselling" },
    { slug: "uttarakhand", name: "Uttarakhand", authority: null, exam: "lateral entry counselling" },
    { slug: "jammu-kashmir", name: "Jammu & Kashmir", authority: null, exam: "lateral entry counselling" },
    { slug: "jharkhand", name: "Jharkhand", authority: "Jharkhand Combined Entrance Competitive Examination Board (JCECEB)", exam: "lateral entry counselling" },
    { slug: "chhattisgarh", name: "Chhattisgarh", authority: null, exam: "lateral entry counselling" },
    { slug: "west-bengal", name: "West Bengal", authority: "West Bengal Joint Entrance Examinations Board (WBJEEB)", exam: "JELET" },
    { slug: "odisha", name: "Odisha", authority: null, exam: "lateral entry counselling" },
    { slug: "telangana", name: "Telangana", authority: null, exam: "ECET" },
    { slug: "andhra-pradesh", name: "Andhra Pradesh", authority: null, exam: "AP ECET" },
    { slug: "karnataka", name: "Karnataka", authority: null, exam: "Diploma CET" },
    { slug: "tamil-nadu", name: "Tamil Nadu", authority: null, exam: "lateral entry counselling" },
    { slug: "kerala", name: "Kerala", authority: null, exam: "lateral entry counselling" },
    { slug: "assam", name: "Assam", authority: null, exam: "lateral entry counselling" },
];

// Commonly-tested subject areas. Exact weightage varies by state — the copy is
// written to teach the concepts, which is what a LEET aspirant actually needs.
export const SUBJECTS = [
    {
        slug: "mathematics", name: "Mathematics", short: "Maths", core: true,
        blurb: "the highest-scoring and most predictable section in almost every LEET / lateral-entry paper",
        topics: [
            "Matrices and Determinants", "Differential Calculus", "Integral Calculus",
            "Differential Equations", "Vectors", "Probability and Statistics",
            "Complex Numbers", "Coordinate Geometry", "Trigonometry", "Sequences and Series",
        ],
    },
    {
        slug: "physics", name: "Physics", core: true,
        blurb: "the section that rewards clear fundamentals over rote learning",
        topics: [
            "Units and Measurement", "Kinematics", "Laws of Motion", "Work, Energy and Power",
            "Electrostatics", "Current Electricity", "Ray and Wave Optics", "Thermodynamics",
            "Oscillations and Waves", "Modern Physics",
        ],
    },
    {
        slug: "chemistry", name: "Chemistry", core: true,
        blurb: "a scoring section once you lock in the reactions and formulae",
        topics: [
            "Atomic Structure", "Chemical Bonding", "States of Matter", "Thermochemistry",
            "Electrochemistry", "Basics of Organic Chemistry", "Periodic Classification",
            "Acids, Bases and Salts", "Metals and Non-metals", "Polymers",
        ],
    },
    {
        slug: "engineering-mechanics", name: "Engineering Mechanics", core: true,
        blurb: "a diploma-level strength that many aspirants underestimate",
        topics: [
            "Force Systems", "Equilibrium of Rigid Bodies", "Friction", "Centroid and Centre of Gravity",
            "Moment of Inertia", "Simple Machines", "Stress and Strain", "Trusses and Frames",
        ],
    },
    {
        slug: "basic-electrical-engineering", name: "Basic Electrical Engineering", core: true,
        blurb: "familiar ground for most polytechnic diploma students",
        topics: [
            "Ohm's Law", "Kirchhoff's Laws", "AC Fundamentals", "Network Theorems",
            "Electromagnetism", "Measuring Instruments",
        ],
    },
    {
        slug: "communication-english", name: "Communication & English", core: false,
        blurb: "quick, near-guaranteed marks if you practise a little",
        topics: [
            "Reading Comprehension", "Grammar and Usage", "Vocabulary", "Sentence Correction",
            "Synonyms and Antonyms", "Error Spotting",
        ],
    },
    {
        slug: "general-aptitude", name: "General Aptitude & Reasoning", core: false,
        blurb: "a section you can train to solve fast under time pressure",
        topics: [
            "Number Systems", "Percentages and Ratios", "Time, Speed and Distance",
            "Logical Reasoning", "Series and Analogies", "Data Interpretation",
        ],
    },
    {
        slug: "computer-fundamentals", name: "Computer Fundamentals", core: false,
        blurb: "an easy edge for CSE/IT diploma holders",
        topics: [
            "Number Systems and Codes", "Boolean Algebra", "Basics of Programming",
            "Operating System Basics", "Computer Networks Basics", "DBMS Basics",
        ],
    },
];

// Institutions students commonly target through lateral entry. Names are real;
// the page content is evergreen prep guidance (it never invents seat matrices or
// cut-offs). `img` maps to the assets already shipped under /public/colleges.
export const COLLEGES = [
    { slug: "dtu-delhi", name: "Delhi Technological University (DTU)", city: "Delhi", img: "dtu.webp" },
    { slug: "nsut-delhi", name: "Netaji Subhas University of Technology (NSUT)", city: "Delhi", img: "nsut.jpg" },
    { slug: "ggsipu-delhi", name: "Guru Gobind Singh Indraprastha University (GGSIPU)", city: "Delhi", img: "ipu.jpg" },
    { slug: "mait-delhi", name: "Maharaja Agrasen Institute of Technology (MAIT)", city: "Delhi", img: "mait.jpg" },
    { slug: "msit-delhi", name: "Maharaja Surajmal Institute of Technology (MSIT)", city: "Delhi", img: "msit.jpg" },
    { slug: "usar-delhi", name: "University School of Automation & Robotics (USAR)", city: "Delhi", img: "usar.webp" },
    { slug: "thapar-patiala", name: "Thapar Institute of Engineering & Technology", city: "Patiala", img: "thapar.webp" },
    { slug: "sliet-longowal", name: "Sant Longowal Institute of Engineering & Technology (SLIET)", city: "Longowal", img: "sliet.jpg" },
    { slug: "coep-pune", name: "COEP Technological University", city: "Pune", img: "coep.jpg" },
    { slug: "vjti-mumbai", name: "Veermata Jijabai Technological Institute (VJTI)", city: "Mumbai", img: "vjti.jpg" },
    { slug: "mit-pune", name: "MIT World Peace University", city: "Pune", img: "mitpune.jpg" },
    { slug: "makaut-wb", name: "Maulana Abul Kalam Azad University of Technology (MAKAUT)", city: "West Bengal", img: "makaut.jpg" },
    { slug: "jadavpur-university", name: "Jadavpur University", city: "Kolkata", img: "ju.jpg" },
    { slug: "bit-mesra", name: "Birla Institute of Technology, Mesra", city: "Ranchi", img: "bitmesra.jpg" },
    { slug: "bit-sindri", name: "BIT Sindri", city: "Dhanbad", img: "bitsindri.jpg" },
    { slug: "hbtu-kanpur", name: "Harcourt Butler Technical University (HBTU)", city: "Kanpur", img: "hbtu.jpg" },
    { slug: "aktu-lucknow", name: "Dr. A.P.J. Abdul Kalam Technical University (AKTU)", city: "Lucknow", img: "aktu.jpg" },
    { slug: "ldce-ahmedabad", name: "L. D. College of Engineering", city: "Ahmedabad", img: "ldce.jpg" },
    { slug: "ymca-faridabad", name: "J. C. Bose University of Science & Technology, YMCA", city: "Faridabad", img: "ymca.jpg" },
    { slug: "manipal-mit", name: "Manipal Institute of Technology", city: "Manipal", img: "manipal.jpg" },
    { slug: "vit-vellore", name: "Vellore Institute of Technology (VIT)", city: "Vellore", img: "vit.webp" },
    { slug: "mit-muzaffarpur", name: "Muzaffarpur Institute of Technology (MIT Muzaffarpur)", city: "Muzaffarpur", img: "mitmuz.jpg" },
    { slug: "bce-bhagalpur", name: "Bhagalpur College of Engineering", city: "Bhagalpur", img: "bce.jpg" },
];

// Long-form guides (the "blog"/topical-authority layer). Sections are rendered
// as H2/H3 with real, evergreen advice.
export const GUIDES = [
    {
        slug: "what-is-leet-lateral-entry",
        title: "What is LEET? Lateral Entry into B.Tech explained",
        desc: "A plain-English guide to the Lateral Entry Entrance Test (LEET): what it is, who can apply after a diploma, and how you get directly into the 2nd year of B.Tech.",
        intent: "Understand the exam from zero.",
    },
    {
        slug: "bihar-leet-opportunity-after-diploma",
        title: "Bihar LEET: your opportunity after a diploma",
        desc: "Finished a polytechnic diploma in Bihar? Here's how lateral entry (LEET) lets you skip straight into the 2nd year of B.Tech, the branches you can choose, and how to prepare.",
        intent: "The flagship Bihar after-diploma opportunity page.",
    },
    {
        slug: "how-to-prepare-for-leet",
        title: "How to prepare for LEET: a step-by-step study plan",
        desc: "A realistic, coaching-free LEET preparation plan built around past papers, exam-pattern mocks and AI practice — for students who are also finishing their diploma.",
        intent: "Preparation methodology.",
    },
    {
        slug: "leet-vs-jee-which-path-after-diploma",
        title: "LEET vs JEE after a diploma: which path is right for you?",
        desc: "Diploma done — should you attempt lateral entry (LEET) or restart with JEE? An honest comparison of time, cost, eligibility and outcomes.",
        intent: "Decision / comparison.",
    },
    {
        slug: "lateral-entry-vs-regular-btech",
        title: "Lateral entry vs regular B.Tech: is the degree the same?",
        desc: "Does a lateral-entry B.Tech carry the same value as a regular four-year degree? What actually differs, what doesn't, and what recruiters see.",
        intent: "Myth-busting / value.",
    },
    {
        slug: "is-lateral-entry-btech-worth-it",
        title: "Is a lateral-entry B.Tech worth it after a diploma?",
        desc: "Career scope, higher studies, government jobs and salary expectations for a diploma holder who upgrades to B.Tech through lateral entry.",
        intent: "Scope / worth-it.",
    },
    {
        slug: "diploma-to-btech-complete-roadmap",
        title: "Diploma to B.Tech: the complete roadmap",
        desc: "Every step from your final diploma semester to a B.Tech seat via lateral entry — eligibility, entrance test, counselling, documents and preparation.",
        intent: "End-to-end roadmap.",
    },
    {
        slug: "leet-syllabus-overview",
        title: "LEET syllabus overview: what to actually study",
        desc: "The subjects and topics most LEET / lateral-entry papers test — Mathematics, Physics, Chemistry and core engineering — and where to focus first.",
        intent: "Syllabus authority.",
    },
    {
        slug: "leet-exam-pattern-and-marking",
        title: "LEET exam pattern & marking: how the paper is set",
        desc: "Question types, section split, duration and negative marking you can generally expect in a LEET / lateral-entry paper, plus how to plan your attempt.",
        intent: "Exam pattern authority.",
    },
    {
        slug: "leet-counselling-and-documents",
        title: "LEET counselling & documents checklist",
        desc: "How lateral-entry counselling and seat allotment usually work, and the documents to keep ready so you don't lose a seat on a technicality.",
        intent: "Counselling process.",
    },
    {
        slug: "best-books-for-leet-preparation",
        title: "Best books & resources for LEET preparation",
        desc: "How to choose LEET books, why past papers beat thick guides, and how to combine notes, mocks and AI practice for faster revision.",
        intent: "Resources.",
    },
    {
        slug: "how-to-choose-your-btech-branch",
        title: "How to choose your B.Tech branch after lateral entry",
        desc: "CSE, ECE, Mechanical, Civil or your diploma trade? How to pick a lateral-entry B.Tech branch that fits your diploma and your goals.",
        intent: "Branch selection.",
    },
    {
        slug: "common-mistakes-in-leet-preparation",
        title: "7 common mistakes in LEET preparation (and how to avoid them)",
        desc: "The avoidable errors that cost diploma students marks and ranks in LEET — from ignoring past papers to skipping mock analysis.",
        intent: "Mistakes / engagement.",
    },
    {
        slug: "leet-preparation-without-coaching",
        title: "How to crack LEET without expensive coaching",
        desc: "A self-study blueprint for LEET using free past papers, structured notes, exam-pattern mocks and an AI coach — no costly classes required.",
        intent: "No-coaching angle.",
    },
    {
        slug: "last-30-days-leet-revision-plan",
        title: "Last 30 days: a LEET revision plan that works",
        desc: "A focused four-week LEET revision plan for the final stretch — what to revise, how many mocks to take, and how to analyse them.",
        intent: "Time-boxed revision.",
    },
];
