import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useLocation,
} from "react-router-dom";

import Register from "../Pages/Auth/Register";
import Home from "../Pages/General/Home";
import Login from "../Pages/Auth/Login";
import Navbar from "../Components/Navbar";

import { StarsBackground } from '@/Components/animate-ui/components/backgrounds/stars'
import NotFound from "@/Components/NotFound";

const AppLayout = ({ children }) => {
    const location = useLocation();

    const isAuthPage =
        location.pathname.startsWith("/user/register") ||
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
                    <Route path="/user/register" element={<Register />} />
                    <Route path="/user/login" element={<Login />} />
                    <Route path="*" element={<NotFound/>}/>
                </Routes>
            </AppLayout>
        </Router>

        </StarsBackground>
    );
};

export default AppRoutes;
