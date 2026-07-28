/* eslint-disable react-refresh/only-export-components -- context module intentionally exports the provider component and the useTheme hook together */
import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Light by default; the user can switch to dark and we remember the choice.
// The actual `.dark` class is applied to <html> (also pre-paint by a tiny inline
// script in index.html, so there's no flash on reload).
const KEY = "oneleet_theme";

const ThemeContext = createContext({
    theme: "light",
    toggleTheme: () => {},
    setTheme: () => {},
});

const applyClass = (theme) => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
};

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        try {
            return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
        } catch {
            return "light";
        }
    });

    useEffect(() => {
        applyClass(theme);
        try {
            localStorage.setItem(KEY, theme);
        } catch {
            /* storage blocked — the class is still applied for this session */
        }
    }, [theme]);

    const setTheme = useCallback((t) => setThemeState(t === "dark" ? "dark" : "light"), []);
    const toggleTheme = useCallback(
        () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
        []
    );

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
