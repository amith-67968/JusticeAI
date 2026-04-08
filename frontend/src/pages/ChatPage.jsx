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
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex items-center px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-500 hover:text-slate-900 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">JusticeAI Chat</h1>
            <p className="text-xs text-slate-500">{user?.name || 'Current session'}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex w-full justify-start mb-6"
            >
              <div className="flex gap-3 max-w-[70%] items-end">
                <div className="shrink-0 w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center border border-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse delay-75 mx-0.5"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse delay-150"></span>
                </div>
                <div className="p-4 rounded-2xl rounded-bl-md bg-white text-slate-500 text-sm flex items-center shadow-sm">
                  Reviewing relevant laws...
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="p-4 bg-white border-t border-slate-200 shrink-0 flex justify-center shadow-sm">
        <div className="w-full max-w-3xl flex items-center gap-3">
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
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-900 bg-white shadow-sm"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 bg-blue-600 text-white flex flex-col items-center justify-center rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-sm"
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
