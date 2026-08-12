import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { COLLEGES } from "@/data/colleges";

// Closing CTA band for the landing page. Real campus photos drift slowly behind
// the text (two rows, opposite directions) so it reads as "colleges in the
// background", then a brand-gradient scrim drops on top so the thick white copy
// stays perfectly legible in both light and dark. Photos are decorative
// (aria-hidden), lazy-loaded (the band sits near the page bottom), and the drift
// respects prefers-reduced-motion via the shared .marquee-track rule.

// Curated flagship campuses that actually carry a photo — split into two rows.
const withPhoto = (initials) => COLLEGES.find((c) => c.initials === initials && c.image)?.image;
const ROW_A = ["DTU", "NSUT", "VJTI", "IPU", "COEP", "JU"].map(withPhoto).filter(Boolean);
const ROW_B = ["TIET", "MIT", "VIT", "MAIT", "HBTU", "USAR"].map(withPhoto).filter(Boolean);

function DriftRow({ images, dur, reverse }) {
    return (
        <div className="flex overflow-hidden">
            <div
                className="marquee-track flex w-max gap-3"
                style={{ "--marquee-dur": `${dur}s`, animationDirection: reverse ? "reverse" : undefined }}
            >
                {[...images, ...images].map((src, i) => (
                    <img
                        key={i}
                        src={src}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        className="h-24 w-40 shrink-0 rounded-xl object-cover sm:h-28 sm:w-52"
                    />
                ))}
            </div>
        </div>
    );
}

export default function CollegeCtaBand() {
    return (
        <div className="relative mx-auto mt-14 max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-2xl shadow-xl shadow-indigo-600/25">
                {/* Campus photos drifting in the background (decorative) */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-3 opacity-95"
                >
                    <DriftRow images={ROW_A} dur={55} />
                    <DriftRow images={ROW_B} dur={70} reverse />
                </div>

                {/* No brand wash — just a soft dark band through the middle
                    (strongest where the text sits) so the campus photos stay
                    clearly visible. Legibility comes mainly from the text-shadows. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/25 via-slate-950/55 to-slate-950/35"
                />

                {/* Foreground content */}
                <div className="relative flex flex-col items-center gap-4 px-6 py-12 text-center sm:py-14">
                    <h3 className="max-w-3xl text-2xl font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] sm:text-3xl md:text-4xl">
                        Your seat at DTU, NSUT, VJTI &amp; IPU — one decision away.
                    </h3>
                    <p className="max-w-xl text-sm font-semibold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.8)] sm:text-base">
                        Lateral entry into 20+ top government &amp; private colleges. Skip the JEE cut-off — prep
                        with exam-pattern mock tests, PYQs and notes built for LEET.
                    </p>
                    <Link
                        to="/register"
                        className="group relative mt-1 flex items-center gap-2 rounded-lg bg-white px-7 py-3 font-semibold text-indigo-700 shadow-lg transition-all hover:scale-[1.03] active:scale-[0.97] dark:!bg-white dark:!text-indigo-700"
                    >
                        Start preparing
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
