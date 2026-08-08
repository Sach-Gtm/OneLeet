import { Outlet } from "react-router-dom";
import Navbar from "@/Components/General/Navbar";
import Footer from "@/Components/General/Footer";
import FloatingWhatsApp from "@/Components/App/FloatingWhatsApp";

// Light marketing shell (soft gradient + navbar) for the public pages. The
// <main> landmark and the site <Footer> live here so every public route — not
// just the home page — gets the primary-content landmark and the footer's
// internal links (no more dead-end pages), which also helps crawlers.
export default function MarketingLayout() {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#FAF9F6] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#FAF9F6] via-[#FAF9F6] to-indigo-50/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />
            <Navbar />
            <main className="relative z-10">
                <Outlet />
            </main>
            <Footer />
            {/* Premium WhatsApp support — self-gates to null for non-premium, so it
                shows on the public site (home included) only for pro students. */}
            <FloatingWhatsApp context="from the OneLeet site" />
        </div>
    );
}
