import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Briefcase, UploadCloud, FolderOpen, ArrowRight, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlowCard from '../components/ui/spotlight-card';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const features = [
    {
      id: 'chat',
      title: 'AI Legal Chat',
      description: 'Chat with our advanced AI to analyze precedents, draft documents, and get instant legal insights tailored to your case.',
      icon: <Briefcase size={32} className="text-accent-primary" />,
      path: '/chat'
    },
    {
      id: 'analyzer',
      title: 'Case Analyzer',
      description: 'Upload case files or photos of documents. The AI instantly extracts key entities, summaries, and potential arguments.',
      icon: <UploadCloud size={32} className="text-accent-primary" />,
      path: '/analyzer'
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'A secure, organized repository for all your case files, evidence, and generated drafts.',
      icon: <FolderOpen size={32} className="text-accent-primary" />,
      path: '/documents'
    }
  ];

  return (
    <div className="page-container flex flex-col h-screen">
      {/* Minimal App Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg text-lg flex items-center justify-center border border-blue-200 shadow-sm">
            ⚖️
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            JusticeAI
          </h1>
        </div>
        {/* Right: User Section */}
        <div className="flex items-center gap-3">
          {/* Profile */}
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
            <span className="bg-blue-100 text-blue-600 p-1.5 rounded-full flex items-center justify-center">
              <User size={16} />
            </span>
            <span className="text-sm font-medium text-gray-900">{user?.name || 'Profile'}</span>
          </button>

          {/* Logout */}
          <button
            onClick={() => {
              logout();
              navigate('/', { replace: true });
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 transition text-red-600"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center bg-gray-50 px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-10">
          {user?.name ? `Welcome, ${user.name}` : 'Dashboard'}
        </h1>

        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              variants={itemVariants}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
              }}
              whileTap={{ scale: 0.98 }}
              className="h-full"
            >
              <GlowCard 
                onClick={() => navigate(feature.path)}
                glowColor="black"
                customSize={true}
                className="hover:border-accent-primary/40 h-full w-full"
              >
                <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 flex items-center justify-center mb-6 group-hover:bg-accent-primary/20 transition-colors border border-accent-primary/20">
                  {feature.icon}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-accent-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-8 flex items-center text-sm font-semibold text-accent-primary group-hover:text-accent-hover">
                  Get Started <ArrowRight size={16} className="ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
