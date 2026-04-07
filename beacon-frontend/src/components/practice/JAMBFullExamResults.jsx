import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Home } from 'lucide-react';
import BookmarkButton from '../shared/BookmarkButton';
import { useBookmarkIds } from '../../utils/bookmarks';

function OptionPill({ letter, children, variant }) {
  const cls =
    variant === 'correct'
      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-400/30'
      : variant === 'wrong'
        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-400/30'
        : 'bg-white dark:bg-[#0D1525] text-[#0C4A6E] dark:text-[#F0F9FF]/80 border-sky-100 dark:border-sky-900/20';

  return (
    <div className={`w-full px-4 py-3 rounded-2xl border ${cls} text-sm font-bold`}>
      <span className="inline-block mr-3 px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs">
        {letter}
      </span>
      {children}
    </div>
  );
}

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
    // Prefer first wrong question
    const idx = flatQuestions.findIndex((q) => {
      const sel = answersById[q.id];
      if (!sel) return false;
      return sel !== q.correctAnswer;
    });
    return idx >= 0 ? idx : 0;
  });

  const activeQuestion = flatQuestions[activeQIndex] || null;
  const selectedLetter = activeQuestion ? answersById[activeQuestion.id] : null;
  const isCorrect = activeQuestion ? selectedLetter === activeQuestion.correctAnswer : false;
  const { bookmarkIds, updateBookmarkId } = useBookmarkIds();

  const subjectSummary = useMemo(() => {
    return sections.map((sec) => {
      const correct = sec.questions.reduce((acc, q) => {
        const sel = answersById[q.id];
        return acc + (sel && sel === q.correctAnswer ? 1 : 0);
      }, 0);
      return {
        subject: sec.subject,
        correct,
        total: sec.questions.length,
      };
    });
  }, [sections, answersById]);

  const wrongQuestions = useMemo(() => {
    return flatQuestions.filter((q) => {
      const sel = answersById[q.id];
      return sel && sel !== q.correctAnswer;
    });
  }, [flatQuestions, answersById]);

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const pointsTotal = pointsSummary?.total ?? 0;
  const answerPoints = pointsSummary?.answerPoints ?? 0;
  const speedBonus = pointsSummary?.speedBonus ?? 0;
  const streakBonus = pointsSummary?.streakBonus ?? 0;

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] text-[#0C4A6E] dark:text-[#F0F9FF]">
      <div className="max-w-md mx-auto px-5 pt-10 pb-28">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-300 mb-5"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-[2.5rem] p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-sky-600/70">JAMB Results</div>
              <div className="font-[var(--font-syne)] font-black text-4xl mt-1">{score}%</div>
              <div className="text-sm text-sky-600/60 font-bold mt-1">
                {correctCount} correct out of {flatQuestions.length || 180}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-widest text-sky-600/70">Time</div>
              <div className="text-sm font-bold mt-1">{formatTime(timeUsedSeconds)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-6">
            {subjectSummary.map((s) => {
              const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
              return (
                <div key={s.subject} className="bg-[#F0F9FF] dark:bg-[#080C14] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold">{s.subject}</div>
                    <div className="text-xs font-bold text-sky-600/70">{s.correct}/{s.total}</div>
                  </div>
                  <div className="h-2 bg-sky-100 dark:bg-sky-900/30 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-sky-700 dark:bg-sky-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-[#0D1525] border border-amber-100 dark:border-amber-900/30 rounded-[2.5rem] p-6 shadow-sm">
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

        {/* Active question review */}
        {activeQuestion && (
          <div className="mt-6 bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-[2.5rem] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold">
                Review: Q{activeQIndex + 1} • {activeQuestion.subject}
              </div>
              <div className="flex items-center gap-2">
                {isCorrect ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-red-500" />}
                <div className="text-xs font-bold text-sky-600/60 uppercase tracking-widest">
                  {isCorrect ? 'Correct' : selectedLetter ? 'Wrong' : 'Unanswered'}
                </div>
              </div>
            </div>

            <div className="text-sm font-bold mb-4 leading-relaxed">{activeQuestion.text}</div>

            <div className="space-y-3">
              {activeQuestion.options.map((opt, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx];
                const selected = selectedLetter === letter;
                const correct = activeQuestion.correctAnswer === letter;
                let variant = 'neutral';
                if (correct) variant = 'correct';
                else if (selected && !correct) variant = 'wrong';
                return <OptionPill key={letter} letter={letter} variant={variant}>{opt}</OptionPill>;
              })}
            </div>

            <div className="mt-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 rounded-2xl p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-sky-700/70">Explanation</div>
              <div className="text-sm font-medium mt-2 leading-relaxed">
                {activeQuestion.explanation || '—'}
              </div>
            </div>
          </div>
        )}

        {/* Wrong answers list */}
        {wrongQuestions.length > 0 && (
          <div className="mt-6 bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-[2.5rem] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold">Wrong Answers</div>
              <div className="text-xs font-bold text-sky-600/60 uppercase tracking-widest">
                {wrongQuestions.length} total
              </div>
            </div>
            <div className="space-y-3">
              {wrongQuestions.map((q, idx) => {
                const isBookmarked = bookmarkIds.has(String(q.id));
                return (
                  <div
                    key={q.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/30"
                  >
                    <div className="flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-sky-500/70 mb-1">
                        Q{idx + 1} • {q.subject}
                      </div>
                      <p className="text-sm font-medium">{q.text}</p>
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

        {/* Jump grid */}
        <div className="mt-6">
          <div className="text-xs font-bold uppercase tracking-widest text-sky-600/70 mb-3">Jump to any question</div>
          <div className="grid grid-cols-10 gap-2">
            {flatQuestions.map((q, idx) => {
              const answered = !!answersById[q.id];
              const selected = answersById[q.id];
              const correct = answered && selected === q.correctAnswer;
              const flagged = !!flaggedById[q.id];
              const isActive = idx === activeQIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQIndex(idx)}
                  className={`w-6 h-6 rounded-md border text-[10px] font-bold ${
                    isActive ? 'ring-4 ring-sky-500/20 bg-sky-700 text-white border-sky-700' :
                    flagged ? 'bg-amber-400 text-white border-amber-500' :
                    answered ? (correct ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-red-500 text-white border-red-500') :
                    'bg-white dark:bg-[#0D1525] border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-300'
                  }`}
                  title={`Q${idx + 1}`}
                  aria-label={`Select question ${idx + 1}`}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate('/practice')}
            className="flex-1 py-4 rounded-2xl bg-sky-700 text-white font-bold flex items-center justify-center gap-2"
          >
            <Home size={16} />
            Back to Practice
          </button>
        </div>
      </div>
    </div>
  );
}
