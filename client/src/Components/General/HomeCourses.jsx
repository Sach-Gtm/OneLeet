import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react";
import { getCourses } from "@/Api/CoursesApi";
import CourseBanner from "@/Components/General/CourseBanner";
import SkyClouds from "@/Components/General/SkyClouds";

// Landing-page batches strip: every published course, browsable and free to
// join WITHOUT logging in. Cards deep-link to the public course page. Hides
// itself if nothing is published yet. Cards reflect the signed-in student's
// enrollment (an "Enrolled" badge + "Open" action) via course.enrolled.
export default function HomeCourses() {
    const [courses, setCourses] = useState(null);
    useEffect(() => {
        getCourses().then((list) => setCourses(list || [])).catch(() => setCourses([]));
    }, []);

    if (!courses || courses.length === 0) return null;

    return (
        <section className="relative isolate overflow-hidden py-16 sm:py-20">
            {/* Real sky behind the batches — light-blue with drifting clouds. */}
            <SkyClouds className="absolute inset-0 -z-10" />
            {/* Soft edge fades so the sky band melts into the page above & below. */}
            <span className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-20 bg-gradient-to-b from-[#FAF9F6] to-transparent dark:from-slate-950" />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-20 bg-gradient-to-t from-[#FAF9F6] to-transparent dark:from-slate-950" />

            <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-6 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/10 dark:text-indigo-200">
                    <GraduationCap size={13} /> College-wise batches
                </span>
                <h2 className="mt-3 text-2xl font-bold text-slate-900 drop-shadow-sm sm:text-3xl dark:text-white">Pick your batch, free to join</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-700 dark:text-slate-200">
                    Enroll free and get all the free content of your batch. Premium unlocks ranked mocks,
                    the full paper archive and live doubt classes.
                </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.slice(0, 6).map((c) => (
                    <Link
                        key={c._id || c.slug}
                        to={`/courses/${c.slug}`}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-md shadow-sky-900/5 ring-1 ring-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20 dark:ring-white/5"
                    >
                        <CourseBanner label={c.examName || "LEET"} className="h-24">
                            {c.enrolled && (
                                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                                    <CheckCircle2 size={12} /> Enrolled
                                </span>
                            )}
                        </CourseBanner>
                        <div className="flex flex-1 flex-col p-5">
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{c.name}</h3>
                            {c.tagline && <p className="mt-1.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{c.tagline}</p>}
                            <div className="mt-auto flex items-center justify-between pt-4">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                    <CheckCircle2 size={13} /> {c.enrolled ? "Enrolled" : "Free to join"}
                                </span>
                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                                    {c.enrolled ? "Open" : "View"} <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="mt-8 text-center">
                <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                    See all batches <ArrowRight size={16} />
                </Link>
            </div>
            </div>
        </section>
    );
}
