import { useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, Plus, ChevronDown } from "lucide-react";
import { LEET_FAQ, faqJsonLd } from "@/data/faq";

// Home-page FAQ (sits at the bottom of the landing page). Shows the first three
// questions and reveals the rest on "Show all", so it never fills the screen.
// SEO: real crawlable Q&A in semantic <details>, plus FAQPage JSON-LD, plus
// crawlable internal links into the pre-rendered /leet hub. Answers target the
// queries diploma students actually search (lateral entry after diploma,
// eligibility, best colleges, coaching, state-wise B.Tech colleges).
const INITIAL = 3;

// Links into the pre-rendered /leet pages are real static files (served outside
// the SPA), so they use <a> for a real navigation; the /courses SPA route uses
// <Link>. Both render a crawlable <a href> either way.
const EXPLORE = [
    { href: "/leet/eligibility/", label: "Eligibility" },
    { href: "/leet/syllabus/", label: "Syllabus" },
    { href: "/leet/previous-year-papers/", label: "Previous papers" },
    { href: "/leet/mock-tests/", label: "Mock tests" },
    { href: "/leet/colleges/", label: "Colleges" },
    { to: "/courses", label: "Batches" },
];

function FaqItem({ q, a }) {
    return (
        <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[15px] font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
                <span>{q}</span>
                <Plus size={18} className="shrink-0 text-indigo-500 transition-transform duration-200 group-open:rotate-45" />
            </summary>
            <p className="-mt-1 pb-4 text-sm leading-relaxed text-slate-600">{a}</p>
        </details>
    );
}

export default function HomeFaq() {
    const [showAll, setShowAll] = useState(false);
    const visible = showAll ? LEET_FAQ : LEET_FAQ.slice(0, INITIAL);

    return (
        <section aria-labelledby="faq-heading" className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
            {/* FAQPage structured data, always in sync with the questions above. */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }} />

            <div className="mb-6 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    <HelpCircle size={13} /> LEET &amp; lateral entry
                </span>
                <h2 id="faq-heading" className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                    Frequently asked questions
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
                    Straight answers on lateral entry after diploma, eligibility, the best colleges and coaching for LEET.
                </p>
            </div>

            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 sm:px-6">
                {visible.map((f) => (
                    <FaqItem key={f.q} q={f.q} a={f.a} />
                ))}
            </div>

            {!showAll && (
                <div className="mt-5 text-center">
                    <button
                        onClick={() => setShowAll(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
                    >
                        Show all {LEET_FAQ.length} questions
                        <ChevronDown size={15} />
                    </button>
                </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Explore</span>
                {EXPLORE.map((e) =>
                    e.to ? (
                        <Link
                            key={e.label}
                            to={e.to}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
                        >
                            {e.label}
                        </Link>
                    ) : (
                        <a
                            key={e.label}
                            href={e.href}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
                        >
                            {e.label}
                        </a>
                    )
                )}
            </div>
        </section>
    );
}
