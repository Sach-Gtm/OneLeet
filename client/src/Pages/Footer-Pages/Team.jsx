import ChromaGrid from "@/Components/animate-ui/ChromaGrid";
import React, { useState } from "react";
import { Github, Linkedin } from "lucide-react";

const Team = () => {
    const [tilt, setTilt] = useState({});

    const members = [
        {
            name: "Saurav Anand",
            username: "@isauravanand",
            // rank: "Rank 23 @ipuLeet-2025",
            tagline: "Full Stack Developer ",
            image: "https://res.cloudinary.com/dtgo1vvgs/image/upload/v1765216641/download_5_twuygb.jpg",
            github: "https://github.com/isauravanand",
            linkedin: "https://www.linkedin.com/in/saurav-anand-257037251/"
        },
        {
            name: "Sachin Gautam",
            username: "@sachingautam",
            // rank: "Rank 54 @ipuLeet-2025",
            tagline: "Bakchodi Developer",
            image: "https://res.cloudinary.com/dtgo1vvgs/image/upload/v1765217102/caa3166d46ae69f93dec818856d0a830_etcpk3.jpg",
            github: "https://github.com/sach-gtm",
            linkedin: "https://www.linkedin.com/in/sachin-gautam-1484a2227/"
        }
    ];

    const handleMove = (e, index) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const rotateX = ((y - rect.height / 2) / 20).toFixed(2);
        const rotateY = ((x - rect.width / 2) / 20).toFixed(2);

        setTilt(prev => ({
            ...prev,
            [index]: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
        }));
    };

    const handleLeave = (index) => {
        setTilt(prev => ({
            ...prev,
            [index]: `rotateX(0deg) rotateY(0deg)`
        }));
    };

    return (
        <div className="relative min-h-screen w-full bg-black overflow-hidden">

            <div className="absolute inset-0 pointer-events-none bg-black/40 backdrop-blur-[6px] glass-noise"></div>

            <div className="relative z-10 flex flex-col justify-center items-center pt-20 mt-30">
                <div className="grid grid-cols-1 md:grid-cols-2 mt-10 max-w-5xl w-full px-4 cursor-pointer">
                    {members.map((m, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center text-center"
                        >
                            <div
                                onMouseMove={(e) => handleMove(e, index)}
                                onMouseLeave={() => handleLeave(index)}
                                style={{
                                    transform: tilt[index],
                                    transition: "transform 0.2s ease-out",
                                    perspective: "1000px",
                                }}
                                className="rounded-2xl"
                            >
                                <img
                                    src={m.image}
                                    alt={m.name}
                                    className="
                                        w-80 h-96 object-cover rounded-2xl shadow-xl
                                        grayscale 
                                        hover:grayscale-0
                                        transition-all duration-500 ease-out
                                    "
                                />
                            </div>

                            <h2 className="mt-4 text-lg font-bold text-white">{m.name}</h2>

                            <p className="text-gray-400 text-sm">{m.username}</p>

                            <p className="text-yellow-400 font-semibold text-sm mt-1">
                                {m.rank}
                            </p>

                            <p className="text-gray-300 mt-1 text-sm italic">
                                {m.tagline}
                            </p>

                            <div className="flex gap-4 mt-3">
                                <a
                                    href={m.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
                                >
                                    <Github className="w-5 h-5 text-white" />
                                </a>

                                <a
                                    href={m.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
                                >
                                    <Linkedin className="w-5 h-5 text-white" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Team;
