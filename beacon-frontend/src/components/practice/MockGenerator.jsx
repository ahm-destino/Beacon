import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Zap, Target, Book, Layout, Binary, Microscope, Languages, History as HistoryIcon } from 'lucide-react';

const SUBJECTS = [
  { id: 'Mathematics', icon: Binary, color: 'text-amber-500', bg: 'bg-amber-100/50 dark:bg-amber-900/20' },
  { id: 'Physics', icon: Layout, color: 'text-sky-500', bg: 'bg-sky-100/50 dark:bg-sky-900/20' },
  { id: 'Chemistry', icon: Microscope, color: 'text-emerald-500', bg: 'bg-emerald-100/50 dark:bg-emerald-900/20' },
  { id: 'Biology', icon: Book, color: 'text-rose-500', bg: 'bg-rose-100/50 dark:bg-rose-900/20' },
  { id: 'English', icon: Languages, color: 'text-indigo-500', bg: 'bg-indigo-100/50 dark:bg-indigo-900/20' },
];

const COUNTS = [10, 20, 40, 60];

export default function MockGenerator() {
  const navigate = useNavigate();
  const location = useLocation();
  const { focusSubject, retryMockId } = location.state || {};
  const [selectedSubject, setSelectedSubject] = useState(focusSubject || 'Mathematics');
  const [count, setCount] = useState(20);

  useEffect(() => {
    if (retryMockId) {
      const mocks = JSON.parse(localStorage.getItem('mockHistory') || '[]');
      const mock = mocks.find(m => String(m.id) === String(retryMockId));
      if (mock) {
        navigate('/practice/exam', { state: { mockId: mock.id, questions: mock.questions, subject: mock.subject, mode: 'exam' } });
      }
    }
  }, [retryMockId, navigate]);

  const generateMock = () => {
    const questions = Array.from({ length: count }, (_, i) => ({
      id: `mock_${Date.now()}_${i}`,
      text: `${selectedSubject} Simulation Question ${i + 1}`,
      options: ['A. Primary Logic', 'B. Secondary Logic', 'C. Tertiary Logic', 'D. Quaternary Logic'],
      correctAnswer: 'A',
      explanation: 'This is a simulation-generated explanation for the specialized mock examination module.',
      subject: selectedSubject,
    }));

    const mock = {
      id: Date.now().toString(),
      subject: selectedSubject,
      questions,
      wrongAnswers: [],
      answers: {},
      createdAt: Date.now(),
      status: 'active'
    };

    const history = JSON.parse(localStorage.getItem('mockHistory') || '[]');
    history.unshift(mock);
    localStorage.setItem('mockHistory', JSON.stringify(history));

    navigate('/practice/exam', { state: { mockId: mock.id, questions, subject: selectedSubject, mode: 'exam' } });
  };

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
        
        <h1 className="font-[var(--font-syne)] font-black text-3xl text-[#0C4A6E] dark:text-[#F0F9FF] leading-tight">
          Mock <span className="text-sky-600">Engine</span>
        </h1>
        <p className="font-[var(--font-jakarta)] text-sm text-sky-600/60 dark:text-sky-400/60 mt-2">
          Generate a high-fidelity exam simulation tailored to your current mastery levels.
        </p>
      </div>

      <div className="flex-1 px-5 pt-4 space-y-8">
        {/* SUBJECT SELECTION */}
        <div className="space-y-4">
          <p className="font-[var(--font-syne)] font-bold text-xs text-sky-500 uppercase tracking-widest pl-1">Target Subject</p>
          <div className="grid grid-cols-2 gap-3">
            {SUBJECTS.map(sub => {
              const Icon = sub.icon;
              const isSelected = selectedSubject === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub.id)}
                  className={`p-4 rounded-3xl border-2 transition-all duration-300 flex flex-col gap-3 ${
                    isSelected 
                      ? 'border-sky-600 bg-white dark:bg-[#0D1525] shadow-xl shadow-sky-500/10' 
                      : 'border-sky-100 dark:border-sky-900/20 bg-white/50 dark:bg-[#0D1525]/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sub.bg} ${sub.color}`}>
                    <Icon size={20} />
                  </div>
                  <span className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">
                    {sub.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* COUNT SELECTION */}
        <div className="space-y-4">
          <p className="font-[var(--font-syne)] font-bold text-xs text-sky-500 uppercase tracking-widest pl-1">Question Volume</p>
          <div className="grid grid-cols-4 gap-2">
            {COUNTS.map(n => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`py-3 rounded-2xl border-2 text-xs font-black transition-all duration-300 ${
                  count === n 
                    ? 'border-sky-600 bg-sky-600 text-white shadow-lg shadow-sky-500/20' 
                    : 'border-sky-100 dark:border-sky-900/20 bg-white/50 dark:bg-[#0D1525]/50 text-sky-700 dark:text-sky-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER ACTION */}
      <div className="p-5 pb-10 space-y-4">
        <button
          onClick={generateMock}
          className="w-full bg-[#0369A1] dark:bg-[#0EA5E9] text-white py-5 rounded-[2rem] font-[var(--font-syne)] font-black text-lg shadow-xl shadow-sky-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          Initialize Mock <Zap size={20} fill="currentColor" />
        </button>
        
        <button
          onClick={() => navigate('/practice/mock/history')}
          className="w-full flex items-center justify-center gap-2 text-sky-600 dark:text-sky-400 text-sm font-bold hover:opacity-80 transition-opacity"
        >
          <HistoryIcon size={16} /> View Simulation History
        </button>
      </div>
    </div>
  );
}

