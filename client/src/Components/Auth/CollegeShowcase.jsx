import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Sparkles } from "lucide-react";
import { LogoMark } from "@/Components/General/Logo";

// The colleges LEET can open the door to. Names are the official ones (a few
// were gently corrected from common short-forms), and every fact is written to
// be TRUE and defensible — aspiration, not a placement guarantee.
//
// PHOTO-READY: add `image: "<url>"` to any college and the slide will use that
// photograph instead of the branded gradient (the text scrim already sits on
// top, so legibility is preserved). Until then, each shows an on-brand gradient
// with a large monogram so it looks intentional, loads instantly, and carries
// no image-licensing risk.
const COLLEGES = [
    { name: "Delhi Technological University", initials: "DTU", place: "Delhi", tag: "Govt · Flagship",
      fact: "Delhi's flagship engineering university. Through JEE, a seat here is a top-percentile war and years of coaching. LEET gets you the same DTU degree — a different door to the same dream." },
    { name: "Netaji Subhas University of Technology", initials: "NSUT", place: "Delhi", tag: "Govt · Top-tier",
      fact: "Formerly NSIT — among Delhi's most sought-after colleges, with elite recruiters and a powerhouse alumni network. You reach it through LEET, skipping the brutal JEE cut-off." },
    { name: "Jadavpur University", initials: "JU", place: "Kolkata", tag: "Govt · Iconic",
      fact: "One of India's most respected public universities. World-class faculty, deep research and strong placements — at almost no fees." },
    { name: "Maharaja Agrasen Institute of Technology", initials: "MAIT", place: "Delhi", tag: "GGSIPU",
      fact: "A top IPU college with strong IT & core placements and a lively campus in Rohini. LEET is your lateral gateway in." },
    { name: "Maharaja Surajmal Institute of Technology", initials: "MSIT", place: "Delhi", tag: "GGSIPU",
      fact: "A well-loved IPU college with solid placements and a huge, warm alumni base. Enter via LEET — no JEE marathon required." },
    { name: "Guru Gobind Singh Indraprastha University", initials: "IPU", place: "Dwarka, Delhi", tag: "State University",
      fact: "Delhi's own state university — many branches, strong recruiters and low fees. LEET opens the main Dwarka campus to you." },
    { name: "University School of Automation & Robotics", initials: "USAR", place: "Delhi", tag: "GGSIPU · New-age",
      fact: "IPU's future-facing school built for AI, robotics and automation. A modern, fast-rising campus — and LEET-friendly." },
    { name: "Dr. A.P.J. Abdul Kalam Technical University", initials: "AKTU", place: "Lucknow, UP", tag: "Largest tech university",
      fact: "India's largest technical university, with 700+ affiliated colleges. A LEET seat plugs you into a massive recruiter network across UP." },
    { name: "Harcourt Butler Technical University", initials: "HBTU", place: "Kanpur, UP", tag: "Century-old · Govt",
      fact: "A century-old government institute — and where PhysicsWallah's Alakh Pandey studied engineering. Real legacy and strong core branches, reachable through LEET." },
    { name: "College of Engineering, Pune", initials: "COEP", place: "Pune", tag: "Est. 1854 · Govt",
      fact: "Among India's oldest and finest engineering schools, founded in 1854. Blue-chip placements and fierce alumni pride." },
    { name: "J.C. Bose University (YMCA)", initials: "YMCA", place: "Faridabad", tag: "State University · NCR",
      fact: "Haryana's top state technical university, minutes from Delhi-NCR's recruiters. Strong core engineering and steady placements." },
    { name: "Bhagalpur College of Engineering", initials: "BCE", place: "Bhagalpur, Bihar", tag: "Govt · Affordable",
      fact: "A government college with low fees, a degree that counts, and a dependable placement record. Big value, small price." },
    { name: "Veermata Jijabai Technological Institute", initials: "VJTI", place: "Mumbai", tag: "Est. 1887 · Govt",
      fact: "Mumbai's legendary institute, with elite placements and iconic alumni. JEE seats here are cut-throat — LEET is your way in." },
    { name: "MIT, Pune", initials: "MIT", place: "Pune", tag: "Private · Modern",
      fact: "A large, modern private campus with strong industry links and heavy recruiter footfall across Pune's IT belt." },
    { name: "Birla Institute of Technology, Mesra", initials: "BIT", place: "Ranchi", tag: "National brand",
      fact: "A national name in tech, with strong core & IT recruiters and a powerful, well-connected alumni network." },
    { name: "BIT Sindri", initials: "BIT", place: "Dhanbad, Jharkhand", tag: "Est. 1949 · Govt-aided",
      fact: "A historic, respected institute with affordable fees and a solid placement record — a genuine legacy name in the East." },
    { name: "Muzaffarpur Institute of Technology", initials: "MIT", place: "Muzaffarpur, Bihar", tag: "Govt · Affordable",
      fact: "A government college under Bihar's technical university, with low fees and reliable placements. Strong value for money." },
    { name: "Maulana Abul Kalam Azad University of Technology", initials: "MAKAUT", place: "West Bengal", tag: "State University",
      fact: "West Bengal's big technical university, with wide reach across the state and a growing recruiter base." },
    { name: "Manipal Institute of Technology", initials: "MIT", place: "Manipal", tag: "Private · Global brand",
      fact: "One of India's top private institutes, with a world-class campus and blue-chip placements. A brand that opens doors." },
    { name: "Thapar Institute of Engineering & Technology", initials: "TIET", place: "Patiala", tag: "Private · Top-ranked",
      fact: "A consistently top-ranked private university, with strong MNC placements and a serious research culture." },
    { name: "Vellore Institute of Technology", initials: "VIT", place: "Vellore", tag: "Private · Powerhouse",
      fact: "A private powerhouse — massive recruiter drives, high placement volume, and a truly global campus feel." },
    { name: "Sant Longowal Institute of Engineering & Technology", initials: "SLIET", place: "Longowal, Punjab", tag: "Central Govt · LEET",
      fact: "A centrally-funded institute built around lateral entry — LEET is literally its front door. A central-government degree at low fees." },
    { name: "Gujarat Government Colleges (LD, VGEC…)", initials: "GEC", place: "Gujarat", tag: "Govt · Ultra-low fees",
      fact: "Top Gujarat govt colleges like LD & VGEC charge roughly ₹1,500 a year — and tuition is free for girls. An elite education without the price tag." },
];

const GRADIENTS = [
    ["#4338ca", "#7c3aed"], ["#0e7490", "#0891b2"], ["#b91c1c", "#ea580c"],
    ["#1d4ed8", "#3b82f6"], ["#7c3aed", "#a21caf"], ["#0f766e", "#059669"],
    ["#6d28d9", "#c026d3"], ["#b45309", "#d97706"], ["#0369a1", "#0ea5e9"],
    ["#be123c", "#e11d48"],
];

const SLIDE_MS = 4500;

export default function CollegeShowcase({ heading }) {
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
                    {/* full-bleed backdrop: photo if provided, else a live gradient.
                        Slow zoom keeps it moving. */}
                    <motion.div
                        className="absolute inset-0 bg-cover bg-center"
                        style={
                            c.image
                                ? { backgroundImage: `url(${c.image})` }
                                : { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }
                        }
                        initial={{ scale: reduce ? 1 : 1.14 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: SLIDE_MS / 1000 + 1.2, ease: "linear" }}
                    />
                    {/* giant translucent monogram for texture */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="select-none text-[13rem] font-black leading-none text-white/10 xl:text-[16rem]">
                            {c.initials}
                        </span>
                    </div>
                    {/* scrims: keep top logo + bottom text readable, image still shows through */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45" />

                    {/* the facts, over the image with maintained transparency */}
                    <div className="absolute inset-x-0 bottom-0 z-10 px-10 pb-24 pt-10 xl:px-12">
                        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                            <MapPin className="h-3 w-3" /> {c.place} · {c.tag}
                        </span>
                        <h2 className="text-3xl font-extrabold leading-tight text-white drop-shadow-sm xl:text-4xl">
                            {c.name}
                        </h2>
                        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 xl:text-base">
                            {c.fact}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* --- static overlays (persist across slides) --- */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" style={{ height: "30%" }} />

            <div className="relative z-20 flex h-full flex-col justify-between p-10 xl:p-12">
                <div className="space-y-4">
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
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                        <Sparkles className="h-3.5 w-3.5" /> Where LEET can take you
                    </span>
                    {heading && (
                        <h1 className="max-w-[16rem] text-2xl font-extrabold leading-tight text-white drop-shadow-md xl:text-[1.7rem]">
                            {heading}
                        </h1>
                    )}
                </div>

                {/* progress dots + counter */}
                <div className="flex items-center gap-3">
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
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-white/70">
                        {String(i + 1).padStart(2, "0")} / {COLLEGES.length}
                    </span>
                </div>
            </div>
        </div>
    );
}
