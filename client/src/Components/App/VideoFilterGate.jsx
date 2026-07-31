import { useEffect, useMemo, useState } from "react";
import { X, GraduationCap, ListFilter, BookOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// A video with no targets (or ["all"]) is meant for everyone, so it shows under
// any exam a student picks.
const isUniversal = (v) => !v.targets?.length || v.targets.includes("all");
const inExam = (v, exam) => exam === "all" || isUniversal(v) || (v.targets || []).includes(exam);

// The Videos entry gate: instead of dumping every lecture, students first pick an
// exam (required, when exam-specific videos exist) and, optionally, a subject and
// chapter — landing straight on what's relevant. All options are derived from the
// videos the user can actually see. Staff can skip with "Show all" to manage.
export default function VideoFilterGate({ videos, examList, staff, initial, dismissable, onApply, onClose }) {
    const examMap = useMemo(() => new Map((examList || []).map((e) => [e.code, e.name])), [examList]);

    // Exams that actually have videos for this user (specific targets only).
    const examOptions = useMemo(() => {
        const codes = new Set();
        for (const v of videos || []) for (const t of v.targets || []) if (t && t !== "all") codes.add(t);
        const order = new Map((examList || []).map((e, i) => [e.code, i]));
        return [...codes]
            .sort((a, b) => (order.get(a) ?? 1e9) - (order.get(b) ?? 1e9))
            .map((c) => ({ code: c, name: examMap.get(c) || c }));
    }, [videos, examList, examMap]);

    const examRequired = examOptions.length > 0;
    const [exam, setExam] = useState(initial?.exam && initial.exam !== "all" ? initial.exam : examRequired ? "" : "all");
    const [subject, setSubject] = useState(initial?.subject || "all");
    const [chapter, setChapter] = useState(initial?.chapter || "all");

    // Subjects available for the chosen exam.
    const subjects = useMemo(() => {
        const seen = [];
        for (const v of videos || []) {
            if (!inExam(v, exam || "all")) continue;
            const s = v.subject?.trim() || "General";
            if (!seen.includes(s)) seen.push(s);
        }
        return seen;
    }, [videos, exam]);

    // Effective subject: the picked one if it's still available under this exam,
    // otherwise "all" — derived in render, so no state-syncing effect is needed.
    const effSubject = subject === "all" || subjects.includes(subject) ? subject : "all";

    // Chapters for the chosen exam + subject.
    const chapters = useMemo(() => {
        if (effSubject === "all") return [];
        const seen = [];
        for (const v of videos || []) {
            if (!inExam(v, exam || "all")) continue;
            if ((v.subject?.trim() || "General") !== effSubject) continue;
            const c = v.chapter?.trim();
            if (c && !seen.includes(c)) seen.push(c);
        }
        return seen;
    }, [videos, exam, effSubject]);
    const effChapter = effSubject !== "all" && chapters.includes(chapter) ? chapter : "all";

    useEffect(() => {
        if (!dismissable) return;
        const onKey = (e) => e.key === "Escape" && onClose?.();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose, dismissable]);

    const canApply = !examRequired || !!exam;
    const apply = () => onApply({ exam: exam || "all", subject: effSubject, chapter: effChapter });
    const showAll = () => onApply({ exam: "all", subject: "all", chapter: "all" });
    const showSubjects = subjects.length > 1 || subjects.some((s) => s !== "General");

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={dismissable ? onClose : undefined}
            />
            <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles size={18} />
                            <p className="text-base font-bold">Find your lectures</p>
                        </div>
                        {dismissable && (
                            <button onClick={onClose} className="rounded-md p-1 text-white/80 hover:bg-white/15" aria-label="Close">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                    <p className="mt-0.5 text-xs text-white/80">
                        {examRequired
                            ? "Pick the exam you're preparing for, then optionally narrow by subject or chapter."
                            : "Filter by subject or chapter to jump straight to what you need."}
                    </p>
                </div>

                <div className="max-h-[55vh] space-y-4 overflow-y-auto p-5">
                    {examRequired && (
                        <Section icon={<GraduationCap size={13} />} label="Exam" required>
                            {examOptions.map((e) => (
                                <Chip key={e.code} active={exam === e.code} onClick={() => setExam(e.code)}>
                                    {e.name}
                                </Chip>
                            ))}
                        </Section>
                    )}
                    {showSubjects && (
                        <Section icon={<ListFilter size={13} />} label="Subject">
                            <Chip active={effSubject === "all"} onClick={() => setSubject("all")}>
                                All subjects
                            </Chip>
                            {subjects.map((s) => (
                                <Chip key={s} active={effSubject === s} onClick={() => setSubject(s)}>
                                    {s}
                                </Chip>
                            ))}
                        </Section>
                    )}
                    {effSubject !== "all" && chapters.length > 0 && (
                        <Section icon={<BookOpen size={13} />} label="Chapter">
                            <Chip active={effChapter === "all"} onClick={() => setChapter("all")}>
                                All chapters
                            </Chip>
                            {chapters.map((c) => (
                                <Chip key={c} active={effChapter === c} onClick={() => setChapter(c)}>
                                    {c}
                                </Chip>
                            ))}
                        </Section>
                    )}
                    {examRequired && !exam && (
                        <p className="text-xs text-slate-400">Choose an exam to continue.</p>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-4">
                    {staff ? (
                        <button onClick={showAll} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                            Show all (manage)
                        </button>
                    ) : (
                        <span />
                    )}
                    <button
                        onClick={apply}
                        disabled={!canApply}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Show videos
                    </button>
                </div>
            </div>
        </div>
    );
}

function Section({ icon, label, required, children }) {
    return (
        <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {icon} {label} {required && <span className="text-rose-500">*</span>}
            </p>
            <div className="flex flex-wrap gap-2">{children}</div>
        </div>
    );
}

function Chip({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition",
                active
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-slate-800"
            )}
        >
            {children}
        </button>
    );
}
