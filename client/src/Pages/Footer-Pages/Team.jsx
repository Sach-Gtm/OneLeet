import { Github, Linkedin } from "lucide-react";

const members = [
    {
        name: "Sachin Gautam",
        username: "@sachingautam",
        tagline: "Founder & Full-Stack Developer",
        initials: "SG",
        github: "https://github.com/sach-gtm",
        linkedin: "https://www.linkedin.com/in/sachin-gautam-1484a2227/",
    },
];

export default function Team() {
    return (
        <div className="mx-auto max-w-4xl px-4 pb-24 pt-32 sm:px-6">
            <div className="mb-12 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
                    The people behind OneLeet
                </span>
                <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">The Team</h1>
                <p className="mx-auto mt-3 max-w-xl text-slate-500">
                    A small team building the tool we wish we&apos;d had — set on getting
                    more diploma students into the colleges they deserve.
                </p>
            </div>

            <div className="mx-auto grid max-w-md grid-cols-1 gap-6">
                {members.map((m) => (
                    <div
                        key={m.name}
                        className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                    >
                        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl font-bold text-white shadow-md">
                            {m.initials}
                        </span>
                        <h2 className="mt-4 text-xl font-bold text-slate-900">{m.name}</h2>
                        <p className="text-sm text-slate-400">{m.username}</p>
                        <p className="mt-1 text-sm font-medium text-indigo-600">{m.tagline}</p>

                        <div className="mt-5 flex justify-center gap-3">
                            <a
                                href={m.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                                aria-label="GitHub"
                            >
                                <Github className="h-5 w-5" />
                            </a>
                            <a
                                href={m.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            <p className="mt-12 text-center text-sm text-slate-400">
                OneLeet is built and operated by{" "}
                <span className="font-semibold text-slate-600">StaplerLabs Private Limited</span>.
            </p>
        </div>
    );
}
