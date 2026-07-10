import React from "react";
import { Award, GraduationCap } from "lucide-react";

const mentors = [
    {
        name: "Sachin Gautam",
        handle: "@sachingautam",
        rank: 54,
        exam: "IPU LEET 2025",
    },
    {
        name: "Ayush",
        handle: null,
        rank: 63,
        exam: "IPU LEET 2025",
    },
];

const Mentors = () => {
    return (
        <div className="relative min-h-screen w-full bg-black overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-black/40 backdrop-blur-[6px] glass-noise" />

            <div className="relative z-10 mx-auto max-w-5xl px-4 pt-40 pb-20">
                <div className="mb-12 text-center">
                    <h1 className="text-3xl font-bold text-white md:text-4xl">
                        Meet Your Mentors
                    </h1>
                    <p className="mx-auto mt-3 max-w-xl text-gray-400">
                        Learn from LEET toppers who cracked the exam and know exactly
                        what it takes to get in.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {mentors.map((m, i) => (
                        <div
                            key={i}
                            className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md transition-all hover:border-yellow-400/40 hover:bg-white/[0.06]"
                        >
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-500 px-3 py-1 text-sm font-bold text-black">
                                    <Award className="h-4 w-4" />
                                    Rank {m.rank}
                                </span>
                                <GraduationCap className="h-6 w-6 text-white/30" />
                            </div>

                            <h3 className="mt-5 text-xl font-bold text-white">
                                {m.name}
                            </h3>
                            {m.handle && (
                                <p className="text-sm text-gray-400">{m.handle}</p>
                            )}
                            <p className="mt-1 text-sm font-medium text-yellow-400">
                                {m.exam}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Mentors;
