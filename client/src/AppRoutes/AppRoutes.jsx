import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useLocation,
    Navigate
} from "react-router-dom";

import Home from "../Pages/General/Home";
import Navbar from "../Components/General/Navbar";

import { StarsBackground } from '@/Components/animate-ui/components/backgrounds/stars'
import NotFound from "@/Components/General/NotFound";
import Mentors from "@/Pages/Navbar-Pages/Mentors";
import Login from "@/Pages/Auth/Login";
import PrivacyPolicy from "@/Pages/Footer-Pages/PrivacyPolicy";
import Team from "@/Pages/Footer-Pages/Team";
import TestPage from "@/Pages/Test/TestPage";
import ResultPage from "@/Pages/Test/ResultPage";
import LeaderboardPage from "@/Pages/Test/LeaderboardPage";
import { HexagonBackground } from "@/Components/animate-ui/components/backgrounds/hexagon";


const AppLayout = ({ children }) => {
    const location = useLocation();

    const isAuthPage =
        location.pathname.startsWith("/user/login");

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            {!isAuthPage && (
                <HexagonBackground className="absolute inset-0 -z-10" />
            )}

            {!isAuthPage && <Navbar />}

            <div className="relative z-10">{children}</div>
        </div>
    );
};

const AppRoutes = () => {
    return (
        // <HexagonBackground>

            <Router>
                <AppLayout>
                    <Routes>

                        <Route path="/" element={<Home />} />
                        <Route path="*" element={<NotFound />} />
                        <Route path="/mentor" element={<Mentors />} />
                        <Route path="/user/login" element={<Login />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/team" element={<Team />} />
                        <Route path="/tests" element={<Navigate to="/test/ipu2024" replace />} />
                        <Route path="/test/:exam" element={<TestPage />} />
                        <Route path="/result/:attemptId" element={<ResultPage />} />
                        <Route path="/leaderboard/:exam" element={<LeaderboardPage />} />
                    </Routes>
                </AppLayout>
            </Router>

        // </HexagonBackground>
    );
};

export default AppRoutes;
