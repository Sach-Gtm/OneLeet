import { Award, GraduationCap } from "lucide-react";

const mentors = [
    { name: "Sachin Gautam", handle: "@sachingautam", rank: 54, exam: "IPU LEET 2025", initials: "SG" },
    { name: "Ayush", handle: null, rank: 63, exam: "IPU LEET 2025", initials: "A" },
];

export default function Mentors() {
    return (
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-32 sm:px-6">
            <div className="mb-12 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-600 shadow-sm">
                    Learn from those who cracked it
                </span>
                <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
                    Meet Your Mentors
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-slate-500">
                    LEET rank-holders who&apos;ve sat exactly where you are — and know
                    precisely what it takes to get in.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {mentors.map((m) => (
                    <div
                        key={m.name}
                        className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-amber-200 hover:shadow-md"
                    >
                        <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1 text-sm font-bold text-white shadow-sm">
                                <Award className="h-4 w-4" /> Rank {m.rank}
                            </span>
                            <GraduationCap className="h-6 w-6 text-slate-200" />
                        </div>

                        <div className="mt-5 flex items-center gap-4">
                            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-bold text-white shadow">
                                {m.initials}
                            </span>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{m.name}</h3>
                                {m.handle && <p className="text-sm text-slate-400">{m.handle}</p>}
                                <p className="mt-0.5 text-sm font-semibold text-amber-600">{m.exam}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
