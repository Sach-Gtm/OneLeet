import { useEffect, useMemo, useRef, useState } from "react";
import {
    X,
    Search,
    Loader2,
    Armchair,
    ChevronDown,
    Info,
    Maximize,
    Minimize,
    Building2,
} from "lucide-react";
import { getSeatMatrix } from "@/Api/SeatMatrixApi";

const nf = (n) => Number(n || 0).toLocaleString("en-IN");

// One college's card: name + seat total, expandable to a branch-wise table
// (General / Management Quota / Total).
function CollegeCard({ college, expanded, onToggle }) {
    const branches = college.branches || [];
    const sub = branches.reduce(
        (a, b) => {
            a.general += Number(b.general || 0);
            a.mq += Number(b.mq || 0);
            a.total += Number(b.total || 0);
            return a;
        },
        { general: 0, mq: 0, total: 0 }
    );
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/70">
            <button
                onClick={onToggle}
                className="flex w-full items-center gap-2 bg-slate-50 px-3.5 py-2.5 text-left hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800"
            >
                <Building2 size={15} className="shrink-0 text-indigo-500" />
                <span className="min-w-0 flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {college.name}
                </span>
                <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                    {nf(sub.total)} seats
                </span>
                <ChevronDown
                    size={16}
                    className={"shrink-0 text-slate-400 transition-transform " + (expanded ? "rotate-180" : "")}
                />
            </button>

            {expanded && (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[380px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-700">
                                <th className="px-3.5 py-2 font-semibold">Branch</th>
                                <th className="px-2 py-2 text-right font-semibold">General</th>
                                <th className="px-2 py-2 text-right font-semibold">MQ</th>
                                <th className="px-3.5 py-2 text-right font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {branches.map((b, i) => (
                                <tr key={i}>
                                    <td className="px-3.5 py-2 font-medium text-slate-700 dark:text-slate-200">
                                        {b.branch || b.branchLong || "-"}
                                        {b.branch && b.branchLong && b.branchLong !== b.branch && (
                                            <span className="block text-[11px] font-normal text-slate-400">
                                                {b.branchLong}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">{nf(b.general)}</td>
                                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                                        {Number(b.mq) ? nf(b.mq) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                                    </td>
                                    <td className="px-3.5 py-2 text-right font-bold text-slate-800 dark:text-slate-100">{nf(b.total)}</td>
                                </tr>
                            ))}
                            <tr className="bg-slate-50/70 dark:bg-slate-800/40">
                                <td className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Total</td>
                                <td className="px-2 py-2 text-right text-xs font-bold text-slate-500 dark:text-slate-300">{nf(sub.general)}</td>
                                <td className="px-2 py-2 text-right text-xs font-bold text-slate-500 dark:text-slate-300">{nf(sub.mq)}</td>
                                <td className="px-3.5 py-2 text-right text-xs font-bold text-indigo-600 dark:text-indigo-300">{nf(sub.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Full seat-intake matrix for an exam: searchable, college-by-college. Opened
// from the exam-pattern page. Fetches on open; supports fullscreen for easy
// browsing of a long list.
// Mount-gated by the parent (rendered only while open), so it starts fresh each
// time it's opened and the effect never needs a synchronous setState.
export default function SeatMatrixModal({ examCode, examName, onClose }) {
    const [matrix, setMatrix] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [query, setQuery] = useState("");
    const [openSet, setOpenSet] = useState(() => new Set());
    const [isFs, setIsFs] = useState(false);
    const cardRef = useRef(null);

    useEffect(() => {
        if (!examCode) return undefined;
        let alive = true;
        getSeatMatrix(examCode)
            .then((m) => alive && setMatrix(m))
            .catch(() => alive && setError(true))
            .finally(() => alive && setLoading(false));
        const onKey = (e) => e.key === "Escape" && !document.fullscreenElement && onClose();
        const onFs = () => setIsFs(Boolean(document.fullscreenElement));
        window.addEventListener("keydown", onKey);
        document.addEventListener("fullscreenchange", onFs);
        return () => {
            alive = false;
            window.removeEventListener("keydown", onKey);
            document.removeEventListener("fullscreenchange", onFs);
        };
    }, [examCode, onClose]);

    const q = query.trim().toLowerCase();
    const filtered = useMemo(() => {
        const colleges = matrix?.colleges || [];
        if (!q) return colleges;
        return colleges
            .map((c) => {
                if ((c.name || "").toLowerCase().includes(q)) return c;
                const branches = (c.branches || []).filter(
                    (b) =>
                        (b.branch || "").toLowerCase().includes(q) ||
                        (b.branchLong || "").toLowerCase().includes(q)
                );
                return branches.length ? { ...c, branches } : null;
            })
            .filter(Boolean);
    }, [matrix, q]);

    const toggleFullscreen = () => {
        const el = cardRef.current;
        if (!el) return;
        if (document.fullscreenElement) document.exitFullscreen?.();
        else el.requestFullscreen?.().catch(() => {});
    };
    const toggleCollege = (name) =>
        setOpenSet((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
            <div
                ref={cardRef}
                className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
            >
                {/* Header */}
                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15">
                            <Armchair size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                                Seat Matrix, {matrix?.examName || examName}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                                {matrix
                                    ? [
                                          matrix.session && `Session ${matrix.session}`,
                                          `${nf(matrix.totalColleges)} colleges`,
                                          `${nf(matrix.totalSeats)} seats`,
                                      ]
                                          .filter(Boolean)
                                          .join(" · ")
                                    : "Loading…"}
                            </p>
                        </div>
                        <button
                            onClick={toggleFullscreen}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title={isFs ? "Exit full screen" : "Full screen"}
                            aria-label={isFs ? "Exit full screen" : "Full screen"}
                        >
                            {isFs ? <Minimize size={17} /> : <Maximize size={17} />}
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative mt-3">
                        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search college or branch…"
                            className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
                    {loading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        </div>
                    ) : error || !matrix ? (
                        <p className="py-10 text-center text-sm text-slate-400">
                            Couldn&apos;t load the seat matrix. Please try again.
                        </p>
                    ) : (
                        <>
                            {/* How to read it */}
                            <div className="flex gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 p-2.5 text-xs leading-relaxed text-slate-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-slate-300">
                                <Info size={14} className="mt-0.5 shrink-0 text-indigo-500" />
                                <p>
                                    <b>General</b> = open counseling seats · <b>MQ</b> = Management Quota.
                                    {matrix.note ? ` ${matrix.note}` : ""}
                                    {matrix.source ? ` Source: ${matrix.source}.` : ""}
                                </p>
                            </div>

                            {filtered.length === 0 ? (
                                <p className="py-10 text-center text-sm text-slate-400">No colleges or branches match “{query}”.</p>
                            ) : (
                                filtered.map((c) => (
                                    <CollegeCard
                                        key={c.name}
                                        college={c}
                                        expanded={Boolean(q) || openSet.has(c.name)}
                                        onToggle={() => toggleCollege(c.name)}
                                    />
                                ))
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
