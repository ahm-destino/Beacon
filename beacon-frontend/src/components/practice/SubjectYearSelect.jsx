import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Layout, Book, Binary, Microscope, Languages, History, Globe, Landmark, TrendingUp, Briefcase, BookOpen } from 'lucide-react';

// Maps to the 10 subjects seeded in the database
const SUBJECTS = [
  { id: 'Mathematics', db_name: 'Mathematics', icon: Binary, color: 'text-amber-500', bg: 'bg-amber-100/50 dark:bg-amber-900/20' },
  { id: 'Use of English', db_name: 'English', icon: Languages, color: 'text-indigo-500', bg: 'bg-indigo-100/50 dark:bg-indigo-900/20' },
  { id: 'Physics', db_name: 'Physics', icon: Layout, color: 'text-sky-500', bg: 'bg-sky-100/50 dark:bg-sky-900/20' },
  { id: 'Chemistry', db_name: 'Chemistry', icon: Microscope, color: 'text-emerald-500', bg: 'bg-emerald-100/50 dark:bg-emerald-900/20' },
  { id: 'Biology', db_name: 'Biology', icon: Book, color: 'text-rose-500', bg: 'bg-rose-100/50 dark:bg-rose-900/20' },
  { id: 'Economics', db_name: 'Economics', icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-100/50 dark:bg-violet-900/20' },
  { id: 'Government', db_name: 'Government', icon: Landmark, color: 'text-orange-500', bg: 'bg-orange-100/50 dark:bg-orange-900/20' },
  { id: 'Geography', db_name: 'Geography', icon: Globe, color: 'text-teal-500', bg: 'bg-teal-100/50 dark:bg-teal-900/20' },
  { id: 'Commerce', db_name: 'Commerce', icon: Briefcase, color: 'text-fuchsia-500', bg: 'bg-fuchsia-100/50 dark:bg-fuchsia-900/20' },
  { id: 'CRS', db_name: 'Crs', icon: BookOpen, color: 'text-yellow-600', bg: 'bg-yellow-100/50 dark:bg-yellow-900/20' },
];

// Generate years backwards from 2024 to 1989
const YEARS = Array.from({ length: 2024 - 1989 + 1 }, (_, i) => String(2024 - i));

export default function SubjectYearSelect() {
  const navigate = useNavigate();
  const location = useLocation();
  const prevState = location.state || {};
  const { mode = 'practice' } = prevState;
  
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedYear, setSelectedYear] = useState('2023');

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      {/* HEADER */}
      <div className="px-5 pt-8 pb-4 shrink-0">
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
          <div className="h-1 w-8 rounded-full bg-sky-100 dark:bg-sky-900/40"></div>
        </div>
        
        <h1 className="font-[var(--font-syne)] font-bold text-2xl text-[#0C4A6E] dark:text-[#F0F9FF] leading-tight">
          Pick your <span className="text-sky-600 font-extrabold">Module</span>
        </h1>
        <p className="font-[var(--font-jakarta)] text-[13px] text-sky-600/60 dark:text-sky-400/60 mt-2 leading-relaxed">
          Select a subject and the specific exam year you wish to master.
        </p>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-8 no-scrollbar">
        {/* SUBJECT SELECTION */}
        <div className="space-y-4">
          <p className="font-[var(--font-syne)] font-bold text-xs text-sky-500 uppercase tracking-widest pl-1">Subjects</p>
          <div className="grid grid-cols-2 gap-3">
            {SUBJECTS.map(sub => {
              const Icon = sub.icon;
              const isSelected = selectedSubject === sub.db_name;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub.db_name)}
                  className={`p-3.5 rounded-2xl border-2 transition-all duration-300 flex flex-col gap-2.5 ${
                    isSelected 
                      ? 'border-sky-600 bg-white dark:bg-[#0D1525] shadow-lg shadow-sky-500/[0.03]' 
                      : 'border-sky-100 dark:border-sky-900/10 bg-white/50 dark:bg-[#0D1525]/50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${sub.bg} ${sub.color}`}>
                    <Icon size={18} />
                  </div>
                  <span className="font-[var(--font-syne)] font-bold text-[13px] text-[#0C4A6E] dark:text-[#F0F9FF] text-left">
                    {sub.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* YEAR SELECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pl-1">
            <p className="font-[var(--font-syne)] font-bold text-xs text-sky-500 uppercase tracking-widest">Exam Year</p>
            <span className="text-[10px] font-bold text-sky-400 bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 rounded-full">Available: 1989 - 2024</span>
          </div>
          {/* Scrollable grid for years to keep it compact */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1 pb-1 rounded-xl" style={{ scrollbarWidth: 'thin' }}>
            {YEARS.map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`py-3 rounded-2xl border-2 text-[13px] font-black transition-all duration-300 ${
                  selectedYear === y 
                    ? 'border-sky-600 bg-sky-600 text-white shadow-lg shadow-sky-500/20' 
                    : 'border-sky-100 dark:border-sky-900/20 bg-white/50 dark:bg-[#0D1525]/50 text-sky-700 dark:text-sky-400 hover:border-sky-300 dark:hover:border-sky-700'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER ACTION */}
      <div className="p-5 pb-8 shrink-0 bg-[#F0F9FF] dark:bg-[#080C14] border-t border-sky-100 dark:border-sky-900/20">
        <button
          onClick={() => navigate('/practice/setup/timer', { state: { ...prevState, subject: selectedSubject, year: selectedYear } })}
          className="w-full bg-[#0369A1] dark:bg-[#0EA5E9] text-white py-4.5 rounded-2xl font-[var(--font-syne)] font-bold text-[15px] shadow-lg shadow-sky-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {mode === 'exam' ? 'Start Exam Simulation' : 'Continue'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

