import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Scale,
  Send,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatMessage from '../components/ChatMessage';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const createMessageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Legal Chat', path: '/chat', icon: MessageSquare },
  { name: 'Case Analyzer', path: '/analyzer', icon: UploadCloud },
  { name: 'Documents', path: '/documents', icon: FileText },
];

const buildAssistantMessage = (response) => {
  return {
    id: createMessageId(),
    role: 'ai',
    content: response.answer,
    metadata: {
      explanation: response.explanation || '',
      whyApplicable: response.why_applicable || '',
      laws: response.relevant_laws || [],
      plan: response.next_steps || [],
      sources: response.sources || [],
      // Lawyer fields — populated asynchronously
      lawyers: [],
      linkedinUrl: '',
      caseTypes: [],
      lawyersLoading: true,   // starts as loading
    },
  };
};

const getUserInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'JA';

// ── Geolocation helper ─────────────────────────────────────────────────

const getLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 0, lng: 0, city: '' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Reverse-geocode to get city name
        let city = '';
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          const data = await resp.json();
          city =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.state_district ||
            data?.address?.state ||
            '';
        } catch {
          // City lookup failed — still usable with lat/lng
        }
        resolve({ lat: latitude, lng: longitude, city });
      },
      () => {
        // Permission denied or error
        resolve({ lat: 0, lng: 0, city: '' });
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  });
};

// ═══════════════════════════════════════════════════════════════════════════

const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome-message',
      role: 'ai',
      content: 'Hello. I am JusticeAI. Tell me about your legal issue, uploaded document, or next step you want help with.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Cache location so we only prompt once
  const locationRef = useRef(null);

  useEffect(() => {
    if (typeof location.state?.draft === 'string') {
      setInput(location.state.draft);
      // Consume the draft so revisiting /chat does not restore a stale prompt.
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Fetch lawyers in the background and patch the message
  const fetchLawyers = useCallback(async (messageId, aiResponse) => {
    try {
      // Get location (cached after first call)
      if (!locationRef.current) {
        locationRef.current = await getLocation();
      }
      const loc = locationRef.current;

      const lawyerData = await api.recommendLawyers(user, {
        ai_response: aiResponse,
        city: loc.city,
        lat: loc.lat,
        lng: loc.lng,
      });

      // Patch the specific message's metadata
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
              ...msg,
              metadata: {
                ...msg.metadata,
                lawyers: lawyerData.lawyers || [],
                linkedinUrl: lawyerData.linkedin_url || '',
                caseTypes: lawyerData.case_types || [],
                lawyersLoading: false,
              },
            }
            : msg
        )
      );
    } catch (err) {
      console.warn('[ChatPage] Lawyer recommendation failed:', err);
      // Stop loading even on failure
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
              ...msg,
              metadata: {
                ...msg.metadata,
                lawyersLoading: false,
              },
            }
            : msg
        )
      );
    }
  }, [user]);

  const handleSend = async (event) => {
    event?.preventDefault();
    const trimmedInput = input.trim();

    if (!trimmedInput || isTyping) {
      return;
    }

    const userMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmedInput,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await api.chat(user, {
        user_query: trimmedInput,
        session_id: sessionId,
        user_id: user?.id,
      });

      if (response.session_id) {
        setSessionId(response.session_id);
      }

      const assistantMsg = buildAssistantMessage(response);

      setMessages((currentMessages) => [...currentMessages, assistantMsg]);

      // Fire-and-forget: fetch lawyers asynchronously
      fetchLawyers(assistantMsg.id, response);

    } catch (err) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          role: 'ai',
          content: err instanceof Error
            ? `I couldn't reach the legal assistant just now.\n\n${err.message}`
            : 'I could not process that request right now.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-dvh min-h-dvh overflow-hidden bg-[#f8f9ff] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/80 bg-white/95 px-4 py-5 shadow-[8px_0_30px_rgba(15,23,42,0.025)] backdrop-blur-xl lg:flex">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-8 flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-slate-50"
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

        <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Workspace
        </p>
        <nav aria-label="Main navigation" className="space-y-1">
          {NAV_ITEMS.map(({ name, path, icon: Icon }) => {
            const active = path === '/chat';
            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                aria-current={active ? 'page' : undefined}
                className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all ${
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
              </button>
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
          <div className="flex items-center gap-2.5 border-t border-slate-100 pt-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-blue-600 to-indigo-600 text-[10px] font-semibold text-white shadow-sm">
              {getUserInitials(user?.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold text-slate-800">
                {user?.name || 'JusticeAI User'}
              </span>
              <span className="block truncate text-[9px] text-slate-400">{user?.email || ' '}</span>
            </span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-2 text-[10px] sm:text-[11px]">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              aria-label="Back to dashboard"
              className="mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-blue-700"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="font-medium text-slate-400">Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="truncate font-semibold text-slate-700">AI Legal Chat</span>
          </div>
          <span className="ml-3 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-white bg-linear-to-br from-blue-600 to-indigo-600 text-[10px] font-bold text-white shadow-sm ring-1 ring-slate-200">
            {getUserInitials(user?.name).slice(0, 1)}
          </span>
        </header>

        <nav aria-label="Mobile navigation" className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200/80 bg-white px-3 py-2 lg:hidden">
          {NAV_ITEMS.map(({ name, path, icon: Icon }) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              aria-current={path === '/chat' ? 'page' : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs ${
                path === '/chat'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {React.createElement(Icon, { size: 15 })}
              {name}
            </button>
          ))}
        </nav>

        <section className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl px-4 pb-6 pt-6 sm:px-7 sm:pt-8 lg:px-10">
              <div className="mb-7">
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-700/80">
                  Legal guidance
                </p>
                <h1 className="text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-[28px]">
                  AI Legal Chat
                </h1>
                <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-[13px]">
                  Consult statutory records, procedural remedies, case precedent, or ask questions about your documents.
                </p>
              </div>

              <div className="space-y-1">
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mb-5 flex w-full justify-start"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="flex w-full items-start gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                          <Scale size={15} />
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-xs text-slate-500 shadow-[0_2px_8px_rgba(15,23,42,0.025)]">
                          <span className="flex gap-1">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500 [animation-delay:120ms]" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500 [animation-delay:240ms]" />
                          </span>
                          Reviewing relevant laws…
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} className="h-3" />
              </div>
            </div>
          </div>

          <footer className="shrink-0 border-t border-slate-200/80 bg-white/95 px-3 py-3 shadow-[0_-4px_18px_rgba(15,23,42,0.025)] backdrop-blur sm:px-6 sm:py-4">
            <form onSubmit={handleSend} className="mx-auto w-full max-w-5xl">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_3px_12px_rgba(15,23,42,0.05)] transition focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-50 sm:gap-3 sm:p-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your case, law section, or uploaded document…"
                  aria-label="Message the legal assistant"
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-xs text-slate-800 shadow-none outline-none placeholder:text-slate-400 focus:border-0 focus:ring-0 sm:px-4 sm:text-[13px]"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 p-0 text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
                  aria-label="Send message"
                  title="Send message"
                >
                  <Send size={17} />
                </button>
              </div>
              <p className="mt-2 text-center text-[9px] leading-relaxed text-slate-400">
                AI legal guidance is for informational purposes. Verify with qualified legal counsel.
              </p>
            </form>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default ChatPage;
