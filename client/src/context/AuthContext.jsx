/* eslint-disable react-refresh/only-export-components -- context module intentionally exports the provider component and the useAuth hook together */
import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";
import { getMe, logoutUser } from "@/Api/AuthApis";

const AuthContext = createContext(null);

// Auth state is driven by the httpOnly cookie: on load we ask the API who we
// are (`GET /auth/me`). We never read the JWT in JS — the cookie is sent
// automatically thanks to `withCredentials`.
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const data = await getMe();
            setUser(data?.user || null);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const logout = useCallback(async () => {
        try {
            await logoutUser();
        } catch {
            // ignore — clearing local state below is what matters to the UI
        }
        setUser(null);
    }, []);

    const value = {
        user,
        setUser,
        loading,
        refresh,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
}
