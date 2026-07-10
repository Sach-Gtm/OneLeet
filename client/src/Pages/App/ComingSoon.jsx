import { Link } from "react-router-dom";
import { Hammer, ArrowLeft } from "lucide-react";

// Placeholder rendered inside the app shell for routes whose feature hasn't
// been built yet, so the sidebar navigation is fully functional in the meantime.
export default function ComingSoon({ title = "This page" }) {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Hammer className="h-6 w-6" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">{title} is coming soon</h1>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
                We&apos;re building this out next. Your dashboard is live in the meantime.
            </p>
            <Link
                to="/dashboard"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
                <ArrowLeft size={15} /> Back to Dashboard
            </Link>
        </div>
    );
}
