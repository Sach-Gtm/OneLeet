import { useEffect, useMemo, useRef, useState } from "react";
import {
    X,
    Search,
    Loader2,
    TrendingDown,
    ChevronDown,
    Info,
    Maximize,
    Minimize,
    Building2,
    Trophy,
} from "lucide-react";
import { getCutoffs } from "@/Api/CutoffApi";

const nf = (n) => (n == null ? "—" : Number(n).toLocaleString("en-IN"));

// Display order + left-border accent colour per IPU category code.
const ORDER = ["OPNOHS", "OPNOOS", "BCNOHS", "EWNOHS", "SCNOHS", "SCNOOS", "STNOHS", "OPDFHS", "OPPHHS", "NOSMAI"];
const rank = (code) => {
    const i = ORDER.indexOf(code);
    return i === -1 ? 99 : i;
};
const accent = (code) => {
    if (code.startsWith("OPNO")) return "border-indigo-400";
    if (code.startsWith("BC")) return "border-emerald-400";
    if (code.startsWith("EW")) return "border-teal-400";
    if (code.startsWith("SC")) return "border-amber-400";
    if (code.startsWith("ST")) return "border-orange-400";
    if (code.startsWith("OPDF")) return "border-sky-400";
    if (code.startsWith("OPPH")) return "border-violet-400";
    if (code.startsWith("NOSM")) return "border-rose-400";
    return "border-slate-300";
};

// One branch: its category cut-offs (opening = best rank admitted, closing =
// last rank admitted). Closing rank is emphasised — it's the number that tells a
// student whether they had a realistic chance.
function BranchBlock({ branch, legendMap }) {
    const cells = [...(branch.cells || [])].sort((a, b) => rank(a.code) - rank(b.code));
    if (!cells.length) return null;
    return (
        <div className="rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
            <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{branch.branch}</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
                {cells.map((c, i) => {
                    const leg = legendMap[c.code] || { label: c.code, region: "" };
                    return (
                        <div
                            key={i}
                            className={`flex items-center gap-2 rounded-md border-l-4 bg-slate-50 px-2 py-1.5 dark:bg-slate-800/50 ${accent(c.code)}`}
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{leg.label}</p>
                                {leg.region && <p className="truncate text-[10px] text-slate-400">{leg.region}</p>}
                            </div>
                            <div className="shrink-0 text-right">
                                <p className="text-[10px] leading-none text-slate-400">opens {nf(c.min)}</p>
                                <p className="mt-0.5 text-sm font-bold leading-none text-slate-800 dark:text-slate-100">
                                    <span className="text-[10px] font-medium text-slate-400">closes </span>
                                    {nf(c.max)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function CollegeCard({ college, legendMap, expanded, onToggle }) {
    const nBranches = (college.branches || []).length;
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/70">
            <button
                onClick={onToggle}
                className="flex w-full items-center gap-2 bg-slate-50 px-3.5 py-2.5 text-left hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800"
            >
                <Building2 size={15} className="shrink-0 text-indigo-500" />
                <span className="min-w-0 flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{college.name}</span>
                <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                    {nBranches} branch{nBranches === 1 ? "" : "es"}
                </span>
                <ChevronDown size={16} className={"shrink-0 text-slate-400 transition-transform " + (expanded ? "rotate-180" : "")} />
            </button>
            {expanded && (
                <div className="space-y-2 p-2.5">
                    {(college.branches || []).map((b, i) => (
                        <BranchBlock key={i} branch={b} legendMap={legendMap} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Round-wise counseling cut-offs for an exam. Mount-gated by the parent (rendered
// only while open) so the effect never needs a synchronous setState.
export default function CutoffModal({ examCode, examName, onClose }) {
    const [cutoff, setCutoff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [roundIdx, setRoundIdx] = useState(0);
    const [query, setQuery] = useState("");
    const [openSet, setOpenSet] = useState(() => new Set());
    const [isFs, setIsFs] = useState(false);
    const cardRef = useRef(null);

    useEffect(() => {
        if (!examCode) return undefined;
        let alive = true;
        getCutoffs(examCode)
            .then((c) => alive && setCutoff(c))
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

    const legendMap = useMemo(
        () => Object.fromEntries((cutoff?.legend || []).map((l) => [l.code, l])),
        [cutoff]
    );

    const round = cutoff?.rounds?.[roundIdx];
    const q = query.trim().toLowerCase();
    const colleges = useMemo(() => {
        const list = round?.colleges || [];
        if (!q) return list;
        return list
            .map((c) => {
                if ((c.name || "").toLowerCase().includes(q)) return c;
                const branches = (c.branches || []).filter((b) => (b.branch || "").toLowerCase().includes(q));
                return branches.length ? { ...c, branches } : null;
            })
            .filter(Boolean);
    }, [round, q]);

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
                            <TrendingDown size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                                Counseling Cut-offs — {cutoff?.examName || examName}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                                {cutoff ? [cutoff.session && `Session ${cutoff.session}`, "Diploma holders · closing ranks"].filter(Boolean).join(" · ") : "Loading…"}
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
                        <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Round tabs */}
                    {cutoff?.rounds?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {cutoff.rounds.map((r, i) => (
                                <button
                                    key={r.round ?? i}
                                    onClick={() => setRoundIdx(i)}
                                    className={
                                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition " +
                                        (i === roundIdx
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "border border-slate-200 text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300")
                                    }
                                >
                                    {i === roundIdx && <Trophy size={12} />} {r.label || `Round ${r.round}`}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative mt-2.5">
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
                    ) : error || !cutoff ? (
                        <p className="py-10 text-center text-sm text-slate-400">Couldn&apos;t load the cut-offs. Please try again.</p>
                    ) : (
                        <>
                            <div className="flex gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 p-2.5 text-xs leading-relaxed text-slate-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-slate-300">
                                <Info size={14} className="mt-0.5 shrink-0 text-indigo-500" />
                                <p>
                                    <b>Opening</b> = best rank admitted, <b>Closing</b> = last rank admitted in this round.
                                    If your IPU CET (LE) rank is at or below a category&apos;s <b>closing</b> rank, you had a realistic chance.
                                    {cutoff.source ? ` Source: ${cutoff.source}.` : ""}
                                </p>
                            </div>

                            {colleges.length === 0 ? (
                                <p className="py-10 text-center text-sm text-slate-400">No colleges or branches match “{query}”.</p>
                            ) : (
                                colleges.map((c) => (
                                    <CollegeCard
                                        key={c.name}
                                        college={c}
                                        legendMap={legendMap}
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
