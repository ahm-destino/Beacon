import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-id';
import { 
  ArrowLeft, CheckCircle2, XCircle, Home, 
  Target, Zap, Clock, Trophy, Award, BarChart3, 
  ChevronRight, Flag, HelpCircle
} from 'lucide-react';
import BookmarkButton from '../shared/BookmarkButton';
import { useBookmarkIds } from '../../utils/bookmarks';
import FormattedExplanation, { buildCopyText } from '../shared/FormattedExplanation';

const MiniStat = ({ icon: Icon, label, value, color }) => (
  <div className="flex flex-col items-center gap-1.5 p-3 bg-sky-50 dark:bg-sky-900/10 rounded-2xl border border-sky-100 dark:border-sky-900/20">
    <Icon size={14} className={color} />
    <span className="text-[10px] font-black uppercase tracking-widest text-sky-600/40 dark:text-sky-400/40">{label}</span>
    <span className="text-xs font-black text-[#0C4A6E] dark:text-[#F0F9FF]">{value}</span>
  </div>
);

const SubjectCard = ({ subject, correct, total }) => {
  const percentage = Math.round((correct / total) * 100);
  const color = percentage >= 75 ? 'bg-emerald-500' : percentage >= 45 ? 'bg-sky-600' : 'bg-rose-500';
  
  return (
    <div className="bg-white dark:bg-[#0D1525] p-5 rounded-3xl border border-sky-100 dark:border-sky-900/20 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-[var(--font-syne)] font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">{subject}</h4>
        <span className="text-xs font-black text-sky-600">{correct}/{total}</span>
      </div>
      <div className="h-2 w-full bg-sky-50 dark:bg-[#080C14] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[9px] font-bold text-sky-600/40 uppercase">Accuracy</span>
        <span className={`text-[9px] font-black uppercase ${percentage >= 45 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {percentage >= 75 ? 'Excellent' : percentage >= 45 ? 'Passing' : 'Needs Review'}
        </span>
      </div>
    </div>
  );
};

export default function JAMBFullExamResults() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const {
    flatQuestions = [],
    sections = [],
    answersById = {},
    flaggedById = {},
    timeUsedSeconds = 0,
    correctCount = 0,
    score = 0,
    pointsSummary,
  } = location.state || {};

  const [activeQIndex, setActiveQIndex] = useState(() => {
    const idx = flatQuestions.findIndex((q) => answersById[q.id] && answersById[q.id] !== q.correctAnswer);
    return idx >= 0 ? idx : 0;
  });

  const activeQuestion = flatQuestions[activeQIndex] || null;
  const selectedLetter = activeQuestion ? answersById[activeQuestion.id] : null;
  const isCorrect = activeQuestion ? selectedLetter === activeQuestion.correctAnswer : false;

  const toVisualLetter = (originalLetter) => {
    if (!activeQuestion || !originalLetter || !activeQuestion.optionMapping) return originalLetter;
    const idx = activeQuestion.optionMapping.indexOf(originalLetter);
    return idx === -1 ? originalLetter : ['A', 'B', 'C', 'D'][idx];
  };

  const { bookmarkIds, updateBookmarkId } = useBookmarkIds();

  const subjectSummary = useMemo(() => {
    return sections.map((sec) => ({
      subject: sec.subject,
      correct: sec.questions.reduce((acc, q) => acc + (answersById[q.id] === q.correctAnswer ? 1 : 0), 0),
      total: sec.questions.length,
    }));
  }, [sections, answersById]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col font-[var(--font-jakarta)]">
      
      {/* HEADER */}
      <div className="px-5 pt-10 pb-4 flex items-center justify-between bg-white dark:bg-[#0D1525] border-b border-sky-100 dark:border-sky-900/20">
        <button onClick={() => navigate('/practice')} className="p-2 -ml-2 text-sky-600"><ArrowLeft size={24} /></button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF] uppercase tracking-wider">Exam Report</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex-1 px-5 pt-6 pb-32 space-y-6 overflow-y-auto">
        
        {/* OVERALL PERFORMANCE CARD */}
        <div className="bg-white dark:bg-[#0D1525] rounded-[2.5rem] p-8 border border-sky-100 dark:border-sky-900/20 shadow-xl shadow-sky-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full -mr-16 -mt-16"></div>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[2rem] bg-sky-600 flex flex-col items-center justify-center text-white shrink-0 shadow-lg shadow-sky-600/20">
               <span className="font-[var(--font-syne)] font-black text-4xl">{score}</span>
               <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">% Score</span>
            </div>
            <div className="flex-1">
               <div className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1">JAMB UTME SIMULATION</div>
               <h3 className="font-[var(--font-syne)] font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF] leading-tight">
                 {score >= 250 ? 'Top Tier Talent! 🚀' : score >= 200 ? 'Solid Competition! 🔥' : 'Room for Growth! 📈'}
               </h3>
               <div className="flex items-center gap-2 mt-2">
                 <MiniStat icon={Target} label="Correct" value={`${correctCount}/${flatQuestions.length}`} color="text-sky-600" />
                 <MiniStat icon={Clock} label="Time" value={formatTime(timeUsedSeconds)} color="text-indigo-600" />
               </div>
            </div>
          </div>
        </div>

        {/* POINTS & REWARDS */}
        <div className="bg-amber-500 rounded-3xl p-6 text-white shadow-xl shadow-amber-500/20 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Zap size={24} fill="white" />
             </div>
             <div>
               <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Points Earned</p>
               <h3 className="font-[var(--font-syne)] font-black text-2xl">+{pointsSummary?.total || 0} XP</h3>
             </div>
           </div>
           <Award size={32} className="opacity-40" />
        </div>

        {/* SUBJECT BREAKDOWN SECTION */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 px-1">
             <BarChart3 size={16} className="text-sky-600" />
             <h3 className="font-[var(--font-syne)] font-black text-xs text-[#0C4A6E] dark:text-[#F0F9FF] uppercase tracking-widest">Subject Analysis</h3>
           </div>
           <div className="grid grid-cols-1 gap-3">
             {subjectSummary.map(s => (
               <SubjectCard key={s.subject} subject={s.subject} correct={s.correct} total={s.total} />
             ))}
           </div>
        </div>

        {/* ACTIVE REVIEW */}
        {activeQuestion && (
           <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-[var(--font-syne)] font-black text-xs text-[#0C4A6E] dark:text-[#F0F9FF] uppercase tracking-widest">Correction Tool</h3>
                <span className="text-[10px] bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-full font-black uppercase">Q{activeQIndex + 1}</span>
              </div>

              <div className="bg-white dark:bg-[#0D1525] rounded-[2.5rem] p-6 border border-sky-100 dark:border-sky-900/20 shadow-sm relative">
                <div className="flex items-center justify-between mb-4">
                   <div className="text-[10px] font-black text-sky-600/60 uppercase">{activeQuestion.subject} • Error Analysis</div>
                   <div className={`p-1.5 rounded-lg ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                     {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                   </div>
                </div>

                <p className="text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] leading-relaxed mb-6">
                  {activeQuestion.text}
                </p>

                <div className="space-y-3 mb-6">
                   {activeQuestion.options.map((opt, idx) => {
                     const letter = ['A', 'B', 'C', 'D'][idx];
                     const isSelected = toVisualLetter(selectedLetter) === letter;
                     const isRealCorrect = toVisualLetter(activeQuestion.correctAnswer) === letter;
                     
                     let variant = 'bg-white dark:bg-[#080C14] border-sky-100 dark:border-sky-900/20 text-sky-700/60';
                     if (isRealCorrect) variant = 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-4 ring-emerald-500/10 shadow-sm';
                     else if (isSelected) variant = 'bg-rose-50 border-rose-500 text-rose-700 ring-4 ring-rose-500/10 shadow-sm';

                     return (
                        <div key={letter} className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${variant}`}>
                           <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${isRealCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-rose-500 text-white' : 'bg-sky-100 dark:bg-sky-900/40 text-sky-600'}`}>
                             {letter}
                           </span>
                           <span className="text-sm font-bold flex-1">{opt}</span>
                        </div>
                     );
                   })}
                </div>

                <div className="bg-sky-50 dark:bg-sky-900/20 rounded-3xl p-5 border border-sky-100 dark:border-sky-800/30">
                   <div className="flex items-center justify-between mb-3 border-b border-sky-100/50 dark:border-sky-800/50 pb-2">
                      <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest flex items-center gap-1.5">
                        <Zap size={10} fill="currentColor" /> Why this is correct
                      </span>
                      <BookmarkButton questionId={activeQuestion.id} />
                   </div>
                   <div className="text-sm font-medium leading-relaxed italic">
                      <FormattedExplanation text={activeQuestion.explanation || 'Detailed explanation not available for this legacy question.'} />
                   </div>
                </div>
              </div>
           </div>
        )}

        {/* QUESTION NAV GRID */}
        <div className="space-y-3 pt-6">
           <div className="flex justify-between items-center px-1 text-[10px] font-black text-sky-600/40 uppercase tracking-widest">
              <span>Simulation Grid</span>
              <span>180 Total</span>
           </div>
           <div className="grid grid-cols-10 gap-2 p-4 bg-white/50 dark:bg-[#0D1525]/50 rounded-3xl border border-sky-100 dark:border-sky-900/20">
             {flatQuestions.map((q, idx) => {
               const ans = answersById[q.id];
               const active = idx === activeQIndex;
               const correct = ans === q.correctAnswer;
               const flagged = !!flaggedById[q.id];
               
               let variant = 'bg-white dark:bg-[#080C14] border-sky-100 dark:border-sky-900/20 text-sky-700/40';
               if (active) variant = 'bg-sky-600 border-sky-600 text-white ring-4 ring-sky-500/20';
               else if (flagged) variant = 'bg-amber-400 border-amber-500 text-white';
               else if (ans) variant = correct ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-rose-500 border-rose-500 text-white';

               return (
                 <button 
                   key={q.id} 
                   onClick={() => setActiveQIndex(idx)} 
                   className={`w-full aspect-square rounded-lg border flex items-center justify-center text-[10px] font-bold transition-all ${variant}`}
                 >
                   {idx + 1}
                 </button>
               );
             })}
           </div>
        </div>

      </div>

      {/* FOOTER ACTION */}
      <div className="fixed bottom-0 left-0 right-0 p-5 pb-10 bg-gradient-to-t from-[#F0F9FF] via-[#F0F9FF] dark:from-[#080C14] dark:via-[#080C14] to-transparent">
        <button
          onClick={() => navigate('/practice')}
          className="w-full bg-[#0C4A6E] dark:bg-sky-600 text-white py-5 rounded-[2rem] font-[var(--font-syne)] font-black text-lg shadow-xl shadow-sky-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          FINISH REVIEW <Home size={20} />
        </button>
      </div>

    </div>
  );
}
