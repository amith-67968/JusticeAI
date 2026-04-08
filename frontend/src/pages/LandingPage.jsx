import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, User } from 'lucide-react';
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
    <div className="relative h-screen w-full overflow-hidden bg-black">
      
      {/* High-quality 4K-like Video Background */}
      <video
        id="hero-video"
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover scale-110"
      >
        <source src="/video/hero.mp4" type="video/mp4" />
      </video>

      {/* Premium Gradient Overlay - Darker on the right where the UI sits */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/40 to-black/90 z-0"></div>

      {/* Fixed Layout Wrap */}
      <div className="absolute inset-0 flex items-center justify-center md:justify-end px-6 md:px-10 z-10 pointer-events-none">
        
        {/* Perspective Flip Container - Enlarged for new nested Auth flows */}
        <div className="perspective w-full max-w-lg min-h-[560px] pointer-events-auto">
          <div className={`relative w-full h-full min-h-[560px] transition-transform duration-700 transform-style ${isFlipped ? "rotate-y-180" : ""}`}>
            
            {/* FRONT (Hero) */}
            <div className="absolute inset-0 backface-hidden w-full h-full">
              {/* Darker premium glass block to make white text pop */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/20 rounded-2xl p-10 w-full h-full shadow-2xl flex flex-col justify-center items-start text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  JusticeAI helps people move from confusion to legal clarity.
                </h1>

                <p className="text-gray-300 mt-5 text-left text-lg">
                  Upload documents, analyze case strength, and chat through your next legal steps in seconds.
                </p>

                <div className="mt-8 flex justify-start">
                  {user ? (
                     <Link
                        to="/dashboard"
                        className="bg-white/20 border border-white/30 px-8 py-3.5 rounded-xl font-semibold text-white hover:bg-white/30 transition text-center shadow-lg"
                      >
                        Go to Dashboard
                      </Link>
                  ) : (
                      <button
                        onClick={() => setIsFlipped(true)}
                        className="bg-white/20 border border-white/30 px-8 py-3.5 rounded-xl font-semibold text-white hover:bg-white/30 transition shadow-lg cursor-pointer"
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
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/20 rounded-2xl p-8 md:p-10 w-full min-h-[560px] h-full shadow-2xl relative flex flex-col justify-center overflow-hidden">
                
                <button
                  onClick={() => setIsFlipped(false)}
                  className="absolute top-4 left-4 md:top-6 md:left-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20 cursor-pointer backdrop-blur-md shadow-lg"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                <div className="w-full mt-10 relative h-[420px]">
                  <AnimatePresence mode="wait">
                    
                    {/* LOGIN FORM */}
                    {!isSignup && (
                      <motion.div
                        key="login"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 w-full"
                      >
                        <h2 className="text-3xl font-bold text-white text-center tracking-tight">Log in</h2>
                        <p className="text-gray-300 text-sm text-center mt-2 mb-6">
                           Welcome back to JusticeAI. Please enter your details.
                        </p>

                        <form onSubmit={handleLogin} className="space-y-4">
                          {error && (
                            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-100 mb-2">
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

                          <div className="relative group">
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
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition cursor-pointer p-1"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>

                          <div className="pt-2">
                            <button
                               disabled={loading}
                               type="submit"
                               className="p-3.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold w-full transition shadow-lg cursor-pointer"
                            >
                               {loading ? "Authenticating..." : "Log in"}
                            </button>
                          </div>
                        </form>

                        <p className="text-center text-gray-300 mt-6 text-sm">
                          Don’t have an account?
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
                        className="absolute inset-0 w-full"
                      >
                        <h2 className="text-3xl font-bold text-white text-center tracking-tight">Create account</h2>
                        <p className="text-gray-300 text-sm text-center mt-2 mb-6">
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

                          <div className="flex gap-3">
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
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition cursor-pointer p-1"
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
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition cursor-pointer p-1"
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
                              className="p-3.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold w-full transition shadow-lg cursor-pointer"
                            >
                              {loading ? "Creating account..." : "Create account"}
                            </button>
                          </div>
                        </form>

                        <p className="text-center text-gray-300 mt-6 text-sm">
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
