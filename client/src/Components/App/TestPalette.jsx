import { cn } from "@/lib/utils";

// The real-exam question navigator (audit H2 — "real-time test feel"). Mirrors
// the palette every CBT exam (GATE/LEET/JEE) shows: a numbered grid colour-coded
// by state, live counts, and jump-to-any-question. Graded tests only — practice
// stays a simple reveal-as-you-go scroll. Rendered both in the desktop side rail
// and the mobile bottom sheet, so the two always agree.
function statusOf(q, answers, marked) {
    const answered = answers[q._id] != null;
    const isMarked = !!marked[q._id];
    if (isMarked) return answered ? "markedAnswered" : "marked";
    if (answered) return "answered";
    return "unanswered";
}

const CELL = {
    answered: "bg-emerald-500 text-white",
    marked: "bg-violet-500 text-white",
    markedAnswered: "bg-violet-500 text-white ring-2 ring-emerald-400 ring-offset-1 dark:ring-offset-slate-900",
    unanswered:
        "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700",
};

export default function TestPalette({ questions, answers, marked, current, onJump, onClose }) {
    const counts = questions.reduce(
        (acc, q) => {
            const s = statusOf(q, answers, marked);
            if (s === "answered") acc.answered += 1;
            else if (s === "marked") acc.marked += 1;
            else if (s === "markedAnswered") {
                acc.answered += 1;
                acc.marked += 1;
            } else acc.left += 1;
            return acc;
        },
        { answered: 0, marked: 0, left: 0 }
    );

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Questions</h3>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        Close
                    </button>
                )}
            </div>

            {/* Live counts */}
            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                <Count label="Answered" value={counts.answered} tone="text-emerald-600" />
                <Count label="Review" value={counts.marked} tone="text-violet-600" />
                <Count label="Left" value={counts.left} tone="text-slate-500" />
            </div>

            {/* Numbered grid */}
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-5">
                {questions.map((q, i) => (
                    <button
                        key={q._id}
                        onClick={() => onJump(i)}
                        className={cn(
                            "relative grid h-8 w-full place-items-center rounded-lg text-xs font-bold tabular-nums transition",
                            CELL[statusOf(q, answers, marked)],
                            current === i && "outline outline-2 outline-indigo-500 outline-offset-1"
                        )}
                        aria-label={`Question ${i + 1}`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800">
                <Legend swatch="bg-emerald-500" label="Answered" />
                <Legend swatch="bg-violet-500" label="Marked for review" />
                <Legend swatch="bg-slate-200 dark:bg-slate-700" label="Not answered" />
            </div>
        </div>
    );
}

function Count({ label, value, tone }) {
    return (
        <div className="rounded-lg bg-slate-50 py-1.5 dark:bg-slate-800/60">
            <p className={cn("text-base font-bold tabular-nums", tone)}>{value}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        </div>
    );
}

function Legend({ swatch, label }) {
    return (
        <div className="flex items-center gap-2">
            <span className={cn("h-3 w-3 rounded", swatch)} />
            {label}
        </div>
    );
}
