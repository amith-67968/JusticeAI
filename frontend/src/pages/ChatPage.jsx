import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatMessage from '../components/ChatMessage';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const createMessageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const buildAssistantMessage = (response) => {
  const contentBlocks = [
    response.answer,
    response.explanation,
    response.why_applicable ? `Why this applies:\n${response.why_applicable}` : '',
  ].filter(Boolean);

  return {
    id: createMessageId(),
    role: 'ai',
    content: contentBlocks.join('\n\n'),
    metadata: {
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
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <div className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex w-full items-center gap-3 px-4 py-4 sm:px-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-500 hover:text-slate-900 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">JusticeAI Chat</h1>
            <p className="text-xs text-slate-500">{user?.name || 'Current session'}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 flex w-full justify-start sm:mb-6"
            >
              <div className="flex max-w-[88%] items-end gap-2.5 sm:max-w-[70%] sm:gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse delay-75 mx-0.5"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse delay-150"></span>
                </div>
                <div className="flex items-center rounded-2xl rounded-bl-md bg-white p-3.5 text-sm text-slate-500 shadow-sm sm:p-4">
                  Reviewing relevant laws...
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2 sm:gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about your case, law section, or uploaded document..."
            className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-slate-900 outline-none shadow-sm transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            title="Send Message"
          >
            <Send size={20} className="mr-0.5 mt-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
