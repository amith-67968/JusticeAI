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
    <div className="relative flex min-h-dvh items-start justify-center overflow-hidden bg-linear-to-br from-black via-gray-900 to-blue-900 px-4 py-20 sm:items-center sm:py-10">
      
      <Link
        to="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20 sm:left-6 sm:top-6"
      >
        <ArrowLeft size={16} />
        Back to landing
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
      >
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
          <h2 className="text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl">Log in</h2>
          <p className="text-gray-300 text-sm text-center mt-2">
            Welcome back to JusticeAI. Please enter your details.
          </p>
        </motion.div>

        <form onSubmit={handleLogin} className="mt-6 space-y-5 sm:mt-8">
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
            <div className="relative group">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl px-4 py-3 w-full outline-none focus:ring-2 focus:ring-blue-500/50 transition pl-11"
              />
              <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={18} />
            </div>
          </motion.div>

          {/* Password Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl px-4 py-3 w-full outline-none focus:ring-2 focus:ring-blue-500/50 transition pl-11 pr-11"
              />
              <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={18} />
              <button
                type="button"
                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-200 transition"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

          <div className="pt-2">
            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              disabled={loading}
              type="submit"
              className="mt-4 w-full rounded-xl bg-white/20 py-3 font-medium text-white shadow-lg transition hover:bg-white/30"
            >
              {loading ? "Logging in..." : "Log in"}
            </motion.button>
            
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-white transition hover:bg-white/20"
            >
               <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              Continue with Google
            </motion.button>
          </div>
        </form>

        {/* Signup Link */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.8 }}
           className="text-sm text-gray-400 text-center mt-4"
        >
          Don't have an account? <Link to="/signup" state={{ from: location.state?.from }} className="text-white hover:text-white/80 font-medium transition-colors">Sign up</Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
