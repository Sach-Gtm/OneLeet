import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react";
import { getCourses } from "@/Api/CoursesApi";
import CourseBanner from "@/Components/General/CourseBanner";

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
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
            <div className="mb-6 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    <GraduationCap size={13} /> College-wise batches
                </span>
                <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Pick your batch, free to join</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
                    Enroll free and get all the free content of your batch. Premium unlocks ranked mocks,
                    the full paper archive and live doubt classes.
                </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.slice(0, 6).map((c) => (
                    <Link
                        key={c._id || c.slug}
                        to={`/courses/${c.slug}`}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <CourseBanner label={c.examName || "LEET"} className="h-24">
                            {c.enrolled && (
                                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                                    <CheckCircle2 size={12} /> Enrolled
                                </span>
                            )}
                        </CourseBanner>
                        <div className="flex flex-1 flex-col p-5">
                            <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                            {c.tagline && <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{c.tagline}</p>}
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
        </section>
    );
}
