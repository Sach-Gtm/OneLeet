import { X, BookOpen, Loader2, Sparkles } from "lucide-react";

// A tiny, SAFE Markdown-ish renderer: headings (#..####), bullets (-, *),
// **bold**, and paragraphs. It builds React nodes (never dangerouslySetInnerHTML),
// so note text can't inject HTML/scripts.
function renderInline(text, keyBase) {
    return String(text)
        .split(/(\*\*[^*]+\*\*)/g)
        .map((p, i) =>
            /^\*\*[^*]+\*\*$/.test(p) ? (
                <strong key={`${keyBase}-b${i}`}>{p.slice(2, -2)}</strong>
            ) : (
                <span key={`${keyBase}-t${i}`}>{p}</span>
            )
        );
}

function Markdown({ content }) {
    const lines = String(content || "").split(/\r?\n/);
    const blocks = [];
    let list = null;
    const flush = (i) => {
        if (list) {
            blocks.push(
                <ul key={`ul-${i}`} className="my-2 ml-5 list-disc space-y-1">
                    {list}
                </ul>
            );
            list = null;
        }
    };
    lines.forEach((raw, i) => {
        const line = raw.trimEnd();
        const bullet = line.match(/^\s*[-*]\s+(.*)$/);
        if (bullet) {
            list = list || [];
            list.push(
                <li key={`li-${i}`} className="text-sm leading-relaxed text-slate-600">
                    {renderInline(bullet[1], `li-${i}`)}
                </li>
            );
            return;
        }
        flush(i);
        if (!line.trim()) return;
        const h = line.match(/^(#{1,4})\s+(.*)$/);
        if (h) {
            const level = h[1].length;
            const cls =
                level <= 1
                    ? "mt-4 text-lg font-bold text-slate-900"
                    : level === 2
                    ? "mt-4 text-base font-bold text-slate-800"
                    : "mt-3 text-sm font-semibold text-slate-700";
            blocks.push(
                <p key={`h-${i}`} className={cls}>
                    {renderInline(h[2], `h-${i}`)}
                </p>
            );
            return;
        }
        blocks.push(
            <p key={`p-${i}`} className="mt-2 text-sm leading-relaxed text-slate-600">
                {renderInline(line, `p-${i}`)}
            </p>
        );
    });
    flush("end");
    return <div>{blocks}</div>;
}

// Reads a written / AI-drafted "text" note inline (no PDF to open).
export default function NoteReaderModal({ open, onClose, loading, note }) {
    if (!open) return null;
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
                        <>
                            {note.source === "ai" && (
                                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
                                    <Sparkles size={12} /> AI-assisted note
                                </div>
                            )}
                            <Markdown content={note.content} />
                        </>
                    ) : (
                        <p className="text-sm text-slate-500">This note has no readable text.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
