import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, ArrowRight, Tag, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { CART_TIERS } from "@/data/pricing";

const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

// Sticky "shopping" bar shown whenever the cart has items. Surfaces the running
// total, the multi-course discount already applied, and a nudge toward the next
// tier — the founder's "add more, save more" banner. Hidden on the checkout
// page itself (the full summary lives there).
export default function CartBar() {
    const { items, count, totals, clear } = useCart();
    const { pathname } = useLocation();
    if (count === 0 || pathname === "/checkout") return null;

    // Next discount tier the student is one step away from.
    const nextTier = CART_TIERS.find((t) => t.count > count);
    const nudge = nextTier
        ? `Add ${nextTier.count - count} more ${nextTier.count - count === 1 ? "batch" : "batches"} for ${nextTier.off}% off`
        : null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white">
                    <ShoppingCart size={17} />
                    <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1 text-[11px] font-bold text-slate-900">{count}</span>
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{rupee(totals.total)}</span>
                        {totals.discount > 0 && (
                            <span className="text-xs text-slate-400 line-through">{rupee(totals.subtotal)}</span>
                        )}
                        {totals.discount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                <Tag size={10} /> −{rupee(totals.discount)}{totals.capped ? " (max)" : ""}
                            </span>
                        )}
                    </div>
                    {nudge && <p className="truncate text-[11px] font-medium text-indigo-600 dark:text-indigo-400">{nudge}</p>}
                </div>

                <button
                    type="button"
                    onClick={clear}
                    title="Clear cart"
                    className="hidden shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 sm:inline-flex dark:hover:bg-slate-800"
                >
                    <X size={16} />
                </button>
                <Link
                    to="/checkout"
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                    Checkout <ArrowRight size={16} />
                </Link>
            </div>

            {/* compact item chips (desktop) */}
            <div className="mx-auto hidden max-w-5xl flex-wrap gap-1.5 px-4 pb-2 sm:flex">
                {items.map((i) => (
                    <span key={i.slug} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {i.name} · {rupee(i.price)}
                    </span>
                ))}
            </div>
        </div>
    );
}
