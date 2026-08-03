import { X, BookOpen, Loader2, Brain } from "lucide-react";
import Markdown from "@/Components/App/Markdown";
import ProtectedContent from "@/Components/Security/ProtectedContent";
import { useAuth } from "@/context/AuthContext";
import { isStaff } from "@/lib/roles";

// Reads a written / AI-drafted "text" note inline (no PDF to open).
export default function NoteReaderModal({ open, onClose, loading, note }) {
    const { user } = useAuth();
    if (!open) return null;
    // Premium notes get the watermark + capture-protection layer; free notes and
    // trusted staff are unaffected.
    const guarded = Boolean(note?.premium) && !isStaff(user);
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
            <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                            <BookOpen size={16} />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800">{note?.title || "Note"}</p>
                            <p className="truncate text-xs text-slate-400">
                                {note?.teacher || "OneLeet Faculty"}
                                {note?.subject ? ` · ${note.subject}` : ""}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="min-h-[160px] flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                            <p className="text-sm">Loading…</p>
                        </div>
                    ) : note?.content ? (
                        <ProtectedContent
                            enabled={guarded}
                            contentType="note"
                            contentRef={note?.title || note?._id || ""}
                        >
                            {note.source === "ai" && (
                                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
                                    <Brain size={12} /> AI-assisted note
                                </div>
                            )}
                            <Markdown content={note.content} />
                        </ProtectedContent>
                    ) : (
                        <p className="text-sm text-slate-500">This note has no readable text.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
