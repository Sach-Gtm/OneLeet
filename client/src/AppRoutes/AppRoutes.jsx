import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useLocation,
} from "react-router-dom";

import Home from "../Pages/General/Home";
import Navbar from "../Components/General/Navbar";

import { StarsBackground } from '@/Components/animate-ui/components/backgrounds/stars'
import NotFound from "@/Components/General/NotFound";
import Mentors from "@/Pages/Navbar-Pages/Mentors";
import Login from "@/Pages/Auth/Login";
import PrivacyPolicy from "@/Pages/Footer-Pages/PrivacyPolicy";
import Team from "@/Pages/Footer-Pages/Team";

const AppLayout = ({ children }) => {
    const location = useLocation();

    const isAuthPage =
        location.pathname.startsWith("/user/login");

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            {!isAuthPage && (
                <StarsBackground className="absolute inset-0 -z-10" />
            )}

            {!isAuthPage && <Navbar />}

            <div className="relative z-10">{children}</div>
        </div>
    );
};

const AppRoutes = () => {
    return (
        <StarsBackground>

        <Router>
            <AppLayout>
                <Routes>

                    <Route path="/" element={<Home />} />
                    <Route path="*" element={<NotFound/>}/>
                    <Route path="/mentor" element={<Mentors/>}/>
                    <Route path="/user/login" element={<Login />} />
                    <Route path="/privacy" element={<PrivacyPolicy/>}/>
                    <Route path="/team" element={<Team/>}/>
                </Routes>
            </AppLayout>
        </Router>

        </StarsBackground>
    );
};

export default AppRoutes;
