import { useEffect, useMemo, useState } from "react";
import {
    Search,
    ChevronDown,
    Sparkles,
    Layers,
    User,
    Loader2,
    BookOpen,
    Eye,
    Zap,
    Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
    getNotes,
    getNotesFilters,
    getNote,
    summarizeNote,
    generateFlashcards,
} from "@/Api/NotesApi";
import NoteAiModal from "@/Components/App/NoteAiModal";
import NotesUploadModal from "@/Components/App/NotesUploadModal";
import NoteReaderModal from "@/Components/App/NoteReaderModal";
import { useAuth } from "@/context/AuthContext";

const SIDEBAR_GROUPS = [
    { key: "difficulty", label: "Difficulty", source: "difficulties" },
    { key: "format", label: "Format", source: "formats" },
    { key: "teacher", label: "Top Teachers", source: "teachers" },
];

const emptySidebar = { difficulty: [], format: [], teacher: [] };

function FilterSection({ label, options, selected, onToggle }) {
    const [open, setOpen] = useState(true);
    if (!options || options.length === 0) return null;
    return (
        <div className="border-b border-slate-100 py-3">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between text-sm font-semibold text-slate-700"
            >
                {label}
                <ChevronDown size={16} className={cn("text-slate-400 transition-transform", open && "rotate-180")} />
            </button>
            {open && (
                <div className="mt-2 space-y-1.5">
                    {options.map((opt) => (
                        <label
                            key={opt}
                            className="flex cursor-pointer items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(String(opt))}
                                onChange={() => onToggle(String(opt))}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="capitalize">{opt}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

function NoteCard({ note, onSummary, onFlashcards, onRead }) {
    const tags = [note.branch, note.level, note.difficulty].filter(Boolean);
    const hasFile = Boolean(note.fileUrl);
    const openView = () => {
        if (hasFile) window.open(note.fileUrl, "_blank", "noopener,noreferrer");
        else onRead(note);
    };
    return (
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                    <span
                        key={t}
                        className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                    >
                        {t}
                    </span>
                ))}
            </div>
            <h3 className="text-base font-bold text-slate-900">{note.title}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                <User size={12} /> {note.teacher || "OneLeet Faculty"}
                {note.subject ? ` · ${note.subject}` : ""}
            </p>
            {note.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">{note.description}</p>
            )}

            <button
                onClick={openView}
                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
                <BookOpen size={15} /> {hasFile ? "View Note" : "Read Note"}
            </button>
            <div className="mt-2 flex gap-2">
                <button
                    onClick={() => onSummary(note)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                    <Sparkles size={13} /> AI Summary
                </button>
                <button
                    onClick={() => onFlashcards(note)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                    <Layers size={13} /> Flashcards
                </button>
            </div>
        </div>
    );
}

export default function NotesLibrary() {
    const [filterOptions, setFilterOptions] = useState(null);
    const [subjectChip, setSubjectChip] = useState("all");
    const [sidebar, setSidebar] = useState(emptySidebar);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const { user } = useAuth();
    const isStaff = ["teacher", "admin", "superadmin"].includes(user?.role);

    const [uploadOpen, setUploadOpen] = useState(false);
    const [reader, setReader] = useState({ open: false, loading: false, note: null });

    const [aiModal, setAiModal] = useState({ open: false, mode: "summary", noteTitle: "", loading: false, data: null, error: null });

    useEffect(() => {
        getNotesFilters()
            .then((res) => setFilterOptions(res.filters))
            .catch(() => setFilterOptions(null));
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    const queryParams = useMemo(() => {
        const params = { sort, page, limit: 6 };
        if (subjectChip !== "all") params.subject = subjectChip;
        for (const [key, values] of Object.entries(sidebar)) {
            if (values.length) params[key] = values.join(",");
        }
        if (debouncedSearch.trim()) params.q = debouncedSearch.trim();
        return params;
    }, [subjectChip, sidebar, debouncedSearch, sort, page]);

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: show the loader before each fetch
        setLoading(true);
        getNotes(queryParams)
            .then((res) => active && setData(res))
            .catch(() => active && setData(null))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [queryParams, refreshKey]);

    // Open a written / AI "text" note (no PDF): fetch its full body, then read it.
    const openReader = async (note) => {
        setReader({ open: true, loading: true, note: { title: note.title } });
        try {
            const res = await getNote(note._id);
            setReader({ open: true, loading: false, note: res.note });
        } catch {
            setReader({ open: false, loading: false, note: null });
            toast.error("Couldn't open this note.");
        }
    };

    const toggleSidebar = (key, value) => {
        setPage(1);
        setSidebar((prev) => {
            const set = new Set(prev[key]);
            set.has(value) ? set.delete(value) : set.add(value);
            return { ...prev, [key]: [...set] };
        });
    };

    const runAi = async (note, mode) => {
        setAiModal({ open: true, mode, noteTitle: note.title, loading: true, data: null, error: null });
        try {
            const res = mode === "summary" ? await summarizeNote(note._id) : await generateFlashcards(note._id);
            setAiModal((m) => ({ ...m, loading: false, data: res }));
        } catch {
            setAiModal((m) => ({ ...m, loading: false, error: "Could not generate right now. Please try again." }));
        }
    };

    const notes = data?.notes || [];
    const pages = data?.pages || 1;
    const total = data?.total || 0;
    const subjects = filterOptions?.subjects || [];

    return (
        <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Study Notes &amp; Material</h1>
                    <p className="text-sm text-slate-500">Access top-tier notes, AI summaries, and flashcards.</p>
                </div>
                {isStaff && (
                    <button
                        onClick={() => setUploadOpen(true)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        <Plus size={16} /> Add note
                    </button>
                )}
            </div>

            {/* Subject chips */}
            <div className="mb-5 flex flex-wrap gap-2">
                {["all", ...subjects].map((s) => (
                    <button
                        key={s}
                        onClick={() => {
                            setSubjectChip(s);
                            setPage(1);
                        }}
                        className={cn(
                            "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition",
                            subjectChip === s
                                ? "bg-indigo-600 text-white"
                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        {s === "all" ? "All" : s}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
                <aside className="w-full shrink-0 space-y-4 lg:w-60">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <h2 className="text-sm font-bold text-slate-800">Filters</h2>
                        {SIDEBAR_GROUPS.map((group) => (
                            <FilterSection
                                key={group.key}
                                label={group.label}
                                options={filterOptions?.[group.source]}
                                selected={sidebar[group.key]}
                                onToggle={(value) => toggleSidebar(group.key, value)}
                            />
                        ))}
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-4 text-white">
                        <Zap className="mb-2 h-5 w-5" />
                        <p className="text-sm font-bold">AI Flashcards</p>
                        <p className="mt-0.5 text-xs text-indigo-100">
                            Turn any note into a revision deck instantly.
                        </p>
                        <button
                            onClick={() => toast("Hit “Flashcards” on any note to generate a deck.")}
                            className="mt-3 w-full rounded-lg bg-white/15 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-white/25"
                        >
                            Try Now
                        </button>
                    </div>
                </aside>

                <div className="min-w-0 flex-1">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <div className="relative min-w-0 flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search topic, subject, or teacher..."
                                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                        <select
                            value={sort}
                            onChange={(e) => {
                                setSort(e.target.value);
                                setPage(1);
                            }}
                            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                            <BookOpen className="mb-2 h-8 w-8 text-slate-300" />
                            <p className="text-sm font-medium text-slate-600">No notes found</p>
                            <p className="mt-0.5 text-xs text-slate-400">Try a different subject or filter.</p>
                        </div>
                    ) : (
                        <>
                            <p className="mb-3 text-xs text-slate-400">{total} note{total === 1 ? "" : "s"}</p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {notes.map((note) => (
                                    <NoteCard
                                        key={note._id}
                                        note={note}
                                        onSummary={(n) => runAi(n, "summary")}
                                        onFlashcards={(n) => runAi(n, "flashcards")}
                                        onRead={openReader}
                                    />
                                ))}
                            </div>

                            {pages > 1 && (
                                <div className="mt-6 flex items-center justify-center gap-1.5">
                                    <button
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={cn(
                                                "h-8 w-8 rounded-lg text-sm font-medium",
                                                p === page ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <button
                                        disabled={page >= pages}
                                        onClick={() => setPage((p) => Math.min(pages, p + 1))}
                                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <NoteAiModal
                open={aiModal.open}
                onClose={() => setAiModal((m) => ({ ...m, open: false }))}
                mode={aiModal.mode}
                noteTitle={aiModal.noteTitle}
                loading={aiModal.loading}
                data={aiModal.data}
                error={aiModal.error}
            />

            {isStaff && (
                <NotesUploadModal
                    open={uploadOpen}
                    onClose={() => setUploadOpen(false)}
                    onUploaded={() => {
                        setPage(1);
                        setRefreshKey((k) => k + 1);
                    }}
                />
            )}

            <NoteReaderModal
                open={reader.open}
                loading={reader.loading}
                note={reader.note}
                onClose={() => setReader({ open: false, loading: false, note: null })}
            />
        </div>
    );
}
