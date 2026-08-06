import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Compass } from "lucide-react";
import { LogoMark } from "@/Components/General/Logo";
import { COLLEGES } from "@/data/colleges";

const GRADIENTS = [
    ["#4338ca", "#7c3aed"], ["#0e7490", "#0891b2"], ["#b91c1c", "#ea580c"],
    ["#1d4ed8", "#3b82f6"], ["#7c3aed", "#a21caf"], ["#0f766e", "#059669"],
    ["#6d28d9", "#c026d3"], ["#b45309", "#d97706"], ["#0369a1", "#0ea5e9"],
    ["#be123c", "#e11d48"],
];

const SLIDE_MS = 4500;

export default function CollegeShowcase({ heading, compact = false }) {
    const [i, setI] = useState(0);
    const reduce = useReducedMotion();

    useEffect(() => {
        if (reduce) return;
        const id = setInterval(() => setI((p) => (p + 1) % COLLEGES.length), SLIDE_MS);
        return () => clearInterval(id);
    }, [reduce]);

    const c = COLLEGES[i];
    const [from, to] = GRADIENTS[i % GRADIENTS.length];

    return (
        <div className="absolute inset-0 overflow-hidden bg-slate-900">
            <AnimatePresence>
                <motion.div
                    key={i}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: "easeInOut" }}
                >
                    {/* gradient base — also the graceful fallback if a photo fails */}
                    <div
                        className="absolute inset-0"
                        style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
                    />
                    {/* real campus photo on top, if we have one. Slow zoom keeps it
                        moving; if it ever fails to load it hides itself and the
                        gradient beneath shows through. */}
                    {c.image && (
                        <motion.img
                            src={c.image}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                            }}
                            initial={{ scale: reduce ? 1 : 1.14 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: SLIDE_MS / 1000 + 1.2, ease: "linear" }}
                        />
                    )}
                    {/* giant translucent monogram for texture */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="select-none text-[13rem] font-black leading-none text-white/10 xl:text-[16rem]">
                            {c.initials}
                        </span>
                    </div>
                    {/* Brand overlay in the OneLeet colours: ~50% blue + ~25%
                        saffron/orange + ~25% black. One cohesive brand tone over
                        every campus photo, text kept crisp, image still showing
                        through. The black leans to the bottom to hold the text. */}
                    <div className="absolute inset-0 bg-[#3FB0D6]/50" />
                    <div className="absolute inset-0 bg-[#EC7A54]/25" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-black/15" />

                    {/* the facts, over the image with maintained transparency */}
                    <div className={`absolute inset-x-0 bottom-0 z-10 ${compact ? "px-5 pb-11 pt-8" : "px-10 pb-24 pt-10 xl:px-12"}`}>
                        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                            <MapPin className="h-3 w-3" /> {c.place} · {c.tag}
                        </span>
                        <h2 className={`font-extrabold leading-tight text-white drop-shadow-sm ${compact ? "text-lg" : "text-3xl xl:text-4xl"}`}>
                            {c.name}
                        </h2>
                        {!compact && (
                            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 xl:text-base">
                                {c.fact}
                            </p>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* --- static overlays (persist across slides) --- */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" style={{ height: "30%" }} />

            <div className={`relative z-20 flex h-full flex-col justify-between ${compact ? "p-5" : "p-10 xl:p-12"}`}>
                <div className="space-y-4">
                    {!compact && (
                        <Link to="/" className="flex items-center gap-2.5">
                            <LogoMark size={44} animated />
                            <div className="leading-tight">
                                <span className="block text-lg font-extrabold tracking-tight">
                                    <span className="text-[#EC7A54]">One</span>
                                    <span className="text-[#5ec8ea]">Leet</span>
                                </span>
                                <span className="block text-[10px] font-medium text-white/60">
                                    A StaplerLabs product
                                </span>
                            </div>
                        </Link>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                        <Compass className="h-3.5 w-3.5" /> Where LEET can take you
                    </span>
                    {!compact && heading && (
                        <h1 className="max-w-[16rem] text-2xl font-extrabold leading-tight text-white drop-shadow-md xl:text-[1.7rem]">
                            {heading}
                        </h1>
                    )}
                </div>

                {/* progress dots + counter + photo credit */}
                <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                        {!compact && (
                            <div className="flex flex-1 flex-wrap gap-1.5">
                                {COLLEGES.map((_, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        aria-label={`Show ${COLLEGES[idx].initials}`}
                                        onClick={() => setI(idx)}
                                        className={`h-1.5 rounded-full transition-all ${
                                            idx === i ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                        <span className={`shrink-0 text-xs font-semibold tabular-nums text-white/70 ${compact ? "ml-auto" : ""}`}>
                            {String(i + 1).padStart(2, "0")} / {COLLEGES.length}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
