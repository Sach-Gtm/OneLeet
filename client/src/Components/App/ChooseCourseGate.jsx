import { Link } from "react-router-dom";
import { GraduationCap, ArrowRight, Sparkles } from "lucide-react";

// Shown in place of a content page when a signed-in student hasn't joined any
// batch yet. Signing up doesn't require a course, but opening content does —
// so we point them to the (free-to-join) batches. `label` names what they were
// trying to open ("tests", "notes", …).
export default function ChooseCourseGate({ label = "this content" }) {
    return (
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <GraduationCap size={26} />
            </span>
            <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-slate-100">
                Choose a course to unlock {label}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Enroll in a college-wise batch to see its tests, notes, syllabus and papers.
                Joining is <strong className="font-semibold text-slate-700 dark:text-slate-200">free</strong>-
                premium unlocks ranked mocks, the full archive and live doubt classes.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                    <Sparkles size={16} /> Browse courses, free
                </Link>
                <Link
                    to="/pricing"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    See premium <ArrowRight size={15} />
                </Link>
            </div>
        </div>
    );
}
