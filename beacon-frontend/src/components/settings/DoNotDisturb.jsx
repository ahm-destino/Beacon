import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Moon, Sun, Calendar, ShieldAlert } from 'lucide-react';

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
        on ? 'bg-sky-600' : 'bg-sky-200 dark:bg-sky-900/30'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
          on ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function DoNotDisturb() {
  const navigate = useNavigate();
  const [fromTime, setFromTime] = useState('22:00');
  const [toTime, setToTime] = useState('07:00');
  const [weekendMode, setWeekendMode] = useState(true);
  const [examDaySilence, setExamDaySilence] = useState(true);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <div className="px-5 pt-6 flex items-center justify-between mb-8">
        <button onClick={() => navigate('/settings')} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Do Not Disturb</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-[2rem] bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center mx-auto mb-4 text-sky-600">
            <Moon size={32} />
          </div>
          <p className="text-sm text-sky-600/60 dark:text-sky-400/60 leading-relaxed font-bold">
            No notifications will be sent during your quiet hours, except for critical alerts.
          </p>
        </div>

        {/* TIME RANGE */}
        <div className="bg-white dark:bg-[#0D1525] rounded-[2rem] border border-sky-100 dark:border-sky-900/10 overflow-hidden shadow-sm mb-8">
          <div className="flex items-center justify-between px-6 py-5 border-b border-sky-50 dark:border-sky-900/5">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 flex items-center justify-center">
                <Moon size={18} />
              </div>
              <p className="text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">Quiet Hours From</p>
            </div>
            <input 
              type="time" 
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
              className="bg-sky-50 dark:bg-sky-900/20 text-sky-600 px-4 py-2 rounded-xl text-sm font-black outline-none"
            />
          </div>
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 flex items-center justify-center">
                <Sun size={18} />
              </div>
              <p className="text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">Quiet Hours To</p>
            </div>
            <input 
              type="time" 
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
              className="bg-sky-50 dark:bg-sky-900/20 text-sky-600 px-4 py-2 rounded-xl text-sm font-black outline-none"
            />
          </div>
        </div>

        {/* SPECIAL MODES */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0D1525] p-6 rounded-[2rem] border border-sky-100 dark:border-sky-900/10 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-sky-600">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">Weekend Mode</p>
                <p className="text-[10px] font-bold text-sky-600/40 uppercase tracking-widest mt-0.5">Reduce alerts on Sat/Sun</p>
              </div>
            </div>
            <Toggle on={weekendMode} onChange={() => setWeekendMode(!weekendMode)} />
          </div>

          <div className="bg-white dark:bg-[#0D1525] p-6 rounded-[2rem] border border-sky-100 dark:border-sky-900/10 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
                <ShieldAlert size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">Exam Day Silence</p>
                <p className="text-[10px] font-bold text-rose-600/40 uppercase tracking-widest mt-0.5">Silence non-critical alerts</p>
              </div>
            </div>
            <Toggle on={examDaySilence} onChange={() => setExamDaySilence(!examDaySilence)} />
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-black uppercase text-sky-600/30 tracking-widest">
           Settings are saved automatically
        </p>
      </div>
    </div>
  );
}
