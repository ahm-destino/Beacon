import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, History, Zap, Trophy, Target, ArrowRight, RotateCcw } from 'lucide-react';

const SUBJECT_METADATA = {
  'Mathematics': { color: 'text-amber-500', bg: 'bg-amber-100/50 dark:bg-amber-900/20' },
  'Physics': { color: 'text-sky-500', bg: 'bg-sky-100/50 dark:bg-sky-900/20' },
  'Chemistry': { color: 'text-emerald-500', bg: 'bg-emerald-100/50 dark:bg-emerald-900/20' },
  'Biology': { color: 'text-rose-500', bg: 'bg-rose-100/50 dark:bg-rose-900/20' },
  'English': { color: 'text-indigo-500', bg: 'bg-indigo-100/50 dark:bg-indigo-900/20' },
};

export default function MockHistory() {
  const navigate = useNavigate();
  const mocks = JSON.parse(localStorage.getItem('mockHistory') || '[]');

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      {/* HEADER */}
      <div className="px-5 pt-8 pb-4">
        <button 
          onClick={() => navigate('/practice/mock')}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 shadow-sm mb-6"
        >
          <ChevronLeft size={20} />
        </button>
        
        <h1 className="font-[var(--font-syne)] font-black text-3xl text-[#0C4A6E] dark:text-[#F0F9FF] leading-tight">
          Simulation <span className="text-sky-600">History</span>
        </h1>
        <p className="font-[var(--font-jakarta)] text-sm text-sky-600/60 dark:text-sky-400/60 mt-2">
          Track your progress through previous mock simulations and review key insights.
        </p>
      </div>

      <div className="flex-1 px-5 pt-4 pb-24 space-y-4">
        {mocks.length === 0 ? (
          <div className="py-20 text-center space-y-4 opacity-50">
            <div className="w-20 h-20 rounded-[2rem] bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center mx-auto text-sky-300">
              <History size={40} />
            </div>
            <p className="font-[var(--font-syne)] font-bold text-sky-600/60">No simulations recorded yet.</p>
          </div>
        ) : (
          mocks.map((mock) => {
            const meta = SUBJECT_METADATA[mock.subject] || { color: 'text-sky-500', bg: 'bg-sky-50' };
            const score = mock.score || 0;
            
            return (
              <div key={mock.id} className="group relative bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/20 rounded-[2.5rem] p-5 shadow-sm hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center ${meta.bg} ${meta.color} shrink-0`}>
                    <Zap size={24} fill="currentColor" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-[var(--font-syne)] font-bold text-[#0C4A6E] dark:text-[#F0F9FF] truncate">{mock.subject} Simulation</h3>
                      <span className="shrink-0 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-900/40 text-[#0EA5E9] text-[9px] font-black uppercase">
                        {mock.questions?.length || 0} Qs
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-sky-600/40 dark:text-sky-400/40 uppercase tracking-tighter">
                      {new Date(mock.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="font-[var(--font-syne)] font-black text-xl text-sky-600 dark:text-sky-400">
                      {score}<span className="text-[10px]">%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 pb-1 border-t border-sky-50 dark:border-sky-900/10 pt-4">
                  <button
                    onClick={() => navigate(`/practice/mock/history/${mock.id}`, { state: { mock } })}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#0369A1] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-sky-500/20 active:scale-95 transition-all w-full"
                  >
                    <Trophy size={14} /> View Insights
                  </button>
                  <button
                    onClick={() => navigate('/practice/mock', { state: { retryMockId: mock.id } })}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-transparent border-2 border-sky-100 dark:border-sky-800 text-sky-700 dark:text-sky-400 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all w-full"
                  >
                    <RotateCcw size={14} /> Re-Simulation
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

