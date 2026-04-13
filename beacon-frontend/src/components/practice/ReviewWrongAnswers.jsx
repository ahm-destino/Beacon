import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Brain, BookOpen, RotateCcw, ArrowRight, MessageSquare, Plus, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import BookmarkButton from '../shared/BookmarkButton';
import { useBookmarkIds } from '../../utils/bookmarks';
import QuestionTextFormatter from '../shared/QuestionTextFormatter';
import FormattedExplanation, { buildCopyText } from '../shared/FormattedExplanation';

export default function ReviewWrongAnswers() {
  const navigate = useNavigate();
  const location = useLocation();
  const { wrongQuestions = [], subject, examType } = location.state || {};
  const [expanded, setExpanded] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const { bookmarkIds, updateBookmarkId } = useBookmarkIds();

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const showToast = (msg) => console.info(msg);

  const handleCopyExplanation = async (question) => {
    const raw = question?.explanation || '';
    if (!raw) return;
    const { text } = buildCopyText(raw);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(question.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (_) {
      // best effort
    }
  };

  const filtered = activeFilter === 'All'
    ? wrongQuestions
    : wrongQuestions.filter(q => q.subject === activeFilter);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      {/* HEADER */}
      <div className="px-5 pt-8 pb-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 shadow-sm mb-6"
        >
          <ChevronLeft size={20} />
        </button>
        
        <h1 className="font-[var(--font-syne)] font-bold text-2xl text-[#0C4A6E] dark:text-[#F0F9FF] leading-tight">
          Review <span className="text-sky-600 font-extrabold">Insights</span>
        </h1>
        <p className="font-[var(--font-jakarta)] text-[13px] text-sky-600/60 dark:text-sky-400/60 mt-2 leading-relaxed">
          Deconstruct your errors and master the underlying concepts.
        </p>
      </div>

      <div className="flex-1 px-5 pt-4 pb-24 space-y-6">
        {/* FILTER BAR */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {['All', subject || 'General'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeFilter === f 
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/10' 
                  : 'bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/10 text-sky-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="py-20 text-center space-y-4 opacity-50">
              <div className="w-20 h-20 rounded-[2rem] bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center mx-auto text-sky-300">
                <Sparkles size={40} />
              </div>
              <p className="font-[var(--font-syne)] font-bold text-sky-600/60">Flawless execution. No errors to review.</p>
            </div>
          ) : (
            filtered.map((question, idx) => (
              <div key={question.id} className="bg-white dark:bg-[#0D1525] rounded-3xl border-2 border-sky-100 dark:border-sky-900/10 p-5 shadow-sm overflow-hidden transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-500 text-[10px] font-black uppercase tracking-tighter">
                    Question {idx + 1}
                  </span>
                  <div className="flex gap-2">
                    <BookmarkButton
                      questionId={question.id}
                      initialState={bookmarkIds.has(String(question.id))}
                      onChange={(next) => updateBookmarkId(question.id, next)}
                      className="w-8 h-8 rounded-xl"
                    />
                    <button
                      onClick={() => navigate('/ai-tutor/chat', {
                        state: {
                          questionContext: { text: question.text, correctAnswer: question.correctAnswer, subject: question.subject || subject },
                          autoSend: true,
                        },
                      })}
                      className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800/30"
                    >
                      <Brain size={16} />
                    </button>
                    <button
                      onClick={() => {
                        const reviews = JSON.parse(localStorage.getItem('reviewQueue') || '[]');
                        reviews.push({ ...question, addedAt: Date.now() });
                        localStorage.setItem('reviewQueue', JSON.stringify(reviews));
                        showToast('Added to review queue!');
                      }}
                       className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <QuestionTextFormatter text={question.text} imageUrl={question.image_url} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/30 dark:border-emerald-800/20">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black">
                        {question.correctAnswer}
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Correct Answer</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleExpand(question.id)}
                    className="w-full py-4 rounded-2xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100/50 dark:border-sky-800/30 flex items-center justify-center gap-2 transition-all hover:bg-sky-100 dark:hover:bg-sky-900/40"
                  >
                    <span className="text-xs font-black text-sky-700 dark:text-sky-400 uppercase tracking-widest flex items-center gap-2">
                      {expanded[question.id] ? <><ChevronUp size={14} /> Close Logic</> : <><ChevronDown size={14} /> Reveal Deconstruction</>}
                    </span>
                  </button>

                  {expanded[question.id] && (
                    <div className="p-5 mt-2 bg-white dark:bg-[#080C14] rounded-3xl border border-sky-100 dark:border-sky-900/20 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <BookOpen size={16} className="text-sky-500" />
                          <h4 className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Scientific Explanation</h4>
                        </div>
                        <button
                          onClick={() => handleCopyExplanation(question)}
                          className="text-[10px] font-bold uppercase tracking-widest text-sky-500 hover:text-sky-600"
                        >
                          {copiedId === question.id ? 'Copied' : 'Copy steps'}
                        </button>
                      </div>
                      <div className="text-xs leading-relaxed text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80 italic">
                        <FormattedExplanation text={question.explanation || 'The logical progression for this module involves advanced subject-specific synthesis currently undergoing optimization.'} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FOOTER ACTION */}
      <div className="p-5 pb-8">
        <button
          onClick={() => navigate('/practice')}
          className="w-full bg-[#0369A1] dark:bg-[#0EA5E9] text-white py-4.5 rounded-2xl font-[var(--font-syne)] font-bold text-base shadow-lg shadow-sky-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Mastery Complete <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

