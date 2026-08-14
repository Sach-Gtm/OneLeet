/* eslint-disable react-refresh/only-export-components -- small shared helpers + presentational bits for the Success Wall */
import { Star, GraduationCap, Trophy, Building2, BookOpen } from "lucide-react";

export const initials = (name) =>
    (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

// A portrait photo in a fixed portrait frame: a blurred copy of the image fills
// the frame so nothing is cropped, with the full image shown (object-contain) on
// top. Keeps every screenshot readable at a uniform portrait size.
export function PortraitImage({ src, alt = "", className = "", rounded = "rounded-xl" }) {
    return (
        <div className={`relative overflow-hidden bg-slate-900 ${rounded} ${className}`}>
            <img src={src} aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-lg" />
            <img src={src} alt={alt} className="relative h-full w-full object-contain" loading="lazy" />
        </div>
    );
}

// The optional student details as compact chips — only the ones present show.
export function StudentMeta({ r, className = "" }) {
    const items = [
        r.exam && { icon: GraduationCap, text: r.exam },
        r.rank && { icon: Trophy, text: r.rank },
        r.college && { icon: Building2, text: r.college },
        r.branch && { icon: BookOpen, text: r.branch },
    ].filter(Boolean);
    if (!items.length) return null;
    return (
        <div className={`flex flex-wrap gap-1.5 ${className}`}>
            {items.map((it, i) => {
                const Icon = it.icon;
                return (
                    <span key={i} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Icon size={11} className="text-indigo-500" /> {it.text}
                    </span>
                );
            })}
        </div>
    );
}

export function Stars({ size = 11 }) {
    return (
        <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={size} className="fill-amber-400 text-amber-400" />
            ))}
        </div>
    );
}
