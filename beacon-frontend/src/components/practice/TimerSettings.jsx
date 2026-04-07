import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Clock, Zap, Target, Coffee } from 'lucide-react';

export default function TimerSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const prevState = location.state || {};
  const mode = (prevState.mode || 'practice').toLowerCase();
  const [timer, setTimer] = useState(30);
  const [noTimer, setNoTimer] = useState(false);

  const handleStart = () => {
    const finalTimer = noTimer ? null : timer * 60;
    
    // Logic for mock generator if applicable
    if (prevState.mockId) {
       // Mock flow
    }

    if (mode === 'exam') {
      navigate('/practice/exam', { state: { ...prevState, timer: finalTimer } });
      return;
    }

    if (prevState.practiceType === 'topic') {
      navigate('/practice/generating', { state: { ...prevState, timer: finalTimer } });
    } else {
      navigate('/practice/session', { state: { ...prevState, timer: finalTimer } });
    }
  };

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
          <div className="h-1 w-8 rounded-full bg-sky-600"></div>
          <div className="h-1 w-8 rounded-full bg-sky-600"></div>
        </div>
        
        <h1 className="font-[var(--font-syne)] font-bold text-2xl text-[#0C4A6E] dark:text-[#F0F9FF] leading-tight">
          Set your <span className="text-sky-600 font-extrabold">Pace</span>
        </h1>
        <p className="font-[var(--font-jakarta)] text-[13px] text-sky-600/60 dark:text-sky-400/60 mt-2 leading-relaxed">
          {mode === 'exam' 
            ? 'Challenge yourself with a strict timer to simulate real exam conditions.' 
            : 'Select a duration for your study session or practice without a timer.'}
        </p>
      </div>

      <div className="flex-1 px-5 pt-4 space-y-8">
        {/* TIMER OPTIONS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pl-1">
            <p className="font-[var(--font-syne)] font-bold text-xs text-sky-500 uppercase tracking-widest">Duration</p>
            {!noTimer && <span className="text-[10px] font-bold text-sky-400 flex items-center gap-1"><Clock size={10} /> {timer} Minutes</span>}
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 45, 60].map(t => (
              <button
                key={t}
                onClick={() => { setTimer(t); setNoTimer(false); }}
                className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all duration-300 ${
                  timer === t && !noTimer
                    ? 'border-sky-600 bg-sky-600 text-white shadow-md shadow-sky-500/10' 
                    : 'border-sky-100 dark:border-sky-900/10 bg-white/50 dark:bg-[#0D1525]/50 text-sky-700 dark:text-sky-400'
                }`}
              >
                {t}m
              </button>
            ))}
          </div>

          <button
            onClick={() => setNoTimer(!noTimer)}
            className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 ${
              noTimer 
                ? 'border-sky-600 bg-white dark:bg-[#0D1525] shadow-lg shadow-sky-500/5' 
                : 'border-sky-100 dark:border-sky-900/10 bg-white/50 dark:bg-[#0D1525]/50'
            }`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${noTimer ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500' : 'bg-sky-50 dark:bg-sky-900/20 text-sky-400'}`}>
              <Coffee size={22} />
            </div>
            <div className="text-left flex-1">
              <p className="font-[var(--font-syne)] font-bold text-[#0C4A6E] dark:text-[#F0F9FF] text-sm">No Timer</p>
              <p className="text-[10px] text-sky-600/60 dark:text-sky-400/60">Study at your own leisure pace</p>
            </div>
            {noTimer && <div className="w-5 h-5 rounded-full bg-sky-600" />}
          </button>
        </div>

        {/* SUMMARY CARD */}
        <div className="bg-white dark:bg-[#0D1525] rounded-[2.5rem] p-6 border border-sky-100 dark:border-sky-900/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <Zap size={40} className="text-sky-500/10" />
          </div>
          <p className="font-[var(--font-syne)] font-bold text-[10px] text-sky-500 uppercase tracking-widest mb-4">Session Preview</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-sky-600/60 font-medium">Subject:</span>
              <span className="text-xs text-[#0C4A6E] dark:text-[#F0F9FF] font-bold">{prevState.subject}</span>
            </div>
            {prevState.topic && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-sky-600/60 font-medium">Focus:</span>
                <span className="text-xs text-[#0C4A6E] dark:text-[#F0F9FF] font-bold truncate max-w-[150px]">{prevState.topic}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-sky-600/60 font-medium">Difficulty:</span>
              <span className="text-xs text-[#0C4A6E] dark:text-[#F0F9FF] font-bold">{prevState.difficulty || 'Normal'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTION */}
      <div className="p-5 pb-8">
        <button
          onClick={handleStart}
          className="w-full bg-[#0369A1] dark:bg-[#0EA5E9] text-white py-4.5 rounded-2xl font-[var(--font-syne)] font-bold text-base shadow-lg shadow-sky-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {mode === 'exam' ? 'Initiate Simulation' : 'Launch Session'} <Zap size={18} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}

