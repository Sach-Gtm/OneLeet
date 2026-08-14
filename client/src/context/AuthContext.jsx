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
import { getToken, getStoredUser, setStoredUser, clearToken } from "@/Api/axios";
import { clearTestPrefs } from "@/lib/testPrefs";

const AuthContext = createContext(null);

// On load we ask the API who we are (`GET /auth/me`), authenticated by the
// Bearer token (and the cookie, where it isn't blocked as third-party).
export function AuthProvider({ children }) {
    // Start from the persisted session (token + cached user) so a reload / PWA
    // relaunch shows the app immediately instead of a spinner that can bounce to
    // /login if the first /auth/me is slow or fails. /auth/me still validates in
    // the background below and a real 401 clears it.
    const [user, setUserState] = useState(() => (getToken() ? getStoredUser() : null));
    const [loading, setLoading] = useState(() => !(getToken() && getStoredUser()));

    // Every user change keeps React state and the persisted cache in lockstep, so
    // a reload restores the latest user (this is also what Profile calls after an
    // edit). Stable identity — safe to leave out of effect deps.
    const setUser = useCallback((u) => {
        setUserState(u);
        setStoredUser(u);
    }, []);

    // Monotonic guard: only the LATEST auth resolution may write state. Without
    // this, a slow initial /auth/me (e.g. a Render cold start still in flight
    // when you log in) could resolve AFTER login and clobber the user back to
    // null — which silently bounced people from the dashboard back to /login.
    const authSeq = useRef(0);

    const refresh = useCallback(async () => {
        const my = ++authSeq.current;
        try {
            const data = await getMe();
            if (my !== authSeq.current) return;
            setUser(data?.user || null);
        } catch (err) {
            if (my !== authSeq.current) return;
            const status = err?.response?.status ?? err?.status;
            // Only a genuine auth rejection (401/403) means "not logged in".
            // A transient failure — a Render cold start, a network blip, a 5xx or
            // a timeout (no response) — must NOT drop a valid session, or the next
            // click into the app bounces to /login. Keep the current user in that
            // case; /auth/me will succeed on a later call once the API is warm.
            if (status === 401 || status === 403) {
                clearToken(); // drops the dead token + cached user
                setUserState(null);
            }
        } finally {
            if (my === authSeq.current) setLoading(false);
        }
    }, [setUser]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // Log in and trust the response's user directly — no second /auth/me round
    // trip, so there's nothing to race and one less thing that can fail. Bumping
    // authSeq invalidates any refresh still in flight (see the guard above).
    const login = useCallback(async (payload) => {
        const data = await loginUser(payload);
        authSeq.current++;
        setUser(data?.user || null); // persists too, so a later reload restores the session
        setLoading(false);
        return data;
    }, [setUser]);

    const logout = useCallback(async () => {
        authSeq.current++;
        try {
            await logoutUser();
        } catch {
            // ignore — clearing local state below is what matters to the UI
        }
        clearTestPrefs(); // so the Tests popup asks again on the next login
        setUser(null);
    }, [setUser]);

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
