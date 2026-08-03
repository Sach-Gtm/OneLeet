import { useEffect } from "react";
import { X, FileText, ShieldCheck } from "lucide-react";
import ProtectedContent from "@/Components/Security/ProtectedContent";

// Views a PREMIUM PDF note INSIDE the app instead of opening the raw file URL in
// a new browser tab (which would be a one-click download with no protection).
// The PDF is embedded with the native viewer toolbar hidden and wrapped in
// ProtectedContent, so it carries the per-student identity watermark and the
// capture-reporting layer. Nothing on the web can fully seal a PDF, but this
// removes the trivial download path and makes any leak traceable to the account.
export default function ProtectedPdfModal({ note, onClose }) {
    useEffect(() => {
        if (!note) return undefined;
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [note, onClose]);

    if (!note) return null;
    // Ask the browser's built-in PDF viewer to hide its toolbar (download / print
    // buttons) and side panes, where the renderer honours it (Chrome / Edge).
    const src = `${note.fileUrl}#toolbar=0&navpanes=0&statusbar=0`;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
            <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                            <FileText size={16} />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800">
                                {note.title || "Note"}
                            </p>
                            <p className="flex items-center gap-1 truncate text-xs text-emerald-600">
                                <ShieldCheck size={12} /> Protected premium note
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

                <ProtectedContent
                    enabled
                    contentType="note"
                    contentRef={note.title || note._id || ""}
                    className="flex-1 bg-slate-100"
                >
                    <iframe
                        title={note.title || "Premium note"}
                        src={src}
                        className="h-[75vh] w-full"
                    />
                </ProtectedContent>
            </div>
        </div>
    );
}
