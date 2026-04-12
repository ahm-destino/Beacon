import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-id';
import { 
  BookOpen, RotateCcw, Home, Trophy, Target, Zap, Clock, 
  ArrowRight, Award, TrendingUp, BarChart3, Star, PieChart
} from 'lucide-react';
import { updatePracticeState } from '../../utils/practiceState';
import BookmarkButton from '../shared/BookmarkButton';
import { useBookmarkIds } from '../../utils/bookmarks';

const StatCard = ({ icon: Icon, label, value, subtext, color, delay = "0" }) => (
  <div className={`bg-white dark:bg-[#0D1525] rounded-3xl p-5 border border-sky-100 dark:border-sky-900/20 shadow-sm animate-in slide-in-from-bottom-5 duration-700 delay-${delay} flex flex-col gap-3 h-full`}>
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-sky-600/50 dark:text-sky-400/50">{label}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <h3 className="font-[var(--font-syne)] font-black text-2xl text-[#0C4A6E] dark:text-[#F0F9FF]">{value}</h3>
        {subtext && <span className="text-[10px] font-bold text-sky-500/60 uppercase">{subtext}</span>}
      </div>
    </div>
  </div>
);

const TopicPill = ({ topic, correct, total }) => {
  const percentage = Math.round((correct / total) * 100);
  const color = percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-sky-500' : 'bg-amber-500';
  
  return (
    <div className="flex items-center gap-4 p-4 bg-sky-50/50 dark:bg-sky-900/10 rounded-2xl border border-sky-100/50 dark:border-sky-900/10">
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-xs font-bold text-[#0C4A6E] dark:text-[#F0F9FF] truncate">{topic}</span>
          <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 whitespace-nowrap">{correct}/{total}</span>
        </div>
        <div className="h-2 w-full bg-white dark:bg-[#080C14] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default function PracticeResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const {
    document_id,
    section_id,
    questions = [],
    answers = {},
    examType,
    subject,
    topic,
    mode,
    timeTaken,
    pointsSummary,
    celebration,
  } = location.state || {};

  const correct = useMemo(() => questions.filter(q => answers[q.id] === q.correctAnswer), [questions, answers]);
  const wrong = useMemo(() => questions.filter(q => answers[q.id] !== q.correctAnswer && answers[q.id] !== 'skipped'), [questions, answers]);
  const score = questions.length ? Math.round((correct.length / questions.length) * 100) : 0;
  
  const topicBreakdown = useMemo(() => {
    const counts = {};
    questions.forEach(q => {
      const key = q.topic || 'General';
      if (!counts[key]) counts[key] = { topic: key, correct: 0, total: 0 };
      counts[key].total += 1;
      if (answers[q.id] === q.correctAnswer) counts[key].correct += 1;
    });
    return Object.values(counts);
  }, [questions, answers]);

  const timeStats = useMemo(() => {
    if (!timeTaken || !questions.length) return { average: '—' };
    const avg = Math.round(timeTaken / questions.length);
    return { average: `${avg}s` };
  }, [timeTaken, questions.length]);

  const didSaveRef = useRef(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const { bookmarkIds, updateBookmarkId } = useBookmarkIds();
  const visibleQuestions = showAllQuestions ? questions : questions.slice(0, 10);

  useEffect(() => {
    if (didSaveRef.current) return;
    didSaveRef.current = true;
    const historyItem = {
      id: id || Date.now(),
      examType, subject, topic,
      mode: mode || 'practice',
      score, correct: correct.length, total: questions.length,
      date: new Date().toISOString(),
      questions, answers, timeTaken,
      pointsSummary,
    };

    updatePracticeState(prev => ({
      ...prev,
      history: [historyItem, ...(prev.history || [])],
    }));

    const legacy = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
    legacy.unshift(historyItem);
    localStorage.setItem('sessionHistory', JSON.stringify(legacy));
  }, []);

  const formatFullTime = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col font-[var(--font-jakarta)]">
      
      {/* HEADER SECTION */}
      <div className="px-5 pt-12 pb-8 text-center bg-white dark:bg-[#0D1525] rounded-b-[3rem] border-b border-sky-100 dark:border-sky-900/20 shadow-xl shadow-sky-500/5">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-sky-400/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
          <div className="relative w-28 h-28 bg-white dark:bg-[#080C14] rounded-[3rem] shadow-2xl flex items-center justify-center border-4 border-white dark:border-sky-900/40">
            <Trophy size={56} className={score >= 70 ? "text-amber-400" : "text-sky-400"} />
          </div>
        </div>
        
        <h1 className="font-[var(--font-syne)] font-black text-3xl text-[#0C4A6E] dark:text-[#F0F9FF] mb-2 px-4 leading-tight">
          {score >= 80 ? 'Mastery Unlocked!' : score >= 60 ? 'Session Complete!' : 'Work in Progress!'}
        </h1>
        <p className="text-xs font-black text-sky-600/60 dark:text-sky-400/60 uppercase tracking-widest">
           {subject || 'General'} • {mode === 'exam' ? 'Mock Simulation' : 'Practice Hub'}
        </p>
      </div>

      <div className="flex-1 px-5 pt-8 pb-32 space-y-6 overflow-y-auto">
        
        {/* CORE STATS GRID */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            icon={Target} 
            label="Accuracy" 
            value={`${score}%`} 
            color="bg-sky-600" 
            subtext="Score"
          />
          <StatCard 
            icon={Zap} 
            label="Points" 
            value={`+${pointsSummary?.total || 0}`} 
            color="bg-amber-500" 
            subtext="XP"
          />
          <StatCard 
            icon={Clock} 
            label="Duration" 
            value={formatFullTime(timeTaken)} 
            color="bg-indigo-500" 
            delay="100"
          />
          <StatCard 
            icon={Award} 
            label="Best Streak" 
            value="3 Days" 
            color="bg-emerald-500" 
            subtext="Active"
            delay="100"
          />
        </div>

        {/* TOPIC DEEP DIVE */}
        <div className="bg-white dark:bg-[#0D1525] rounded-[2.5rem] p-6 border border-sky-100 dark:border-sky-900/20 shadow-sm">
           <div className="flex items-center justify-between mb-6 px-1">
             <div className="flex items-center gap-2">
               <TrendingUp size={18} className="text-sky-600" />
               <h3 className="font-[var(--font-syne)] font-black text-[#0C4A6E] dark:text-[#F0F9FF] uppercase tracking-wider text-xs">Topic Insights</h3>
             </div>
             <div className="text-[10px] font-black bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-full">{topicBreakdown.length} Areas</div>
           </div>

           <div className="space-y-3">
             {topicBreakdown.map((t, idx) => (
               <TopicPill key={idx} topic={t.topic} correct={t.correct} total={t.total} />
             ))}
           </div>
        </div>

        {/* PERFORMANCE BREAKDOWN */}
        <div className="grid grid-cols-2 gap-4 h-32">
           <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl p-5 border border-emerald-100 dark:border-emerald-900/20 flex flex-col justify-between">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest pl-1">Correct</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{correct.length}</span>
                <span className="text-xs font-bold text-emerald-600/60 font-[var(--font-syne)]">Questions</span>
              </div>
           </div>
           <div className="bg-rose-50 dark:bg-rose-900/10 rounded-3xl p-5 border border-rose-100 dark:border-rose-900/20 flex flex-col justify-between">
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest pl-1">Incorrect</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-700 dark:text-rose-400">{wrong.length}</span>
                <span className="text-xs font-bold text-rose-600/60 font-[var(--font-syne)]">Questions</span>
              </div>
           </div>
        </div>

        {/* QUESTION RECAP */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-2">
             <h3 className="font-[var(--font-syne)] font-black text-[#0C4A6E] dark:text-[#F0F9FF] uppercase tracking-wider text-xs">Correction Feed</h3>
             <button onClick={() => setShowAllQuestions(!showAllQuestions)} className="text-[10px] font-black bg-sky-600 text-white px-3 py-1 rounded-full uppercase">
               {showAllQuestions ? 'Collapse' : 'Expand All'}
             </button>
          </div>

          <div className="space-y-3">
            {visibleQuestions.map((q, idx) => {
              const isCorrect = answers[q.id] === q.correctAnswer;
              return (
                <div key={q.id} className="bg-white dark:bg-[#0D1525] rounded-[2rem] p-5 border border-sky-100 dark:border-sky-900/20 shadow-sm flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center font-[var(--font-syne)] font-black text-lg ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-bold text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80 line-clamp-2 leading-relaxed">
                      {q.text}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                       <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                         {isCorrect ? 'Mastered' : 'Needs Review'}
                       </span>
                       <span className="text-[9px] font-bold text-sky-600/40 uppercase truncate max-w-[100px]">{q.topic || 'General'}</span>
                    </div>
                  </div>
                  <BookmarkButton questionId={q.id} className="mt-1" />
                </div>
              );
            })}
          </div>
        </div>

        {/* FINAL ACTIONS */}
        <div className="space-y-3 pt-6">
          <button
            onClick={() => navigate('/practice/review', { state: { wrongQuestions: wrong, subject, examType } })}
            className="w-full bg-[#0369A1] dark:bg-sky-600 text-white py-5 rounded-[2rem] font-[var(--font-syne)] font-black text-lg shadow-xl shadow-sky-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
          >
            REVIEW WRONG ANSWERS <RotateCcw size={20} />
          </button>
          
          <div className="grid grid-cols-2 gap-3 pb-8">
            <button
              onClick={() => navigate('/practice')}
              className="bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-300 py-4.5 rounded-[2rem] font-black text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Home size={18} /> HUB
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-300 py-4.5 rounded-[2rem] font-black text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              EXIT <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
