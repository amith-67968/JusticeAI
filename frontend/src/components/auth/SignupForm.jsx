import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';

const SignupForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-secondary ml-1">Full Name</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <User className="text-text-tertiary" size={18} />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-11"
            placeholder="Jane Doe"
            required
            autoComplete="name"
          />
        </div>
      </div>

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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-secondary ml-1">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="text-text-tertiary" size={16} />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 text-sm py-3"
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-secondary ml-1">Confirm</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="text-text-tertiary" size={16} />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-9 text-sm py-3"
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full btn-primary mt-2 flex items-center justify-center gap-2 py-3.5"
      >
        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
          <>Create Account <ArrowRight size={18} /></>
        )}
      </button>
    </form>
  );
};

export default SignupForm;
