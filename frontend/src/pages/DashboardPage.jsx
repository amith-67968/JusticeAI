import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="font-body-md text-body-md antialiased overflow-x-hidden bg-surface-bright text-primary w-full min-h-screen">
      {/* JSON Component: SideNavBar */}
      <nav className="fixed left-0 top-0 h-screen w-64 border-r bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl text-slate-900 dark:text-slate-50 font-sans antialiased tracking-tight border-slate-200 dark:border-slate-800 shadow-sm flex flex-col p-4 gap-2 z-50">
        {/* Header */}
        <div className="px-4 py-6 mb-4">
          <h1 className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white">JusticeAI</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">Legal Intelligence</p>
        </div>
        
        {/* Navigation Links */}
        <div className="flex-1 flex flex-col gap-1">
          {/* Active Item: Dashboard */}
          <button onClick={() => navigate('/dashboard')} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg active:scale-95 duration-150">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>dashboard</span>
            Dashboard
          </button>
          
          <button onClick={() => navigate('/chat')} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors duration-200 active:scale-95 duration-150 rounded-lg">
            <span className="material-symbols-outlined">chat_bubble</span>
            AI Legal Chat
          </button>
          
          <button onClick={() => navigate('/analyzer')} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors duration-200 active:scale-95 duration-150 rounded-lg">
            <span className="material-symbols-outlined">analytics</span>
            Case Analyzer
          </button>
          
          <button onClick={() => navigate('/documents')} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors duration-200 active:scale-95 duration-150 rounded-lg">
            <span className="material-symbols-outlined">description</span>
            Documents
          </button>
        </div>
      </nav>

      {/* Main Content Wrapper (offset by sidebar width) */}
      <div className="pl-64 flex flex-col min-h-screen">
        {/* JSON Component: TopNavBar */}
        <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-md text-slate-900 dark:text-slate-50 font-sans text-sm border-b border-slate-200 dark:border-slate-800 flex items-center justify-end h-16 px-8">
          {/* Right Side: Actions */}
          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-100"
              title="Profile"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
            
            {isProfileOpen && (
              <div className="absolute top-10 right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name || 'User Profile'}</p>
                </div>
                <button 
                  onClick={() => {
                    logout();
                    navigate('/', { replace: true });
                  }} 
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 p-12 mx-auto w-full max-w-7xl flex flex-col gap-12">
          {/* Hero Section */}
          <section className="flex flex-col gap-2">
            <h2 className="font-h2 text-h2 text-primary tracking-tight">Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              Manage legal analysis, case reviews, and AI-powered legal assistance from one place.
            </p>
          </section>

          {/* Feature Cards Grid (Bento Style) */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feature 1: AI Chat (Highlighted) */}
            <div onClick={() => navigate('/chat')} className="cursor-pointer glass-card rounded-xl p-8 flex flex-col justify-between ai-gradient-border bg-white shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-9xl">psychology</span>
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-on-surface" style={{ fontVariationSettings: '"FILL" 1' }}>forum</span>
                </div>
                <h3 className="font-h3 text-h3 text-primary mb-2">AI Legal Chat</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-8 leading-relaxed">
                  Talk through legal issues, brainstorm defense strategies, and get instant citations from our specialized legal language model.
                </p>
              </div>
              <button className="relative z-10 w-fit px-6 py-3 bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center gap-2 hover:bg-opacity-90 transition-all">
                Open Chat <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

            {/* Feature 2: Case Analyzer */}
            <div onClick={() => navigate('/analyzer')} className="cursor-pointer glass-card rounded-xl p-8 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
              <div>
                <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-on-surface">troubleshoot</span>
                </div>
                <h3 className="font-h3 text-h3 text-primary mb-2">Case Analyzer</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-8 leading-relaxed">
                  Upload complex dockets and let the AI extract key dates, identify precedents, and highlight potential risks automatically.
                </p>
              </div>
              <button className="w-fit px-6 py-3 border border-outline-variant text-primary rounded-lg font-label-md text-label-md flex items-center gap-2 hover:bg-surface-container transition-all">
                Analyze Case
              </button>
            </div>

            {/* Feature 3: Documents */}
            <div onClick={() => navigate('/documents')} className="cursor-pointer glass-card rounded-xl p-8 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
              <div>
                <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-on-surface">folder_managed</span>
                </div>
                <h3 className="font-h3 text-h3 text-primary mb-2">Documents</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-8 leading-relaxed">
                  Browse your secure legal library. Fast semantic search across thousands of contracts, briefs, and filings.
                </p>
              </div>
              <button className="w-fit px-6 py-3 border border-outline-variant text-primary rounded-lg font-label-md text-label-md flex items-center gap-2 hover:bg-surface-container transition-all">
                Open Library
              </button>
            </div>
          </section>


        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
