import { useState } from "react";
import { X, Sparkles, Loader2, Lightbulb, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

function Flashcard({ card }) {
    const [flipped, setFlipped] = useState(false);
    return (
        <button
            onClick={() => setFlipped((v) => !v)}
            className="flex min-h-[110px] w-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300"
        >
            <p className={cn("text-sm", flipped ? "text-slate-600" : "font-semibold text-slate-800")}>
                {flipped ? card.answer : card.question}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-500">
                <RotateCw size={12} /> {flipped ? "Show question" : "Show answer"}
            </span>
        </button>
    );
}

// Modal that renders either an AI summary or a set of AI flashcards for a note.
export default function NoteAiModal({ open, onClose, mode, noteTitle, loading, data, error }) {
    if (!open) return null;
    const isStub = data?.provider === "stub";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
            <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                            <Sparkles size={16} />
                        </span>
                        <div>
                            <p className="text-sm font-bold text-slate-800">
                                {mode === "summary" ? "AI Summary" : "AI Flashcards"}
                            </p>
                            <p className="line-clamp-1 text-xs text-slate-400">{noteTitle}</p>
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
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            <p className="text-sm">Generating…</p>
                        </div>
                    ) : error ? (
                        <p className="text-sm text-red-500">{error}</p>
                    ) : mode === "summary" ? (
                        <div className="space-y-4">
                            <p className="text-sm leading-relaxed text-slate-700">{data?.summary}</p>
                            {data?.keyPoints?.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                                        Key points
                                    </p>
                                    <ul className="space-y-1.5">
                                        {data.keyPoints.map((p, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" />
                                                {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {(data?.cards || []).map((card, i) => (
                                <Flashcard key={i} card={card} />
                            ))}
                        </div>
                    )}
                </div>

                {isStub && !loading && !error && (
                    <div className="border-t border-slate-100 bg-amber-50 px-5 py-2.5 text-xs text-amber-700">
                        Sample output — add a <code className="font-mono">GEMINI_API_KEY</code> to enable real AI.
                    </div>
                )}
            </div>
        </div>
    );
}
