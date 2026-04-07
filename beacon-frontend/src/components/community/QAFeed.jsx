import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';
import { MessageCircle, ThumbsUp, Eye, Plus } from 'lucide-react';
import BookmarkButton from '../shared/BookmarkButton';
import { useBookmarkIds } from '../../utils/bookmarks';
import { Community } from '../../services/api';

export default function QAFeed() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const { bookmarkIds, updateBookmarkId } = useBookmarkIds();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const mockQuestions = [
    {
      id: '1',
      subject: 'Biology',
      time: '2h ago',
      status: 'Answered',
      text: 'Can someone explain the difference between mitosis and meiosis in simple terms?',
      author: { id: 'so', name: 'Sarah O.', avatar: 'SO' },
      views: 234,
      answers: 8,
      likes: 45,
    },
    {
      id: '2',
      subject: 'Math',
      time: '5m ago',
      status: 'Open',
      text: 'How do you solve quadratic equations using the completing the square method? I always get stuck on the last step.',
      author: { id: 'to', name: 'Tunde O.', avatar: 'TO' },
      views: 12,
      answers: 0,
      likes: 2,
    },
    {
      id: '3',
      subject: 'Chemistry',
      time: '1d ago',
      status: 'Answered',
      text: 'What is the easiest way to memorize the first 20 elements of the periodic table?',
      author: { id: 'em', name: 'Emeka M.', avatar: 'EM' },
      views: 845,
      answers: 15,
      likes: 120,
    },
  ];

  const timeAgo = (iso) => {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  const initials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ').filter(Boolean);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return `${first}${second}`.toUpperCase() || 'ST';
  };

  const mapQuestion = (q) => {
    const status = q?.is_resolved || (q?.answer_count || 0) > 0 ? 'Answered' : 'Open';
    return {
      id: q.id,
      subject: q.subject || 'General',
      time: timeAgo(q.created_at),
      status,
      text: q.title || q.body || 'Question',
      author: {
        id: q.user_id || 'user',
        name: q.author_name || 'Student',
        avatar: initials(q.author_name || 'Student'),
      },
      views: q.views || 0,
      answers: q.answer_count || 0,
      likes: q.likes || 0,
      practice_question_id: q.practice_question_id,
    };
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await Community.listQuestions(1);
        const payload = res?.data?.items || res?.data || [];
        const list = Array.isArray(payload) ? payload : [];
        const mapped = list.map(mapQuestion);
        if (cancelled) return;
        setQuestions(mapped.length ? mapped : mockQuestions);
      } catch (_) {
        if (!cancelled) setQuestions(mockQuestions);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredQuestions = useMemo(() => {
    if (filter === 'All') return questions;
    const lowered = filter.toLowerCase();
    if (lowered.includes('unanswered')) {
      return questions.filter((q) => q.status !== 'Answered');
    }
    return questions.filter((q) => (q.subject || '').toLowerCase() === lowered);
  }, [filter, questions]);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader 
        title="Q&A Board" 
        rightAction={
          <button
            onClick={() => navigate('/community/qa/ask')}
            className="bg-sky-600 dark:bg-sky-500 text-white rounded-lg p-1.5 hover:bg-sky-700 dark:hover:bg-sky-400 transition-colors"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="px-5 pt-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {['All', 'Math', 'Biology', 'Chemistry', 'Physics', 'English', 'Unanswered'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-[var(--font-jakarta)] font-semibold transition-all duration-200
                ${filter === f 
                  ? 'bg-sky-600 dark:bg-sky-500 text-white' 
                  : 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-3 mt-4">
        {loading ? (
          <div className="text-center text-xs text-sky-600/70 dark:text-sky-400/70 py-8">
            Loading questions...
          </div>
        ) : (
          filteredQuestions.map(q => (
          <button
            key={q.id}
            onClick={() => navigate(`/community/qa/${q.id}`, { state: { question: q } })}
            className="block w-full text-left bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5 hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700/40 cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] focus:ring-2 focus:ring-sky-500/50 relative overflow-hidden"
          >
            {q.status === 'Answered' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 text-[10px] rounded-lg px-2 py-0.5 font-bold uppercase tracking-wider">{q.subject}</span>
                <span className="text-xs text-[#0369A1] dark:text-[#7DD3FC]">{q.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${q.status === 'Answered' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'}`}>
                  {q.status === 'Answered' ? 'Answered' : 'Open'}
                </span>
                {q.practice_question_id && (
                  <BookmarkButton
                    questionId={q.practice_question_id}
                    initialState={bookmarkIds.has(String(q.practice_question_id))}
                    onChange={(next) => updateBookmarkId(q.practice_question_id, next)}
                    className="w-7 h-7 rounded-lg"
                  />
                )}
              </div>
            </div>

            <h3 className="font-[var(--font-syne)] font-semibold text-base text-[#0C4A6E] dark:text-[#F0F9FF] mt-3 leading-relaxed line-clamp-2">
              {q.text}
            </h3>

            <div className="flex items-center gap-2 mt-4">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">{q.author.avatar}</div>
              <span className="font-[var(--font-jakarta)] text-xs font-semibold text-[#0369A1] dark:text-[#7DD3FC]">{q.author.name}</span>
            </div>

            <div className="flex gap-4 mt-3 pt-3 border-t border-sky-50 dark:border-sky-900/20">
              <div className="flex items-center gap-1.5 text-xs text-sky-600/70 dark:text-sky-400/70 font-semibold">
                <Eye size={14} /> {q.views} views
              </div>
              <div className="flex items-center gap-1.5 text-xs text-sky-600/70 dark:text-sky-400/70 font-semibold">
                <MessageCircle size={14} /> {q.answers} answers
              </div>
              <div className="flex items-center gap-1.5 text-xs text-sky-600/70 dark:text-sky-400/70 font-semibold">
                <ThumbsUp size={14} /> {q.likes} likes
              </div>
            </div>
          </button>
          ))
        )}
      </div>
    </div>
  );
}

