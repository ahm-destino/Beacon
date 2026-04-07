import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Trophy, Zap, Clock, Repeat, ArrowRight, CheckCircle2, XCircle, Brain, Target, Sparkles } from 'lucide-react';
import { Practice } from '../../services/api';
import BookmarkButton from '../shared/BookmarkButton';
import { useBookmarkIds } from '../../utils/bookmarks';

export default function PracticeHistoryDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [session, setSession] = useState(location.state?.session || null);
  const [isLoading, setIsLoading] = useState(!location.state?.session);
  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const { bookmarkIds, updateBookmarkId } = useBookmarkIds();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (location.state?.session) return;
        setIsLoading(true);
        const res = await Practice.getSessionSnapshot(id);
        const data = res?.data || {};
        if (cancelled) return;
        setSession(data?.session || null);
        setQuestions(Array.isArray(data?.questions) ? data.questions : []);
      } catch (_) {
        if (cancelled) return;
        setSession(null);
        setQuestions([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const resolvedSession = useMemo(() => session || {}, [session]);
  const accuracy = resolvedSession.score || Math.round((resolvedSession.correct / (resolvedSession.total || 1)) * 100);
  const visibleQuestions = showAllQuestions ? questions : questions.slice(0, 10);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center">
        <p className="font-[var(--font-syne)] font-bold text-[#0369A1] dark:text-[#F0F9FF]">
          Loading session snapshot…
        </p>
      </div>
    );
  }

  if (!resolvedSession.id) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center">
        <p className="font-[var(--font-syne)] font-bold text-[#0369A1] dark:text-[#F0F9FF]">
          Session not found.
        </p>
      </div>
    );
  }

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
        
        <div className="text-center space-y-2">
           <p className="font-[var(--font-jakarta)] text-[10px] text-sky-600/60 dark:text-sky-400/60 font-black uppercase tracking-widest">
            {resolvedSession.date} • {resolvedSession.mode} Session
          </p>
          <h1 className="font-[var(--font-syne)] font-bold text-2xl text-[#0C4A6E] dark:text-[#F0F9FF]">
            {resolvedSession.subject} <span className="text-sky-600 font-extrabold">Breakdown</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 px-5 pt-4 pb-24 space-y-6 overflow-y-auto">
        {/* SCORE CARD */}
        <div className="bg-white dark:bg-[#0D1525] rounded-[2.5rem] p-8 border border-sky-100 dark:border-sky-900/20 shadow-xl shadow-sky-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-[var(--font-syne)] font-bold text-6xl leading-none text-[#0C4A6E] dark:text-[#F0F9FF]">
                {accuracy}
              </span>
              <span className="text-xl font-bold text-sky-400">%</span>
            </div>
            <div className="bg-sky-50 dark:bg-sky-900/40 px-6 py-2 rounded-full border border-sky-100 dark:border-sky-800/30">
              <p className="font-[var(--font-syne)] font-bold text-sm text-sky-700 dark:text-sky-300 uppercase tracking-widest">
                {resolvedSession.correct} / {resolvedSession.total} Correct
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-sky-50 dark:border-sky-900/10 text-center">
            <div>
              <p className="text-[9px] text-sky-500/60 font-black uppercase mb-1 tracking-widest">Duration</p>
              <p className="font-[var(--font-syne)] font-black text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">{resolvedSession.time}</p>
            </div>
            <div>
              <p className="text-[9px] text-sky-500/60 font-black uppercase mb-1 tracking-widest">Efficiency</p>
              <p className="font-[var(--font-syne)] font-black text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">{resolvedSession.timeStats?.average}/q</p>
            </div>
          </div>
        </div>

        {/* TOPIC BREAKDOWN */}
        <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 border border-sky-100 dark:border-sky-900/20 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
              <Target size={18} />
            </div>
            <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">Mastery Graph</h3>
          </div>

          <div className="space-y-5">
            {(resolvedSession.topicBreakdown || []).map((t, i) => {
              const perc = Math.round((t.correct / t.total) * 100);
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80">{t.topic}</span>
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-tighter">{t.correct} / {t.total} Pts</span>
                  </div>
                  <div className="h-2 w-full bg-sky-50 dark:bg-sky-900/30 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${perc >= 70 ? 'bg-emerald-500' : perc >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${perc}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PACE STATS */}
        <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 border border-sky-100 dark:border-sky-900/20 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center">
                <Clock size={18} />
              </div>
              <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">Pacing Analytics</h3>
            </div>
            <Sparkles size={16} className="text-sky-300" />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
              {[
              { label: 'Fastest', val: resolvedSession.timeStats?.fastest, color: 'text-emerald-500' },
              { label: 'Average', val: resolvedSession.timeStats?.average, color: 'text-sky-500' },
              { label: 'Slowest', val: resolvedSession.timeStats?.slowest, color: 'text-rose-500' }
            ].map((stat, i) => (
              <div key={i} className="bg-sky-50/30 dark:bg-[#080C14] p-3 rounded-2xl border border-sky-100/50 dark:border-sky-900/30 text-center">
                <p className="text-[8px] font-black text-sky-600/40 uppercase tracking-widest mb-1.5">{stat.label}</p>
                <p className={`font-[var(--font-syne)] font-black text-sm ${stat.color}`}>{stat.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* QUESTION REVIEW */}
        {questions.length > 0 && (
          <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 border border-sky-100 dark:border-sky-900/20 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">
                Question Review
              </h3>
              {questions.length > 10 && (
                <button
                  onClick={() => setShowAllQuestions((prev) => !prev)}
                  className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest"
                >
                  {showAllQuestions ? 'Show Less' : `Show All ${questions.length}`}
                </button>
              )}
            </div>
            <div className="space-y-3">
              {visibleQuestions.map((q, idx) => {
                const isCorrect = !!q.is_correct;
                const isBookmarked = bookmarkIds.has(String(q.id || q.question_id));
                return (
                  <div
                    key={q.id || `${q.question_id}-${idx}`}
                    className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/30"
                  >
                    <div className="flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-sky-500/70 mb-1">
                        Q{idx + 1} • {isCorrect ? 'Correct' : 'Wrong'}
                      </div>
                      <p className="text-sm font-medium text-[#0C4A6E] dark:text-[#F0F9FF] line-clamp-2">
                        {q.text}
                      </p>
                    </div>
                    <BookmarkButton
                      questionId={q.id || q.question_id}
                      initialState={isBookmarked}
                      onChange={(next) => updateBookmarkId(q.id || q.question_id, next)}
                      className="w-9 h-9"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex flex-col gap-3 pb-8">
          <button
            onClick={() => navigate('/practice/review', { state: { wrongQuestions: resolvedSession.wrongQuestions || [], subject: resolvedSession.subject } })}
            className="w-full bg-[#0369A1] dark:bg-[#0EA5E9] text-white py-4.5 rounded-2xl font-[var(--font-syne)] font-bold shadow-lg shadow-sky-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Review Errors <ArrowRight size={18} />
          </button>
          
          <button
            onClick={() => navigate('/practice/setup/exam-type', { state: { mode: (resolvedSession.mode || 'practice').toLowerCase(), prefill: resolvedSession } })}
            className="w-full bg-white dark:bg-[#0D1525] text-sky-700 dark:text-sky-400 border-2 border-sky-100 dark:border-sky-900/10 py-4.5 rounded-2xl font-[var(--font-syne)] font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Repeat size={18} /> Re-Simulate Module
          </button>
        </div>
      </div>
    </div>
  );
}
