import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './Login';

export default function LandingPage() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    // Wait for the "person to stop walking" (approx 3.5 seconds)
    const timer = setTimeout(() => {
      setShowContent(true);
      
      // We can selectively pause the background video to "stop" the person 
      // on the left side of the screen if desired, or let it smoothly loop.
      const videoEl = document.getElementById('hero-video');
      if (videoEl) {
        // Option to pause or significantly slow down playback rate
        // videoEl.pause(); 
        videoEl.playbackRate = 0.5; // Slow down to look cinematic
      }
    }, 3500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black flex items-center justify-center">
      
      {/* 1. Full-screen Background Video */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black">
        {!videoError && (
          <video
            id="hero-video"
            autoPlay 
            muted 
            loop
            playsInline
            onLoadedData={() => setIsVideoLoaded(true)}
            onError={() => {
              setVideoError(true);
              setShowContent(true); // show immediately if error
            }}
            className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-110 saturate-110"
          >
            <source src="/landing-hero.mp4" type="video/mp4" />
          </video>
        )}
        
        {/* Fallback Background Layer (Visible if video fails) */}
        {videoError && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black flex items-center justify-center z-[-1]" />
        )}
        
        {/* Dark overlay for readability (Reduced for clearer video) */}
        <div className="absolute inset-0 bg-black/20" />
      </div>



      {/* 2. Hero Content & Login Box (Flip Card View) */}
      <div className="relative z-10 w-full px-8 lg:px-24 max-w-[var(--max-w-app)] mx-auto flex justify-end perspective h-[650px] items-center">
        <div 
          className={`relative w-full max-w-xl h-full transition-transform duration-700 transform-style preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}
        >
          
          {/* Front Side (Landing Content) */}
          <div className="absolute w-full h-full backface-hidden flex flex-col justify-center">
            <AnimatePresence>
              {showContent && (
                <motion.div 
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="text-right flex flex-col items-end"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-4 leading-tight">
                      JusticeAI
                    </h1>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <p className="text-xl md:text-2xl text-gray-200 mb-10 font-light leading-relaxed">
                      AI-powered legal assistance for everyone.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <div className="relative inline-block">
                      <button 
                        onClick={() => setIsFlipped(true)}
                        className="relative z-10 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full px-8 py-4 text-white text-lg font-semibold shadow-lg shadow-white/10 hover:scale-105 hover:bg-white/30 transition-all duration-300"
                      >
                        Get Started
                      </button>
                      
                      {/* Liquid Reflection Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30 opacity-20 rounded-full pointer-events-none"></div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Back Side (Embedded Login Page) */}
          <div className="absolute w-full h-full rotate-y-180 backface-hidden flex items-center justify-center">
            <div className="w-full">
              <Login />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};


