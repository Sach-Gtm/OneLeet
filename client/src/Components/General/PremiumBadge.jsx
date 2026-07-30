import { Crown, Lock } from "lucide-react";

// A small "Premium" pill shown on any content marked premium. When `locked`
// (a free student who can't open it yet) it shows a lock; otherwise a crown.
// Used across Tests, Notes, Videos and Syllabus so premium reads the same
// everywhere.
export default function PremiumBadge({ locked = false, className = "" }) {
    return (
        <span
            className={
                "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 " +
                className
            }
            title={locked ? "Premium — upgrade to unlock" : "Premium content"}
        >
            {locked ? <Lock className="h-3 w-3" /> : <Crown className="h-3 w-3" />} Premium
        </span>
    );
}
