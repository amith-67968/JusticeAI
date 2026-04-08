import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const [videoError, setVideoError] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);

      const videoElement = document.getElementById('hero-video');
      if (videoElement) {
        videoElement.playbackRate = 0.65;
      }
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black flex items-center justify-center">
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black">
        {!videoError && (
          <video
            id="hero-video"
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoError(true)}
            className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-110 saturate-110"
          >
            <source src="/video/hero.mp4" type="video/mp4" />
          </video>
        )}

        {videoError && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
        )}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_35%),linear-gradient(115deg,_rgba(15,23,42,0.45),_rgba(2,6,23,0.78))]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl px-8 lg:px-16">
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="max-w-3xl"
            >
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.7 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur-lg"
              >
                AI-powered legal assistance for Indian law
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="mt-8 text-5xl md:text-7xl font-bold tracking-tight text-white leading-[0.95]"
              >
                JusticeAI helps people move from confusion to legal clarity.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.8 }}
                className="mt-6 max-w-2xl text-lg md:text-xl text-slate-200 leading-relaxed"
              >
                Upload documents, analyze case strength, and chat through your next legal steps with a single guided workflow.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="mt-10 flex flex-col sm:flex-row items-start gap-4"
              >
                {user ? (
                  /* ── Logged-in user: show Dashboard CTA ── */
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white text-slate-950 px-7 py-3.5 text-base font-semibold shadow-lg shadow-black/20 transition hover:scale-[1.02]"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  /* ── Guest: show Sign in / Sign up CTAs ── */
                  <>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white text-slate-950 px-7 py-3.5 text-base font-semibold shadow-lg shadow-black/20 transition hover:scale-[1.02]"
                    >
                      Get Started
                    </Link>
                    <Link
                      to="/signup"
                      className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-lg transition hover:bg-white/20"
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
