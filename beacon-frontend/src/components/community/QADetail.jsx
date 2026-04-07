import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';
import { ThumbsUp, MessageSquare, Share2, MoreHorizontal, Award } from 'lucide-react';
import BookmarkButton from '../shared/BookmarkButton';
import { useBookmarkIds } from '../../utils/bookmarks';
import { Community } from '../../services/api';

export default function QADetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { question, scrollToAnswerId, highlightAnswer } = location.state || {};
  const [liked, setLiked] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const { bookmarkIds, updateBookmarkId } = useBookmarkIds();
  const [questionData, setQuestionData] = useState(question || null);
  const [isLoading, setIsLoading] = useState(!question);

  const fallbackAnswers = [
    { id: 'a1', text: 'The trick is to define a consistent positive direction for the entire system...', author: { id: 'mj', name: 'Maria Johnson', avatar: 'MJ' }, votes: 15, createdAt: Date.now() - 10000 },
    { id: 'a2', text: 'Maria\'s explanation is spot on! Just remember that g is 9.8 m/s^2...', author: { id: 'db', name: 'David B.', avatar: 'DB' }, votes: 2, createdAt: Date.now() - 5000 },
  ];
  const [answers, setAnswers] = useState(question?.answers || fallbackAnswers);
  const [bestAnswerId, setBestAnswerId] = useState('a1');

  const initials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ').filter(Boolean);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return `${first}${second}`.toUpperCase() || 'ST';
  };

  const mapAnswer = (a) => ({
    id: a.id,
    text: a.body || a.text,
    author: {
      id: a.user_id || a.author_id || 'user',
      name: a.author_name || 'Student',
      avatar: initials(a.author_name || 'Student'),
    },
    votes: a.upvotes ?? a.votes ?? 0,
    createdAt: a.created_at ? new Date(a.created_at).getTime() : Date.now(),
    is_best_answer: a.is_best_answer || false,
  });

  const mapQuestion = (q) => {
    const mappedAnswers = (q.answers || []).map(mapAnswer);
    const best = mappedAnswers.find((a) => a.is_best_answer)?.id || null;
    return {
      id: q.id,
      text: q.title || q.body || 'Question',
      body: q.body || '',
      user_id: q.user_id,
      author_name: q.author_name || 'Student',
      author_photo: q.author_photo,
      created_at: q.created_at,
      subject: q.subject,
      practice_question_id: q.practice_question_id,
      answers: mappedAnswers,
      bestAnswerId: best,
    };
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const res = await Community.getQuestion(id);
        const data = res?.data;
        if (cancelled || !data) return;
        const mapped = mapQuestion(data);
        setQuestionData(mapped);
        setAnswers(mapped.answers.length ? mapped.answers : fallbackAnswers);
        setBestAnswerId(mapped.bestAnswerId || mapped.answers[0]?.id || 'a1');
      } catch (_) {
        if (!cancelled && !question) setQuestionData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!questionData?.answers || questionData.answers.length === 0) return;
    setAnswers(questionData.answers);
    if (questionData.bestAnswerId) {
      setBestAnswerId(questionData.bestAnswerId);
    }
  }, [questionData]);

  useEffect(() => {
    if (scrollToAnswerId) {
      const el = document.getElementById(`answer-${scrollToAnswerId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [scrollToAnswerId]);

  const submitAnswer = () => {
    if (!answerText.trim()) return;
    const newAnswer = {
      id: Date.now().toString(),
      text: answerText,
      author: { id: 'me', name: 'You', avatar: 'YO' },
      votes: 0,
      createdAt: Date.now(),
    };
    setAnswers(prev => [...prev, newAnswer]);
    setAnswerText('');
  };

  const selectBestAnswer = (answerId) => {
    setBestAnswerId(answerId);
  };

  const likeAnswer = (answerId) => {
    setAnswers(prev => prev.map(a => a.id === answerId ? { ...a, votes: a.votes + 1 } : a));
  };

  const displayQuestion = questionData || question || {};
  const questionTitle = displayQuestion.text || 'How do you set up the equations for a two-mass pulley system?';
  const practiceQuestionId = displayQuestion.practice_question_id;
  const questionBody = displayQuestion.body || 'I understand that Tension is the same on both sides, but I keep getting the signs wrong for acceleration. Can someone break down the steps?';
  const authorName = displayQuestion.author_name || 'Alex S.';
  const authorId = displayQuestion.user_id || 'asker';
  const authorInitials = initials(authorName);
  const postedAt = displayQuestion.created_at ? new Date(displayQuestion.created_at).toLocaleDateString() : '2 hours ago';

  if (isLoading && !displayQuestion?.text) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center">
        <p className="text-sm font-bold text-sky-600/70 dark:text-sky-400/70">Loading question...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-24">
      <SubScreenHeader 
        title="Question" 
        rightAction={<MoreHorizontal size={20} className="text-[#0C4A6E] dark:text-[#F0F9FF]" />} 
      />

      <div className="bg-white dark:bg-[#0D1525] p-5 shadow-sm border-b border-sky-100 dark:border-sky-900/20">
        <div className="flex items-center gap-3 mb-4">
          <div
            onClick={() => navigate(`/community/students/${authorId}`, { state: { student: { id: authorId, name: authorName, avatar: authorInitials } } })}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer"
          >
            {authorInitials}
          </div>
          <div>
            <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">{authorName}</h3>
            <p className="text-xs text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 font-medium">Student - {postedAt}</p>
          </div>
          <div className="ml-auto bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
            <Award size={12} /> 50 pts
          </div>
        </div>

        <h1 className="font-[var(--font-syne)] font-bold text-lg text-[#0369A1] dark:text-[#0EA5E9] mb-3 leading-snug">
          {questionTitle}
        </h1>

        {practiceQuestionId && (
          <div className="flex justify-end mb-3">
            <BookmarkButton
              questionId={practiceQuestionId}
              initialState={bookmarkIds.has(String(practiceQuestionId))}
              onChange={(next) => updateBookmarkId(practiceQuestionId, next)}
              className="w-9 h-9 rounded-xl"
            />
          </div>
        )}
        
        <p className="text-sm text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80 leading-relaxed mb-4">
          {questionBody}
        </p>

        <div className="flex items-center gap-6 pt-2 border-t border-sky-50 dark:border-sky-900/20">
          <button 
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? 'text-sky-600 dark:text-sky-400' : 'text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 hover:text-sky-600 dark:hover:text-sky-400'}`}
          >
            <ThumbsUp size={18} className={liked ? 'fill-current' : ''} /> 24
          </button>
          <button className="flex items-center gap-1.5 text-sm font-semibold text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
            <MessageSquare size={18} /> {answers.length}
          </button>
          <button className="flex items-center gap-1.5 text-sm font-semibold text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 hover:text-sky-600 dark:hover:text-sky-400 transition-colors ml-auto">
            <Share2 size={18} /> Share
          </button>
        </div>
      </div>

      <div className="px-5 pt-6">
        <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">{answers.length} Answers</h2>

        <div className="space-y-4">
          {answers.map(answer => (
            <div
              id={`answer-${answer.id}`}
              key={answer.id}
              className={`bg-white dark:bg-[#0D1525] rounded-2xl p-4 border ${bestAnswerId === answer.id ? 'border-2 border-green-400 dark:border-green-500/50' : 'border-sky-100 dark:border-sky-900/20'} shadow-sm ${highlightAnswer && scrollToAnswerId === answer.id ? 'ring-2 ring-sky-400' : ''}`}
            >
              {bestAnswerId === answer.id && (
                <div className="mb-2 text-[10px] font-bold text-green-600">Best Answer</div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div
                  onClick={() => navigate(`/community/students/${answer.author.id}`, { state: { student: answer.author } })}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  {answer.author.avatar}
                </div>
                <div>
                  <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">{answer.author.name}</h3>
                  <p className="text-[10px] text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60">1 hour ago</p>
                </div>
              </div>
              
              <p className="text-sm text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80 leading-relaxed mb-3">
                {answer.text}
              </p>

              <div className="flex items-center gap-4 pt-3 border-t border-sky-50 dark:border-sky-900/10">
                <button onClick={() => likeAnswer(answer.id)} className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
                  <ThumbsUp size={14} /> {answer.votes}
                </button>
                <button className="text-xs font-semibold text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 hover:text-sky-600 dark:hover:text-sky-400">
                  Reply
                </button>
                <button
                  onClick={() => selectBestAnswer(answer.id)}
                  className="ml-auto text-xs font-semibold text-sky-600 hover:underline"
                >
                  Select Best Answer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0D1525] border-t border-sky-100 dark:border-sky-900/20 p-4 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
        <div className="max-w-md mx-auto flex items-end gap-2">
          <div className="flex-1 bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-800/30 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-sky-500/50 transition-all duration-200">
            <textarea 
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Write an answer..." 
              className="w-full bg-transparent outline-none font-[var(--font-jakarta)] text-sm text-[#0C4A6E] dark:text-[#F0F9FF] placeholder:text-sky-400 dark:placeholder:text-sky-600 resize-none min-h-[40px] max-h-[120px]"
              rows={1}
            />
          </div>
          <button 
            onClick={submitAnswer}
            disabled={!answerText.trim()}
            className="w-10 h-10 rounded-full bg-[#0369A1] dark:bg-[#0EA5E9] text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] active:scale-95 transition-all duration-200 shadow-md"
          >
            <Share2 className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
