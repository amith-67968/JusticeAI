import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, X } from 'lucide-react';

import LoginForm from './auth/LoginForm';
import SignupForm from './auth/SignupForm';
import ForgotPasswordForm from './auth/ForgotPasswordForm';
import ResetPasswordForm from './auth/ResetPasswordForm';

const AuthModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('login');

  if (!isOpen) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'login':
        return <LoginForm onSwitch={setActiveTab} />;
      case 'signup':
        return <SignupForm onSwitch={setActiveTab} />;
      case 'forgot':
        return <ForgotPasswordForm onSwitch={setActiveTab} />;
      case 'reset':
        return <ResetPasswordForm onSwitch={setActiveTab} />;
      default:
        return <LoginForm onSwitch={setActiveTab} />;
    }
  };

  const titles = {
    login: 'Welcome back',
    signup: 'Create an account',
    forgot: 'Reset Password',
    reset: 'Set new password'
  };

  const getSubtext = () => {
    if (activeTab === 'login') return (
      <span>Don't have an account? <button onClick={() => setActiveTab('signup')} className="text-accent-primary hover:text-accent-hover font-medium">Sign up now</button></span>
    );
    if (activeTab === 'signup') return (
      <span>Already have an account? <button onClick={() => setActiveTab('login')} className="text-accent-primary hover:text-accent-hover font-medium">Sign in</button></span>
    );
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
        className="w-full max-w-md relative z-10"
      >
        <button 
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-12 right-0 p-2 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-14 h-14 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-sm flex items-center justify-center mb-6">
            <Scale className="text-accent-primary" size={32} />
          </div>
          <motion.h1 
            key={activeTab}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-slate-900 tracking-tight mb-2 text-center"
          >
            {titles[activeTab]}
          </motion.h1>
          <p className="text-slate-600 text-center">
            {getSubtext()}
          </p>
        </div>

        <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-[0_24px_60px_-24px_rgba(15,23,42,0.28)] border border-slate-200/80 p-8 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;
