import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowRight, Bookmark, Clock, Target, Zap, BarChart3, Compass, FileText, Grid3x3, BookOpen } from 'lucide-react';
import AppHeader from '../shared/AppHeader';
import BottomNav from '../shared/BottomNav';
import { loadPracticeState, updatePracticeState } from '../../utils/practiceState';
import { useBookmarkIds } from '../../utils/bookmarks';

export default function PracticeHub() {
  const navigate = useNavigate();
  const practiceState = loadPracticeState();
  const savedSession = practiceState.currentSession || JSON.parse(localStorage.getItem('savedPracticeSession') || 'null');
  const { bookmarkIds } = useBookmarkIds();
  const bookmarkCount = bookmarkIds.size || 0;
  const historyCount = practiceState.history?.length || JSON.parse(localStorage.getItem('sessionHistory') || '[]').length;

  const handleResume = () => {
    if (!savedSession) return;
    const sessionId = savedSession.id || Date.now().toString();
    const path = savedSession.mode === 'exam' ? `/practice/exam-session/${sessionId}` : `/practice/session/${sessionId}`;
    navigate(path, { state: { ...savedSession, id: sessionId, resuming: true } });
  };

  const handleStartFresh = () => {
    updatePracticeState(prev => ({ ...prev, currentSession: null }));
    localStorage.removeItem('savedPracticeSession');
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-24">
      <AppHeader title="Practice" />
      
      <div className="max-w-md mx-auto px-5 pt-4">
        
        {/* MAIN ACTION CARDS */}
        <div className="flex flex-col gap-4">
          
          {/* CARD 1 — PRACTICE MODE */}
          <button 
            onClick={() => navigate('/practice/setup/exam-type', { state: { mode: 'practice' } })}
            className="w-full text-left block bg-gradient-to-br from-sky-600 to-sky-700 dark:from-sky-800 dark:to-sky-900 rounded-2xl p-6 border border-transparent dark:border-sky-700/20 cursor-pointer hover:scale-[1.01] transition-all duration-200 shadow-xl shadow-sky-500/10 dark:shadow-none active:scale-[0.99] focus:ring-2 focus:ring-sky-500/50"
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                <Target size={22} className="text-white" />
              </div>
            </div>
            <h2 className="font-[var(--font-syne)] font-bold text-xl text-white mt-4">Practice Mode</h2>
            <p className="text-[13px] text-sky-100 mt-1 leading-relaxed">See answers and explanations instantly</p>
            <div className="flex items-center justify-between mt-5">
              <span className="text-[11px] text-sky-200 font-['Plus_Jakarta_Sans'] font-medium">10,000+ questions</span>
              <div className="bg-white/20 hover:bg-white/30 text-white rounded-xl px-4 py-2 font-[var(--font-syne)] font-bold text-sm flex items-center gap-1 transition-colors">
                Start Practice <ArrowRight size={16} />
              </div>
            </div>
          </button>

          {/* CARD 2 — EXAM MODE */}
          <button 
            onClick={() => navigate('/practice/setup/exam-type', { state: { mode: 'exam' } })}
            className="w-full text-left block bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/30 rounded-2xl p-6 hover:border-sky-300 dark:hover:border-sky-700/50 hover:shadow-lg cursor-pointer transition-all duration-200 active:scale-[0.99] focus:ring-2 focus:ring-sky-500/50"
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center text-2xl">
                <Zap size={20} />
              </div>
            </div>
            <h2 className="font-[var(--font-syne)] font-bold text-xl text-[#0369A1] dark:text-[#0EA5E9] mt-4">Exam Mode</h2>
            <p className="text-sm text-[#0369A1] dark:text-[#7DD3FC] mt-1">Full simulation. No hints. No explanations.</p>
            <div className="flex justify-between items-center mt-5">
              <span className="text-xs text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 font-['Plus_Jakarta_Sans']">Real exam conditions</span>
              <div className="bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-xl px-4 py-2 font-[var(--font-syne)] font-bold text-sm flex items-center gap-1 transition-colors">
                Start Exam <ArrowRight size={16} />
              </div>
            </div>
          </button>

          {/* CARD 3 — MOCK EXAMS */}
          <button 
            onClick={() => navigate('/practice/mock')}
            className="w-full text-left block bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/30 rounded-2xl p-6 hover:border-sky-300 dark:hover:border-sky-700/50 hover:shadow-lg cursor-pointer transition-all duration-200 active:scale-[0.99] focus:ring-2 focus:ring-sky-500/50"
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl">
                <BarChart3 size={20} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
            <h2 className="font-[var(--font-syne)] font-bold text-xl text-[#0369A1] dark:text-[#0EA5E9]">CBT Exam Simulator</h2>
            </div>
            <p className="text-sm text-[#0369A1] dark:text-[#7DD3FC] mt-1">Real JAMB, WAEC & NECO patterns. Official timing.</p>
            <div className="flex justify-between items-center mt-5">
              <span className="text-xs text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 font-['Plus_Jakarta_Sans']">Subject bundling & analytics</span>
              <div className="bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-xl px-4 py-2 font-[var(--font-syne)] font-bold text-sm flex items-center gap-1 transition-colors">
                Start Simulation <ArrowRight size={16} />
              </div>
            </div>
          </button>
        </div>

        {/* CONTINUE SESSION BAR */}
        {savedSession && (
          <div className="mt-6 bg-gradient-to-r from-sky-600 to-sky-700 dark:from-sky-800 dark:to-sky-900 rounded-2xl p-4 shadow-lg shadow-sky-500/10 dark:shadow-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <Play size={20} fill="currentColor" className="ml-0.5" />
              </div>
              <div className="flex-1">
                <p className="font-[var(--font-syne)] font-bold text-sm text-white">Continue Session</p>
                <p className="text-xs text-sky-200 mt-0.5">
                  {(savedSession.examType || 'Practice')}{savedSession.year ? ` ${savedSession.year}` : ''} {savedSession.subject ? ` ${savedSession.subject}` : ''} — Q{(savedSession.currentIndex ?? 0) + 1}/{savedSession.questions?.length || 0}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleResume}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white rounded-xl py-2 text-xs font-bold transition-all"
              >
                Resume
              </button>
              <button
                onClick={handleStartFresh}
                className="flex-1 bg-white text-sky-700 rounded-xl py-2 text-xs font-bold transition-all"
              >
                Start Fresh
              </button>
            </div>
          </div>
        )}

        {/* MORE TOOLS SECTION */}
        <div className="mt-8">
          <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9]">More Tools</h3>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { id: 'strategy', label: 'Strategy Guides', sublabel: 'JAMB, WAEC, NECO, JUPEB tips', icon: Compass, path: '/practice/strategy' },
              { id: 'documents', label: 'Documents', sublabel: 'Upload and learn from PDFs', icon: FileText, path: '/practice/documents' },
              { id: 'diagrams', label: 'Diagrams', sublabel: 'Interactive diagram labeling', icon: Grid3x3, path: '/practice/diagrams' },
              { id: 'reference', label: 'Quick Reference', sublabel: 'Formulas, periodic table', icon: BookOpen, path: '/practice/reference' },
              { id: 'jamb-full', label: 'JAMB Full Simulation', sublabel: '180 questions • 120 mins', icon: Zap, path: '/practice/jamb-full' },
              { id: 'bookmarks', label: 'Bookmarks', sublabel: `${bookmarkCount} saved`, icon: Bookmark, path: '/practice/bookmarks' },
              { id: 'history', label: 'History', sublabel: `${historyCount} sessions`, icon: Clock, path: '/practice/history' },
            ].map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => navigate(tool.path)}
                  className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 hover:border-sky-300 dark:hover:border-sky-700/30 hover:shadow-md cursor-pointer transition-all duration-200 active:scale-95 text-left"
                >
                  <div className="text-2xl mb-3 text-sky-700 dark:text-sky-300">
                    <Icon size={20} />
                  </div>
                  <h4 className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9]">{tool.label}</h4>
                  <p className="text-xs text-[#0369A1] dark:text-[#7DD3FC] mt-1 line-clamp-2">{tool.sublabel}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
