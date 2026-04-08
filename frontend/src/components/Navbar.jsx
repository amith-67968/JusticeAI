import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scale, MessageSquare, LayoutDashboard, FileText, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Chat', path: '/chat', icon: <MessageSquare size={20} /> },
    { name: 'Analyzer', path: '/analyzer', icon: <UploadCloud size={20} /> },
    { name: 'Documents', path: '/documents', icon: <FileText size={20} /> },
  ];

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full glass-panel border-b-0 rounded-none h-[72px] flex items-center px-6 lg:px-12"
    >
      <div className="flex justify-between items-center w-full max-w-[var(--max-w-app)] mx-auto">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20 group-hover:bg-accent-primary/20 transition-colors">
            <Scale className="text-accent-primary" size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">JusticeAI</span>
        </NavLink>

        <div className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive 
                    ? 'bg-accent-primary/10 text-accent-primary' 
                    : 'text-text-secondary hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="text-xs text-text-tertiary">Premium Plan</p>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
