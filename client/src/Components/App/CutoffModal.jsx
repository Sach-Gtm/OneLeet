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
    Target,
    Check,
    Sparkles,
} from "lucide-react";
import { getCutoffs } from "@/Api/CutoffApi";
import { useAuth } from "@/context/AuthContext";
import {
    PREDICTOR_CATEGORIES,
    PREDICTOR_REGIONS,
    eligibleCodes,
    evaluateBranch,
    catLabel,
    regionLabel,
} from "@/lib/collegePredictor";

const nf = (n) => (n == null ? "—" : Number(n).toLocaleString("en-IN"));

const ORDER = ["OPNOHS", "OPNOOS", "BCNOHS", "EWNOHS", "SCNOHS", "SCNOOS", "STNOHS", "OPDFHS", "OPPHHS", "NOSMAI"];
const rankOf = (code) => {
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

const PKEY = "oneleet.predictor.v1";
const loadPred = () => {
    try {
        return JSON.parse(localStorage.getItem(PKEY)) || {};
    } catch {
        return {};
    }
};

// One branch: category cut-offs. When the predictor is active, the branch is
// highlighted if the candidate clears it, and each eligible cell is ticked
// (cleared) or crossed (missed).
function BranchBlock({ branch, legendMap, active, rankNum, codes }) {
    const cells = [...(branch.cells || [])].sort((a, b) => rankOf(a.code) - rankOf(b.code));
    if (!cells.length) return null;
    const qual = branch.qual;
    const shell = active
        ? qual
            ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/5"
            : "border-slate-100 opacity-60 dark:border-slate-800"
        : "border-slate-100 dark:border-slate-800";
    return (
        <div className={`rounded-lg border p-2.5 ${shell}`}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{branch.branch}</p>
                {active && qual && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                        <Check size={11} /> You&apos;d get this · {qual.safe ? "Safe" : "Close"}
                    </span>
                )}
                {active && !qual && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-400 dark:bg-slate-800">
                        Out of reach this round
                    </span>
                )}
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
                {cells.map((c, i) => {
                    const leg = legendMap[c.code] || { label: c.code, region: "" };
                    const eligible = active && codes.has(c.code);
                    const cleared = eligible && rankNum <= c.max;
                    const ring = eligible ? (cleared ? "ring-2 ring-emerald-300" : "ring-1 ring-rose-200") : "";
                    return (
                        <div
                            key={i}
                            className={`flex items-center gap-2 rounded-md border-l-4 bg-slate-50 px-2 py-1.5 dark:bg-slate-800/50 ${accent(c.code)} ${ring}`}
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

function CollegeCard({ college, legendMap, active, rankNum, codes, expanded, onToggle }) {
    const branches = college.branches || [];
    const qualCount = active ? branches.filter((b) => b.qual).length : 0;
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/70">
            <button
                onClick={onToggle}
                className="flex w-full items-center gap-2 bg-slate-50 px-3.5 py-2.5 text-left hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800"
            >
                <Building2 size={15} className="shrink-0 text-indigo-500" />
                <span className="min-w-0 flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{college.name}</span>
                {active && qualCount > 0 && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                        {qualCount} you&apos;d get
                    </span>
                )}
                <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                    {branches.length} branch{branches.length === 1 ? "" : "es"}
                </span>
                <ChevronDown size={16} className={"shrink-0 text-slate-400 transition-transform " + (expanded ? "rotate-180" : "")} />
            </button>
            {expanded && (
                <div className="space-y-2 p-2.5">
                    {branches.map((b, i) => (
                        <BranchBlock key={i} branch={b} legendMap={legendMap} active={active} rankNum={rankNum} codes={codes} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Round-wise counseling cut-offs + a rank-based college predictor. Mount-gated by
// the parent (rendered only while open) so the effect never needs a synchronous
// setState.
export default function CutoffModal({ examCode, examName, onClose }) {
    const { user } = useAuth();
    const [cutoff, setCutoff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [roundIdx, setRoundIdx] = useState(0);
    const [query, setQuery] = useState("");
    const [openSet, setOpenSet] = useState(() => new Set());
    const [isFs, setIsFs] = useState(false);
    const cardRef = useRef(null);

    // Predictor inputs — prefer the student's saved profile, then their last
    // session (localStorage), then sensible defaults.
    const [rank, setRank] = useState(() => (user?.leetRank ? String(user.leetRank) : loadPred().rank || ""));
    const [category, setCategory] = useState(() => user?.leetCategory || loadPred().category || "general");
    const [region, setRegion] = useState(() => user?.leetRegion || loadPred().region || "delhi");
    const [onlyMatches, setOnlyMatches] = useState(false);

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

    useEffect(() => {
        try {
            localStorage.setItem(PKEY, JSON.stringify({ rank, category, region }));
        } catch {
            /* storage blocked — fine */
        }
    }, [rank, category, region]);

    const legendMap = useMemo(
        () => Object.fromEntries((cutoff?.legend || []).map((l) => [l.code, l])),
        [cutoff]
    );

    const round = cutoff?.rounds?.[roundIdx];
    const q = query.trim().toLowerCase();
    const rankNum = parseInt(rank, 10);
    const active = Number.isFinite(rankNum) && rankNum > 0;
    const codes = useMemo(() => eligibleCodes(category, region), [category, region]);

    // Search-filter, predictor-annotate, and (optionally) keep only matches.
    const { list, summary } = useMemo(() => {
        const src = round?.colleges || [];
        const searched = !q
            ? src
            : src
                  .map((c) => {
                      if ((c.name || "").toLowerCase().includes(q)) return c;
                      const branches = (c.branches || []).filter((b) => (b.branch || "").toLowerCase().includes(q));
                      return branches.length ? { ...c, branches } : null;
                  })
                  .filter(Boolean);

        let qBranches = 0;
        let qColleges = 0;
        let safe = 0;
        const out = [];
        for (const c of searched) {
            const branches = (c.branches || []).map((b) => ({
                ...b,
                qual: active ? evaluateBranch(b.cells, rankNum, codes) : null,
            }));
            const matched = branches.filter((b) => b.qual);
            if (active) {
                qBranches += matched.length;
                safe += matched.filter((b) => b.qual.safe).length;
                if (matched.length) qColleges += 1;
            }
            const shown = active && onlyMatches ? matched : branches;
            if (active && onlyMatches && shown.length === 0) continue;
            out.push({ ...c, branches: shown });
        }
        return { list: out, summary: { qBranches, qColleges, safe } };
    }, [round, q, active, rankNum, codes, onlyMatches]);

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
                                Cut-offs &amp; College Predictor — {cutoff?.examName || examName}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                                {cutoff
                                    ? [cutoff.session && `Session ${cutoff.session}`, "Diploma holders · closing ranks"].filter(Boolean).join(" · ")
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
                            {/* College Predictor */}
                            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-500/25 dark:bg-indigo-500/10">
                                <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-100">
                                    <Target size={15} className="text-indigo-600" /> College Predictor
                                    <span className="font-normal text-slate-400">— enter your rank to see what you&apos;d get</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        inputMode="numeric"
                                        value={rank}
                                        onChange={(e) => setRank(e.target.value)}
                                        placeholder="Your IPU CET (LE) rank"
                                        className="h-9 w-44 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="h-9 rounded-lg border border-slate-200 px-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        {PREDICTOR_CATEGORIES.map((c) => (
                                            <option key={c.key} value={c.key}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={region}
                                        onChange={(e) => setRegion(e.target.value)}
                                        className="h-9 rounded-lg border border-slate-200 px-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        {PREDICTOR_REGIONS.map((r) => (
                                            <option key={r.key} value={r.key}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                    {active && (
                                        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={onlyMatches}
                                                onChange={(e) => setOnlyMatches(e.target.checked)}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            Only show my matches
                                        </label>
                                    )}
                                </div>
                                {active && (
                                    <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm dark:bg-slate-800/50">
                                        <Sparkles size={15} className="mt-0.5 shrink-0 text-indigo-500" />
                                        <p className="text-slate-600 dark:text-slate-300">
                                            With rank <b className="text-slate-900 dark:text-slate-100">{nf(rankNum)}</b> as{" "}
                                            <b>{catLabel(category)}</b> ({regionLabel(region)}), you&apos;d have cleared{" "}
                                            <b className="text-emerald-600 dark:text-emerald-400">{summary.qBranches}</b> branch
                                            {summary.qBranches === 1 ? "" : "es"} at{" "}
                                            <b className="text-emerald-600 dark:text-emerald-400">{summary.qColleges}</b> college
                                            {summary.qColleges === 1 ? "" : "s"} in {round?.label || "this round"}
                                            {summary.qBranches > 0 && (
                                                <span className="text-slate-400"> · {summary.safe} comfortably safe</span>
                                            )}
                                            .
                                            <span className="ml-1 text-xs text-slate-400">Indicative — cut-offs shift year to year.</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* How to read it */}
                            <div className="flex gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                                <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
                                <p>
                                    <b>Opening</b> = best rank admitted, <b>Closing</b> = last rank admitted in this round.
                                    {cutoff.source ? ` Source: ${cutoff.source}.` : ""}
                                </p>
                            </div>

                            {list.length === 0 ? (
                                <p className="py-10 text-center text-sm text-slate-400">
                                    {active && onlyMatches
                                        ? "No colleges match your rank in this round — try another round or turn off the filter."
                                        : `No colleges or branches match “${query}”.`}
                                </p>
                            ) : (
                                list.map((c) => (
                                    <CollegeCard
                                        key={c.name}
                                        college={c}
                                        legendMap={legendMap}
                                        active={active}
                                        rankNum={rankNum}
                                        codes={codes}
                                        expanded={Boolean(q) || (active && onlyMatches) || openSet.has(c.name)}
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
