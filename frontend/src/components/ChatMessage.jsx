import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, BookOpenText, Bot, Lightbulb, Scale, UserRound } from 'lucide-react';
import LawyerCards from './LawyerCards';

const ChatMessage = ({ message }) => {
  const isAI = message.role === 'ai';

  const formatText = (text) =>
    String(text || '')
      .split('\n')
      .map((paragraph, index) => {
        if (!paragraph.trim()) {
          return <br key={index} />;
        }

        return (
          <p key={index} className="mb-2 last:mb-0">
            {paragraph.split('**').map((chunk, chunkIndex) =>
              chunkIndex % 2 === 1 ? (
                <strong key={chunkIndex} className="font-semibold text-slate-900">
                  {chunk}
                </strong>
              ) : (
                chunk
              )
            )}
          </p>
        );
      });

  const metadata = message.metadata;

  return (
    <motion.div
      initial={{ opacity: 0, x: isAI ? -12 : 12, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      className={`mb-5 flex w-full ${isAI ? 'justify-start' : 'justify-end'} sm:mb-6`}
    >
      {isAI ? (
        <div className="flex w-full items-start gap-3">
          <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
            <Bot size={16} />
          </div>
          <article className="min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_3px_12px_rgba(15,23,42,0.035)] sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-900">JusticeAI</span>
              <span className="h-1 w-1 rounded-full bg-blue-300" />
              <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-slate-400">
                Legal assistant
              </span>
            </div>

            {message.content && (
              <div className="text-[12px] leading-6 text-slate-700 sm:text-[13px] sm:leading-7">
                {formatText(message.content)}
              </div>
            )}

            {metadata?.explanation && (
              <section className={`${message.content ? 'mt-3 border-t border-slate-100 pt-3' : ''}`}>
                <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Legal explanation
                </h3>
                <div className="text-[11px] leading-6 text-slate-600 sm:text-xs">
                  {formatText(metadata.explanation)}
                </div>
              </section>
            )}

            {metadata && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {metadata.whyApplicable && (
                  <section className="rounded-xl border border-violet-100 bg-violet-50/70 p-3.5 md:col-span-2 sm:p-4">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-violet-800">
                      <Lightbulb size={14} />
                      Why This Applies
                    </div>
                    <div className="text-[10px] leading-5 text-slate-600 sm:text-[11px] sm:leading-6">
                      {formatText(metadata.whyApplicable)}
                    </div>
                  </section>
                )}

                {metadata.laws?.length > 0 && (
                  <section className="rounded-xl border border-blue-100 bg-blue-50/65 p-3.5 sm:p-4">
                    <div className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold text-blue-800">
                      <Scale size={14} />
                      Relevant Laws
                    </div>
                    <ul className="space-y-2 text-[10px] leading-5 text-slate-600 sm:text-[11px]">
                      {metadata.laws.map((law, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                          <span>{law}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {metadata.plan?.length > 0 && (
                  <section className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 sm:p-4">
                    <div className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold text-emerald-800">
                      <AlertCircle size={14} />
                      Recommended Strategy
                    </div>
                    <ol className="space-y-2 text-[10px] leading-5 text-slate-600 sm:text-[11px]">
                      {metadata.plan.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="shrink-0 font-semibold text-emerald-700">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {metadata.sources?.length > 0 && (
                  <section className="rounded-xl border border-violet-100 bg-violet-50/60 p-3.5 md:col-span-2 sm:p-4">
                    <div className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold text-violet-800">
                      <BookOpenText size={14} />
                      Sources
                    </div>
                    <ul className="flex flex-wrap gap-2">
                      {metadata.sources.map((source, index) => (
                        <li
                          key={index}
                          className="max-w-full break-words rounded-lg border border-violet-100 bg-white/80 px-2.5 py-1.5 text-[9px] leading-4 text-slate-600 sm:text-[10px]"
                        >
                          {source}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <LawyerCards
                  lawyers={metadata.lawyers || []}
                  linkedinUrl={metadata.linkedinUrl || ''}
                  caseTypes={metadata.caseTypes || []}
                  isLoading={metadata.lawyersLoading || false}
                />
              </div>
            )}
          </article>
        </div>
      ) : (
        <div className="flex max-w-[88%] items-end gap-2 sm:max-w-[78%] sm:gap-3">
          <div className="rounded-2xl rounded-br-md border border-blue-100 bg-blue-100/70 px-4 py-3 text-[12px] leading-6 text-slate-800 sm:px-5 sm:py-3.5 sm:text-[13px]">
            {formatText(message.content)}
          </div>
          <div className="mb-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-white shadow-sm">
            <UserRound size={14} />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
