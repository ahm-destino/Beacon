import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Zap, Target, BookOpen, GraduationCap } from 'lucide-react';

export default function ExamTypeSelect() {
  const navigate = useNavigate();
  const location = useLocation();
  const prevState = location.state || {};
  const { mode = 'practice' } = prevState;
  const [selectedExam, setSelectedExam] = useState('JAMB');

  const EXAMS = [
    { id: 'JAMB', label: 'JAMB UTME', sub: 'Unified Tertiary Matriculation Examination', icon: Zap, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20' },
    { id: 'WAEC', label: 'WAEC SSCE', sub: 'West African Senior School Certificate', icon: GraduationCap, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { id: 'NECO', label: 'NECO SSCE', sub: 'National Examinations Council', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { id: 'JUPEB', label: 'JUPEB', sub: 'Joint Universities Preliminary Board', icon: Target, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      {/* HEADER */}
      <div className="px-5 pt-8 pb-4">
        <button 
          onClick={() => navigate('/practice')}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 shadow-sm mb-6"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1 w-8 rounded-full bg-sky-600"></div>
          <div className="h-1 w-8 rounded-full bg-sky-100 dark:bg-sky-900/40"></div>
          <div className="h-1 w-8 rounded-full bg-sky-100 dark:bg-sky-900/40"></div>
          <div className="h-1 w-8 rounded-full bg-sky-100 dark:bg-sky-900/40"></div>
        </div>
        
        <h1 className="font-[var(--font-syne)] font-bold text-2xl text-[#0C4A6E] dark:text-[#F0F9FF] leading-tight">
          Choose your <span className="text-sky-600 font-extrabold">Exam Type</span>
        </h1>
        <p className="font-[var(--font-jakarta)] text-[13px] text-sky-600/60 dark:text-sky-400/60 mt-2 leading-relaxed">
          Select the specific examination you are preparing for to get customized questions.
        </p>
      </div>

      <div className="flex-1 px-5 pt-4 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {EXAMS.map(exam => {
            const Icon = exam.icon;
            const isSelected = selectedExam === exam.id;
            
            return (
              <button
                key={exam.id}
                onClick={() => setSelectedExam(exam.id)}
                className={`relative w-full p-4 rounded-2xl border-2 text-left transition-all duration-300 flex items-center gap-4 ${
                  isSelected 
                    ? 'border-sky-600 bg-white dark:bg-[#0D1525] shadow-lg shadow-sky-500/5' 
                    : 'border-sky-100 dark:border-sky-900/10 bg-white/50 dark:bg-[#0D1525]/50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${exam.bg} ${exam.color}`}>
                  <Icon size={24} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF]">
                    {exam.label}
                  </h3>
                  <p className="text-[11px] text-sky-600/60 dark:text-sky-400/60 truncate">
                    {exam.sub}
                  </p>
                </div>
                
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-sky-600 flex items-center justify-center text-white">
                    <ArrowRight size={12} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FOOTER ACTION */}
      <div className="p-5 pb-8">
        <button
          onClick={() => {
            const nextPath = mode === 'exam' ? '/practice/setup/subject-year' : '/practice/setup/type';
            navigate(nextPath, { state: { ...prevState, mode, examType: selectedExam } });
          }}
          className="w-full bg-[#0369A1] dark:bg-[#0EA5E9] text-white py-4.5 rounded-2xl font-[var(--font-syne)] font-bold text-base shadow-lg shadow-sky-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Continue <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

