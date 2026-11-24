import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { animate, motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  Clock,
  FileText,
  Gavel,
  MessageSquare,
  Scale,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SidebarToggle } from '../components/WorkspaceLayout';
import ProfileDropdown from '../components/ProfileDropdown';

const CAPABILITY_STATS = [
  { label: 'Case categories', value: 5, suffix: '', icon: BarChart3, tone: 'text-violet-600 bg-violet-50' },
  { label: 'Legal sections', value: 120, suffix: '+', icon: Gavel, tone: 'text-amber-600 bg-amber-50' },
  { label: 'Avg. response', value: 10, suffix: 's', icon: Clock, tone: 'text-emerald-600 bg-emerald-50' },
];

const QUICK_PROMPTS = [
  'My landlord withheld my deposit — what can I do?',
  'I was charged a hidden fee by a seller online.',
  'Someone used my UPI ID without permission.',
];

const KNOWLEDGE_AREAS = [
  { label: 'Consumer Protection', tone: 'bg-blue-50 text-blue-700' },
  { label: 'Criminal law (BNS)', tone: 'bg-violet-50 text-violet-700' },
  { label: 'Cyber crime (IT Act)', tone: 'bg-rose-50 text-rose-700' },
  { label: 'Rent & tenancy', tone: 'bg-emerald-50 text-emerald-700' },
  { label: 'Civil procedure', tone: 'bg-amber-50 text-amber-700' },
  { label: 'Evidence & timeline', tone: 'bg-cyan-50 text-cyan-700' },
];

const FEATURE_CARDS = [
  {
    path: '/chat',
    icon: MessageSquare,
    tone: 'from-blue-500 to-cyan-400',
    chip: 'bg-blue-50 text-blue-600',
    title: 'AI Legal Chat',
    body: 'Talk through a legal issue in plain language and get answers that cite the exact section of the act behind them.',
    cta: 'Open chat',
    span: 'lg:col-span-2',
    primary: true,
  },
  {
    path: '/analyzer',
    icon: UploadCloud,
    tone: 'from-violet-500 to-fuchsia-400',
    chip: 'bg-violet-50 text-violet-600',
    title: 'Case Analyzer',
    body: 'Upload a notice or docket to score evidence strength, flag missing elements and surface the next step.',
    cta: 'Analyze case',
    span: '',
  },
  {
    path: '/documents',
    icon: FileText,
    tone: 'from-emerald-500 to-teal-400',
    chip: 'bg-emerald-50 text-emerald-600',
    title: 'Document Library',
    body: 'Every file you upload, indexed and searchable with extracted parties, dates, amounts and clauses.',
    cta: 'Open library',
    span: '',
  },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

function CountUp({ to, suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    const controls = animate(0, to, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (latest) => setValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  );
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documentCount, setDocumentCount] = useState(null);

  useEffect(() => {
    let isActive = true;

    api
      .listDocuments(user)
      .then((payload) => {
        if (!isActive) return;
        const documents = Array.isArray(payload) ? payload : payload?.documents;
        setDocumentCount(Array.isArray(documents) ? documents.length : 0);
      })
      .catch(() => {
        if (isActive) setDocumentCount(null);
      });

    return () => {
      isActive = false;
    };
  }, [user]);

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="relative min-h-dvh w-full overflow-x-clip bg-bg-primary">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-drift-a absolute -top-32 -left-24 h-112 w-md rounded-full bg-blue-200/40 blur-3xl" />
        <div className="animate-drift-b absolute top-1/3 -right-28 h-120 w-120 rounded-full bg-violet-200/35 blur-3xl" />
      </div>

      {/* Main column */}
      <div>
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
          <div className="mx-auto flex h-18 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
            <SidebarToggle />
            <div className="ml-auto flex items-center gap-2">
              <ProfileDropdown />
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
          {/* Greeting hero */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="surface-card relative overflow-hidden p-7 sm:p-10"
          >
            <div className="animate-drift-a pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full bg-blue-200/45 blur-3xl" />
            <div className="animate-drift-b pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-violet-200/40 blur-3xl" />

            <div className="pointer-events-none absolute top-1/2 right-10 hidden h-52 w-52 -translate-y-1/2 opacity-70 lg:block">
              <span className="animate-spin-slow absolute inset-0 rounded-full border border-dashed border-blue-300/50" />
              <span
                className="animate-spin-slow absolute inset-8 rounded-full border border-violet-200/70"
                style={{ animationDirection: 'reverse', animationDuration: '20s' }}
              />
              <span className="animate-float-slow absolute -top-2 left-1/2 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border border-white bg-white shadow-md">
                <Scale className="text-accent-primary" size={16} />
              </span>
              <span className="animate-float-slower absolute -bottom-2 left-1/2 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border border-white bg-white shadow-md">
                <Gavel className="text-violet-600" size={16} />
              </span>
            </div>

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-accent-primary uppercase">
                <Sparkles size={13} />
                {getGreeting()}
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 text-balance sm:text-4xl">
                {firstName ? `Welcome back, ${firstName}` : 'Welcome to JusticeAI'}
              </h1>
              <p className="mt-3 max-w-xl leading-relaxed text-slate-600">
                Upload a document, ask a question, or review what you have analysed so far — everything you
                need to move a legal problem forward lives here.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/chat')}
                  className="btn-primary group inline-flex items-center gap-2 px-6 py-3 text-sm shadow-lg shadow-blue-600/20"
                >
                  Ask the assistant
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/analyzer')}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/70 px-6 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-md"
                >
                  <UploadCloud size={16} />
                  New analysis
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/documents')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  Browse documents
                </button>
              </div>
            </div>
          </motion.section>

          {/* Stats */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="surface-card p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-accent-primary">
                  <FileText size={19} />
                </span>
                <span className="text-xs font-medium text-slate-400">Library</span>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                {documentCount === null ? '—' : <CountUp to={documentCount} />}
              </p>
              <p className="mt-1 text-sm text-slate-500">Documents analysed</p>
            </div>

            {CAPABILITY_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="surface-card p-5">
                  <div className="flex items-center justify-between">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${stat.tone}`}>
                      <Icon size={19} />
                    </span>
                    <span className="text-xs font-medium text-slate-400">Platform</span>
                  </div>
                  <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                    <CountUp to={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                </div>
              );
            })}
          </motion.section>

          {/* Feature bento */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-5 lg:grid-cols-3"
          >
            {FEATURE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <motion.article
                  key={card.path}
                  onClick={() => navigate(card.path)}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className={`surface-card group relative cursor-pointer overflow-hidden p-7 ${card.span}`}
                >
                  <div
                    className={`pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full bg-linear-to-br ${card.tone} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20`}
                  />
                  <div className="relative flex h-full flex-col">
                    <span
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.chip} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                    >
                      <Icon size={24} />
                    </span>
                    <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-900">{card.title}</h2>
                    <p className="mt-3 leading-relaxed text-slate-600">{card.body}</p>
                    <span
                      className={`mt-7 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                        card.primary
                          ? 'bg-accent-primary text-white shadow-md shadow-blue-600/20'
                          : 'border border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {card.cta}
                      <ArrowRight
                        size={15}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </motion.article>
              );
            })}
          </motion.section>

          {/* Quick prompts + knowledge */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-5 lg:grid-cols-5"
          >
            <div className="surface-card p-7 lg:col-span-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-accent-primary">
                  <MessageSquare size={20} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">Ask a quick question</h2>
                  <p className="text-sm text-slate-500">Start from a common situation</p>
                </div>
              </div>

              <ul className="mt-6 flex flex-col gap-3">
                {QUICK_PROMPTS.map((prompt) => (
                  <li key={prompt}>
                    <button
                      type="button"
                      onClick={() => navigate('/chat', { state: { draft: prompt } })}
                      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/70 px-5 py-4 text-left text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/60"
                    >
                      {prompt}
                      <ArrowRight
                        size={16}
                        className="shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-accent-primary"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface-card p-7 lg:col-span-2">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Knowledge base</h2>
              <p className="mt-1 text-sm text-slate-500">Statutes the assistant can reason over</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {KNOWLEDGE_AREAS.map((area) => (
                  <span
                    key={area.label}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${area.tone}`}
                  >
                    {area.label}
                  </span>
                ))}
              </div>

              <div className="mt-7 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ChevronDown size={15} className="text-accent-primary" />
                  What gets extracted
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {['Parties and their roles', 'Key dates and events', 'Monetary amounts', 'Missing elements'].map(
                    (item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </motion.section>

          <p className="pb-4 text-center text-xs leading-relaxed text-slate-400">
            JusticeAI provides general information, not legal advice, and does not create a
            lawyer-client relationship. Consult a qualified advocate for formal legal matters.
          </p>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
