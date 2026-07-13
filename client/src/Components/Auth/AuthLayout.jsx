import { Link } from "react-router-dom";
import { LogoMark } from "@/Components/General/Logo";
import CollegeShowcase from "@/Components/Auth/CollegeShowcase";

// Shared split-panel shell for the light auth screens (login / register /
// forgot / reset). Left = a moving showcase of the colleges LEET can open the
// door to (hidden on mobile). Right = the form. Extra props (subheading, stats,
// variant) passed by some screens are intentionally ignored here now.
export default function AuthLayout({ heading, children }) {
    return (
        <div className="grid min-h-screen w-full bg-white lg:grid-cols-2">
            {/* College showcase panel (desktop only) */}
            <div className="relative hidden overflow-hidden lg:block">
                <CollegeShowcase heading={heading} />
            </div>

            {/* Form panel */}
            <div className="flex items-center justify-center px-6 py-10 sm:px-10">
                <div className="w-full max-w-md">
                    {/* Compact brand for mobile (showcase panel is hidden) */}
                    <Link
                        to="/"
                        className="mb-8 flex flex-col items-center justify-center gap-1 lg:hidden"
                    >
                        <div className="flex items-center gap-2">
                            <LogoMark size={36} animated />
                            <span className="text-lg font-extrabold tracking-tight">
                                <span className="text-[#EC7A54]">One</span>
                                <span className="text-[#3FB0D6]">Leet</span>
                            </span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">
                            A StaplerLabs product
                        </span>
                    </Link>
                    {children}
                </div>
            </div>
        </div>
    );
}
