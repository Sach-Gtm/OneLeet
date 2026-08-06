import { MessageCircle, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isPremium } from "@/lib/roles";
import { whatsappLink, WHATSAPP_RESPONSE } from "@/config/support";

// Premium-only WhatsApp support. Rendered for pro students only (the founder's
// call — it's a paid perk); everyone else sees nothing. `variant="card"` is the
// dashboard block; `variant="inline"` is a compact button.
export default function PremiumWhatsApp({ variant = "card", context = "" }) {
    const { user } = useAuth();
    if (!isPremium(user)) return null;

    const msg = `Hi OneLeet team, I'm ${user?.name || "a premium student"}${
        context ? ` (${context})` : ""
    } and need some help with my preparation.`;
    const href = whatsappLink(msg);

    if (variant === "inline") {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
                <MessageCircle size={15} /> Chat on WhatsApp
            </a>
        );
    }

    return (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/25 dark:bg-emerald-500/10">
            <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
                    <MessageCircle size={20} />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Premium WhatsApp support</h3>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                        Stuck on a topic, a test or the counselling process? Message our team directly.
                    </p>
                    <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <Clock size={11} /> We reply {WHATSAPP_RESPONSE}
                    </p>
                </div>
            </div>
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
                <MessageCircle size={16} /> Chat with us on WhatsApp
            </a>
        </div>
    );
}
