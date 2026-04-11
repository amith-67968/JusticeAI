import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  
  const { user, login, signup } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  // Switch wrapper that resets error logs
  const toggleAuthMode = (mode) => {
    setError('');
    setIsSignup(mode);
  };

  useEffect(() => {
    const videoElement = document.getElementById('hero-video');
    if (videoElement) {
      videoElement.playbackRate = 0.65;
    }
  }, []);

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-black">
      
      {/* High-quality 4K-like Video Background */}
      <video
        id="hero-video"
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover scale-125 sm:scale-110"
      >
        <source src="/video/hero.mp4" type="video/mp4" />
      </video>

      {/* Premium Gradient Overlay - Darker on the right where the UI sits */}
      <div className="absolute inset-0 z-0 bg-linear-to-r from-black/30 via-black/55 to-black/90"></div>

      {/* Fixed Layout Wrap */}
      <div className="relative z-10 flex min-h-dvh items-start justify-center px-4 py-4 pointer-events-none sm:px-6 sm:py-8 lg:items-center lg:justify-end lg:px-10">
        
        {/* Perspective Flip Container - Enlarged for new nested Auth flows */}
        <div className="perspective pointer-events-auto w-full max-w-sm sm:max-w-lg lg:max-w-xl">
          <div className={`relative h-128 max-h-[calc(100dvh-2rem)] w-full transition-transform duration-700 transform-style sm:h-136 sm:max-h-[calc(100dvh-4rem)] lg:h-144 ${isFlipped ? "rotate-y-180" : ""}`}>
            
            {/* FRONT (Hero) */}
            <div className="absolute inset-0 backface-hidden w-full h-full">
              {/* Darker premium glass block to make white text pop */}
              <div className="flex h-full w-full flex-col items-start justify-end rounded-[28px] border border-white/20 bg-slate-900/40 p-6 text-left shadow-2xl backdrop-blur-xl sm:justify-center sm:p-8 lg:p-10">
                <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.75rem]">
                  JusticeAI helps people move from confusion to legal clarity.
                </h1>

                <p className="mt-4 max-w-md text-left text-base text-gray-300 sm:mt-5 sm:text-lg">
                  Upload documents, analyze case strength, and chat through your next legal steps in seconds.
                </p>

                <div className="mt-8 flex w-full justify-start">
                  {user ? (
                     <Link
                        to="/dashboard"
                        className="w-full rounded-xl border border-white/30 bg-white/20 px-6 py-3.5 text-center font-semibold text-white shadow-lg transition hover:bg-white/30 sm:w-auto sm:px-8"
                      >
                        Go to Dashboard
                      </Link>
                  ) : (
                      <button
                        onClick={() => setIsFlipped(true)}
                        className="w-full rounded-xl border border-white/30 bg-white/20 px-6 py-3.5 font-semibold text-white shadow-lg transition hover:bg-white/30 sm:w-auto sm:px-8"
                      >
                        Get Started
                      </button>
                  )}
                </div>
              </div>
            </div>

            {/* BACK (Auth Container) */}
            <div className="absolute inset-0 w-full h-full rotate-y-180 backface-hidden flex">
              {/* Darker premium glass block for the backside too, keeping unified contrast */}
              <div className="relative flex h-full w-full flex-col overflow-y-auto rounded-[28px] border border-white/20 bg-slate-900/40 p-5 pt-16 shadow-2xl backdrop-blur-xl sm:p-8 sm:pt-16 lg:p-10 lg:pt-20">
                
                <button
                  onClick={() => setIsFlipped(false)}
                  className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white shadow-lg transition hover:bg-white/20 backdrop-blur-md sm:top-6 sm:left-6"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                <div className="relative mt-2 w-full flex-1">
                  <AnimatePresence mode="wait">
                    
                    {/* LOGIN FORM */}
                    {!isSignup && (
                      <motion.div
                        key="login"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex w-full flex-col justify-start sm:justify-center"
                      >
                        <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">Log in</h2>
                        <p className="mt-2 mb-6 text-center text-sm text-gray-300">
                           Welcome back to JusticeAI. Please enter your details.
                        </p>

                        <form onSubmit={handleLogin} className="space-y-4">
                          {error && (
                            <div className="mb-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-100">
                              {error}
                            </div>
                          )}

                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="w-full p-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition"
                          />

                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Password"
                              className="w-full p-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition pr-12"
                            />
                            <button
                              type="button"
                              className="absolute top-1/2 right-4 -translate-y-1/2 p-1 text-gray-400 transition hover:text-gray-200"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>

                          <div className="pt-2">
                            <button
                               disabled={loading}
                               type="submit"
                               className="w-full rounded-xl bg-white/20 p-3.5 font-semibold text-white shadow-lg transition hover:bg-white/30"
                            >
                               {loading ? "Authenticating..." : "Log in"}
                            </button>
                          </div>
                        </form>

                        <p className="mt-6 text-center text-sm text-gray-300">
                          Don't have an account?
                          <span
                            className="ml-1.5 cursor-pointer text-white font-semibold hover:underline"
                            onClick={() => toggleAuthMode(true)}
                          >
                            Sign up
                          </span>
                        </p>
                      </motion.div>
                    )}

                    {/* SIGNUP FORM */}
                    {isSignup && (
                      <motion.div
                        key="signup"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex w-full flex-col justify-start sm:justify-center"
                      >
                        <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">Create account</h2>
                        <p className="mt-2 mb-6 text-center text-sm text-gray-300">
                           Join JusticeAI to get started.
                        </p>

                        <form onSubmit={handleSignup} className="space-y-3.5">
                          {error && (
                            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-100">
                              {error}
                            </div>
                          )}

                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full name"
                            className="w-full p-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition"
                          />
                          
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="w-full p-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition"
                          />

                          <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative w-full">
                              <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full p-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition pr-11"
                              />
                              <button
                                type="button"
                                className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-gray-400 transition hover:text-gray-200"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            
                            <div className="relative w-full">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm"
                                className="w-full p-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition pr-11"
                              />
                              <button
                                type="button"
                                className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-gray-400 transition hover:text-gray-200"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              disabled={loading}
                              type="submit"
                              className="w-full rounded-xl bg-white/20 p-3.5 font-semibold text-white shadow-lg transition hover:bg-white/30"
                            >
                              {loading ? "Creating account..." : "Create account"}
                            </button>
                          </div>
                        </form>

                        <p className="mt-6 text-center text-sm text-gray-300">
                          Already have an account?
                          <span
                            className="ml-1.5 cursor-pointer text-white font-semibold hover:underline"
                            onClick={() => toggleAuthMode(false)}
                          >
                            Log in
                          </span>
                        </p>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
