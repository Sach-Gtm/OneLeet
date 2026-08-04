import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Target, ArrowRight, Sparkles, Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getCutoffIndex, getCutoffs } from "@/Api/CutoffApi";
import { eligibleCodes, evaluateBranch, catLabel } from "@/lib/collegePredictor";

// Dashboard teaser: if the student saved a LEET rank and picked an exam that has
// published cut-offs, show how many colleges they'd get and a few names, linking
// to the full predictor. If they picked such an exam but have no rank yet, nudge
// them to add one. Otherwise renders nothing.
export default function PredictedCollegesCard() {
    const { user } = useAuth();
    const [examCode, setExamCode] = useState(null);
    const [examName, setExamName] = useState("");
    const [cutoff, setCutoff] = useState(null);

    const rank = Number(user?.leetRank) || 0;
    const hasRank = rank > 0;

    // Find an exam the student chose that actually has cut-offs.
    useEffect(() => {
        const exams = user?.exams || [];
        if (!exams.length) return undefined;
        let alive = true;
        getCutoffIndex()
            .then((rows) => {
                if (!alive) return;
                const match = rows.find((r) => exams.includes(r.examCode));
                if (match) {
                    setExamCode(match.examCode);
                    setExamName(match.examName || "");
                }
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [user?.exams]);

    // Pull the cut-offs only once we have a matching exam AND a rank to predict.
    useEffect(() => {
        if (!examCode || !hasRank) return undefined;
        let alive = true;
        getCutoffs(examCode)
            .then((c) => alive && setCutoff(c))
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [examCode, hasRank]);

    const result = useMemo(() => {
        if (!cutoff || !hasRank) return null;
        const codes = eligibleCodes(user?.leetCategory || "general", user?.leetRegion || "delhi");
        const names = new Set();
        for (const rnd of cutoff.rounds || []) {
            for (const col of rnd.colleges || []) {
                for (const b of col.branches || []) {
                    if (evaluateBranch(b.cells, rank, codes)) {
                        names.add(col.name);
                        break;
                    }
                }
            }
        }
        return { count: names.size, names: Array.from(names).slice(0, 4) };
    }, [cutoff, hasRank, rank, user?.leetCategory, user?.leetRegion]);

    if (!examCode) return null; // no chosen exam has cut-offs

    // Has the exam but no rank → nudge to add one.
    if (!hasRank) {
        return (
            <Link
                to="/profile"
                className="flex items-center gap-3 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4 transition hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10"
            >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white">
                    <Target size={18} />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Predict your colleges</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Add your {examName || "LEET"} rank in your profile to see which colleges you&apos;d get.
                    </p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-indigo-400" />
            </Link>
        );
    }

    if (!result) return null; // still loading the cut-offs

    return (
        <Link
            to={`/exam-pattern?exam=${encodeURIComponent(examCode)}`}
            className="group block rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 transition hover:shadow-md hover:shadow-indigo-500/10 dark:border-indigo-500/25 dark:from-indigo-500/10 dark:to-slate-900"
        >
            <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white">
                    <Sparkles size={18} />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Your predicted colleges</p>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                        With rank <b className="text-slate-900 dark:text-slate-100">{rank.toLocaleString("en-IN")}</b> as{" "}
                        <b>{catLabel(user?.leetCategory || "general")}</b>, you&apos;d get{" "}
                        <b className="text-indigo-700 dark:text-indigo-300">
                            {result.count} college{result.count === 1 ? "" : "s"}
                        </b>{" "}
                        in {examName || "your exam"}.
                    </p>
                    {result.names.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {result.names.map((n) => (
                                <span
                                    key={n}
                                    className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300"
                                >
                                    <Building2 size={11} className="text-indigo-500" /> {n}
                                </span>
                            ))}
                            {result.count > result.names.length && (
                                <span className="text-[11px] font-semibold text-slate-400">
                                    +{result.count - result.names.length} more
                                </span>
                            )}
                        </div>
                    )}
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        Open the College Predictor
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </p>
                </div>
            </div>
        </Link>
    );
}
