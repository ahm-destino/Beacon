import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Layers, Layout, Target, BookOpen } from 'lucide-react';

export default function PracticeTypeSelect() {
  const navigate = useNavigate();
  const location = useLocation();
  const prevState = location.state || {};

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
        
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1 w-8 rounded-full bg-sky-600"></div>
          <div className="h-1 w-8 rounded-full bg-sky-600"></div>
          <div className="h-1 w-8 rounded-full bg-sky-100 dark:bg-sky-900/40"></div>
          <div className="h-1 w-8 rounded-full bg-sky-100 dark:bg-sky-900/40"></div>
        </div>
        
        <h1 className="font-[var(--font-syne)] font-bold text-2xl text-[#0C4A6E] dark:text-[#F0F9FF] leading-tight">
          How do you want to <span className="text-sky-600 font-extrabold">Practice</span>?
        </h1>
        <p className="font-[var(--font-jakarta)] text-[13px] text-sky-600/60 dark:text-sky-400/60 mt-2 leading-relaxed">
          Choose between broad subject-based testing or focused topic-specific practice.
        </p>
      </div>

      <div className="flex-1 px-5 pt-6 space-y-3">
        <button
          onClick={() => navigate('/practice/setup/subject-year', { state: { ...prevState, practiceType: 'subject' } })}
          className="group relative w-full p-6 rounded-3xl border-2 border-sky-100 dark:border-sky-900/10 bg-white dark:bg-[#0D1525] text-left hover:border-sky-600 transition-all duration-300 shadow-lg shadow-sky-500/[0.03] flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 shrink-0">
            <Layout size={28} />
          </div>
          <div className="flex-1">
            <h3 className="font-[var(--font-syne)] font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">Subject-Based</h3>
            <p className="text-[11px] text-sky-600/60 dark:text-sky-400/60 mt-1">Full mastery over an entire subject's curriculum.</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-all">
            <ArrowRight size={16} />
          </div>
        </button>

        <button
          onClick={() => navigate('/practice/setup/topic', { state: { ...prevState, practiceType: 'topic' } })}
          className="group relative w-full p-6 rounded-3xl border-2 border-sky-100 dark:border-sky-900/10 bg-white dark:bg-[#0D1525] text-left hover:border-sky-600 transition-all duration-300 shadow-lg shadow-sky-500/[0.03] flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 shrink-0">
            <Layers size={28} />
          </div>
          <div className="flex-1">
            <h3 className="font-[var(--font-syne)] font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">Topic-Based</h3>
            <p className="text-[11px] text-sky-600/60 dark:text-sky-400/60 mt-1">Surgical focus on individual weakly understood areas.</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-400 group-hover:bg-sky-600 group-hover:text-white transition-all">
            <ArrowRight size={16} />
          </div>
        </button>
      </div>

      <div className="p-10 text-center opacity-30 select-none pointer-events-none">
        <Target size={120} className="mx-auto text-sky-500/20" />
      </div>
    </div>
  );
}

