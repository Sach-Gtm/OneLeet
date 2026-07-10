import React from "react";
import { Github, Linkedin } from "lucide-react";

const members = [
    {
        name: "Sachin Gautam",
        username: "@sachingautam",
        tagline: "Founder & Full Stack Developer",
        github: "https://github.com/sach-gtm",
        linkedin: "https://www.linkedin.com/in/sachin-gautam-1484a2227/",
    },
];

const Team = () => {
    return (
        <div className="relative min-h-screen w-full bg-black overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-black/40 backdrop-blur-[6px] glass-noise" />

            <div className="relative z-10 flex flex-col items-center px-4 pt-40 pb-20">
                <div className="mb-12 text-center">
                    <h1 className="text-3xl font-bold text-white md:text-4xl">
                        The Team
                    </h1>
                    <p className="mx-auto mt-3 max-w-xl text-gray-400">
                        The people building OneLeet.
                    </p>
                </div>

                <div className="grid w-full max-w-md grid-cols-1 gap-6">
                    {members.map((m, index) => (
                        <div
                            key={index}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-md"
                        >
                            <h2 className="text-xl font-bold text-white">
                                {m.name}
                            </h2>
                            <p className="text-sm text-gray-400">{m.username}</p>
                            <p className="mt-2 text-sm italic text-gray-300">
                                {m.tagline}
                            </p>

                            <div className="mt-5 flex justify-center gap-4">
                                <a
                                    href={m.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
                                >
                                    <Github className="h-5 w-5 text-white" />
                                </a>
                                <a
                                    href={m.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
                                >
                                    <Linkedin className="h-5 w-5 text-white" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Team;
