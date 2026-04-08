import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatMessage from '../components/ChatMessage';

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'ai',
      content: 'Hello Counselor. I am JusticeAI. How can I assist you with your caseload today?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mock API response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `Based on your query, here is an analysis of standard contract breach protocols.\n\nA material breach occurs when one party's failure to perform defeats the essential purpose of the contract. You will need to verify whether the timeline stipulation was explicitly marked as "time is of the essence".\n\n**Consider exploring the following angles:**`,
        metadata: {
          laws: ['UCC § 2-601: Buyer\'s Rights on Improper Delivery', 'Restatement (Second) of Contracts § 241'],
          plan: ['Review the contract for "time is of the essence" clauses', 'Compile evidence of delivery delays', 'Draft a notice of default to the opposing party']
        }
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Minimal Header */}
      <div className="flex items-center px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="text-slate-500 hover:text-slate-900 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-slate-900">JusticeAI</h1>
        </div>
      </div>
      
      {/* Scrollable Chat Area */}
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
                  Analyzing legal clauses...
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Sticky Input Bar */}
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
            placeholder="Message JusticeAI..."
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

export default Chat;
