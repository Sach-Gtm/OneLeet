import { MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isPremium } from "@/lib/roles";
import { whatsappLink, WHATSAPP_RESPONSE } from "@/config/support";

// Premium-only floating WhatsApp button — the universal "chat bubble" every site
// has, pinned bottom-right with a pulsing ring to catch the eye. Self-gates to
// null for non-premium users. Mounted only where wanted (the dashboard).
export default function FloatingWhatsApp({ context = "" }) {
    const { user } = useAuth();
    if (!isPremium(user)) return null;

    const msg = `Hi OneLeet team, I'm ${user?.name || "a premium student"}${
        context ? ` (${context})` : ""
    } and need some help with my preparation.`;

    return (
        <a
            href={whatsappLink(msg)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="group fixed bottom-5 right-5 z-40 flex items-center"
        >
            {/* Hover tooltip */}
            <span className="pointer-events-none mr-3 hidden max-w-[180px] rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg group-hover:block dark:bg-slate-700">
                Premium support · we reply {WHATSAPP_RESPONSE}
            </span>
            <span className="relative grid h-14 w-14 place-items-center">
                {/* pulsing ring */}
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/30" />
                {/* button */}
                <span className="relative grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition group-hover:scale-105 group-hover:bg-emerald-700">
                    <MessageCircle size={26} />
                </span>
                {/* 6h badge */}
                <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-[9px] font-extrabold text-slate-900 ring-2 ring-white dark:ring-slate-900">
                    6h
                </span>
            </span>
        </a>
    );
}
