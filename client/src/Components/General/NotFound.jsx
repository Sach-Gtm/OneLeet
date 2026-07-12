import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white px-10 py-16 text-center shadow-sm"
            >
                <motion.h1
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-8xl font-extrabold text-transparent sm:text-9xl"
                >
                    404
                </motion.h1>

                <h2 className="mt-4 text-2xl font-semibold tracking-wide text-slate-900">
                    Page Not Found
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                    The page you&apos;re looking for doesn&apos;t exist or may have been moved.
                </p>

                <Link
                    to="/"
                    className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.03]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>

                <div className="pointer-events-none absolute -left-6 -top-6 h-20 w-20 rounded-full bg-indigo-200/40 blur-2xl" />
                <div className="pointer-events-none absolute -right-6 bottom-0 h-24 w-24 rounded-full bg-violet-200/40 blur-2xl" />
            </motion.div>
        </div>
    );
}
