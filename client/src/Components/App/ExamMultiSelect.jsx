import { useEffect, useMemo, useState } from "react";
import { Search, Check, Loader2, Globe2, CheckCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getExams } from "@/Api/ExamsApi";

// Reusable picker over the LEET exam catalog, used by staff to TARGET content at
// specific college-wise exams.
//   • `value` is an array of exam codes. The sentinel ["all"] (and []) means
//     UNIVERSAL — shown to every student, enrolled or not.
//   • "Select all" checks every college and collapses to ["all"]; unchecking any
//     one expands it to the explicit remaining codes (no lock — always editable).
//   • Selecting every college by hand re-collapses to ["all"].
// `onChange(next)` receives the new array. `allowAll` keeps the select-all /
// universal affordance (all current callers target content, so it's on).
export default function ExamMultiSelect({
    value = [],
    onChange,
    allowAll = false,
    height = "max-h-56",
}) {
    const [exams, setExams] = useState(null);
    const [q, setQ] = useState("");

    useEffect(() => {
        let active = true;
        getExams()
            .then((e) => active && setExams(e))
            .catch(() => active && setExams([]));
        return () => {
            active = false;
        };
    }, []);

    const allCodes = useMemo(() => (exams || []).map((e) => e.code), [exams]);
    // "all" sentinel (or literally every code) → treat as all-checked.
    const isAll =
        allowAll &&
        (value.includes("all") || (allCodes.length > 0 && allCodes.every((c) => value.includes(c))));
    // The concrete set of checked codes (expanding the "all" sentinel).
    const selected = useMemo(
        () => (isAll ? new Set(allCodes) : new Set(value)),
        [isAll, allCodes, value]
    );

    const groups = useMemo(() => {
        const needle = q.trim().toLowerCase();
        const list = (exams || []).filter((e) => !needle || e.name.toLowerCase().includes(needle));
        const map = new Map();
        for (const e of list) {
            if (!map.has(e.group)) map.set(e.group, []);
            map.get(e.group).push(e);
        }
        return [...map.entries()];
    }, [exams, q]);

    const emit = (set) => {
        // Every college selected → collapse to the universal sentinel.
        if (allowAll && allCodes.length > 0 && allCodes.every((c) => set.has(c))) return onChange(["all"]);
        onChange([...set]);
    };

    const toggle = (code) => {
        const set = new Set(selected); // expands "all" first, so unchecking one keeps the rest
        if (set.has(code)) set.delete(code);
        else set.add(code);
        emit(set);
    };

    const selectAll = () => onChange(["all"]);
    const clear = () => onChange([]);

    if (exams === null) {
        return (
            <div className="flex justify-center rounded-xl border border-slate-200 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            </div>
        );
    }

    const count = selected.size;
    // Audience caption — both extremes (all / none) mean "everyone".
    const caption = !allowAll
        ? null
        : isAll || count === 0
          ? "Shown to every student (common content)."
          : `Shown only to students in the ${count} selected exam${count === 1 ? "" : "s"}.`;

    return (
        <div className="rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 border-b border-slate-100 p-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search universities / LEET…"
                        className="h-8 w-full rounded-lg border border-slate-200 pl-8 pr-2 text-xs focus:border-indigo-400 focus:outline-none"
                    />
                </div>
                <span className="shrink-0 pr-1 text-xs font-medium text-slate-400">
                    {isAll ? "All selected" : `${count} selected`}
                </span>
            </div>

            {allowAll && (
                <div className="flex items-center gap-2 border-b border-slate-100 px-2 py-2">
                    <button
                        type="button"
                        onClick={selectAll}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                            isAll ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        <CheckCheck size={13} /> Select all
                    </button>
                    <button
                        type="button"
                        onClick={clear}
                        disabled={count === 0}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-40"
                    >
                        <X size={13} /> Clear
                    </button>
                    <span className="ml-auto inline-flex items-center gap-1 pr-1 text-[11px] text-slate-400">
                        <Globe2 size={12} /> {caption}
                    </span>
                </div>
            )}

            <div className={cn("overflow-y-auto p-1", height)}>
                {groups.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-400">No match.</p>
                ) : (
                    groups.map(([group, items]) => (
                        <div key={group} className="mb-1">
                            <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                {group}
                            </p>
                            {items.map((e) => {
                                const on = selected.has(e.code);
                                return (
                                    <button
                                        key={e.code}
                                        type="button"
                                        onClick={() => toggle(e.code)}
                                        className={cn(
                                            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition",
                                            on ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "grid h-4 w-4 shrink-0 place-items-center rounded border",
                                                on ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"
                                            )}
                                        >
                                            {on && <Check size={11} />}
                                        </span>
                                        {e.name}
                                    </button>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
