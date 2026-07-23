import { useEffect, useMemo, useState } from "react";
import { Search, Check, Loader2, Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getExams } from "@/Api/ExamsApi";

// Reusable picker over the LEET exam catalog.
//   • Staff "target universities" (allowAll): a "All universities" option that
//     stores ["all"]; otherwise specific codes.
//   • Student "which exams" (allowAll=false): specific codes only.
// `value` is an array of codes; `onChange(next)` gets the new array.
export default function ExamMultiSelect({ value = [], onChange, allowAll = false, height = "max-h-56" }) {
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

    const isAll = allowAll && value.includes("all");
    const selected = useMemo(() => new Set(value), [value]);

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

    const toggle = (code) => {
        if (isAll) return;
        const set = new Set(value);
        if (set.has(code)) set.delete(code);
        else set.add(code);
        onChange([...set]);
    };

    if (exams === null) {
        return (
            <div className="flex justify-center rounded-xl border border-slate-200 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            </div>
        );
    }

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
                    {isAll ? "All universities" : `${value.length} selected`}
                </span>
            </div>

            {allowAll && (
                <button
                    type="button"
                    onClick={() => onChange(isAll ? [] : ["all"])}
                    className={cn(
                        "flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left text-sm font-semibold transition",
                        isAll ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                    )}
                >
                    <span
                        className={cn(
                            "grid h-4 w-4 shrink-0 place-items-center rounded border",
                            isAll ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"
                        )}
                    >
                        {isAll && <Check size={11} />}
                    </span>
                    <Globe2 size={14} /> All universities / every LEET
                </button>
            )}

            <div className={cn("overflow-y-auto p-1", height, isAll && "pointer-events-none opacity-40")}>
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
