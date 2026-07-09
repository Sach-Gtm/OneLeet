import { Outlet } from "react-router-dom";
import { StarsBackground } from "@/Components/animate-ui/components/backgrounds/stars";
import Navbar from "@/Components/General/Navbar";

// Dark marketing shell (star background + navbar) for the public pages.
export default function MarketingLayout() {
    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            <StarsBackground className="absolute inset-0 -z-10" />
            <Navbar />
            <div className="relative z-10">
                <Outlet />
            </div>
        </div>
    );
}
