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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
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
          className="absolute -top-12 right-0 p-2 text-white hover:text-gray-200 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm flex items-center justify-center mb-6">
            <Scale className="text-accent-primary" size={32} />
          </div>
          <motion.h1 
            key={activeTab}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white tracking-tight mb-2 text-center"
          >
            {titles[activeTab]}
          </motion.h1>
          <p className="text-gray-200 text-center">
            {getSubtext()}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
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
