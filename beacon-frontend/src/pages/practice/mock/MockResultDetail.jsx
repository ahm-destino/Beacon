import React, { useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Trophy, RotateCcw, BookOpen, Share2, TrendingUp } from 'lucide-react';
import SubScreenHeader from '../../../components/shared/SubScreenHeader';

export default function MockResultDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const mock = useMemo(() => {
    if (location.state?.mock) return location.state.mock;
    const history = JSON.parse(localStorage.getItem('mockHistory') || '[]');
    return history.find(m => String(m.id) === String(id));
  }, [location.state, id]);

  const questions = mock?.questions || [];
  const answers = mock?.answers || {};
  const correct = questions.filter(q => answers[q.id] === q.correctAnswer);
  const score = questions.length ? Math.round((correct.length / questions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-12">
      <SubScreenHeader title="Mock Results" />

      <div className="pt-8 px-5 text-center mb-8">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 animate-bounce" style={{ animationDuration: '3s' }}>
          {score >= 70 ? '🎉' : '💪'}
        </div>
        <h1 className="font-[var(--font-syne)] font-black text-3xl text-[#0369A1] dark:text-[#0EA5E9]">
          {score >= 70 ? 'Excellent Work!' : 'Keep Pushing!'}
        </h1>
        <p className="text-sm text-[#0369A1] dark:text-[#7DD3FC] mt-2 font-medium">
          Mock Exam Results
        </p>
      </div>

      <div className="max-w-md mx-auto px-5">
        <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-8 border border-sky-100 dark:border-sky-900/20 shadow-[0_8px_32px_rgba(14,165,233,0.1)] dark:shadow-none mb-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-50 dark:bg-sky-900/10 rounded-full"></div>
          <div className="relative flex flex-col items-center">
            <div className="text-sm font-bold text-sky-500 uppercase tracking-[0.2em] mb-2">SCORE</div>
            <div className="flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans'] text-7xl font-black text-sky-700 dark:text-sky-300">{score}</span>
              <span className="text-2xl font-bold text-sky-400 dark:text-sky-600">%</span>
            </div>
            <p className="text-xs text-sky-600 dark:text-sky-400 mt-4 font-semibold flex items-center gap-1.5">
              <TrendingUp size={14} /> Mock performance snapshot
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/practice/review', {
              state: { wrongQuestions: questions.filter(q => answers[q.id] !== q.correctAnswer), subject: mock?.subject },
            })}
            className="w-full bg-sky-700 dark:bg-sky-600 text-white rounded-2xl py-4 font-[var(--font-syne)] font-bold text-sm shadow-[0_4px_16px_rgba(3,105,161,0.3)] flex items-center justify-center gap-2 hover:bg-sky-600 transition-all scale-100 active:scale-95 focus:ring-2 focus:ring-sky-500/50"
          >
            <BookOpen size={18} /> Review Wrong Answers
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/practice/exam', { state: { mockId: mock?.id, questions } })}
              className="flex-1 bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 rounded-2xl py-4 font-[var(--font-syne)] font-bold text-sm flex items-center justify-center gap-2 hover:bg-sky-50 transition-all"
            >
              <RotateCcw size={18} /> Retry Mock
            </button>
            <button className="flex-1 bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 rounded-2xl py-4 font-[var(--font-syne)] font-bold text-sm flex items-center justify-center gap-2 hover:bg-sky-50 transition-all">
              <Share2 size={18} /> Share Result
            </button>
          </div>

          <button
            onClick={() => navigate('/practice')}
            className="w-full text-center block pt-2 text-sky-600 dark:text-sky-400 font-bold text-sm hover:underline"
          >
            Back to Practice Hub
          </button>
        </div>
      </div>
    </div>
  );
}
