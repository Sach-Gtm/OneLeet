import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { getCases } from "@/Api/ReviewsApi";
import { useSeo } from "@/lib/useSeo";
import { PortraitImage, StudentMeta, initials } from "@/Components/General/successShared";

// The /success index — every published success story, crawlable and linked from
// the footer so the individual case pages get discovered.
export default function SuccessStories() {
    const [cases, setCases] = useState(null);

    useEffect(() => {
        getCases().then((c) => setCases(c || [])).catch(() => setCases([]));
    }, []);

    useSeo({
        title: "LEET Success Stories: diploma to B.Tech, real students | OneLeet",
        description:
            "Real OneLeet success stories — diploma students who cracked the Lateral Entry Entrance Test and got into 2nd-year B.Tech. See how they did it.",
        path: "/success",
    });

    return (
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
            <div className="mx-auto max-w-2xl text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" /> Success stories
                </span>
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    From diploma to B.Tech — real journeys
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
                    How OneLeet students cracked the Lateral Entry Entrance Test and got into the colleges they wanted.
                </p>
            </div>

            {cases === null ? (
                <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
            ) : cases.length === 0 ? (
                <p className="mt-12 rounded-2xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-400 dark:border-slate-700">
                    Success stories are on the way — check back soon.
                </p>
            ) : (
                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    {cases.map((c) => (
                        <Link
                            key={c._id}
                            to={`/success/${c.slug}`}
                            className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                        >
                            {c.image ? (
                                <PortraitImage src={c.image} alt={c.author || "Student"} className="aspect-[3/4] w-24 shrink-0" rounded="rounded-lg" />
                            ) : (
                                <span className="grid aspect-[3/4] w-24 shrink-0 place-items-center rounded-lg text-2xl font-extrabold text-white" style={{ backgroundImage: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                                    {initials(c.author)}
                                </span>
                            )}
                            <div className="min-w-0 flex-1">
                                <h2 className="line-clamp-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                    {c.caseTitle || `How ${c.author || "a student"} cracked LEET`}
                                </h2>
                                {c.author && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{c.author}</p>}
                                <StudentMeta r={c} className="mt-2" />
                                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                    Read the story <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
