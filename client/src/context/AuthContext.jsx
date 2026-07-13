/* eslint-disable react-refresh/only-export-components -- context module intentionally exports the provider component and the useAuth hook together */
import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
} from "react";
import { getMe, loginUser, logoutUser } from "@/Api/AuthApis";

const AuthContext = createContext(null);

// On load we ask the API who we are (`GET /auth/me`), authenticated by the
// Bearer token (and the cookie, where it isn't blocked as third-party).
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Monotonic guard: only the LATEST auth resolution may write state. Without
    // this, a slow initial /auth/me (e.g. a Render cold start still in flight
    // when you log in) could resolve AFTER login and clobber the user back to
    // null — which silently bounced people from the dashboard back to /login.
    const authSeq = useRef(0);

    const refresh = useCallback(async () => {
        const my = ++authSeq.current;
        try {
            const data = await getMe();
            if (my === authSeq.current) setUser(data?.user || null);
        } catch {
            if (my === authSeq.current) setUser(null);
        } finally {
            if (my === authSeq.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // Log in and trust the response's user directly — no second /auth/me round
    // trip, so there's nothing to race and one less thing that can fail. Bumping
    // authSeq invalidates any refresh still in flight (see the guard above).
    const login = useCallback(async (payload) => {
        const data = await loginUser(payload);
        authSeq.current++;
        setUser(data?.user || null);
        setLoading(false);
        return data;
    }, []);

    const logout = useCallback(async () => {
        authSeq.current++;
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
        login,
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
