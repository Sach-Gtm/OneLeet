import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

// A subtle "Install the app" banner. It appears only when the browser fires
// `beforeinstallprompt` (i.e. the PWA is genuinely installable and not already
// installed), and it's dismissible — once dismissed it stays quiet.
const DISMISS_KEY = "ol_pwa_dismissed";

export default function InstallPrompt() {
    const [deferred, setDeferred] = useState(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Already running as an installed app, or dismissed before → never show.
        const standalone =
            window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone;
        if (standalone || localStorage.getItem(DISMISS_KEY)) return undefined;

        const onPrompt = (e) => {
            e.preventDefault(); // keep the event so we can trigger it from our button
            setDeferred(e);
            setShow(true);
        };
        const onInstalled = () => setShow(false);
        window.addEventListener("beforeinstallprompt", onPrompt);
        window.addEventListener("appinstalled", onInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", onPrompt);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    if (!show) return null;

    const install = async () => {
        if (!deferred) return;
        deferred.prompt();
        try {
            await deferred.userChoice;
        } catch {
            /* user dismissed the native sheet */
        }
        setShow(false);
        setDeferred(null);
    };
    const dismiss = () => {
        try {
            localStorage.setItem(DISMISS_KEY, "1");
        } catch {
            /* storage unavailable — just hide for this session */
        }
        setShow(false);
    };

    return (
        <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:inset-x-auto sm:right-4 sm:w-80">
            <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Download size={20} />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Install the OneLeet app</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Full-screen and faster, right on your home screen.</p>
                </div>
                <button onClick={dismiss} className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Dismiss">
                    <X size={16} />
                </button>
            </div>
            <button onClick={install} className="mt-2.5 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
                Install app
            </button>
        </div>
    );
}
