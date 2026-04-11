import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Scale, AlertCircle, BookOpenText } from 'lucide-react';
import LawyerCards from './LawyerCards';

const ChatMessage = ({ message }) => {
  const isAI = message.role === 'ai';

  const formatText = (text) => {
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
      className={`mb-4 flex w-full ${isAI ? "justify-start" : "justify-end"} sm:mb-6`}
    >
      <div className={`flex max-w-[88%] gap-2.5 sm:max-w-[75%] sm:gap-3 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>

        {/* Avatar */}
        {isAI && (
          <div className="mt-auto mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-slate-600">
            <Bot size={18} />
          </div>
        )}

        {/* Bubble */}
        <div className={`p-3.5 shadow-sm sm:p-4 ${isAI
            ? 'bg-slate-100 text-slate-900 rounded-2xl rounded-bl-md'
            : 'bg-blue-600 text-white rounded-2xl rounded-br-md ml-auto'
          }`}>
          <div className="leading-relaxed text-[0.95rem]">
            {formatText(message.content)}
          </div>

          {/* AI Metadata Results (Laws/Strategies) */}
          {isAI && message.metadata && (
            <div className="mt-4 grid gap-3 grid-cols-1 md:grid-cols-2">
              {message.metadata.laws && message.metadata.laws.length > 0 && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 text-blue-600 mb-3 font-semibold text-sm">
                    <Scale size={14} />
                    Relevant Laws
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2">
                    {message.metadata.laws.map((law, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        <span>{law}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {message.metadata.plan && message.metadata.plan.length > 0 && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-600 mb-3 font-semibold text-sm">
                    <AlertCircle size={14} />
                    Strategy
                  </div>
                  <ol className="text-xs text-slate-600 space-y-2">
                    {message.metadata.plan.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-emerald-500 font-bold shrink-0 mt-px">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {message.metadata.sources && message.metadata.sources.length > 0 && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm md:col-span-2">
                  <div className="flex items-center gap-2 text-violet-600 mb-3 font-semibold text-sm">
                    <BookOpenText size={14} />
                    Sources
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2">
                    {message.metadata.sources.map((source, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                        <span>{source}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lawyer Recommendations */}
              <LawyerCards
                lawyers={message.metadata.lawyers || []}
                linkedinUrl={message.metadata.linkedinUrl || ''}
                caseTypes={message.metadata.caseTypes || []}
                isLoading={message.metadata.lawyersLoading || false}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
