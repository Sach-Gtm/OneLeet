import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowBigUp, Loader2, Send, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { getPost, addReply, toggleUpvote } from "@/Api/CommunityApi";

export default function PostDetail() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState("");
    const [posting, setPosting] = useState(false);
    const [voting, setVoting] = useState(false);

    useEffect(() => {
        let active = true;
        getPost(id)
            .then((res) => active && setPost(res.post))
            .catch(() => active && setPost(null))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [id]);

    const submitReply = async () => {
        if (!reply.trim()) return;
        setPosting(true);
        try {
            const res = await addReply(id, reply.trim());
            setPost((p) => ({ ...p, replies: [...(p.replies || []), res.reply] }));
            setReply("");
        } catch {
            toast.error("Could not post reply.");
        } finally {
            setPosting(false);
        }
    };

    const onUpvote = async () => {
        if (voting) return;
        setVoting(true);
        try {
            const res = await toggleUpvote(id);
            setPost((p) => ({ ...p, upvoted: res.upvoted, upvoteCount: res.upvoteCount }));
        } catch {
            toast.error("Could not vote.");
        } finally {
            setVoting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }
    if (!post) {
        return (
            <div className="mx-auto max-w-md py-16 text-center">
                <p className="text-sm font-medium text-slate-600">Discussion not found.</p>
                <Link to="/community" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                    Back to Community
                </Link>
            </div>
        );
    }

    const replies = post.replies || [];

    return (
        <div className="mx-auto max-w-3xl">
            <Link to="/community" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
                <ArrowLeft size={16} /> Back to Community
            </Link>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold text-slate-900">{post.title}</h1>
                        <p className="mt-1 text-xs text-slate-400">
                            {post.authorName || "Student"} · {timeAgo(post.createdAt)}
                            {post.subject ? ` · ${post.subject}` : ""}
                        </p>
                    </div>
                    <button
                        onClick={onUpvote}
                        disabled={voting}
                        aria-label="Upvote"
                        className={cn(
                            "flex shrink-0 flex-col items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                            post.upvoted ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        )}
                    >
                        <ArrowBigUp size={18} />
                        {post.upvoteCount}
                    </button>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{post.body}</p>
            </div>

            <div className="mt-6">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <MessageSquare size={16} /> {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
                </h2>

                <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3">
                    <textarea
                        rows={3}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Write a reply…"
                        className="w-full resize-none border-0 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={submitReply}
                            disabled={posting || !reply.trim()}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Send size={14} /> {posting ? "Posting…" : "Reply"}
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {replies.map((r, i) => (
                        <div key={r._id || i} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-xs font-semibold text-slate-700">
                                {r.authorName || "Student"}
                                <span className="ml-2 font-normal text-slate-400">{timeAgo(r.createdAt)}</span>
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{r.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
