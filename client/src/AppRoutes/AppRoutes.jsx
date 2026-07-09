import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Home from "../Pages/General/Home";
import MarketingLayout from "@/Components/General/MarketingLayout";
import NotFound from "@/Components/General/NotFound";
import Mentors from "@/Pages/Navbar-Pages/Mentors";
import PrivacyPolicy from "@/Pages/Footer-Pages/PrivacyPolicy";
import Team from "@/Pages/Footer-Pages/Team";

import Login from "@/Pages/Auth/Login";
import Register from "@/Pages/Auth/Register";
import ForgotPassword from "@/Pages/Auth/ForgotPassword";
import ResetPassword from "@/Pages/Auth/ResetPassword";

import ProtectedRoute from "@/Components/Auth/ProtectedRoute";
import AppShell from "@/Components/App/AppShell";
import Dashboard from "@/Pages/App/Dashboard";
import PyqArchive from "@/Pages/App/PyqArchive";
import NotesLibrary from "@/Pages/App/NotesLibrary";
import ComingSoon from "@/Pages/App/ComingSoon";

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                {/* Public marketing pages — dark themed shell */}
                <Route element={<MarketingLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/mentor" element={<Mentors />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="*" element={<NotFound />} />
                </Route>

                {/* Auth — light, full-screen (no chrome) */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/user/login" element={<Navigate to="/login" replace />} />

                {/* Authenticated app — light sidebar shell */}
                <Route
                    element={
                        <ProtectedRoute>
                            <AppShell />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/pyqs" element={<PyqArchive />} />
                    <Route path="/notes" element={<NotesLibrary />} />
                    <Route path="/tests" element={<ComingSoon title="Mock Tests" />} />
                    <Route path="/ai-tools" element={<ComingSoon title="AI Tools" />} />
                    <Route path="/analytics" element={<ComingSoon title="Analytics" />} />
                    <Route path="/community" element={<ComingSoon title="Community" />} />
                    <Route path="/profile" element={<ComingSoon title="Profile" />} />
                </Route>
            </Routes>
        </Router>
    );
};

export default AppRoutes;
