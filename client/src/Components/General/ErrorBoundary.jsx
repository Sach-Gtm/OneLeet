import { Component } from "react";
import { reloadOnceForStaleChunk } from "@/lib/reloadOnce";

// Secondary net for stale-chunk failures that reach React as a render error
// (the primary handler is the `vite:preloadError` listener in main.jsx). Without
// a boundary these unmount the whole tree — a blank screen. Here we reload once
// to recover, and fall back to a friendly retry screen for anything else.
function isChunkLoadError(error) {
    const msg = (error && (error.message || String(error))) || "";
    return (
        /dynamically imported module/i.test(msg) ||
        /Loading chunk/i.test(msg) ||
        /importing a module script failed/i.test(msg) ||
        /Failed to fetch/i.test(msg)
    );
}

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error) {
        // Try a one-time reload for stale-chunk errors; if that's exhausted (or
        // it's a different error) we render the retry screen below.
        if (isChunkLoadError(error) && reloadOnceForStaleChunk()) return;
        console.error("App error boundary caught:", error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
                    <h1 className="text-xl font-semibold text-slate-800">
                        Something went wrong
                    </h1>
                    <p className="max-w-sm text-sm text-slate-500">
                        The app hit an unexpected error. Reloading usually fixes
                        it.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                    >
                        Reload
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
