import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Scale, AlertCircle } from 'lucide-react';

const ChatMessage = ({ message }) => {
  const isAI = message.role === 'ai';

  const formatText = (text) => {
    // Simple mock markdown formatting for paragraphs and bold text
    return text.split('\n').map((paragraph, i) => {
      if (!paragraph.trim()) return <br key={i} />;
      return (
        <p key={i} className="mb-2 last:mb-0">
          {paragraph.split('**').map((chunk, j) => 
            j % 2 === 1 ? <strong key={j} className={isAI ? "text-slate-900 font-bold" : "text-white font-bold"}>{chunk}</strong> : chunk
          )}
        </p>
      );
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: isAI ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex w-full ${isAI ? "justify-start" : "justify-end"} mb-6`}
    >
      <div className={`flex gap-3 max-w-[60%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        {isAI && (
          <div className="shrink-0 w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mt-auto mb-1 border border-slate-300">
            <Bot size={18} />
          </div>
        )}

        {/* Bubble */}
        <div className={`p-4 shadow-sm ${
          isAI 
            ? 'bg-slate-100 text-slate-900 rounded-2xl rounded-bl-md' 
            : 'bg-blue-600 text-white rounded-2xl rounded-br-md ml-auto'
        }`}>
          <div className="leading-relaxed text-[0.95rem]">
            {formatText(message.content)}
          </div>

          {/* AI Metadata Results (Laws/Strategies) */}
          {isAI && message.metadata && (
            <div className="mt-4 grid gap-3 grid-cols-1 md:grid-cols-2">
              {message.metadata.laws && (
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 text-blue-600 mb-2 font-medium text-sm">
                    <Scale size={14} />
                    Relevant Precedents
                  </div>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                    {message.metadata.laws.map((law, idx) => (
                      <li key={idx} className="truncate" title={law}>{law}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {message.metadata.plan && (
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-600 mb-2 font-medium text-sm">
                    <AlertCircle size={14} />
                    Strategy
                  </div>
                  <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1">
                    {message.metadata.plan.map((step, idx) => (
                      <li key={idx} className="truncate" title={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
