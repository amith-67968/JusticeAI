import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const { signup, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await signup(name, email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed.');
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
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-semibold text-white text-center tracking-tight">Create account</h2>
          <p className="text-gray-300 text-sm text-center mt-2 mb-2">
            Start with a local demo account and continue into the dashboard.
          </p>
        </motion.div>

        <form onSubmit={handleSignup} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl px-4 py-3 w-full outline-none focus:ring-2 focus:ring-blue-500/50 transition pl-11"
              />
              <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
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

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
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
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl px-4 py-3 w-full outline-none focus:ring-2 focus:ring-blue-500/50 transition pl-11 pr-11"
              />
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <button
                type="button"
                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-200 transition"
                onClick={() => setShowConfirmPassword((current) => !current)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            disabled={loading}
            type="submit"
            className="bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-xl w-full mt-4 transition shadow-lg border border-white/10"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </motion.button>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-sm text-gray-400 text-center mt-6"
        >
          Already have an account?{' '}
          <Link to="/login" state={{ from: location.state?.from }} className="text-white hover:text-blue-400 font-medium transition-colors">
            Log in
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
