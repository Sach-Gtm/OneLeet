import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

// Light/dark switch. `variant="row"` (default) is a full-width labelled button
// for the sidebar bottom; `variant="icon"` is a compact button for the header
// so the theme can be changed from any page (incl. mobile).
export default function ThemeToggle({ variant = "row" }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";
    const Icon = isDark ? Sun : Moon;

    if (variant === "icon") {
        return (
            <button
                onClick={toggleTheme}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                title={isDark ? "Light mode" : "Dark mode"}
            >
                <Icon size={18} />
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
            <Icon size={18} />
            {isDark ? "Light mode" : "Dark mode"}
        </button>
    );
}
