import { useEffect, useMemo, useRef, useState } from "react";
import { ShieldAlert, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import {
    reportAbuse,
    watermarkText,
    watermarkImage,
    openedStamp,
} from "@/lib/contentProtection";

// Injected once: blanks the page when the user tries to print / "Save as PDF"
// while premium content is on screen (body carries the class only then).
const PRINT_STYLE_ID = "oneleet-print-guard";
function ensurePrintGuard() {
    if (typeof document === "undefined" || document.getElementById(PRINT_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = PRINT_STYLE_ID;
    style.textContent = `@media print {
  body.oneleet-premium-live * { visibility: hidden !important; }
  body.oneleet-premium-live::before {
    content: "This premium OneLeet content can't be printed. Please study it inside the app.";
    visibility: visible; display: block; position: fixed; top: 42%; left: 0; right: 0;
    padding: 0 40px; text-align: center; font-family: Arial, Helvetica, sans-serif;
    font-size: 18px; font-weight: 700; color: #0f172a;
  }
}`;
    document.head.appendChild(style);
}

// Wraps premium content with the full deterrent + detection layer:
//  • a per-student identity watermark tiled over the content (traceable leaks),
//  • blocks right-click / text-selection / copy / drag,
//  • blocks Ctrl/Cmd+S, Ctrl/Cmd+P and flags PrintScreen + dev-tools,
//  • blacks the content out whenever the tab is hidden or loses focus
//    (frustrates screen recording and capture-while-multitasking),
//  • reports every detectable attempt to the server (admins get alerted).
//
// When `enabled` is false (free content, or trusted staff), it renders children
// untouched — zero overhead and no behaviour change for non-premium content.
export default function ProtectedContent({
    children,
    contentType = "general",
    contentRef = "",
    enabled = true,
    className = "",
}) {
    const { user } = useAuth();
    const [obscured, setObscured] = useState(false); // tab hidden / lost focus
    const [flash, setFlash] = useState(false); // brief black on screenshot key
    const flashTimer = useRef(null);

    const stamp = useRef(openedStamp());
    const wmImage = useMemo(
        () => watermarkImage(watermarkText(user), stamp.current),
        [user]
    );

    const report = (type) => reportAbuse({ type, contentType, contentRef });

    useEffect(() => {
        if (!enabled) return undefined;
        ensurePrintGuard();
        document.body.classList.add("oneleet-premium-live");

        const warn = (msg) => toast(msg, { icon: "🔒" });

        const onKeyDown = (e) => {
            const key = (e.key || "").toLowerCase();
            const meta = e.ctrlKey || e.metaKey;
            // Save page
            if (meta && key === "s") {
                e.preventDefault();
                report("save");
                warn("Saving premium content is disabled.");
                return;
            }
            // Print / Save-as-PDF
            if (meta && key === "p") {
                e.preventDefault();
                report("print");
                warn("Printing premium content is disabled.");
                return;
            }
            // Copy (belt-and-braces alongside the onCopy handler)
            if (meta && key === "c") {
                report("copy");
                return;
            }
            // Dev tools (can't truly block, but flag it)
            if (key === "f12" || (meta && e.shiftKey && ["i", "j", "c"].includes(key))) {
                report("devtools");
                return;
            }
        };

        // PrintScreen usually only surfaces on keyup (Windows). Briefly black the
        // screen so a capture taken right then grabs the overlay, and flag it.
        const onKeyUp = (e) => {
            if ((e.key || "").toLowerCase() === "printscreen") {
                report("screenshot");
                warn("Screenshots of premium content are monitored.");
                setFlash(true);
                clearTimeout(flashTimer.current);
                flashTimer.current = setTimeout(() => setFlash(false), 1200);
            }
        };

        const hide = () => {
            if (document.hidden) {
                setObscured(true);
                report("tab-hidden");
            }
        };
        const onBlur = () => setObscured(true);
        const onFocus = () => setObscured(false);
        const onBeforePrint = () => report("print");

        window.addEventListener("keydown", onKeyDown, true);
        window.addEventListener("keyup", onKeyUp, true);
        document.addEventListener("visibilitychange", hide);
        window.addEventListener("blur", onBlur);
        window.addEventListener("focus", onFocus);
        window.addEventListener("beforeprint", onBeforePrint);

        return () => {
            document.body.classList.remove("oneleet-premium-live");
            window.removeEventListener("keydown", onKeyDown, true);
            window.removeEventListener("keyup", onKeyUp, true);
            document.removeEventListener("visibilitychange", hide);
            window.removeEventListener("blur", onBlur);
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("beforeprint", onBeforePrint);
            clearTimeout(flashTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, contentType, contentRef]);

    // Disabled (free content or trusted staff): behave as a plain wrapper so the
    // caller's layout className (e.g. the video's aspect-box, the guide's
    // centering) is preserved — just without the watermark/blackout/handlers.
    if (!enabled) return <div className={className}>{children}</div>;

    const block = (type) => (e) => {
        e.preventDefault();
        if (type) report(type);
    };

    return (
        <div
            className={`relative select-none ${className}`}
            style={{ WebkitUserSelect: "none", userSelect: "none" }}
            onContextMenu={block("context-menu")}
            onCopy={block("copy")}
            onCut={block("copy")}
            onDragStart={block(null)}
        >
            {children}

            {/* Identity watermark — tiled over the content, non-interactive. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10"
                style={{ backgroundImage: wmImage, backgroundRepeat: "repeat" }}
            />

            {/* Black-out overlay: tab hidden / focus lost / screenshot flash. */}
            {(obscured || flash) && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-slate-950 px-6 text-center text-slate-200">
                    {flash ? (
                        <ShieldAlert className="h-8 w-8 text-amber-400" />
                    ) : (
                        <EyeOff className="h-8 w-8 text-slate-400" />
                    )}
                    <p className="text-sm font-semibold">
                        {flash
                            ? "Screenshots are monitored"
                            : "Content hidden"}
                    </p>
                    <p className="max-w-xs text-xs text-slate-400">
                        {flash
                            ? "This premium content is watermarked to your account."
                            : "Return to this tab to keep viewing your premium content."}
                    </p>
                </div>
            )}
        </div>
    );
}
