import { useEffect, useMemo, useState } from "react";
import {
    Search,
    ChevronDown,
    Eye,
    Play,
    Download,
    Sparkles,
    FileQuestion,
    Loader2,
    Lightbulb,
    Calculator,
    BookOpen,
    SlidersHorizontal,
    X,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { getPyqs, getPyqFilters, pyqDownloadUrl } from "@/Api/PyqApi";

const DIFFICULTY_STYLE = {
    easy: "bg-emerald-50 text-emerald-700",
    moderate: "bg-amber-50 text-amber-700",
    hard: "bg-red-50 text-red-700",
};

const TAG_ICON = { conceptual: Lightbulb, numerical: Calculator, theory: BookOpen };

const FILTER_GROUPS = [
    { key: "year", label: "Exam Year", source: "years" },
    { key: "stateExam", label: "State Exam", source: "stateExams" },
    { key: "branch", label: "Branch", source: "branches" },
    { key: "subject", label: "Subject", source: "subjects" },
    { key: "difficulty", label: "Difficulty", source: "difficulties" },
];

const emptySelection = { year: [], stateExam: [], branch: [], subject: [], difficulty: [] };

// A single compact filter as a dropdown button + popover of checkboxes. The
// button shows how many options are active; only one dropdown is open at a time
// (managed by the parent), and it closes on outside click.
function FilterDropdown({ label, options, selected, onToggle, open, onToggleOpen }) {
    if (!options || options.length === 0) return null;
    const count = selected.length;
    return (
        <div className="relative" data-filter-dropdown>
            <button
                type="button"
                onClick={onToggleOpen}
                aria-expanded={open}
                className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition",
                    count > 0
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
            >
                {label}
                {count > 0 && (
                    <span className="grid h-4 min-w-4 place-items-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                        {count}
                    </span>
                )}
                <ChevronDown
                    size={15}
                    className={cn("text-slate-400 transition-transform", open && "rotate-180")}
                />
            </button>
            {open && (
                <div className="absolute left-0 top-full z-30 mt-1.5 max-h-64 w-max min-w-[11rem] max-w-[calc(100vw-2.5rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-200/70">
                    {options.map((opt) => {
                        const value = String(opt);
                        const checked = selected.includes(value);
                        return (
                            <label
                                key={value}
                                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => onToggle(value)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="capitalize">{opt}</span>
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function PyqCard({ pyq }) {
    const TagIcon = TAG_ICON[pyq.tag] || Lightbulb;
    const openView = () => {
        if (pyq.fileUrl) window.open(pyq.fileUrl, "_blank", "noopener,noreferrer");
        else toast("This paper's PDF hasn't been uploaded yet.");
    };
    return (
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-start justify-between">
                <span
                    className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        DIFFICULTY_STYLE[pyq.difficulty] || DIFFICULTY_STYLE.moderate
                    )}
                >
                    {pyq.difficulty}
                </span>
                <span className="text-xs text-slate-400">
                    {pyq.year} · {pyq.stateExam}
                </span>
            </div>

            <h3 className="text-base font-bold text-slate-900">{pyq.title}</h3>
            <p className="mt-0.5 text-sm text-slate-500">{pyq.topic || pyq.subject}</p>

            <div className="mt-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                    <TagIcon size={12} /> {pyq.tag}
                </span>
            </div>

            <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                    <button
                        onClick={openView}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        <Eye size={15} /> View
                    </button>
                    {pyq.fileUrl ? (
                        <a
                            href={pyqDownloadUrl(pyq.fileUrl)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            <Download size={15} /> Download
                        </a>
                    ) : (
                        <button
                            onClick={() => toast("This paper's PDF hasn't been uploaded yet.")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-200 py-2 text-sm font-semibold text-slate-500"
                        >
                            <Download size={15} /> Download
                        </button>
                    )}
                </div>
                <button
                    onClick={() => toast("Interactive practice is coming with structured questions.")}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                    <Play size={15} /> Practice
                </button>
            </div>
        </div>
    );
}

export default function PyqArchive() {
    const [filterOptions, setFilterOptions] = useState(null);
    const [selected, setSelected] = useState(emptySelection);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openKey, setOpenKey] = useState(null); // which filter dropdown is open

    // Load filter facets once
    useEffect(() => {
        getPyqFilters()
            .then((res) => setFilterOptions(res.filters))
            .catch(() => setFilterOptions(null));
    }, []);

    // Close the open filter dropdown on an outside click.
    useEffect(() => {
        if (!openKey) return undefined;
        const h = (e) => {
            if (!e.target.closest("[data-filter-dropdown]")) setOpenKey(null);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [openKey]);

    // Debounce the search box
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    const queryParams = useMemo(() => {
        const params = { sort, page, limit: 6 };
        for (const [key, values] of Object.entries(selected)) {
            if (values.length) params[key] = values.join(",");
        }
        if (debouncedSearch.trim()) params.q = debouncedSearch.trim();
        return params;
    }, [selected, debouncedSearch, sort, page]);

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: show the loader before each fetch
        setLoading(true);
        getPyqs(queryParams)
            .then((res) => {
                if (active) setData(res);
            })
            .catch(() => {
                if (active) setData(null);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [queryParams]);

    const toggleFilter = (key, value) => {
        setPage(1);
        setSelected((prev) => {
            const set = new Set(prev[key]);
            if (set.has(value)) set.delete(value);
            else set.add(value);
            return { ...prev, [key]: [...set] };
        });
    };

    const clearAll = () => {
        setPage(1);
        setSelected(emptySelection);
        setSearch("");
    };

    const pyqs = data?.pyqs || [];
    const pages = data?.pages || 1;
    const total = data?.total || 0;
    const hasActiveFilters =
        Object.values(selected).some((a) => a.length) || debouncedSearch.trim();

    return (
        <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Previous Year Questions Archive
                    </h1>
                    <p className="text-sm text-slate-500">
                        Browse All-India LEET PYQs with filters.
                    </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                    <Sparkles size={13} /> AI Categorization
                </span>
            </div>

            <div>
                {/* Search + sort */}
                <div className="mb-3 flex flex-wrap items-center gap-3">
                    <div className="relative min-w-0 flex-1">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by topic, year, or exam name..."
                            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <select
                        value={sort}
                        onChange={(e) => {
                            setSort(e.target.value);
                            setPage(1);
                        }}
                        className="h-11 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
                    >
                        <option value="newest">Sort by: Newest</option>
                        <option value="oldest">Sort by: Oldest</option>
                        <option value="year-desc">Year: High to Low</option>
                        <option value="year-asc">Year: Low to High</option>
                    </select>
                </div>

                {/* Compact filter dropdown bar */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="mr-0.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <SlidersHorizontal size={14} /> Filters
                    </span>
                    {FILTER_GROUPS.map((group) => (
                        <FilterDropdown
                            key={group.key}
                            label={group.label}
                            options={filterOptions?.[group.source]}
                            selected={selected[group.key]}
                            onToggle={(value) => toggleFilter(group.key, value)}
                            open={openKey === group.key}
                            onToggleOpen={() =>
                                setOpenKey((k) => (k === group.key ? null : group.key))
                            }
                        />
                    ))}
                    {hasActiveFilters && (
                        <button
                            onClick={clearAll}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                        >
                            <X size={13} /> Clear all
                        </button>
                    )}
                </div>

                {/* Results */}
                <div className="min-w-0">

                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        </div>
                    ) : pyqs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                            <FileQuestion className="mb-2 h-8 w-8 text-slate-300" />
                            <p className="text-sm font-medium text-slate-600">No papers found</p>
                            <p className="mt-0.5 text-xs text-slate-400">
                                {hasActiveFilters
                                    ? "Try clearing some filters."
                                    : "Papers will appear here once they're added."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="mb-3 text-xs text-slate-400">
                                {total} paper{total === 1 ? "" : "s"} found
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {pyqs.map((pyq) => (
                                    <PyqCard key={pyq._id} pyq={pyq} />
                                ))}
                            </div>

                            {pages > 1 && (
                                <div className="mt-6 flex items-center justify-center gap-1.5">
                                    <button
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={cn(
                                                "h-8 w-8 rounded-lg text-sm font-medium",
                                                p === page
                                                    ? "bg-indigo-600 text-white"
                                                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <button
                                        disabled={page >= pages}
                                        onClick={() => setPage((p) => Math.min(pages, p + 1))}
                                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
