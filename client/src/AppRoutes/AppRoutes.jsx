import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";

import Home from "../Pages/General/Home";
import Navbar from "../Components/General/Navbar";

import { StarsBackground } from "@/Components/animate-ui/components/backgrounds/stars";
import NotFound from "@/Components/General/NotFound";
import Mentors from "@/Pages/Navbar-Pages/Mentors";
import PrivacyPolicy from "@/Pages/Footer-Pages/PrivacyPolicy";
import Team from "@/Pages/Footer-Pages/Team";

import Login from "@/Pages/Auth/Login";
import Register from "@/Pages/Auth/Register";
import ForgotPassword from "@/Pages/Auth/ForgotPassword";
import ResetPassword from "@/Pages/Auth/ResetPassword";

// Auth screens are full-screen light layouts, so they render WITHOUT the dark
// marketing chrome (star background + navbar). Everything else keeps the dark
// landing shell.
const AUTH_PREFIXES = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/user/login",
];

const AppLayout = ({ children }) => {
    const location = useLocation();
    const isAuthPage = AUTH_PREFIXES.some((p) =>
        location.pathname.startsWith(p)
    );

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            <StarsBackground className="absolute inset-0 -z-10" />
            <Navbar />
            <div className="relative z-10">{children}</div>
        </div>
    );
};

const AppRoutes = () => {
    return (
        <Router>
            <AppLayout>
                <Routes>
                    {/* Public marketing (dark theme) */}
                    <Route path="/" element={<Home />} />
                    <Route path="/mentor" element={<Mentors />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/team" element={<Team />} />

                    {/* Auth (light theme) */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    {/* Legacy path kept working */}
                    <Route path="/user/login" element={<Navigate to="/login" replace />} />

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </AppLayout>
        </Router>
    );
};

export default AppRoutes;
