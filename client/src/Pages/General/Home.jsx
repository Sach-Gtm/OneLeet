import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/Components/General/Footer";

const Home = () => {
  return (
    <>
      <div className="min-h-screen w-full flex flex-col items-center justify-center pt-0 px-4 py-12 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl text-center space-y-6 md:space-y-8"
        >

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-xl"
          >
            <span className="font-bold tracking-tight text-white">
              ONE <span className="bg-gradient-to-r from-indigo-300 to-indigo-500 bg-clip-text text-transparent">LEET</span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Get Free Premium Materials and Mock Tests
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-6"
          >
            <Link
              to="/courses"
              className="group flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-2.5 sm:px-6 sm:py-3 text-white font-semibold shadow-xl hover:scale-[1.03] active:scale-[0.97] transition-all w-full sm:w-auto"
            >
              Start Learning
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/pyq"
              className="rounded-lg px-5 py-2.5 sm:px-6 sm:py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white font-semibold hover:bg-white/20 transition-all w-full sm:w-auto text-center"
            >
              Explore PYQs
            </Link>

            <Link
              to="/tests"
              className="rounded-lg px-5 py-2.5 sm:px-6 sm:py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white font-semibold hover:bg-white/20 transition-all w-full sm:w-auto text-center"
            >
              Take Mock Test
            </Link>
          </motion.div>

          <p className="text-xs sm:text-sm text-gray-400 tracking-wide mt-4 px-2">
            EVERY YEAR THOUSANDS ACHIEVE THEIR DREAMS — NOW IT’S YOUR TURN.
            <br />
            <span className="text-zinc-500 block mt-2 sm:mt-0 sm:inline">
              <span className="hidden sm:inline"><br /></span>
              // Chill kar Bhai Normal Exam hai Ye , Ho jayega , Trust me !
            </span>
          </p>

        </motion.div>

      </div>

      <Footer />
    </>
  );
};

export default Home;