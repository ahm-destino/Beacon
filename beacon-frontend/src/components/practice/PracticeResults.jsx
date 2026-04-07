import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { BookOpen, RotateCcw, Home, Trophy, Target, Zap, Clock, ArrowRight } from 'lucide-react';
import { updatePracticeState } from '../../utils/practiceState';
import BookmarkButton from '../shared/BookmarkButton';
import { useBookmarkIds } from '../../utils/bookmarks';

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
    celebration,  // 🎉 Mimo celebration data from backend
  } = location.state || {};

  const correct = useMemo(() => questions.filter(q => answers[q.id] === q.correctAnswer), [questions, answers]);
  const wrong = useMemo(() => questions.filter(q => answers[q.id] !== q.correctAnswer && answers[q.id] !== 'skipped'), [questions, answers]);
  const score = questions.length ? Math.round((correct.length / questions.length) * 100) : 0;
  const accuracy = score;
  const pointsTotal = pointsSummary?.total ?? 0;
  const answerPoints = pointsSummary?.answerPoints ?? 0;
  const speedBonus = pointsSummary?.speedBonus ?? 0;
  const streakBonus = pointsSummary?.streakBonus ?? 0;

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
    if (!timeTaken || !questions.length) return { fastest: '—', slowest: '—', average: '—' };
    const avg = Math.round(timeTaken / questions.length);
    return {
      fastest: `${Math.max(6, Math.round(avg * 0.6))}s`,
      slowest: `${Math.round(avg * 1.6)}s`,
      average: `${avg}s`,
    };
  }, [timeTaken, questions.length]);

  const didSaveRef = useRef(false);
  const didPopupRef = useRef(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [showCelebration, setShowCelebration] = useState(!!celebration);
  const { bookmarkIds, updateBookmarkId } = useBookmarkIds();
  const visibleQuestions = showAllQuestions ? questions : questions.slice(0, 10);

  // Auto-dismiss celebration after 3.5s
  useEffect(() => {
    if (!showCelebration) return;
    const t = setTimeout(() => setShowCelebration(false), 3500);
    return () => clearTimeout(t);
  }, [showCelebration]);

  useEffect(() => {
    if (didPopupRef.current) return;
    if (pointsTotal <= 0) return;
    didPopupRef.current = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('beacon-points-earned', {
        detail: {
          amount: pointsTotal,
          reason: 'Session complete',
          source: 'session_complete',
        },
      }));
    }
  }, [pointsTotal]);

  useEffect(() => {
    if (didSaveRef.current) return;
    didSaveRef.current = true;
    const historyItem = {
      id: id || Date.now(),
      examType,
      subject,
      topic,
      mode: mode || 'practice',
      score,
      correct: correct.length,
      total: questions.length,
      date: new Date().toISOString(),
      questions,
      answers,
      timeTaken,
      wrongQuestions: wrong,
      topicBreakdown,
      timeStats,
      pointsSummary,
    };

    updatePracticeState(prev => ({
      ...prev,
      history: [historyItem, ...(prev.history || [])],
    }));

    const legacy = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
    legacy.unshift(historyItem);
    localStorage.setItem('sessionHistory', JSON.stringify(legacy));
  }, [id, examType, subject, topic, mode, score, correct.length, questions.length, questions, answers, timeTaken, wrong, topicBreakdown, timeStats]);

  const formatFullTime = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const gradeColors = {
    S: 'from-yellow-400 to-amber-500',
    A: 'from-emerald-400 to-green-500',
    B: 'from-sky-400 to-blue-500',
    C: 'from-violet-400 to-purple-500',
    D: 'from-rose-400 to-red-500',
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">

      {/* 🎉 MIMO-STYLE CELEBRATION OVERLAY */}
      {showCelebration && celebration && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-6 cursor-pointer"
          style={{ background: 'linear-gradient(160deg, #0f172a 0%, #0c4a6e 100%)' }}
          onClick={() => setShowCelebration(false)}
        >
          <style>{`
            @keyframes popIn  { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
            @keyframes riseUp { 0% { transform: translateY(30px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
            @keyframes confettiFall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(120vh) rotate(720deg); opacity: 0; } }
          `}</style>

          {/* Confetti dots */}
          {['#38bdf8','#34d399','#fbbf24','#a78bfa','#f87171'].map((c, i) => (
            <div key={i} style={{
              position: 'absolute', top: '-10px',
              left: `${15 + i * 18}%`,
              width: 10, height: 10,
              borderRadius: '50%',
              background: c,
              animation: `confettiFall ${1.8 + i * 0.3}s ${i * 0.15}s ease-in forwards`,
            }} />
          ))}

          {/* Grade badge */}
          <div style={{ animation: 'popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
            <div className={`w-32 h-32 rounded-[2.5rem] bg-gradient-to-br ${gradeColors[celebration.grade] || gradeColors.B} flex items-center justify-center shadow-2xl mb-6`}>
              <span className="text-white font-black text-6xl">{celebration.grade}</span>
            </div>
          </div>

          {/* Headline */}
          <div style={{ animation: 'riseUp 0.5s 0.3s ease-out both' }} className="text-center mb-8">
            <h2 className="text-white font-black text-3xl mb-1">
              {celebration.grade === 'S' ? 'Perfect! 🏆' :
               celebration.grade === 'A' ? 'Excellent! 🌟' :
               celebration.grade === 'B' ? 'Great Work! 💪' : 'Keep Going! 📚'}
            </h2>
            <p className="text-sky-300 text-sm font-semibold">
              {celebration.correct}/{celebration.total} correct · {celebration.accuracy}% accuracy
            </p>
          </div>

          {/* XP card */}
          <div
            style={{ animation: 'riseUp 0.5s 0.5s ease-out both' }}
            className="w-full max-w-xs bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/70 text-sm font-semibold">XP Earned</span>
              <span className="text-emerald-400 font-black text-2xl">+{celebration.xp_earned} XP</span>
            </div>
            {(celebration.bonuses || []).map((b, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-white/60 text-sm">{b.label}</span>
                <span className="text-yellow-400 font-bold text-sm">+{b.value}</span>
              </div>
            ))}
            {celebration.streak_count > 0 && (
              <div className="flex items-center justify-between py-1 border-t border-white/10 mt-2 pt-2">
                <span className="text-white/60 text-sm">🔥 {celebration.streak_count}-day streak</span>
                <span className="text-orange-400 font-bold text-sm">Active</span>
              </div>
            )}
            {celebration.league && (
              <div className="flex items-center justify-between py-1">
                <span className="text-white/60 text-sm">🏆 League Rank</span>
                <span className="text-sky-300 font-bold text-sm">#{celebration.league.rank} · {celebration.league.tier}</span>
              </div>
            )}
          </div>

          {/* Dismiss hint */}
          <p style={{ animation: 'riseUp 0.5s 0.9s ease-out both' }} className="text-white/40 text-xs animate-pulse">
            Tap anywhere to continue
          </p>
        </div>
      )}
      <div className="flex-1 px-5 pt-12 pb-24 overflow-y-auto space-y-6">
        {/* HEADER / CELEBRATION */}
        <div className="text-center animate-in fade-in zoom-in-95 duration-700">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-sky-400/20 dark:bg-sky-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
            <div className="relative w-24 h-24 bg-white dark:bg-[#0D1525] rounded-[2.5rem] shadow-2xl flex items-center justify-center border-4 border-white dark:border-sky-900/40">
              <Trophy size={48} className={score >= 70 ? "text-amber-400" : "text-sky-400"} />
            </div>
            {score >= 70 && (
              <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                <Zap size={16} fill="currentColor" />
              </div>
            )}
          </div>
          
          <h1 className="font-[var(--font-syne)] font-bold text-2xl text-[#0C4A6E] dark:text-[#F0F9FF]">
            {score >= 80 ? 'Incredible Performance!' : score >= 60 ? 'Great Session!' : 'Solid Effort!'}
          </h1>
          <p className="font-[var(--font-jakarta)] text-sm text-sky-600/60 dark:text-sky-400/60 mt-2 font-bold uppercase tracking-widest">
            {subject} • {mode === 'exam' ? 'Exam Simulation' : 'Practice Session'}
          </p>
        </div>

        {/* MAIN SCORE CARD */}
        <div className="bg-white dark:bg-[#0D1525] rounded-[2.5rem] p-8 border border-sky-100 dark:border-sky-900/20 shadow-xl shadow-sky-500/5 relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
          <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/5 rounded-full -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-[var(--font-syne)] font-bold text-6xl leading-none text-[#0C4A6E] dark:text-[#F0F9FF]">
                {score}
              </span>
              <span className="text-xl font-bold text-sky-400 dark:text-sky-800">%</span>
            </div>
            
            <div className="bg-sky-50 dark:bg-sky-900/30 px-6 py-2 rounded-full border border-sky-100 dark:border-sky-800/30">
              <p className="font-[var(--font-syne)] font-bold text-sm text-sky-700 dark:text-sky-300">
                {correct.length} Correct out of {questions.length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-10 pt-8 border-t border-sky-50 dark:border-sky-900/10">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-sky-600/60 dark:text-sky-400/60 mb-1">
                <Target size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Accuracy</span>
              </div>
              <p className="font-[var(--font-syne)] font-black text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">{accuracy}%</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-sky-600/60 dark:text-sky-400/60 mb-1">
                <Clock size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Time</span>
              </div>
              <p className="font-[var(--font-syne)] font-black text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">{formatFullTime(timeTaken)}</p>
            </div>
          </div>
        </div>

        {/* POINTS EARNED */}
        <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 border border-amber-100 dark:border-amber-900/30 shadow-sm animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">Points Earned</div>
              <div className="text-xs text-sky-600/60 dark:text-sky-400/60 font-bold mt-1">
                Correct answers + speed bonus + streak bonus
              </div>
            </div>
            <div className="font-[var(--font-syne)] font-black text-2xl text-amber-500">
              +{pointsTotal} pts
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">Correct</div>
              <div className="text-sm font-black text-amber-600 mt-1">+{answerPoints}</div>
            </div>
            <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/30 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-sky-500/80">Speed</div>
              <div className="text-sm font-black text-sky-600 mt-1">+{speedBonus}</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">Streak</div>
              <div className="text-sm font-black text-emerald-600 mt-1">+{streakBonus}</div>
            </div>
          </div>
        </div>

        {/* TOPIC BREAKDOWN */}
        <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 border border-sky-100 dark:border-sky-900/20 shadow-sm animate-in slide-in-from-bottom-10 duration-700 delay-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">Topic Analysis</h3>
            <span className="text-[10px] font-bold text-sky-500 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-1 rounded-lg">Performance Heatmap</span>
          </div>

          <div className="space-y-5">
            {topicBreakdown.map((t, idx) => {
              const perc = Math.round((t.correct / t.total) * 100);
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80">{t.topic}</span>
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">{t.correct}/{t.total}</span>
                  </div>
                  <div className="h-2 w-full bg-sky-50 dark:bg-sky-900/30 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${perc >= 75 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : perc >= 50 ? 'bg-sky-500' : perc >= 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${perc}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TIME ANALYSIS */}
        <div className="grid grid-cols-3 gap-3 animate-in slide-in-from-bottom-12 duration-700 delay-200">
          {[
            { label: 'Fastest', val: timeStats.fastest, icon: Zap, color: 'text-amber-500' },
            { label: 'Slowest', val: timeStats.slowest, icon: Clock, color: 'text-red-400' },
            { label: 'Avg / Q', val: timeStats.average, icon: Target, color: 'text-sky-500' }
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-[#0D1525] p-4 rounded-3xl border border-sky-100 dark:border-sky-900/20 text-center flex flex-col items-center">
              <stat.icon size={16} className={`${stat.color} mb-2`} />
              <p className="text-[9px] text-sky-500/60 font-bold uppercase mb-1">{stat.label}</p>
              <p className="font-[var(--font-syne)] font-bold text-[#0C4A6E] dark:text-[#F0F9FF] text-sm">{stat.val}</p>
            </div>
          ))}
        </div>

        {/* QUESTION REVIEW */}
        {questions.length > 0 && (
          <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 border border-sky-100 dark:border-sky-900/20 shadow-sm animate-in slide-in-from-bottom-12 duration-700 delay-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">
                Question Review
              </h3>
              {questions.length > 10 && (
                <button
                  onClick={() => setShowAllQuestions((prev) => !prev)}
                  className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest"
                >
                  {showAllQuestions ? 'Show Less' : `Show All ${questions.length}`}
                </button>
              )}
            </div>
            <div className="space-y-3">
              {visibleQuestions.map((q, idx) => {
                const isCorrect = answers[q.id] === q.correctAnswer;
                const qIndex = questions.findIndex((item) => item.id === q.id);
                const labelIndex = qIndex >= 0 ? qIndex + 1 : idx + 1;
                const isBookmarked = bookmarkIds.has(String(q.id));
                return (
                  <div
                    key={q.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/30"
                  >
                    <div className="flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-sky-500/70 mb-1">
                        Q{labelIndex} • {isCorrect ? 'Correct' : 'Wrong'}
                      </div>
                      <p className="text-sm font-medium text-[#0C4A6E] dark:text-[#F0F9FF] line-clamp-2">
                        {q.text}
                      </p>
                    </div>
                    <BookmarkButton
                      questionId={q.id}
                      initialState={isBookmarked}
                      onChange={(next) => updateBookmarkId(q.id, next)}
                      className="w-9 h-9"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-1 gap-3 py-6">
          {document_id && (
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/practice/document/${document_id}`, { state: { autoNext: true, fromSectionId: section_id } })}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4.5 rounded-2xl font-[var(--font-syne)] font-bold shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Mastered! Next Chapter <ArrowRight size={18} />
              </button>
              
              <button
                onClick={() => navigate(`/practice/document/${document_id}`, { state: { autoGenerate: true, section_id: section_id } })}
                className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-800 text-[#0369A1] dark:text-sky-400 py-4 rounded-2xl font-[var(--font-syne)] font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Need More Questions? <ArrowRight size={16} />
              </button>
            </div>
          )}

          <button
            onClick={() => navigate('/practice/review', { state: { wrongQuestions: wrong, subject, examType } })}
            className="group w-full bg-[#0369A1] dark:bg-[#0EA5E9] text-white py-4.5 rounded-2xl font-[var(--font-syne)] font-bold shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <BookOpen size={18} /> Review Mistakes <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const newId = Date.now().toString();
                const path = mode === 'exam' ? `/practice/exam-session/${newId}` : `/practice/session/${newId}`;
                navigate(path, { state: { id: newId, mode, examType, subject, topic, questions, answers: {}, currentIndex: 0, timer: null } });
              }}
              className="bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-800 text-[#0369A1] dark:text-sky-400 py-4.5 rounded-2xl font-[var(--font-syne)] font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Retry
            </button>
            <button
              onClick={() => navigate('/practice')}
              className="bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-800 text-[#0369A1] dark:text-sky-400 py-4.5 rounded-2xl font-[var(--font-syne)] font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Home size={16} /> Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
