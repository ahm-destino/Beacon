import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Target, Sparkles, Brain, Search } from 'lucide-react';

const TOPICS = {
  'Mathematics': ['Algebra', 'Logarithms', 'Calculus', 'Statistics', 'Geometry', 'Trigonometry'],
  'Physics': ['Kinematics', 'Dynamics', 'Electricity', 'Magnetism', 'Optics', 'Waves'],
  'Chemistry': ['Organic Chemistry', 'Equilibrium', 'Atomic Structure', 'Stoichiometry', 'Thermochemistry'],
  'Biology': ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Anatomy', 'Physiology'],
  'English': ['Comprehension', 'Grammar', 'Vocabulary', 'Literary Terms', 'Oral English'],
};

const DIFFICULTIES = [
  { id: 'Basic', sub: 'Foundational concepts', icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { id: 'Normal', sub: 'Standard exam level', icon: Brain, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20' },
  { id: 'Deep', sub: 'Challenging mastery', icon: Target, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
];

export default function TopicDifficultySelect() {
  const navigate = useNavigate();
  const location = useLocation();
  const prevState = location.state || {};
  const currentSubject = prevState.prefilledSubject || prevState.subject || 'Mathematics';
  const [selectedTopic, setSelectedTopic] = useState(prevState.prefilledTopic || 'Algebra');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Normal');
  const [searchTopic, setSearchTopic] = useState('');

  const availableTopics = TOPICS[currentSubject] || [];
  const filteredTopics = availableTopics.filter(t => t.toLowerCase().includes(searchTopic.toLowerCase()));

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
          <div className="h-1 w-8 rounded-full bg-sky-100 dark:bg-sky-900/40"></div>
        </div>
        
        <h1 className="font-[var(--font-syne)] font-black text-3xl text-[#0C4A6E] dark:text-[#F0F9FF] leading-tight">
          Narrow your <span className="text-sky-600">Focus</span>
        </h1>
        <p className="font-[var(--font-jakarta)] text-sm text-sky-600/60 dark:text-sky-400/60 mt-2">
          Choose a specific topic from <span className="font-black text-sky-700 dark:text-sky-300">{currentSubject}</span> to practice.
        </p>
      </div>

      <div className="flex-1 px-5 pt-4 space-y-8 pb-10">
        {/* TOPIC SELECTION */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" size={18} />
            <input
              type="text"
              placeholder="Search or enter custom topic..."
              value={searchTopic || selectedTopic}
              onChange={(e) => {
                setSearchTopic(e.target.value);
                setSelectedTopic(e.target.value);
              }}
              className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-50 dark:border-sky-900/20 rounded-[1.5rem] pl-12 pr-4 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] focus:border-sky-600 outline-none transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filteredTopics.map(t => (
              <button
                key={t}
                onClick={() => {
                  setSelectedTopic(t);
                  setSearchTopic(t);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                  selectedTopic === t
                    ? 'bg-sky-600 text-white border-sky-600 shadow-lg shadow-sky-500/20'
                    : 'bg-white dark:bg-[#0D1525] border-sky-100 dark:border-sky-900/30 text-sky-600 hover:border-sky-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* DIFFICULTY SELECTION */}
        <div className="space-y-4">
          <p className="font-[var(--font-syne)] font-bold text-xs text-sky-500 uppercase tracking-widest pl-1">Difficulty Level</p>
          <div className="grid grid-cols-1 gap-3">
            {DIFFICULTIES.map(level => {
              const isActive = selectedDifficulty === level.id;
              const Icon = level.icon;
              return (
                <button
                  key={level.id}
                  onClick={() => setSelectedDifficulty(level.id)}
                  className={`w-full p-4 rounded-3xl border-2 transition-all duration-300 flex items-center gap-4 ${
                    isActive 
                      ? 'border-sky-600 bg-white dark:bg-[#0D1525] shadow-xl shadow-sky-500/10' 
                      : 'border-sky-100 dark:border-sky-900/20 bg-white/50 dark:bg-[#0D1525]/50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${level.bg} ${level.color}`}>
                    <Icon size={24} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-[var(--font-syne)] font-bold text-[#0C4A6E] dark:text-[#F0F9FF] text-sm">{level.id}</p>
                    <p className="text-[10px] text-sky-600/60 dark:text-sky-400/60">{level.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOOTER ACTION */}
      <div className="p-5 pb-10">
        <button
          onClick={() => navigate('/practice/setup/timer', { state: { ...prevState, subject: currentSubject, topic: selectedTopic, difficulty: selectedDifficulty } })}
          disabled={!selectedTopic}
          className="w-full bg-[#0369A1] dark:bg-[#0EA5E9] text-white py-5 rounded-[2rem] font-[var(--font-syne)] font-black text-lg shadow-xl shadow-sky-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          Finalize Setup <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

