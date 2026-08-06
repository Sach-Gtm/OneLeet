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
import RequireCourse from "@/Components/Auth/RequireCourse";
import ActivityTracker from "@/Components/App/ActivityTracker";

// The authenticated shell (sidebar, notifications, charts, …) is only needed
// once a user is inside the app — code-split it so a landing/auth visitor never
// downloads it. It resolves inside the <Suspense> that already wraps the routes.
const AppShell = lazy(() => import("@/Components/App/AppShell"));

const NotFound = lazy(() => import("@/Components/General/NotFound"));
const Mentors = lazy(() => import("@/Pages/Navbar-Pages/Mentors"));
const ExamsIndex = lazy(() => import("@/Pages/General/ExamsIndex"));
const ExamDetail = lazy(() => import("@/Pages/General/ExamDetail"));
const Colleges = lazy(() => import("@/Pages/General/Colleges"));
const Pricing = lazy(() => import("@/Pages/General/Pricing"));
const PrivacyPolicy = lazy(() => import("@/Pages/Footer-Pages/PrivacyPolicy"));
const BugReport = lazy(() => import("@/Pages/Footer-Pages/BugReport"));
const Contribute = lazy(() => import("@/Pages/Footer-Pages/Contribute"));

const Login = lazy(() => import("@/Pages/Auth/Login"));
const Register = lazy(() => import("@/Pages/Auth/Register"));
const VerifyOtp = lazy(() => import("@/Pages/Auth/VerifyOtp"));
const ForgotPassword = lazy(() => import("@/Pages/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/Pages/Auth/ResetPassword"));

const Dashboard = lazy(() => import("@/Pages/App/Dashboard"));
const Courses = lazy(() => import("@/Pages/App/Courses"));
const CourseDetail = lazy(() => import("@/Pages/App/CourseDetail"));
const PrepGuide = lazy(() => import("@/Pages/App/PrepGuide"));
const ExamPatternPage = lazy(() => import("@/Pages/App/ExamPatternPage"));
const PyqArchive = lazy(() => import("@/Pages/App/PyqArchive"));
const NotesLibrary = lazy(() => import("@/Pages/App/NotesLibrary"));
const Syllabus = lazy(() => import("@/Pages/App/Syllabus"));
const Videos = lazy(() => import("@/Pages/App/Videos"));
const TestsList = lazy(() => import("@/Pages/App/TestsList"));
const TestTake = lazy(() => import("@/Pages/App/TestTake"));
const TestResult = lazy(() => import("@/Pages/App/TestResult"));
const TestLeaderboardPage = lazy(() => import("@/Pages/App/TestLeaderboardPage"));
const AiTools = lazy(() => import("@/Pages/App/AiTools"));
const Leaderboard = lazy(() => import("@/Pages/App/Leaderboard"));
const Analytics = lazy(() => import("@/Pages/App/Analytics"));
const Community = lazy(() => import("@/Pages/App/Community"));
const PostDetail = lazy(() => import("@/Pages/App/PostDetail"));
const Profile = lazy(() => import("@/Pages/App/Profile"));
const AdminDashboard = lazy(() => import("@/Pages/App/AdminDashboard"));
const Studio = lazy(() => import("@/Pages/App/Studio"));

const FullscreenLoader = () => (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
    </div>
);

const AppRoutes = () => {
    return (
        <Router>
            <ActivityTracker />
            <Suspense fallback={<FullscreenLoader />}>
                <Routes>
                    {/* Public marketing pages — light themed shell */}
                    <Route element={<MarketingLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/exams" element={<ExamsIndex />} />
                        <Route path="/exams/:code" element={<ExamDetail />} />
                        <Route path="/colleges" element={<Colleges />} />
                        <Route path="/pricing" element={<Pricing />} />
                        {/* Courses are public: browse + read the free syllabus before signing up. */}
                        <Route path="/courses" element={<Courses />} />
                        <Route path="/courses/:slug" element={<CourseDetail />} />
                        <Route path="/mentor" element={<Mentors />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/bug-report" element={<BugReport />} />
                        <Route path="/contribute" element={<Contribute />} />
                        <Route path="*" element={<NotFound />} />
                    </Route>

                    {/* Auth — light, full-screen (no chrome) */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-otp" element={<VerifyOtp />} />
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
                        <Route path="/prep-guide" element={<PrepGuide />} />
                        <Route path="/exam-pattern" element={<ExamPatternPage />} />
                        {/* Content routes — a signed-in student must have joined a
                            batch first (RequireCourse shows a "choose a course" gate). */}
                        <Route element={<RequireCourse />}>
                            <Route path="/pyqs" element={<PyqArchive />} />
                            <Route path="/notes" element={<NotesLibrary />} />
                            <Route path="/syllabus" element={<Syllabus />} />
                            <Route path="/videos" element={<Videos />} />
                            <Route path="/tests" element={<TestsList />} />
                            <Route path="/tests/result/:attemptId" element={<TestResult />} />
                            <Route path="/tests/:id/leaderboard" element={<TestLeaderboardPage />} />
                            <Route path="/tests/:id" element={<TestTake />} />
                            <Route path="/ai-tools" element={<AiTools />} />
                        </Route>
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/community" element={<Community />} />
                        <Route path="/community/:id" element={<PostDetail />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/studio" element={<Studio />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                    </Route>
                </Routes>
            </Suspense>
        </Router>
    );
};

export default AppRoutes;
