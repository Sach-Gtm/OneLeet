import { Link } from "react-router-dom";
import { Crown, X, Check } from "lucide-react";

// Shown when a free student tries to open premium content. Explains the perk and
// sends them to the Pricing page (where checkout will live; today a placeholder).
export default function PremiumGateModal({ open, onClose, itemTitle }) {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600">
                    <Crown size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">This is Premium content</h3>
                <p className="mt-1 text-sm text-slate-500">
                    {itemTitle ? <span className="font-medium text-slate-600">“{itemTitle}” </span> : null}
                    is for Premium students. Upgrade to unlock all premium notes, tests, videos &amp; syllabi.
                </p>
                <ul className="mx-auto mt-4 max-w-[15rem] space-y-1.5 text-left text-xs text-slate-600">
                    {["All premium mock tests & practice sets", "Premium notes, videos & syllabi", "Higher daily AI limits"].map(
                        (perk) => (
                            <li key={perk} className="flex items-start gap-1.5">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> {perk}
                            </li>
                        )
                    )}
                </ul>
                <Link
                    to="/pricing"
                    onClick={onClose}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                    <Crown size={16} /> See Premium plans
                </Link>
                <button onClick={onClose} className="mt-2 text-xs font-medium text-slate-400 hover:text-slate-600">
                    Maybe later
                </button>
            </div>
        </div>
    );
}
