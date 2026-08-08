import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Loader2, BookOpenCheck } from "lucide-react";
import { getPublicExams } from "@/Api/PublicApi";
import { useSeo } from "@/lib/useSeo";

// Public directory of every LEET / lateral-entry exam we cover. Grouped by
// region, searchable, and each card deep-links to the exam's public page. No
// login required — this is the SEO surface for "which exams" queries.
export default function ExamsIndex() {
    const [exams, setExams] = useState(null);
    const [q, setQ] = useState("");

    useSeo({
        title: "LEET Exams by State — Pattern, Eligibility & Syllabus | OneLeet",
        description: "Explore every LEET (Lateral Entry Entrance Test) — IPU, DTU/NSUT, UP (AKTU), Bihar, Haryana and more. Compare exam pattern, eligibility, syllabus, seats and cut-offs, free.",
        path: "/exams",
    });

    useEffect(() => {
        getPublicExams().then(setExams);
    }, []);

    const groups = useMemo(() => {
        const needle = q.trim().toLowerCase();
        const list = (exams || []).filter((e) => !needle || e.name.toLowerCase().includes(needle));
        const map = new Map();
        for (const e of list) {
            const g = e.group || "Other";
            if (!map.has(g)) map.set(g, []);
            map.get(g).push(e);
        }
        return [...map.entries()];
    }, [exams, q]);

    return (
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:pt-32">
            <div className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <BookOpenCheck size={13} /> Every LEET exam, explained
                </span>
                <h1 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl">
                    Explore LEET / lateral-entry exams
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                    Pattern, eligibility, syllabus, seat matrix, cut-offs and sample papers for each
                    exam — all free to explore, no sign-up needed.
                </p>
            </div>

            <div className="mx-auto mt-8 max-w-md">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search exams (IPU, DTU, Bihar, AKTU…)"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm focus:border-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                    />
                </div>
            </div>

            {exams === null ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
            ) : groups.length === 0 ? (
                <p className="mt-12 text-center text-sm text-slate-400">No exams match “{q}”.</p>
            ) : (
                <div className="mt-10 space-y-8">
                    {groups.map(([group, items]) => (
                        <div key={group}>
                            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{group}</h2>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {items.map((e) => (
                                    <Link
                                        key={e.code}
                                        to={`/exams/${e.code}`}
                                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                                    >
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{e.name}</span>
                                        <ArrowRight size={15} className="shrink-0 text-indigo-400 transition group-hover:translate-x-0.5" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
