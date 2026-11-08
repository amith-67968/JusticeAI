import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';

const ForgotPasswordForm = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Mock API Call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Check your email</h3>
        <p className="text-text-secondary text-sm mb-6 leading-relaxed">
          We've sent a password reset link to <span className="text-slate-900 font-medium">{email}</span>.
        </p>
        
        <button
          type="button"
          onClick={() => onSwitch('login')}
          className="btn-secondary w-full"
        >
          Return to Login
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-text-secondary text-sm text-center mb-6">
        Enter the email associated with your account and we'll send you a link to reset your password.
      </p>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-secondary ml-1">Email address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="text-text-tertiary" size={18} />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-11"
            placeholder="name@firm.com"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !email}
        className="w-full btn-primary mt-2 flex items-center justify-center gap-2 py-3.5"
      >
        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
      </button>

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={() => onSwitch('login')}
          className="text-sm font-medium text-text-secondary hover:text-slate-900 transition-colors"
        >
          Nevermind, I remembered my password
        </button>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
