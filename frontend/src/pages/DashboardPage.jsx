import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Briefcase, UploadCloud, FolderOpen, ArrowRight, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlowCard from '../components/ui/spotlight-card';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  };

  const features = [
    {
      id: 'chat',
      title: 'AI Legal Chat',
      description: 'Talk through a legal issue, ask about relevant sections, and get structured next steps from the backend assistant.',
      icon: <Briefcase size={32} className="text-accent-primary" />,
      path: '/chat',
    },
    {
      id: 'analyzer',
      title: 'Case Analyzer',
      description: 'Upload a document and run the real extraction, classification, and case-analysis pipeline.',
      icon: <UploadCloud size={32} className="text-accent-primary" />,
      path: '/analyzer',
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Browse your uploaded files, open them again, or clean up the documents linked to this session.',
      icon: <FolderOpen size={32} className="text-accent-primary" />,
      path: '/documents',
    },
  ];

  return (
    <div className="page-container flex min-h-dvh flex-col bg-gray-50">
      <div className="border-b border-gray-200 bg-white shrink-0">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg border border-blue-200 bg-blue-100 p-2 text-sm font-semibold text-blue-600 shadow-sm">
              AI
            </div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
              JusticeAI
            </h1>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-gray-100 sm:w-auto">
              <span className="flex items-center justify-center rounded-full bg-blue-100 p-1.5 text-blue-600">
                <User size={16} />
              </span>
              <span className="truncate text-sm font-medium text-gray-900">{user?.name || 'Profile'}</span>
            </button>

            <button
              onClick={() => {
                logout();
                navigate('/', { replace: true });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-red-600 transition hover:bg-red-50 sm:w-auto"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
          <h1 className="mb-8 text-center text-3xl font-bold text-gray-900 sm:text-4xl md:mb-10 md:text-5xl">
            {user?.name ? `Welcome, ${user.name}` : 'Dashboard'}
          </h1>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid w-full grid-cols-1 gap-8 md:grid-cols-3 md:gap-12"
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
                  className="h-full w-full hover:border-accent-primary/40"
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-primary/20 bg-accent-primary/10 transition-colors group-hover:bg-accent-primary/20">
                    {feature.icon}
                  </div>

                  <div className="flex-1">
                    <h3 className="mb-3 text-xl font-bold text-slate-900 transition-colors group-hover:text-accent-primary">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-text-secondary">
                      {feature.description}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center text-sm font-semibold text-accent-primary group-hover:text-accent-hover">
                    Open Feature <ArrowRight size={16} className="ml-1 opacity-0 -translate-x-2 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
