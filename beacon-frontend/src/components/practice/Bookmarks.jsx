import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Practice } from '../../services/api';

export default function Bookmarks() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState('All');

  useEffect(() => {
    loadBookmarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const res = await Practice.getBookmarks();
      const payload = res?.data;
      const items = Array.isArray(payload)
        ? payload
        : (payload?.bookmarks || payload?.items || []);
      setBookmarks(Array.isArray(items) ? items : []);
    } catch (_) {
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (questionId) => {
    try {
      await Practice.removeBookmark(questionId);
      setBookmarks((prev) => prev.filter((b) => String(b.id) !== String(questionId)));
      toast.success('Bookmark removed');
    } catch (_) {
      toast.error('Failed to remove');
    }
  };

  const normalizeQuestion = (q) => ({
    id: q.id,
    text: q.question_text,
    options: [`A. ${q.option_a}`, `B. ${q.option_b}`, `C. ${q.option_c}`, `D. ${q.option_d}`],
    correctAnswer: q.correct_answer,
    explanation: q.explanation,
    topic: q.topic,
    subject: q.subject,
  });

  const handlePracticeAll = async () => {
    if (!bookmarks.length) return;
    try {
      const questionIds = bookmarks.map((b) => b.id);
      const res = await Practice.createSession({
        mode: 'practice',
        practice_type: 'bookmarks',
        subject: 'Bookmarks',
        question_ids: questionIds,
        total_questions: questionIds.length,
      });
      const session = res?.data?.session;
      const questions = (res?.data?.questions || []).map(normalizeQuestion);
      if (!session?.id) {
        toast.error('Failed to start session');
        return;
      }
      navigate(`/practice/session/${session.id}`, {
        state: {
          id: session.id,
          mode: 'practice',
          subject: 'Bookmarks',
          questions,
          answers: {},
          currentIndex: 0,
        },
      });
    } catch (_) {
      toast.error('Failed to start session');
    }
  };

  const subjects = useMemo(() => {
    const list = bookmarks.map((b) => b.subject).filter(Boolean);
    return ['All', ...new Set(list)];
  }, [bookmarks]);

  const filtered = activeSubject === 'All'
    ? bookmarks
    : bookmarks.filter((b) => b.subject === activeSubject);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      <SubScreenHeader title="Bookmarks" />

      <div className="bg-white dark:bg-[#0D1525] border-b border-sky-100 dark:border-sky-900/20 pt-4 pb-2 sticky top-[60px] z-10 px-5 space-y-4">
        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 flex justify-between items-center border border-sky-100 dark:border-sky-900/30">
          <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
            <Bookmark size={16} className="fill-current" />
            <span className="font-[var(--font-syne)] font-bold text-sm">{bookmarks.length} Saved Questions</span>
          </div>
          {bookmarks.length > 0 && (
            <button
              onClick={handlePracticeAll}
              className="bg-[#0369A1] dark:bg-[#0EA5E9] text-white px-4 py-1.5 rounded-lg font-[var(--font-syne)] font-bold text-xs shadow-sm hover:bg-[#0284C7] active:scale-95 transition-all"
            >
              Practice All
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 pt-1">
          {subjects.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveSubject(filter)}
              className={`px-4 py-1.5 rounded-full font-[var(--font-syne)] font-bold text-xs whitespace-nowrap transition-colors border ${
                activeSubject === filter
                  ? 'bg-[#0369A1] dark:bg-[#0EA5E9] text-white border-transparent'
                  : 'bg-white dark:bg-[#0D1525] text-sky-600/60 dark:text-sky-400/60 border-sky-100 dark:border-sky-900/30 hover:border-sky-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-24 overflow-y-auto">
        {loading ? (
          <div className="py-20 text-center text-sky-600/60 dark:text-sky-400/60">
            Loading bookmarks…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center animate-in fade-in">
            <div className="w-16 h-16 bg-sky-50 dark:bg-sky-900/20 rounded-full flex items-center justify-center text-sky-300 dark:text-sky-700 mb-4">
              <Bookmark size={32} />
            </div>
            <h3 className="font-[var(--font-syne)] font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF] mb-2">No bookmarks yet</h3>
            <p className="font-[var(--font-jakarta)] text-sm text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 max-w-xs mx-auto mb-6">
              When you find a tricky question during practice, tap the bookmark icon to save it here for later review.
            </p>
            <button
              onClick={() => navigate('/practice/setup')}
              className="bg-white dark:bg-[#0D1525] text-[#0369A1] dark:text-[#0EA5E9] border border-sky-100 dark:border-sky-900/30 px-6 py-2.5 rounded-xl font-[var(--font-syne)] font-bold text-sm shadow-sm active:scale-95 transition-all"
            >
              Start Practice Session
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((q) => (
              <div key={q.id} className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 shadow-sm animate-in fade-in">
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div className="flex gap-2 items-center flex-wrap">
                    {q.subject && (
                      <span className="bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {q.subject}
                      </span>
                    )}
                    {q.year && (
                      <span className="bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {q.year}
                      </span>
                    )}
                    {q.topic && (
                      <span className="text-[#0C4A6E]/50 dark:text-[#F0F9FF]/50 text-[10px] font-bold uppercase">
                        • {q.topic}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(q.id)}
                    className="text-red-400 hover:text-red-500 p-1 active:scale-90 transition-transform"
                    aria-label="Remove bookmark"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <p className="font-[var(--font-jakarta)] text-sm text-[#0C4A6E] dark:text-[#F0F9FF] leading-relaxed mb-4 line-clamp-3">
                  {q.question_text || q.text}
                </p>

                <div className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">
                  Saved for review
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
