import { Medal } from "lucide-react";
import { cn } from "@/lib/utils";

// Premium podium medal — a crisp SVG (lucide) tinted gold / silver / bronze,
// replacing the 🥇🥈🥉 emojis for a cleaner, on-brand feel. Ranks outside the
// Top 3 render a plain rank number, so this can stand in anywhere a rank is
// shown. Size via a Tailwind h-/w- className (defaults to h-5 w-5).
const TINT = {
    1: "text-amber-500", // gold
    2: "text-slate-400", // silver
    3: "text-orange-400", // bronze
};

export default function RankMedal({ rank, className, withHash = false }) {
    const tint = TINT[rank];
    if (!tint) {
        return (
            <span className={cn("text-sm font-semibold text-slate-500", className)}>
                {withHash ? `#${rank}` : rank}
            </span>
        );
    }
    return <Medal className={cn("h-5 w-5", tint, className)} aria-label={`Rank ${rank}`} />;
}
