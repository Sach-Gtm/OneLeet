import { CheckCircle2 } from "lucide-react";
import { useSeo } from "@/lib/useSeo";

const mentors = [
    { name: "Sachin Gautam", handle: "@sachingautam", exam: "IPU LEET 2025", initials: "SG" },
    { name: "Ayush", handle: null, exam: "IPU LEET 2025", initials: "A" },
];

export default function Mentors() {
    useSeo({
        title: "LEET Mentors — Learn from students who cracked it | OneLeet",
        description:
            "Meet OneLeet's mentors — LEET qualifiers who've sat exactly where you are and know what it takes to get into 2nd year B.Tech through lateral entry.",
        path: "/mentor",
    });
    return (
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-32 sm:px-6">
            <div className="mb-12 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
                    Learn from those who cracked it
                </span>
                <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
                    Meet Your Mentors
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-slate-500">
                    LEET qualifiers who&apos;ve sat exactly where you are — and know precisely
                    what it takes to get in.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {mentors.map((m) => (
                    <div
                        key={m.name}
                        className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
                    >
                        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xl font-bold text-white shadow">
                            {m.initials}
                        </span>
                        <div className="min-w-0">
                            <h3 className="text-xl font-bold text-slate-900">{m.name}</h3>
                            {m.handle && <p className="text-sm text-slate-400">{m.handle}</p>}
                            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Cleared {m.exam}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
