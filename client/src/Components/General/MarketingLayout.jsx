import { Outlet } from "react-router-dom";
import Navbar from "@/Components/General/Navbar";

// Light marketing shell (soft gradient + navbar) for the public pages.
export default function MarketingLayout() {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#FAF9F6] text-slate-900">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#FAF9F6] via-[#FAF9F6] to-indigo-50/50" />
            <Navbar />
            <div className="relative z-10">
                <Outlet />
            </div>
        </div>
    );
}
