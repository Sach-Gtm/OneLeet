import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative w-full max-w-lg text-center rounded-2xl border border-white/10 
                    bg-gradient-to-br from-white/10 via-white/5 to-transparent 
                    backdrop-blur-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]
                    px-10 py-16"
            >

                <motion.h1
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="text-9xl font-extrabold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                    404
                </motion.h1>

                <h2 className="mt-4 text-2xl font-semibold text-white tracking-wide">
                    Page Not Found
                </h2>

                <p className="mt-2 text-gray-300 text-sm">
                    The page you’re looking for doesn’t exist or may have been moved.
                </p>

                <Link
                    to="/"
                    className="mt-8 inline-flex items-center gap-2 rounded-lg 
                        bg-gradient-to-r from-blue-600 to-indigo-500
                        text-white font-semibold px-6 py-3 text-sm shadow-xl
                        hover:opacity-90 transition-all duration-300"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>

                <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
            </motion.div>
        </div>
    );
};

export default NotFound;
