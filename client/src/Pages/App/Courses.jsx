import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    GraduationCap,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Sparkles,
    ShieldCheck,
} from "lucide-react";
import { getCourses } from "@/Api/CoursesApi";
import CourseBanner, { CourseSky, hueFor } from "@/Components/General/CourseBanner";
import SkyClouds from "@/Components/General/SkyClouds";
import { useSeo } from "@/lib/useSeo";

function CourseCard({ course, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
        >
            <Link
                to={`/courses/${course.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500/40"
            >
                {/* Cover — image if set, else the animated night banner with the exam name. */}
                {course.coverImage?.url ? (
                    <div className="relative h-32 overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800">
                        <img
                            src={course.coverImage.url}
                            alt={course.name}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                        {course.enrolled && (
                            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                                <CheckCircle2 size={12} /> Enrolled
                            </span>
                        )}
                    </div>
                ) : (
                    <CourseBanner label={course.examName || "LEET"} className="h-32">
                        {course.enrolled && (
                            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                                <CheckCircle2 size={12} /> Enrolled
                            </span>
                        )}
                    </CourseBanner>
                )}

                <div className="relative flex flex-1 flex-col p-5">
                    {/* Soft drifting highlight so the body isn't a flat panel. */}
                    <span
                        aria-hidden="true"
                        className="ol-float pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-indigo-400/10 blur-2xl dark:bg-indigo-400/20"
                    />
                    <div className="relative z-10 flex flex-1 flex-col">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {course.name}
                        </h3>
                        {course.tagline && (
                            <p className="mt-1.5 line-clamp-3 text-sm text-slate-500 dark:text-slate-400">
                                {course.tagline}
                            </p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-4">
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={14} /> Free to join
                            </span>
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                {course.enrolled ? "Open" : "View batch"}
                                <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Liquid-glass sheen: a soft light band sweeps across on hover. */}
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-20 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[130%]"
                />
            </Link>
        </motion.div>
    );
}

export default function Courses() {
    const [courses, setCourses] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        getCourses()
            .then((list) => active && setCourses(list))
            .catch((e) => {
                if (!active) return;
                setError(e.message || "Couldn't load courses");
                setCourses([]);
            });
        return () => {
            active = false;
        };
    }, []);

    useSeo({
        title: "LEET Batches: College-wise B.Tech Lateral Entry Prep | OneLeet",
        description: "Join your college-wise LEET batch free: real past papers, ranked mock tests, seat & cut-off data and a plan tied to your exam date. IPU, DTU, UP, Bihar and more.",
        path: "/courses",
    });

    // Only free-to-join LEET exam batches belong here; paid counselling / interview
    // packs (e.g. the MBA Mock PI) live on /pricing, not this "Enroll free" page.
    const batches = (courses || []).filter((c) => (c.kind || "exam") === "exam");

    return (
        <div className="relative min-h-screen">
            {/* Real sky behind the whole batches page — light-blue with clouds. */}
            <SkyClouds className="absolute inset-0 -z-10" />
            <div className="relative mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-28 sm:pt-32">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl p-6 text-white">
                <CourseSky hue={hueFor("Batches")} />
                <div className="relative">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                        <Sparkles size={13} /> Batches
                    </span>
                    <h1 className="mt-3 text-2xl font-bold">Enroll in your batch</h1>
                    <p className="mt-1 max-w-lg text-sm text-indigo-100">
                        Pick the college-wise batch that matches your target exam. Joining is
                        <strong className="font-semibold text-white"> free</strong>: real past
                        papers, ranked mocks, seat &amp; cut-off data and a plan tied to your exam
                        date, all in one place.
                    </p>
                    <Link to="/guarantee" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-amber-300">
                        <ShieldCheck size={13} /> Premium is backed by a 100% money-back guarantee <ArrowRight size={12} />
                    </Link>
                </div>
            </div>

            {/* Loading */}
            {courses === null && (
                <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
            )}

            {/* Empty */}
            {courses !== null && batches.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
                    <GraduationCap className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {error || "No batches are open yet"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                        New batches are added regularly. Check back soon.
                    </p>
                </div>
            )}

            {/* Grid */}
            {courses !== null && batches.length > 0 && (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {batches.map((c, i) => (
                        <CourseCard key={c._id || c.slug} course={c} index={i} />
                    ))}
                </div>
            )}
            </div>
        </div>
    );
}
