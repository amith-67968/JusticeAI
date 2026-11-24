import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Scale,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import { SidebarContext, useWorkspaceSidebar } from './WorkspaceSidebarContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Legal Chat', path: '/chat', icon: MessageSquare },
  { name: 'Case Analyzer', path: '/analyzer', icon: UploadCloud },
  { name: 'Documents', path: '/documents', icon: FileText },
];

export function SidebarToggle({ className = '' }) {
  const { isCollapsed, isMobileOpen, toggleSidebar } = useWorkspaceSidebar();
  const expanded = window.matchMedia('(min-width: 1024px)').matches
    ? !isCollapsed
    : isMobileOpen;

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
      aria-expanded={expanded}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white p-0 text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${className}`}
    >
      <Menu size={18} />
    </button>
  );
}

export function SectionBackButton({ className = '' }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/dashboard')}
      aria-label="Back to dashboard"
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-blue-100 bg-linear-to-br from-white to-blue-50 p-0 text-blue-700 shadow-[0_2px_8px_rgba(37,99,235,0.08)] transition hover:-translate-x-0.5 hover:border-blue-200 hover:from-blue-50 hover:to-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${className}`}
    >
      <ArrowLeft size={18} />
    </button>
  );
}

function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-full flex-col border-r border-slate-200/80 bg-white/95 px-4 py-5 shadow-[8px_0_30px_rgba(15,23,42,0.025)] backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-slate-50"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-blue-100 bg-linear-to-br from-white to-blue-50 text-blue-700 shadow-sm">
            <Scale size={20} strokeWidth={1.8} />
          </span>
          <span>
            <span className="block text-[15px] font-bold tracking-[-0.03em] text-slate-900">
              Justice<span className="text-blue-700">AI</span>
            </span>
            <span className="block text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400">
              Legal intelligence
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Close navigation"
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Workspace
      </p>
      <nav aria-label="Main navigation" className="space-y-1">
        {NAV_ITEMS.map(({ name, path, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                active
                  ? 'border-blue-100/80 bg-blue-50/80 text-blue-700 shadow-[0_2px_8px_rgba(37,99,235,0.06)]'
                  : 'border-transparent text-slate-500 hover:border-slate-100 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {React.createElement(Icon, {
                size: 16,
                className: active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600',
              })}
              {name}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="mb-3 rounded-xl border border-blue-100/80 bg-linear-to-br from-blue-50/90 to-white p-3.5 shadow-[0_3px_12px_rgba(37,99,235,0.04)]">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-slate-700">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-blue-600 shadow-sm">
              <ShieldCheck size={12} />
            </span>
            Your files stay private
          </div>
          <p className="text-[9px] leading-relaxed text-slate-500">
            Documents are processed for your analysis and never used to train public models.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceLayout() {
  const location = useLocation();
  const isFocusedSection = ['/chat', '/analyzer', '/documents'].includes(location.pathname);
  const [isCollapsed, setIsCollapsed] = useState(
    () => window.localStorage.getItem('justiceai-sidebar-collapsed') === 'true'
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem('justiceai-sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setIsCollapsed((collapsed) => !collapsed);
    } else {
      setIsMobileOpen((open) => !open);
    }
  };

  const closeMobileSidebar = () => setIsMobileOpen(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, isMobileOpen, toggleSidebar }}>
      {!isFocusedSection && !isCollapsed && (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
          <Sidebar onNavigate={closeMobileSidebar} />
        </aside>
      )}
      {!isFocusedSection && isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMobileSidebar}
            className="absolute inset-0 h-full w-full rounded-none bg-slate-900/25 p-0 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 w-64">
            <Sidebar onNavigate={closeMobileSidebar} />
          </aside>
        </div>
      )}
      <div className={`min-h-dvh ${!isFocusedSection && !isCollapsed ? 'lg:ml-64' : ''}`}>
        <Outlet />
      </div>
    </SidebarContext.Provider>
  );
}
