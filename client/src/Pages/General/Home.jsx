import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/Components/Footer";

const Home = () => {
  return (
    <>
    
    <div className="min-h-screen w-full flex flex-col items-center justify-center !pt-0 !mt-0">

      {/* HERO CONTENT WRAPPER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl text-center space-y-8"
      >

        {/* MAIN HEADING */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-5xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-xl"
        >
          {/* Your Gateway to */}
          {/* Welcome to */}
          <span className="block text-transparent bg-clip-text 
                    bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
           ONE LEET
          </span>
        </motion.h1>

        {/* SUBTEXT */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed"
        >
          All-India PYQs, AI tools, smart practice, and structured learning —
          all in one futuristic platform powered by intelligence.
        </motion.p>

        {/* BUTTON GROUP */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mt-6"
        >
          {/* Start Learning */}
          <Link
            to="/courses"
            className="group flex items-center gap-2 rounded-lg 
                        bg-gradient-to-r from-blue-600 to-indigo-500
                        px-6 py-3 text-white font-semibold shadow-xl 
                        hover:scale-[1.03] active:scale-[0.97] transition-all"
          >
            Start Learning
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Explore PYQs */}
          <Link
            to="/pyq"
            className="rounded-lg px-6 py-3 bg-white/10 backdrop-blur-xl 
                        border border-white/20 text-white font-semibold 
                        hover:bg-white/20 transition-all"
          >
            Explore PYQs
          </Link>

          {/* Mock Test */}
          <Link
            to="/tests"
            className="rounded-lg px-6 py-3 bg-white/10 backdrop-blur-xl 
                        border border-white/20 text-white font-semibold 
                        hover:bg-white/20 transition-all"
          >
            Take Mock Test
          </Link>
        </motion.div>

        {/* FOOT NOTE */}
        <p className="text-sm text-gray-400 tracking-wide mt-4">
          EVERY YEAR THOUSANDS ACHIEVE THEIR DREAMS — NOW IT’S YOUR TURN. <br />
          <span className="text-zinc-500"> <br />
            // Chill kar Bhai Normal Exam hai Ye , Ho jayega , Trust me !
            
            </span>
        </p>

      </motion.div>
    </div>
   <Footer/>
    </>

  );
};

export default Home;
