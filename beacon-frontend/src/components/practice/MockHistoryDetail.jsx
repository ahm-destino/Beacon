import React, { useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, Trophy, Target, Zap, Clock, BookOpen, RotateCcw, ArrowRight } from 'lucide-react';

export default function MockHistoryDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const mock = location.state?.mock;

  const {
    questions = [],
    answers = {},
    subject,
    score = 0,
    timeTaken = 0,
    topicBreakdown = [],
    timeStats = { fastest: '—', slowest: '—', average: '—' }
  } = mock || {};

  const correctCount = useMemo(() => questions.filter(q => answers[q.id] === q.correctAnswer).length, [questions, answers]);

  const formatFullTime = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (!mock) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-sky-50 dark:bg-sky-900/20 rounded-[2rem] flex items-center justify-center text-sky-300 mb-6">
          <Target size={40} />
        </div>
        <h2 className="font-[var(--font-syne)] font-bold text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Simulation Not Found</h2>
        <p className="text-sm text-sky-600/60 dark:text-sky-400/60 mt-2">The simulation data you are looking for could not be retrieved.</p>
        <button onClick={() => navigate('/practice/mock/history')} className="mt-8 text-sky-600 font-bold flex items-center gap-2">
          <ChevronLeft size={18} /> Back to History
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      {/* HEADER */}
      <div className="px-5 pt-8 pb-4">
        <button 
          onClick={() => navigate('/practice/mock/history')}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 shadow-sm mb-6"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="text-center space-y-2">
           <p className="font-[var(--font-jakarta)] text-[10px] text-sky-600/60 dark:text-sky-400/60 font-black uppercase tracking-widest">
            {new Date(mock.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="font-[var(--font-syne)] font-bold text-2xl text-[#0C4A6E] dark:text-[#F0F9FF]">
            {subject} <span className="text-sky-600 font-extrabold">Report</span>
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
                {score}
              </span>
              <span className="text-xl font-bold text-sky-400">%</span>
            </div>
            <div className="bg-sky-50 dark:bg-sky-900/40 px-6 py-2 rounded-full border border-sky-100 dark:border-sky-800/30">
              <p className="font-[var(--font-syne)] font-bold text-sm text-sky-700 dark:text-sky-300">
                {correctCount} / {questions.length} Correct
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-sky-50 dark:border-sky-900/10 text-center">
            <div>
              <p className="text-[9px] text-sky-500/60 font-black uppercase mb-1">Total Time</p>
              <p className="font-[var(--font-syne)] font-black text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">{formatFullTime(timeTaken)}</p>
            </div>
            <div>
              <p className="text-[9px] text-sky-500/60 font-black uppercase mb-1">Efficiency</p>
              <p className="font-[var(--font-syne)] font-black text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">{timeStats.average}</p>
            </div>
          </div>
        </div>

        {/* TOPIC BREAKDOWN */}
        {topicBreakdown.length > 0 && (
          <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 border border-sky-100 dark:border-sky-900/20 shadow-sm transition-all duration-300">
            <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mb-6">Mastery Heatmap</h3>
            <div className="space-y-5">
              {topicBreakdown.map((t, idx) => {
                const perc = Math.round((t.correct / t.total) * 100);
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80">{t.topic}</span>
                      <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">{t.correct}/{t.total}</span>
                    </div>
                    <div className="h-2 w-full bg-sky-50 dark:bg-sky-900/30 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${perc >= 75 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : perc >= 50 ? 'bg-sky-500' : 'bg-amber-500'}`}
                        style={{ width: `${perc}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="space-y-3 pb-8">
          <button
            onClick={() => navigate('/practice/mock', { state: { retryMockId: id } })}
             className="w-full bg-[#0369A1] dark:bg-[#0EA5E9] text-white py-4.5 rounded-2xl font-[var(--font-syne)] font-bold shadow-lg shadow-sky-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} /> Re-Attempt Simulation
          </button>
          <button
            onClick={() => navigate('/practice/mock/history')}
            className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 text-sky-700 dark:text-sky-400 py-4.5 rounded-2xl font-[var(--font-syne)] font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Back to Archive
          </button>
        </div>
      </div>
    </div>
  );
}
