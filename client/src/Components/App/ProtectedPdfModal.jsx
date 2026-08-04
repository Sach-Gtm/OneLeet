import { useEffect, useRef, useState } from "react";
import { X, FileText, ShieldCheck, Maximize, Minimize } from "lucide-react";
import ProtectedContent from "@/Components/Security/ProtectedContent";

// Views a PREMIUM PDF note INSIDE the app instead of opening the raw file URL in
// a new browser tab (which would be a one-click download with no protection).
// The PDF is embedded with the native viewer toolbar hidden and wrapped in
// ProtectedContent, so it carries the per-student identity watermark and the
// capture-reporting layer. Nothing on the web can fully seal a PDF, but this
// removes the trivial download path and makes any leak traceable to the account.
//
// An "expand" control fullscreens the WATERMARKED stage (not the bare iframe),
// so students can read comfortably while the identity overlay + protection stay
// on the page even in fullscreen.
export default function ProtectedPdfModal({ note, onClose }) {
    const stageRef = useRef(null);
    const [isFs, setIsFs] = useState(false);

    useEffect(() => {
        if (!note) return undefined;
        // Escape closes the modal — but when we're fullscreen, the browser uses
        // Escape to exit fullscreen first, so don't also close the modal then.
        const onKey = (e) => {
            if (e.key === "Escape" && !document.fullscreenElement) onClose();
        };
        const onFs = () => setIsFs(Boolean(document.fullscreenElement));
        window.addEventListener("keydown", onKey);
        document.addEventListener("fullscreenchange", onFs);
        return () => {
            window.removeEventListener("keydown", onKey);
            document.removeEventListener("fullscreenchange", onFs);
        };
    }, [note, onClose]);

    if (!note) return null;
    // Ask the browser's built-in PDF viewer to hide its toolbar (download / print
    // buttons) and side panes, where the renderer honours it (Chrome / Edge).
    const src = `${note.fileUrl}#toolbar=0&navpanes=0&statusbar=0`;

    const toggleFullscreen = () => {
        const el = stageRef.current;
        if (!el) return;
        if (document.fullscreenElement) document.exitFullscreen?.();
        else el.requestFullscreen?.().catch(() => {});
    };

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
                    <div className="flex shrink-0 items-center gap-1">
                        <button
                            onClick={toggleFullscreen}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                            aria-label={isFs ? "Exit full screen" : "Expand to full screen"}
                            title={isFs ? "Exit full screen" : "Expand to full screen"}
                        >
                            <Maximize size={15} /> <span className="hidden sm:inline">Expand</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div ref={stageRef} className="relative bg-slate-100">
                    <ProtectedContent
                        enabled
                        contentType="note"
                        contentRef={note.title || note._id || ""}
                        className="bg-slate-100"
                    >
                        <iframe
                            title={note.title || "Premium note"}
                            src={src}
                            className={"w-full " + (isFs ? "h-screen" : "h-[75vh]")}
                        />
                    </ProtectedContent>
                    {/* Toggle sits on the stage so it's reachable in fullscreen too,
                        where the modal header is hidden behind the fullscreen view. */}
                    <button
                        onClick={toggleFullscreen}
                        className="absolute right-3 top-3 z-30 rounded-md bg-black/50 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/70"
                        aria-label={isFs ? "Exit full screen" : "Full screen"}
                        title={isFs ? "Exit full screen" : "Full screen"}
                    >
                        {isFs ? <Minimize size={16} /> : <Maximize size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
