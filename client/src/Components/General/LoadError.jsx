import { AlertTriangle, RotateCw } from "lucide-react";

// Shown when a list FETCH fails (as opposed to a genuinely empty result) so a
// cold start or network blip reads as "try again" rather than "there's nothing
// here". Pass onRetry to re-trigger the fetch.
export default function LoadError({ onRetry, label = "Couldn't load this right now." }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
            <AlertTriangle className="mb-2 h-8 w-8 text-amber-400" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
            <p className="mt-0.5 text-xs text-slate-400">It might be a slow connection or the server waking up.</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                    <RotateCw className="h-4 w-4" /> Try again
                </button>
            )}
        </div>
    );
}
