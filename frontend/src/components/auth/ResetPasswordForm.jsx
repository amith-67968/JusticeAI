import React, { useState } from 'react';
import { Lock, Loader2, ArrowRight } from 'lucide-react';

const ResetPasswordForm = ({ onSwitch }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    // Mock API
    setTimeout(() => {
      setIsSubmitting(false);
      onSwitch('login'); // Switch back to login upon success
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-text-secondary text-sm text-center mb-6">
        Your new password must be different from previously used passwords.
      </p>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-secondary ml-1">New Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="text-text-tertiary" size={18} />
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-11"
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-secondary ml-1">Confirm new password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="text-text-tertiary" size={18} />
          </div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-11"
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting || !password || !confirmPassword}
        className="w-full btn-primary mt-2 flex items-center justify-center gap-2 py-3.5"
      >
        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
          <>Reset Password <ArrowRight size={18} /></>
        )}
      </button>

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={() => onSwitch('login')}
          className="text-sm font-medium text-text-secondary hover:text-slate-900 transition-colors"
        >
          Cancel and return to Login
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
