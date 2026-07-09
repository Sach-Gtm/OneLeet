import React, { lazy, Suspense } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import { Loader2 } from "lucide-react";

// Eager: the landing page, layouts and the auth guard (needed for first paint
// and to keep the shell stable). Everything else is code-split with lazy().
import Home from "../Pages/General/Home";
import MarketingLayout from "@/Components/General/MarketingLayout";
import ProtectedRoute from "@/Components/Auth/ProtectedRoute";
import AppShell from "@/Components/App/AppShell";

const NotFound = lazy(() => import("@/Components/General/NotFound"));
const Mentors = lazy(() => import("@/Pages/Navbar-Pages/Mentors"));
const PrivacyPolicy = lazy(() => import("@/Pages/Footer-Pages/PrivacyPolicy"));
const Team = lazy(() => import("@/Pages/Footer-Pages/Team"));

const Login = lazy(() => import("@/Pages/Auth/Login"));
const Register = lazy(() => import("@/Pages/Auth/Register"));
const ForgotPassword = lazy(() => import("@/Pages/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/Pages/Auth/ResetPassword"));

const Dashboard = lazy(() => import("@/Pages/App/Dashboard"));
const PyqArchive = lazy(() => import("@/Pages/App/PyqArchive"));
const NotesLibrary = lazy(() => import("@/Pages/App/NotesLibrary"));
const TestsList = lazy(() => import("@/Pages/App/TestsList"));
const TestTake = lazy(() => import("@/Pages/App/TestTake"));
const TestResult = lazy(() => import("@/Pages/App/TestResult"));
const AiTools = lazy(() => import("@/Pages/App/AiTools"));
const Leaderboard = lazy(() => import("@/Pages/App/Leaderboard"));
const Analytics = lazy(() => import("@/Pages/App/Analytics"));
const Community = lazy(() => import("@/Pages/App/Community"));
const PostDetail = lazy(() => import("@/Pages/App/PostDetail"));
const Profile = lazy(() => import("@/Pages/App/Profile"));

const FullscreenLoader = () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    </div>
);

const AppRoutes = () => {
    return (
        <Router>
            <Suspense fallback={<FullscreenLoader />}>
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

                    {/* Authenticated app — light sidebar shell (own Suspense inside) */}
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
                        <Route path="/tests" element={<TestsList />} />
                        <Route path="/tests/result/:attemptId" element={<TestResult />} />
                        <Route path="/tests/:id" element={<TestTake />} />
                        <Route path="/ai-tools" element={<AiTools />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/community" element={<Community />} />
                        <Route path="/community/:id" element={<PostDetail />} />
                        <Route path="/profile" element={<Profile />} />
                    </Route>
                </Routes>
            </Suspense>
        </Router>
    );
};

export default AppRoutes;
