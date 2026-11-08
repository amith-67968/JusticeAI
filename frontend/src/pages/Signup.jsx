import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, Mail, Scale, User } from 'lucide-react';
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

  const fieldClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3.5 pr-11 pl-11 text-slate-900 placeholder-slate-400 outline-none transition focus:border-accent-primary focus:bg-white focus:ring-2 focus:ring-accent-primary/15';

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-drift-b absolute -top-24 -right-20 h-96 w-96 rounded-full bg-violet-200/45 blur-3xl" />
        <div className="animate-drift-a absolute bottom-0 -left-20 h-[26rem] w-[26rem] rounded-full bg-blue-200/45 blur-3xl" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(148,163,184,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.2) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(70% 60% at 50% 40%, #000 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(70% 60% at 50% 40%, #000 30%, transparent 100%)',
          }}
        />
      </div>

      <Link
        to="/"
        className="absolute top-5 left-5 z-20 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:-translate-x-0.5 hover:bg-white sm:top-6 sm:left-6"
      >
        <ArrowLeft size={16} />
        Back to landing
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="surface-card w-full max-w-lg p-7 sm:p-9"
      >
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center text-center"
        >
          <span className="relative grid h-14 w-14 place-items-center rounded-2xl border border-blue-200 bg-blue-50/70">
            <Scale className="text-accent-primary" size={26} />
            <span className="animate-drift-b pointer-events-none absolute -inset-2 rounded-3xl bg-violet-200/40 blur-lg" />
          </span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Create your account</h2>
          <p className="mt-2 text-sm text-slate-600">
            Start with a local demo account and continue into the dashboard.
          </p>
        </motion.div>

        <form onSubmit={handleSignup} className="mt-8 space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {error}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="relative"
          >
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className={fieldClass}
            />
            <User className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.33 }}
            className="relative"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className={fieldClass}
            />
            <Mail className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.41 }}
            className="relative"
          >
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={fieldClass}
            />
            <Lock className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1.5 text-slate-400 transition hover:text-slate-700"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.49 }}
            className="relative"
          >
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className={fieldClass}
            />
            <Lock className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1.5 text-slate-400 transition hover:text-slate-700"
              onClick={() => setShowConfirmPassword((current) => !current)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.57 }}
            disabled={loading}
            type="submit"
            className="btn-primary group mt-2 flex w-full items-center justify-center gap-2 py-3.5 shadow-lg shadow-blue-600/20"
          >
            {loading ? 'Creating account...' : 'Create account'}
            {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
          </motion.button>
        </form>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.66 }}
          className="mt-7 space-y-2.5 border-t border-slate-100 pt-6"
        >
          {['Unlimited document analysis', 'Legal chat with citations', 'Exportable case timeline'].map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm text-slate-500">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-50 text-accent-primary">
                <Check size={12} />
              </span>
              {item}
            </li>
          ))}
        </motion.ul>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="mt-6 text-center text-sm text-slate-600"
        >
          Already have an account?{' '}
          <Link
            to="/login"
            state={{ from: location.state?.from }}
            className="rounded font-semibold text-accent-primary transition hover:text-accent-hover hover:underline"
          >
            Log in
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
