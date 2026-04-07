import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, Hand, Timer, BookOpen } from 'lucide-react';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function DiagramView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { diagram } = location.state || { diagram: { name: 'Diagram', subject: 'General' } };
  
  const [activeMode, setActiveMode] = useState('learn'); // learn, practice, exam, pqs

  const modes = [
    { id: 'learn', label: 'Learn', icon: Eye },
    { id: 'practice', label: 'Practice', icon: Hand },
    { id: 'exam', label: 'Exam', icon: Timer },
    { id: 'pqs', label: 'Past Qs', icon: BookOpen }
  ];

  const renderContent = () => {
    switch(activeMode) {
      case 'learn':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-xl mb-4 border border-sky-100 dark:border-sky-900/30">
              <p className="font-[var(--font-jakarta)] text-sm text-sky-800 dark:text-sky-300 leading-relaxed">
                Study the fully labeled diagram below. Tap on any label to read a detailed description of its function.
              </p>
            </div>
            
            <div className="w-full aspect-square bg-white dark:bg-black rounded-2xl border border-sky-100 dark:border-sky-900/20 overflow-hidden relative shadow-sm flex items-center justify-center p-4">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--tw-gradient-stops))] from-sky-400 to-transparent pointer-events-none"></div>
              {/* Mock Diagram Space */}
              <div className="w-48 h-48 border-4 border-dashed border-sky-200 dark:border-sky-800 rounded-full flex items-center justify-center relative">
                <span className="font-[var(--font-syne)] font-bold text-sky-300 dark:text-sky-700 text-xl">{diagram.name}</span>
                
                {/* Mock Labels */}
                <div className="absolute -top-4 -right-8 bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 px-3 py-1 rounded text-xs font-bold shadow-md cursor-pointer hover:scale-105 transition-transform">Label A</div>
                <div className="absolute -bottom-4 -left-8 bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 px-3 py-1 rounded text-xs font-bold shadow-md cursor-pointer hover:scale-105 transition-transform">Label B</div>
                
                {/* Connecting lines (mocked via CSS borders) */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-sky-300 dark:border-sky-700 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-sky-300 dark:border-sky-700 rounded-bl-lg"></div>
              </div>
            </div>

            <div className="mt-8 text-center pt-4 border-t border-sky-100 dark:border-sky-900/20">
              <p className="text-sm text-[#0C4A6E]/70 dark:text-[#F0F9FF]/70 mb-4">Ready to test your memory?</p>
              <button 
                onClick={() => setActiveMode('practice')}
                className="w-full bg-[#0369A1] dark:bg-[#0EA5E9] text-white py-3.5 rounded-xl font-[var(--font-syne)] font-bold shadow-md hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] active:scale-[0.98] transition-all"
              >
                I'm Ready — Test Me
              </button>
            </div>
          </div>
        );
      case 'practice':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl mb-4 border border-amber-100 dark:border-amber-900/30 flex justify-between items-center">
              <div>
                <p className="font-[var(--font-syne)] font-bold text-amber-800 dark:text-amber-400">Practice Mode</p>
                <p className="font-[var(--font-jakarta)] text-xs text-amber-700 dark:text-amber-300 mt-1">Drag labels to their correct spots.</p>
              </div>
              <div className="text-amber-500 font-bold text-sm bg-amber-100 dark:bg-amber-900/40 px-3 py-1 rounded-lg">0 / 5</div>
            </div>
            
            <div className="w-full aspect-square bg-white dark:bg-black rounded-2xl border border-sky-100 dark:border-sky-900/20 overflow-hidden relative shadow-sm flex items-center justify-center p-4">
              <div className="w-48 h-48 border-4 border-dashed border-sky-200 dark:border-sky-800 rounded-full flex items-center justify-center relative">
                
                {/* Empty Drop Zones */}
                <div className="absolute -top-4 -right-8 w-20 h-6 border-2 border-dashed border-sky-300 dark:border-sky-700 rounded bg-sky-50 dark:bg-sky-900/20"></div>
                <div className="absolute -bottom-4 -left-8 w-20 h-6 border-2 border-dashed border-sky-300 dark:border-sky-700 rounded bg-sky-50 dark:bg-sky-900/20"></div>
                
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-sky-300 dark:border-sky-700 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-sky-300 dark:border-sky-700 rounded-bl-lg"></div>
              </div>
            </div>

            <div className="mt-6">
              <p className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mb-3">Label Pool</p>
              <div className="flex flex-wrap gap-2">
                {['Label A', 'Label B', 'Label C', 'Label D'].map((lbl, i) => (
                  <div key={i} className="bg-white dark:bg-[#0D1525] border border-sky-200 dark:border-sky-700 text-sky-800 dark:text-sky-300 px-4 py-2 rounded-lg text-sm font-bold shadow-sm cursor-grab active:cursor-grabbing hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors">
                    {lbl}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'exam':
        return (
          <div className="animate-in fade-in flex flex-col items-center pt-8">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-4 animate-pulse">
              <Timer size={36} />
            </div>
            <h2 className="font-[var(--font-syne)] font-bold text-xl text-[#0369A1] dark:text-[#0EA5E9] mb-2 text-center">Exam Simulation</h2>
            <p className="text-sm text-[#0C4A6E]/70 dark:text-[#F0F9FF]/70 mb-8 mx-auto max-w-xs text-center">
              Strict timing. No hints. You have 45 seconds per label. Unlabeled parts will be marked wrong.
            </p>
            <button 
              className="bg-red-600 text-white px-8 py-3.5 rounded-xl font-[var(--font-syne)] font-bold shadow-md hover:bg-red-700 active:scale-95 transition-all w-full max-w-xs"
            >
              Start Timed Test
            </button>
          </div>
        );
      case 'pqs':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3">
            {[
              { year: 'WAEC 2019', q: 'Describe the main function of the part labeled II above.', marks: '3 marks' },
              { year: 'JAMB 2021', q: 'The structure labeled IV is primarily responsible for...', options: ['A. Osmoregulation', 'B. Respiration', 'C. Digestion', 'D. Reproduction'] }
            ].map((pq, i) => (
              <div key={i} className="bg-white dark:bg-[#0D1525] p-5 rounded-2xl border border-sky-100 dark:border-sky-900/20 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{pq.year}</span>
                  {pq.marks && <span className="text-amber-500 text-xs font-bold">{pq.marks}</span>}
                </div>
                <p className="font-[var(--font-jakarta)] text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mb-3">{pq.q}</p>
                
                {pq.options ? (
                  <div className="space-y-2 mt-3">
                    {pq.options.map((opt, j) => (
                      <div key={j} className="text-sm text-sky-700/80 dark:text-sky-300/80 pl-2 border-l-2 border-sky-100 dark:border-sky-900/30">{opt}</div>
                    ))}
                  </div>
                ) : (
                  <button className="text-sky-600 dark:text-sky-400 text-xs font-bold underline underline-offset-2">View Model Answer</button>
                )}
              </div>
            ))}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      <SubScreenHeader title={diagram.name} />
      
      {/* MODE SELECTOR */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex bg-white dark:bg-[#0D1525] rounded-xl p-1 border border-sky-100 dark:border-sky-900/20 shadow-sm">
          {modes.map(mode => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]' 
                    : 'text-sky-600/50 dark:text-sky-400/50 hover:bg-sky-50/50 dark:hover:bg-[#080C14]'
                }`}
              >
                <Icon size={16} />
                <span className="font-[var(--font-syne)] font-bold text-[10px] uppercase tracking-wider">{mode.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 px-5 pt-4 pb-24 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
