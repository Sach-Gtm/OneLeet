import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import {
    Loader2, ArrowLeft, ArrowRight, ScrollText, GraduationCap, Building2, TrendingUp,
    FileText, Lock, CheckCircle2, ExternalLink, CalendarDays, ClipboardList, Target, Compass,
} from "lucide-react";
import {
    getExamOverview, getExamPattern, getExamSyllabus, getExamSeatMatrix, getExamCutoffs, getExamPyqs,
} from "@/Api/PublicApi";
import { useSeo } from "@/lib/useSeo";

// A light section shell with an anchor id (for the mega-menu deep-links). `icon`
// is a rendered element (matching the codebase's Section convention).
function Section({ id, icon, title, children, action }) {
    return (
        <section id={id} className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                        {icon}
                    </span>
                    {title}
                </h2>
                {action}
            </div>
            {children}
        </section>
    );
}

const SignInLink = ({ children }) => (
    <Link to="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
        {children} <ArrowRight size={14} />
    </Link>
);

// Public teaser for the college predictor: a visitor enters a rank, and we invite
// them to create a free account to see the full predicted-college list (the
// engine + cut-off data live behind login; premium unlocks the complete list).
function RankPredictorTeaser({ examName }) {
    const [rank, setRank] = useState("");
    const [submitted, setSubmitted] = useState(false);
    return (
        <div>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                Enter a target rank to see which {examName} colleges it could get you.
            </p>
            <form
                onSubmit={(e) => { e.preventDefault(); if (rank) setSubmitted(true); }}
                className="flex flex-wrap items-center gap-2"
            >
                <input
                    type="number"
                    min="1"
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    placeholder="Your expected rank"
                    className="h-10 w-44 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                />
                <button type="submit" className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">
                    <Target size={15} /> Predict
                </button>
            </form>
            {submitted && (
                <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm dark:border-indigo-500/25 dark:bg-indigo-500/10">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                        Good news, a rank around {Number(rank).toLocaleString("en-IN")} opens up several {examName} colleges.
                    </p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">
                        Create a free account to see the full college × branch list for your rank, backed by real
                        previous-year cut-offs.
                    </p>
                    <Link to="/register" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                        See my colleges, free <ArrowRight size={15} />
                    </Link>
                </div>
            )}
        </div>
    );
}

function PatternSection({ p }) {
    const facts = [
        ["Conducting body", p.conductingBody],
        ["Mode", p.examMode],
        ["Duration", p.duration],
        ["Questions", p.totalQuestions],
        ["Total marks", p.totalMarks],
        ["Marking", p.markingCorrect != null ? `+${p.markingCorrect}${p.markingNegative ? ` / ${p.markingNegative}` : ""}` : null],
    ].filter(([, v]) => v !== null && v !== undefined && v !== "");
    return (
        <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {facts.map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{k}</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">{v}</p>
                    </div>
                ))}
            </div>
            {p.sections?.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[420px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-700">
                                <th className="py-2 pr-4 font-semibold">Section</th>
                                <th className="py-2 pr-4 font-semibold">Subjects</th>
                                <th className="py-2 pr-4 font-semibold">Qs</th>
                                <th className="py-2 font-semibold">Marks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {p.sections.map((s, i) => (
                                <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                                    <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-200">{s.name}</td>
                                    <td className="py-2 pr-4 text-slate-500">{Array.isArray(s.subjects) ? s.subjects.join(", ") : s.subjects}</td>
                                    <td className="py-2 pr-4 text-slate-500">{s.questions}</td>
                                    <td className="py-2 text-slate-500">{s.marks}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {(p.importantDates || p.officialWebsite) && (
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    {p.importantDates && (
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                            <CalendarDays size={14} /> {p.importantDates}
                        </span>
                    )}
                    {p.officialWebsite && (
                        <a href={p.officialWebsite} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                            Official website <ExternalLink size={13} />
                        </a>
                    )}
                </div>
            )}
        </>
    );
}

// Keyed by code so switching exams remounts and resets state cleanly (no
// synchronous setState in the effect just to clear the previous exam).
export default function ExamDetail() {
    const { code } = useParams();
    return <ExamDetailInner key={code} code={code} />;
}

function ExamDetailInner({ code }) {
    const [overview, setOverview] = useState(undefined); // undefined=loading, null=not found
    const [pattern, setPattern] = useState(null);
    const [syllabus, setSyllabus] = useState([]);
    const [seat, setSeat] = useState(null);
    const [cutoffs, setCutoffs] = useState(null);
    const [pyqs, setPyqs] = useState([]);

    useEffect(() => {
        let alive = true;
        getExamOverview(code).then((ov) => {
            if (!alive) return;
            setOverview(ov);
            if (!ov) return;
            if (ov.has.pattern) getExamPattern(code).then((d) => alive && setPattern(d));
            if (ov.has.syllabus) getExamSyllabus(code).then((d) => alive && setSyllabus(d));
            if (ov.has.seatMatrix) getExamSeatMatrix(code).then((d) => alive && setSeat(d));
            if (ov.has.cutoffs) getExamCutoffs(code).then((d) => alive && setCutoffs(d));
            if (ov.has.pyqs) getExamPyqs(code).then((d) => alive && setPyqs(d));
        });
        return () => { alive = false; };
    }, [code]);

    // Deep-link scroll: the EXAMS mega-menu links to /exams/:code#seats etc. Content
    // loads async, so scroll to the target section once it has actually rendered.
    const { hash } = useLocation();
    const scrolledTo = useRef(null);
    useEffect(() => {
        if (!hash) return;
        if (scrolledTo.current === hash) return;
        const el = document.getElementById(hash.slice(1));
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            scrolledTo.current = hash;
        }
    }, [hash, overview, pattern, syllabus, seat, cutoffs, pyqs]);

    useSeo({
        title: overview?.exam ? `${overview.exam.name}: Pattern, Eligibility, Syllabus & Cut-offs | OneLeet` : "LEET Exam: Pattern, Eligibility & Cut-offs | OneLeet",
        description: overview?.exam ? `${overview.exam.name}: exam pattern, eligibility, syllabus, seat matrix, previous-year cut-offs and sample papers: everything a diploma student needs, free.` : "Explore LEET / lateral-entry exam details: pattern, eligibility, syllabus, seats and previous-year cut-offs, free on OneLeet.",
        path: `/exams/${code}`,
    });

    if (overview === undefined) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }
    if (overview === null) {
        return (
            <div className="mx-auto max-w-2xl px-4 pt-32 text-center">
                <ScrollText className="mx-auto h-10 w-10 text-slate-300" />
                <h1 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-100">We don&apos;t cover that exam yet</h1>
                <Link to="/exams" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                    <ArrowLeft size={15} /> All exams
                </Link>
            </div>
        );
    }

    const { exam, has } = overview;
    const nav = [
        has.pattern && ["pattern", "Pattern"],
        has.eligibility && ["eligibility", "Eligibility"],
        has.syllabus && ["syllabus", "Syllabus"],
        has.seatMatrix && ["seats", "Seat matrix"],
        has.cutoffs && ["cutoffs", "Cut-offs"],
        has.cutoffs && ["predictor", "Rank predictor"],
        has.pyqs && ["pyqs", "Sample PYQs"],
        ["counselling", "Counselling"],
    ].filter(Boolean);

    return (
        <div className="mx-auto max-w-4xl px-4 pb-20 pt-28 sm:pt-32">
            <Link to="/exams" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                <ArrowLeft size={15} /> All exams
            </Link>

            {/* Hero */}
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200">{exam.group}</p>
                <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{exam.name}</h1>
                <p className="mt-2 max-w-2xl text-sm text-indigo-100">
                    Everything you need to plan for {exam.name}, free to explore. Enroll in the batch when
                    you&apos;re ready for ranked mocks and the full paper archive.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                    <Link to="/courses" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50">
                        <GraduationCap size={16} /> See the batch
                    </Link>
                </div>
            </div>

            {/* In-page nav */}
            {nav.length > 0 && (
                <div className="sticky top-20 z-20 mt-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white/90 p-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
                    {nav.map(([id, label]) => (
                        <a key={id} href={`#${id}`} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                            {label}
                        </a>
                    ))}
                </div>
            )}

            <div className="mt-6 space-y-5">
                {has.pattern && pattern && (
                    <Section id="pattern" icon={<ClipboardList size={16} />} title="Exam pattern">
                        <PatternSection p={pattern} />
                    </Section>
                )}

                {has.eligibility && pattern?.eligibility && (
                    <Section id="eligibility" icon={<CheckCircle2 size={16} />} title="Eligibility">
                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">{pattern.eligibility}</p>
                    </Section>
                )}

                {has.syllabus && (
                    <Section id="syllabus" icon={<ScrollText size={16} />} title="Syllabus"
                        action={<SignInLink>Sign in to track</SignInLink>}>
                        <div className="space-y-3">
                            {syllabus.map((s) => (
                                <div key={s._id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{s.title}</p>
                                        {s.locked && <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400"><Lock size={12} /> Premium</span>}
                                    </div>
                                    {s.locked ? (
                                        <p className="mt-1 text-xs text-slate-400">Full chapter list is part of the premium batch.</p>
                                    ) : (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {s.chapters.map((ch, i) => (
                                                <span key={i} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{ch.title}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {has.seatMatrix && seat && (
                    <Section id="seats" icon={<Building2 size={16} />} title="Seat matrix"
                        action={<SignInLink>Full college-wise seats</SignInLink>}>
                        <div className="mb-3 flex flex-wrap gap-4 text-sm">
                            {seat.totalSeats ? <span className="text-slate-500"><b className="text-slate-800 dark:text-slate-100">{seat.totalSeats}</b> seats</span> : null}
                            <span className="text-slate-500"><b className="text-slate-800 dark:text-slate-100">{seat.colleges?.length || 0}</b> colleges</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {(seat.colleges || []).slice(0, 24).map((c, i) => (
                                <span key={i} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{c.name}</span>
                            ))}
                            {(seat.colleges?.length || 0) > 24 && <span className="text-xs text-slate-400">+{seat.colleges.length - 24} more</span>}
                        </div>
                    </Section>
                )}

                {has.cutoffs && cutoffs && (
                    <Section id="cutoffs" icon={<TrendingUp size={16} />} title="Previous-year cut-offs"
                        action={<SignInLink>Round-wise ranks</SignInLink>}>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {cutoffs.rounds?.length || 0} counselling round{(cutoffs.rounds?.length || 0) === 1 ? "" : "s"} of closing ranks published. Sign in for the full college × branch × category table, or try the rank predictor.
                        </p>
                    </Section>
                )}

                {has.cutoffs && (
                    <Section id="predictor" icon={<Target size={16} />} title="Rank predictor">
                        <RankPredictorTeaser examName={exam.name} />
                    </Section>
                )}

                <Section id="counselling" icon={<Compass size={16} />} title="Counselling"
                    action={<SignInLink>Get counselling help</SignInLink>}>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Choice-filling order, document checklist, round-by-round strategy and freeze
                        vs float. Counselling can make or break your seat. Enrolled students get a
                        step-by-step counselling guide and, on the premium batch, 1:1 guidance during
                        the process.
                    </p>
                </Section>

                {has.pyqs && (
                    <Section id="pyqs" icon={<FileText size={16} />} title="Sample past papers"
                        action={<SignInLink>Sign in to download</SignInLink>}>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {pyqs.map((p) => (
                                <div key={p._id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.title}</p>
                                        <p className="text-xs text-slate-400">{p.year} · {p.subject}</p>
                                    </div>
                                    <Lock size={14} className="shrink-0 text-slate-300" />
                                </div>
                            ))}
                        </div>
                    </Section>
                )}
            </div>

            {/* Colleges + CTA */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Link to="/colleges" className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Colleges you can reach</p>
                        <p className="text-xs text-slate-400">See the flagship colleges lateral entry opens up.</p>
                    </div>
                    <ArrowRight size={16} className="shrink-0 text-indigo-400 transition group-hover:translate-x-0.5" />
                </Link>
                <Link to="/courses" className="group flex items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 transition hover:shadow-md dark:border-indigo-500/30 dark:bg-indigo-500/10">
                    <div>
                        <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200">Ready to start?</p>
                        <p className="text-xs text-indigo-600/80 dark:text-indigo-300/80">Enroll in the batch, free to join.</p>
                    </div>
                    <ArrowRight size={16} className="shrink-0 text-indigo-500 transition group-hover:translate-x-0.5" />
                </Link>
            </div>
        </div>
    );
}
