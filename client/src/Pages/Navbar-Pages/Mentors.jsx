import ChromaGrid from '@/Components/animate-ui/ChromaGrid'
import React from 'react'

const Mentors = () => {
    return (
        <div className="relative min-h-screen w-full bg-black overflow-hidden">

            <div className="absolute inset-0 pointer-events-none bg-black/40 backdrop-blur-[6px] glass-noise"></div>

            <div className="relative z-10 flex justify-center items-start pt-40">
                <ChromaGrid className="mt-10" />
            </div>
        </div>
    )
}

export default Mentors
