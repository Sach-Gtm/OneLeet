import { Sprout, Layers, Target, CalendarClock, PartyPopper } from "lucide-react";

// The LEET prep journey as phases, from the start of the session to exam day.
// Right now (session start) we highlight the first phase as "where you are";
// once exam dates are set (later in the year) this can switch to a live
// countdown that auto-selects the phase — the shape is already built for it.
//
// `color` is a key mapped to Tailwind classes in the components, so the data
// stays presentation-light.
export const PHASES = [
    {
        id: "foundation",
        label: "Foundation",
        window: "Now — you're here",
        current: true,
        icon: Sprout,
        color: "emerald",
        focus: "Cover the syllabus and build a routine you can keep for months.",
        tips: [
            "Go subject-by-subject through the syllabus — tick topics off in the Syllabus tracker as you finish.",
            "Solve 5–10 past-paper questions daily to see how each topic is actually tested.",
            "Build a simple daily routine now — steady work for months beats a last-month panic.",
            "Start an “error log”: note every question you get wrong and the reason why.",
        ],
    },
    {
        id: "build",
        label: "Build",
        window: "~4–2 months to go",
        icon: Layers,
        color: "sky",
        focus: "Finish the syllabus and make mock tests a habit.",
        tips: [
            "Complete full syllabus coverage, then do one clean revision pass.",
            "Take 2–3 full-length mock tests every week and review each one.",
            "Attack your weak subjects now — don't push them to the last month.",
            "Practise PYQs topic-wise to spot the high-frequency questions.",
        ],
    },
    {
        id: "sharpen",
        label: "Sharpen",
        window: "~1 month to go",
        icon: Target,
        color: "indigo",
        focus: "Build speed and accuracy; close your weak gaps.",
        tips: [
            "Alternate full mocks with focused revision of your weakest topics (check Analytics).",
            "Study by marks-weight × your accuracy — spend time where it moves your score most.",
            "Time every section so you're fast and accurate under pressure.",
            "Revise formulas, shortcuts and your error log daily.",
        ],
    },
    {
        id: "final-week",
        label: "Final week",
        window: "Last 7 days",
        icon: CalendarClock,
        color: "amber",
        focus: "Consolidate — revise, don't cram new things.",
        tips: [
            "One timed mock a day, then carefully review every mistake.",
            "Revise short notes, formulas and your error log — no brand-new topics.",
            "Sleep well and shift your routine to match the exam's timing.",
            "Confirm your exam centre, reporting time and documents.",
        ],
    },
    {
        id: "exam-day",
        label: "Exam day",
        window: "The big day",
        icon: PartyPopper,
        color: "rose",
        focus: "Stay calm and execute your plan.",
        tips: [
            "Reach the centre ~45 minutes early with your admit card and photo ID.",
            "Read all instructions and note the marking scheme before you start.",
            "Attempt the questions you're sure of first; be careful with negative marking.",
            "Watch your time per section — don't get stuck on one hard question.",
        ],
    },
];

// Universal, high-leverage things students get wrong. Shown regardless of phase.
export const MISTAKES = [
    {
        title: "Cramming new topics at the end",
        body: "Starting hard, unfamiliar topics right before the exam just shakes your confidence. Revise what you already know.",
    },
    {
        title: "Ignoring negative marking",
        body: "Blind guessing costs marks. Attempt only when you can eliminate options or you're reasonably sure.",
    },
    {
        title: "Only untimed practice",
        body: "If you never practise against the clock, exam-day time pressure will catch you off guard. Simulate the real thing.",
    },
    {
        title: "No error log",
        body: "If you don't track and revisit your mistakes, you'll keep repeating them. Keep a running list and review it.",
    },
    {
        title: "Avoiding weak subjects",
        body: "Practising what you're already good at feels nice but wastes time. Your score grows fastest in your weak areas.",
    },
    {
        title: "Studying by comfort, not weight",
        body: "Give the most time to the sections that carry the most marks — check the paper pattern for the split.",
    },
    {
        title: "Skipping exam-day logistics",
        body: "Not knowing your centre, timing or documents adds needless stress. Sort it out days in advance.",
    },
    {
        title: "Burning out",
        body: "All-nighters and zero rest days wreck your memory and focus. Sleep and breaks are part of the plan, not a reward.",
    },
];

// What to carry to the exam hall. General guidance — always follow whatever the
// admit card specifically states.
export const EXAM_DAY_KIT = [
    "Printed admit card / hall ticket",
    "Original photo ID (Aadhaar / college ID)",
    "2–3 passport-size photographs",
    "Blue / black ballpoint pens",
    "Transparent water bottle",
    "Analog watch (if the centre allows)",
    "Anything your admit card specifically asks you to bring",
];

// Tailwind class sets per phase colour, used by the guide + dashboard card.
// Explicit dark variants because emerald/sky/rose tints aren't remapped by the
// global dark-mode override (only indigo/violet/amber are).
export const PHASE_STYLES = {
    emerald: { chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300", dot: "bg-emerald-500", ring: "ring-emerald-500/30" },
    sky: { chip: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300", dot: "bg-sky-500", ring: "ring-sky-500/30" },
    indigo: { chip: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300", dot: "bg-indigo-500", ring: "ring-indigo-500/30" },
    amber: { chip: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300", dot: "bg-amber-500", ring: "ring-amber-500/30" },
    rose: { chip: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300", dot: "bg-rose-500", ring: "ring-rose-500/30" },
};
