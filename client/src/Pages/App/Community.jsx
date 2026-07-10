import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    MessageSquare,
    ArrowBigUp,
    Plus,
    Search,
    Loader2,
    X,
    Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { timeAgo } from "@/lib/format";
import { listPosts, createPost } from "@/Api/CommunityApi";

function NewPostModal({ open, onClose, onCreated }) {
    const [form, setForm] = useState({ title: "", subject: "", body: "" });
    const [saving, setSaving] = useState(false);
    if (!open) return null;

    const submit = async () => {
        if (!form.title.trim() || !form.body.trim()) return toast.error("Title and body are required.");
        setSaving(true);
        try {
            const res = await createPost(form);
            toast.success("Posted!");
            onCreated(res.post);
            setForm({ title: "", subject: "", body: "" });
            onClose();
        } catch {
            toast.error("Could not create the post.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Start a discussion</h3>
                    <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
                <div className="space-y-3">
                    <input
                        className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Question or topic title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                    <input
                        className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Subject (optional) — e.g. Physics"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    />
                    <textarea
                        rows={5}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Share the details…"
                        value={form.body}
                        onChange={(e) => setForm({ ...form, body: e.target.value })}
                    />
                </div>
                <div className="mt-4 flex justify-end gap-3">
                    <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        Cancel
                    </button>
                    <button onClick={submit} disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                        {saving ? "Posting…" : "Post"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Community() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    const params = useMemo(() => {
        const p = { sort, page, limit: 10 };
        if (debounced.trim()) p.q = debounced.trim();
        return p;
    }, [sort, page, debounced]);

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: show the loader before each fetch
        setLoading(true);
        listPosts(params)
            .then((res) => active && setData(res))
            .catch(() => active && setData(null))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [params, reloadKey]);

    const posts = data?.posts || [];
    const pages = data?.pages || 1;

    return (
        <div className="mx-auto max-w-3xl">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Community</h1>
                    <p className="text-sm text-slate-500">Ask questions, share tips, help each other.</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                    <Plus size={16} /> New Post
                </button>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative min-w-0 flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search discussions…"
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                    <option value="top">Top voted</option>
                </select>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                    <Users className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No discussions yet</p>
                    <p className="mt-0.5 text-xs text-slate-400">Be the first to start one.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {posts.map((p) => (
                        <Link
                            key={p._id}
                            to={`/community/${p._id}`}
                            className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="font-bold text-slate-900">{p.title}</h3>
                                {p.subject && (
                                    <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                                        {p.subject}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.snippet}</p>
                            <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                                <span>{p.authorName || "Student"} · {timeAgo(p.createdAt)}</span>
                                <span className="ml-auto inline-flex items-center gap-1">
                                    <ArrowBigUp size={14} /> {p.upvoteCount}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <MessageSquare size={14} /> {p.replyCount}
                                </span>
                            </div>
                        </Link>
                    ))}

                    {pages > 1 && (
                        <div className="flex items-center justify-center gap-1.5 pt-2">
                            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                                Previous
                            </button>
                            <span className="px-2 text-sm text-slate-500">{page} / {pages}</span>
                            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            <NewPostModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={() => setReloadKey((k) => k + 1)} />
        </div>
    );
}
