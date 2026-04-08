import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    }
  };


  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover brightness-75"
        >
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" />
      </div>

      <Link
        to="/"
        className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
      >
        <ArrowLeft size={16} />
        Back to landing
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-semibold text-white text-center tracking-tight">Log in</h2>
          <p className="text-gray-300 text-sm text-center mt-2 mb-2">
            Welcome back to JusticeAI. Please enter your details.
          </p>
        </motion.div>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {/* Email Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl px-4 py-3 w-full outline-none focus:ring-2 focus:ring-blue-500/50 transition pl-11"
              />
              <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
            </div>
          </motion.div>

          {/* Password Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl px-4 py-3 w-full outline-none focus:ring-2 focus:ring-blue-500/50 transition pl-11 pr-11"
              />
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <button
                type="button"
                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-200 transition"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

          {/* Login Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            disabled={loading}
            type="submit"
            className="bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-xl w-full mt-4 transition shadow-lg border border-white/10"
          >
            {loading ? "Logging in..." : "Log in"}
          </motion.button>
        </form>

        {/* Signup Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm text-gray-400 text-center mt-6"
        >
          Don&apos;t have an account? <Link to="/signup" state={{ from: location.state?.from }} className="text-white hover:text-blue-400 font-medium transition-colors">Sign up</Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
