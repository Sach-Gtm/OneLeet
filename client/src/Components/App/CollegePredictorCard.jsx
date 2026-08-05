import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Target, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getCutoffIndex } from "@/Api/CutoffApi";

// Dashboard CTA: if the student picked an exam that has published cut-offs, point
// them to the College Predictor — a "what-if" tool to check which colleges any
// TARGET rank could get, so they can set a goal and prepare toward it. No saved
// rank required; self-gates to nothing when there's no relevant exam.
export default function CollegePredictorCard() {
    const { user } = useAuth();
    const [exam, setExam] = useState(null); // { examCode, examName }

    useEffect(() => {
        const exams = user?.exams || [];
        if (!exams.length) return undefined;
        let alive = true;
        getCutoffIndex()
            .then((rows) => {
                if (!alive) return;
                // An "All LEET" student (exams=["all"]) matches the first exam
                // that has published cut-offs.
                const all = exams.includes("all");
                const match = rows.find((r) => all || exams.includes(r.examCode));
                if (match) setExam({ examCode: match.examCode, examName: match.examName || "" });
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [user?.exams]);

    if (!exam) return null;

    return (
        <Link
            to={`/exam-pattern?exam=${encodeURIComponent(exam.examCode)}`}
            className="group flex items-center gap-3 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 transition hover:shadow-md hover:shadow-indigo-500/10 dark:border-indigo-500/25 dark:from-indigo-500/10 dark:to-slate-900"
        >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white">
                <Target size={18} />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">College Predictor</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Try any target rank and see which {exam.examName || "LEET"} colleges you could get — set a goal and
                    prep toward it.
                </p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-indigo-400 transition-transform group-hover:translate-x-0.5" />
        </Link>
    );
}
