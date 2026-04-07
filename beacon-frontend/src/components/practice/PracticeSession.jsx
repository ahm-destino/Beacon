import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { X, Clock, ArrowLeft, ArrowRight, CheckCircle2, XCircle, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { loadPracticeState, updatePracticeState } from '../../utils/practiceState';
import { Practice, STREAK_MILESTONE_POINTS } from '../../services/api';
import { useBookmarkIds } from '../../utils/bookmarks';
import QuestionTextFormatter from '../shared/QuestionTextFormatter';
import BookmarkButton from '../shared/BookmarkButton';
import JambCalculator from '../shared/JambCalculator';
import DocumentChat from './DocumentChat';
import { toast } from 'sonner';
import api from '../../services/api';

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function PracticeSession({ forcedMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const savedState = loadPracticeState();
  const fallbackSession = savedState.currentSession || JSON.parse(localStorage.getItem('savedPracticeSession') || 'null');
  const sessionFromNav = location.state || fallbackSession || {};

  // Backend expects modes like: 'practice' | 'exam' | 'mock'.
  // Some UI flows pass modes like 'Refocus'/'Daily'/'Review' — treat them as normal practice.
  const modeFromState = (forcedMode || sessionFromNav.mode || 'practice').toLowerCase();
  const mode = modeFromState === 'exam' ? 'exam' : 'practice';
  const skipBackendSession = Boolean(sessionFromNav.skipBackendSession);
  const initialSessionId = params.id || sessionFromNav.id || null;
  const [sessionId, setSessionId] = useState(initialSessionId);

  const isUuidLike = (v) => typeof v === 'string' && v.includes('-') && v.length >= 32;

  const fallbackQuestions = useMemo(() => ([
    {
      id: 'q1',
      text: 'Which of the following organelles is responsible for cellular respiration?',
      options: ['A. Nucleus', 'B. Mitochondria', 'C. Golgi apparatus', 'D. Ribosomes'],
      correctAnswer: 'B',
      explanation: 'Mitochondria are the powerhouses of the cell. They produce ATP via cellular respiration.',
      topic: 'Cell Biology',
      subject: sessionFromNav.subject || 'Biology',
    },
    {
      id: 'q2',
      text: 'The movement of water molecules through a semi-permeable membrane is known as:',
      options: ['A. Diffusion', 'B. Osmosis', 'C. Active transport', 'D. Transpiration'],
      correctAnswer: 'B',
      explanation: 'Osmosis is a special type of diffusion involving water across a semi-permeable membrane.',
      topic: 'Osmosis',
      subject: sessionFromNav.subject || 'Biology',
    },
  ]), [sessionFromNav.subject]);

  const [questions, setQuestions] = useState(
    sessionFromNav.questions && sessionFromNav.questions.length ? sessionFromNav.questions : []
  );

  const [currentIndex, setCurrentIndex] = useState(sessionFromNav.currentIndex || 0);
  const [answers, setAnswers] = useState(sessionFromNav.answers || {});
  const [showExitModal, setShowExitModal] = useState(false);
  const { bookmarkIds, updateBookmarkId } = useBookmarkIds();
  const [pointsEarned, setPointsEarned] = useState(sessionFromNav.pointsEarned || 0);
  const [pointsBreakdown, setPointsBreakdown] = useState(
    sessionFromNav.pointsBreakdown || { answerPoints: 0, speedBonus: 0, streakBonus: 0 }
  );

  const [sessionStartMs, setSessionStartMs] = useState(
    sessionFromNav.startTime ? new Date(sessionFromNav.startTime).getTime() : Date.now()
  );
  const [timeRemaining, setTimeRemaining] = useState(sessionFromNav.timer ?? (mode === 'exam' ? 3600 : null));
  const [isFinishing, setIsFinishing] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [feedbackExpanded, setFeedbackExpanded] = useState(true);
  // Mimo-style +XP popup
  const [xpPopup, setXpPopup] = useState(null); // { amount, key }

  // AI TUTOR INTEGRATION
  const docId = sessionFromNav.document_id || null;
  const [showChat, setShowChat] = useState(false);
  const [explanationLevel, setExplanationLevel] = useState(localStorage.getItem(`beacon_exp_level_${docId}`) || 'normal');
  const [messages, setMessages] = useState(() => {
    if (!docId) return [];
    const saved = localStorage.getItem(`beacon_chat_${docId}`);
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', text: "Hi! I'm your tutor for this session. What can I explain better?" }
    ];
  });

  useEffect(() => {
    if (docId) localStorage.setItem(`beacon_chat_${docId}`, JSON.stringify(messages));
  }, [messages, docId]);

  useEffect(() => {
    if (docId) localStorage.setItem(`beacon_exp_level_${docId}`, explanationLevel);
  }, [explanationLevel, docId]);

  const handleExplainMore = async (concept) => {
    if (!docId) return;
    const prompt = `Can you explain more about "${concept}" from this question? My level is ${explanationLevel}.`;
    setMessages(prev => [...prev, { role: 'user', text: prompt }]);
    setShowChat(true);
    
    try {
      const res = await api.post(`/api/documents/${docId}/chat`, { 
        message: prompt,
        explanation_level: explanationLevel 
      });
      if (res?.data?.answer) {
        setMessages(prev => [...prev, { role: 'assistant', text: res.data.answer }]);
      }
    } catch (_) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Error: Could not reach the AI tutor." }]);
    }
  };

  const currentQuestion = questions[currentIndex];
  const selected = answers[currentQuestion?.id];
  const isCorrect = selected && selected === currentQuestion?.correctAnswer;

  // Translate the DB correct answer letter → the visual letter the student sees (after shuffle)
  const visualCorrectLetter = currentQuestion?.optionMapping
    ? ['A', 'B', 'C', 'D'][currentQuestion.optionMapping.indexOf(currentQuestion.correctAnswer)]
    : currentQuestion?.correctAnswer;

  const progressPct = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const questionLabel = questions.length ? `Question ${currentIndex + 1} of ${questions.length}` : 'Preparing...';
  const headerTitle = `${sessionFromNav.subject || currentQuestion?.subject || 'General'}${sessionFromNav.topic ? ` — ${sessionFromNav.topic}` : ''}`;

  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [questionStartMs, setQuestionStartMs] = useState(Date.now());

  useEffect(() => {
    // Reset timing every time the user moves to a new question.
    setQuestionStartMs(Date.now());
  }, [currentIndex, currentQuestion?.id]);

  useEffect(() => {
    let cancelled = false;

    const normalizeBackendQuestion = (q) => {
      const originalOptions = [
        { original: 'A', text: q.option_a },
        { original: 'B', text: q.option_b },
        { original: 'C', text: q.option_c },
        { original: 'D', text: q.option_d },
      ];
      
      const shuffledOptions = shuffleArray(originalOptions);

      return {
        id: q.id,
        text: q.question_text,
        imageUrl: q.image_url,
        // We still keep the visual letters A., B., C., D. in the text for the UI but we map them from shuffled index
        options: shuffledOptions.map((opt, idx) => `${['A', 'B', 'C', 'D'][idx]}. ${opt.text}`),
        // Important: we store the shuffle mapping so handleAnswer knows what is what
        optionMapping: shuffledOptions.map(opt => opt.original),
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        topic: q.topic,
        subject: q.subject,
        referenceLink: q.reference_link,
      };
    };

    const difficultyMap = {
      Basic: 'easy',
      Normal: 'medium',
      Deep: 'hard',
      easy: 'easy',
      medium: 'medium',
      hard: 'hard',
    };

    const run = async () => {
      if (skipBackendSession) {
        if (questions.length === 0) {
          setQuestions(fallbackQuestions);
        }
        return;
      }

      // If we already have a backend session id + questions, don't recreate.
      if (questions.length > 0 && isUuidLike(sessionId)) return;

      // If no token exists, fall back to local mocks rather than crashing.
      const token = localStorage.getItem('beacon_token');
      if (!token) {
        setQuestions(fallbackQuestions);
        return;
      }

      setIsCreatingSession(true);
      try {
        const isTopicBased = sessionFromNav.practiceType === 'topic' || !!sessionFromNav.topic;
        const totalQuestions =
          mode === 'practice'
            ? isTopicBased
              ? 12
              : 20
            : sessionFromNav.total_questions || 40;

        const payload = {
          mode,
          practice_type: isTopicBased ? 'topic_based' : 'subject_based',
          exam_type: sessionFromNav.examType || sessionFromNav.exam_type,
          subject: sessionFromNav.subject,
          topic: isTopicBased ? sessionFromNav.topic : null,
          year: !isTopicBased && sessionFromNav.year ? Number(sessionFromNav.year) : null,
          difficulty: sessionFromNav.difficulty ? (difficultyMap[sessionFromNav.difficulty] || sessionFromNav.difficulty) : null,
          time_limit: timeRemaining,
          total_questions: totalQuestions,
        };

        const res = await Practice.createSession(payload);
        const backendSession = res?.data?.session;
        const backendQuestions = res?.data?.questions || [];

        if (cancelled) return;

        setSessionId(backendSession?.id);
        setQuestions(backendQuestions.map(normalizeBackendQuestion));
        setAnswers({});
        setCurrentIndex(0);
        setSessionStartMs(backendSession?.started_at ? new Date(backendSession.started_at).getTime() : Date.now());

        // If the session has a server-side time limit, use it; else keep the existing.
        setTimeRemaining(backendSession?.time_limit ?? payload.time_limit ?? (mode === 'exam' ? 3600 : null));
      } catch (e) {
        if (cancelled) return;
        setQuestions(fallbackQuestions);
      } finally {
        if (!cancelled) setIsCreatingSession(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (timeRemaining === null) return;
    if (timeRemaining <= 0) {
      void handleFinish(true);
      return;
    }
    const t = setInterval(() => setTimeRemaining(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [timeRemaining]);

  useEffect(() => {
    const session = {
      ...sessionFromNav,
      id: sessionId,
      mode,
      questions,
      answers,
      currentIndex,
      startTime: new Date(sessionStartMs).toISOString(),
      timer: timeRemaining,
      status: 'active',
      pointsEarned,
      pointsBreakdown,
    };
    updatePracticeState(prev => ({ ...prev, currentSession: session }));
    localStorage.setItem('savedPracticeSession', JSON.stringify(session));
  }, [answers, currentIndex, timeRemaining, pointsEarned, pointsBreakdown]);

  const formatTime = (seconds) => {
    if (seconds === null) return 'Practice';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = async (letter) => {
    const visualIndex = ['A', 'B', 'C', 'D'].indexOf(letter);
    const originalLetter = currentQuestion.optionMapping
      ? currentQuestion.optionMapping[visualIndex]
      : letter;

    setAnswers(prev => ({ ...prev, [currentQuestion.id]: originalLetter }));
    setFeedbackExpanded(true);

    const timeSpent = Math.max(0, Math.round((Date.now() - questionStartMs) / 1000));
    const isAnswerCorrect = originalLetter === currentQuestion.correctAnswer;

    // Optimistic local state (keeps UI snappy even before API response)
    if (isAnswerCorrect) {
      const speedBonus = timeSpent && timeSpent < 30 ? 5 : 0;
      setPointsEarned(prev => prev + 10 + speedBonus);
      setPointsBreakdown(prev => ({
        ...prev,
        answerPoints: prev.answerPoints + 10,
        speedBonus: prev.speedBonus + speedBonus,
      }));
    }

    if (!skipBackendSession && isUuidLike(sessionId)) {
      try {
        const res = await Practice.submitAnswer(sessionId, {
          question_id: currentQuestion.id,
          selected_option: originalLetter,
          time_spent: timeSpent,
          is_flagged: false,
        });
        // 🎉 Mimo-style: show floating +XP chip using backend's real value
        const earned = res?.data?.points_earned ?? 0;
        if (earned > 0) {
          setXpPopup({ amount: earned, key: Date.now() });
          setTimeout(() => setXpPopup(null), 1200);
        }
      } catch (_) {
        // Best-effort
      }
      window.dispatchEvent(new Event('beacon-weakareas-refresh'));
    } else if (isAnswerCorrect) {
      // Offline/fallback popup
      setXpPopup({ amount: 10, key: Date.now() });
      setTimeout(() => setXpPopup(null), 1200);
    }
  };

  const handleNext = () => {
    if (currentIndex >= questions.length - 1) {
      void handleFinish(false);
      return;
    }
    setCurrentIndex(prev => prev + 1);
    setFeedbackExpanded(true);
  };

  const handlePrev = () => {
    if (currentIndex === 0) return;
    setCurrentIndex(prev => prev - 1);
  };

  const handleFinish = async (autoSubmitted = false) => {
    if (isFinishing) return;
    const timeTaken = Math.round((Date.now() - sessionStartMs) / 1000);
    const sid = isUuidLike(sessionId) ? sessionId : sessionFromNav.id || Date.now().toString();

    let streakBonus = 0;
    let celebration = null;
    if (!skipBackendSession && isUuidLike(sid)) {
      try {
        await Practice.updateSession(sid, { time_used: timeTaken });
        const completion = await Practice.completeSession(sid);
        const currentStreak = completion?.data?.streak?.current_streak;
        streakBonus = STREAK_MILESTONE_POINTS[currentStreak] || 0;
        // 🎉 Capture backend celebration payload
        celebration = completion?.data?.celebration || null;
      } catch (_) {}
    }

    const pointsSummary = {
      total: pointsEarned + streakBonus,
      answerPoints: pointsBreakdown.answerPoints,
      speedBonus: pointsBreakdown.speedBonus,
      streakBonus,
    };

    const resultState = {
      sessionId: sid,
      document_id: docId,
      section_id: sessionFromNav.section_id,
      questions,
      answers,
      mode,
      examType: sessionFromNav.examType,
      subject: sessionFromNav.subject || currentQuestion?.subject,
      topic: sessionFromNav.topic || currentQuestion?.topic,
      timeTaken,
      autoSubmitted,
      pointsSummary,
      celebration, // ← Mimo celebration data from backend
    };

    updatePracticeState(prev => ({ ...prev, currentSession: null }));
    localStorage.removeItem('savedPracticeSession');

    setIsFinishing(true);
    navigate(`/practice/results/${sid}`, { state: resultState });
  };

  const bookmarkActive = currentQuestion ? bookmarkIds.has(String(currentQuestion.id)) : false;

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center">
        <p className="font-[var(--font-syne)] font-bold text-[#0369A1] dark:text-[#F0F9FF]">
          Loading your {mode === 'exam' ? 'exam' : 'practice'} session…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] text-[#0C4A6E] dark:text-[#F0F9FF]">
      {/* ✨ MIMO-STYLE FLOATING +XP CHIP */}
      {xpPopup && (
        <div
          key={xpPopup.key}
          className="fixed left-1/2 z-[100] pointer-events-none"
          style={{
            top: '38%',
            transform: 'translateX(-50%)',
            animation: 'xpFloat 1.1s ease-out forwards',
          }}
        >
          <div className="bg-emerald-500 text-white font-black text-xl px-5 py-2 rounded-full shadow-xl shadow-emerald-500/40 flex items-center gap-2">
            <span>⚡</span>
            <span>+{xpPopup.amount} XP</span>
          </div>
        </div>
      )}
      <style>{`
        @keyframes xpFloat {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0)   scale(1);    }
          60%  { opacity: 1; transform: translateX(-50%) translateY(-48px) scale(1.15); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-80px) scale(0.9); }
        }
      `}</style>

      {/* PROGRESS BAR */}
      <div className="h-1 w-full bg-sky-100 dark:bg-sky-900/30">
        <div className="h-full bg-sky-600 dark:bg-sky-500 transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
      </div>

      {/* SESSION HEADER */}
      <div className="sticky top-0 z-40 bg-white/85 dark:bg-[#080C14]/90 backdrop-blur-xl border-b border-sky-100 dark:border-sky-900/20">
        <div className="flex items-center justify-between px-5 h-16 max-w-md mx-auto">
          <button 
            onClick={() => setShowExitModal(true)} 
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 shadow-sm active:scale-95 transition-all"
          >
            <X size={20} />
          </button>
          
          <div className="text-center flex-1 px-4 min-w-0">
            <h1 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] truncate mb-0.5">
              {headerTitle}
            </h1>
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] text-sky-500 font-bold uppercase tracking-wider">{questionLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowCalculator(!showCalculator)} 
              className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors ${showCalculator ? 'bg-sky-600 text-white border-sky-600' : 'bg-sky-50 dark:bg-[#0D1525] border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400'}`}
              title="Toggle Calculator"
            >
              <Calculator size={16} />
            </button>
            <div className="flex items-center gap-2 bg-[#0369A1] dark:bg-[#0EA5E9] px-3 py-1.5 rounded-xl border border-sky-400/20 shadow-lg shadow-sky-500/10">
              <Clock size={14} className="text-white" />
              <span className="font-['Plus_Jakarta_Sans'] text-xs font-black text-white">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-8 pb-32">
        {/* QUESTION CARD */}
        <div className="relative">
          <div className="flex justify-between items-center mb-6">
             <div className="flex gap-2">
               <span className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/40 text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">
                 {currentQuestion?.topic || 'General'}
               </span>
             </div>
            <BookmarkButton
              questionId={currentQuestion?.id}
              initialState={bookmarkActive}
              onChange={(next) => updateBookmarkId(currentQuestion?.id, next)}
              className="w-10 h-10 rounded-2xl border"
            />
          </div>

          {currentQuestion?.imageUrl && (
            <div className="w-full mb-6 rounded-2xl overflow-hidden border-2 border-sky-100 dark:border-sky-900/40 shadow-sm relative bg-white flex justify-center p-2">
                <img src={currentQuestion.imageUrl} alt="Question figure" className="w-full h-auto object-contain max-h-56" />
            </div>
          )}

          <div className="font-[var(--font-jakarta)] text-lg font-medium leading-relaxed text-[#0C4A6E] dark:text-[#F0F9FF] mb-8">
            <QuestionTextFormatter text={currentQuestion?.text} />
          </div>

          <div className="space-y-4">
            {currentQuestion.options.map((option, i) => {
              const visualLetter = ['A', 'B', 'C', 'D'][i];
              // The database letter that corresponds to this visual slot
              const mappedLetter = currentQuestion.optionMapping ? currentQuestion.optionMapping[i] : visualLetter;
              
              const isSelected = selected === mappedLetter;
              const isCorrectOption = mappedLetter === currentQuestion.correctAnswer;
              const showResult = mode === 'practice' && selected;

              let optionStyle = 'border-sky-100 dark:border-sky-900/20 bg-white dark:bg-[#0D1525] text-[#0C4A6E] dark:text-[#F0F9FF]/80';
              
              if (showResult) {
                if (isCorrectOption) {
                  optionStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-4 ring-emerald-500/10';
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-4 ring-red-500/10';
                }
              } else if (isSelected) {
                optionStyle = 'border-[#0369A1] dark:border-[#0EA5E9] bg-sky-50/50 dark:bg-sky-900/20 text-[#0369A1] dark:text-[#0EA5E9] ring-4 ring-sky-500/10';
              }

              return (
                <button
                  key={visualLetter}
                  onClick={() => handleAnswer(visualLetter)}
                  className={`group w-full text-left p-5 rounded-3xl border-2 font-bold text-sm transition-all duration-300 flex items-center gap-4 ${optionStyle} ${!showResult && 'hover:border-sky-300 active:scale-[0.98]'}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 transition-colors ${
                    isSelected ? 'border-current' : 'border-sky-100 dark:border-sky-900/30 group-hover:border-sky-300'
                  }`}>
                    {visualLetter}
                  </div>
                  <span className="flex-1 font-[var(--font-jakarta)]">{option.replace(/^[A-D]\.\s+/, '')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FEEDBACK SLIDE-UP PANEL */}
        {mode === 'practice' && selected && (
          <div className={`fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-[#0D1525] border-t border-sky-100 dark:border-sky-900/20 shadow-[0_-20px_50px_rgba(3,105,161,0.15)] transition-all duration-500 ease-in-out ${feedbackExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-88px)]'}`}>
            {/* Grab Handle Header */}
            <div 
               onClick={() => setFeedbackExpanded(!feedbackExpanded)}
               className="w-full flex justify-center items-center py-2 cursor-pointer bg-sky-50/50 dark:bg-[#151F32]/50 hover:bg-sky-100/50 dark:hover:bg-[#1E293B] transition-colors rounded-t-3xl"
            >
               <div className="w-12 h-1.5 rounded-full bg-sky-200 dark:bg-sky-800 absolute top-3"></div>
               {feedbackExpanded ? <ChevronDown size={20} className="text-sky-400 mt-2" /> : <ChevronUp size={20} className="text-sky-400 mt-2" />}
            </div>

            <div className="max-w-md mx-auto px-6 pb-10 pt-2">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                  {isCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <h3 className={`font-[var(--font-syne)] font-bold text-lg ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isCorrect ? '✅ Correct!' : 'Not quite.'}
                    </h3>
                    {!isCorrect && <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">Answer: Option {visualCorrectLetter}</p>}
                  </div>
                  
                  {/* Inline Next Button when collapsed */}
                  {!feedbackExpanded && (
                    <button
                      onClick={handleNext}
                      className="bg-[#0369A1] dark:bg-[#0EA5E9] text-white rounded-xl px-4 py-2 font-[var(--font-syne)] font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center gap-1"
                    >
                      Next <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className={`transition-all duration-300 overflow-hidden ${feedbackExpanded ? 'opacity-100 max-h-[400px]' : 'opacity-0 max-h-0'}`}>
                <p className="text-sm font-[var(--font-jakarta)] text-[#0C4A6E] dark:text-[#F0F9FF]/70 leading-relaxed mb-4">
                  {currentQuestion.explanation}
                </p>
                {currentQuestion.referenceLink && (
                  <a 
                    href={currentQuestion.referenceLink} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2 text-sm font-bold text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 mb-6 transition-colors"
                  >
                    📖 Read More / Reference Citation
                  </a>
                )}

                {docId && (
                  <button
                    onClick={() => handleExplainMore(currentQuestion.text)}
                    className="w-full mb-3 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-2xl py-3 font-bold text-sm border border-sky-100 dark:border-sky-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    💡 AI Explain with Tutor
                  </button>
                )}
                
                <button
                  onClick={handleNext}
                  className="w-full bg-[#0369A1] dark:bg-[#0EA5E9] text-white rounded-2xl py-4 font-[var(--font-syne)] font-bold shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {currentIndex === questions.length - 1 ? 'Finish Session' : 'Next Question'} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EXAM MODE FOOTER (ONLY IF NO SELECTED IN PRACTICE) */}
      {!(mode === 'practice' && selected) && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-[#080C14]/90 backdrop-blur-xl border-t border-sky-100 dark:border-sky-900/20 px-5 py-5 pb-10">
          <div className="max-w-md mx-auto flex gap-4">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="w-12 h-12 flex items-center justify-center bg-white dark:bg-[#0D1525] border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400 rounded-2xl disabled:opacity-30 active:scale-95 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="flex-1 bg-[#0369A1] dark:bg-[#0EA5E9] text-white rounded-2xl py-3 font-[var(--font-syne)] font-bold text-sm shadow-lg shadow-sky-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {currentIndex === questions.length - 1 ? 'Finish' : (mode === 'exam' && !selected ? 'Skip' : 'Next')} 
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-5">
          <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 w-full max-w-sm">
            <h3 className="font-[var(--font-syne)] font-bold text-lg text-[#0369A1] dark:text-[#0EA5E9] mb-2">Exit session?</h3>
            <p className="text-sm text-sky-600 dark:text-sky-400 mb-6">Your progress will be saved so you can continue later.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 rounded-xl py-2.5 font-[var(--font-syne)] font-bold text-sm"
              >
                Stay
              </button>
              <button
                onClick={() => {
                  const session = {
                    ...sessionFromNav,
                    id: sessionId,
                    mode,
                    questions,
                    answers,
                    currentIndex,
                    startTime: new Date(sessionStartMs).toISOString(),
                    timer: timeRemaining,
                    status: 'paused',
                    pointsEarned,
                    pointsBreakdown,
                  };
                  updatePracticeState(prev => ({ ...prev, currentSession: session }));
                  localStorage.setItem('savedPracticeSession', JSON.stringify(session));
                  navigate('/practice');
                }}
                className="flex-1 bg-sky-700 dark:bg-sky-600 text-white rounded-xl py-2.5 font-[var(--font-syne)] font-bold text-sm"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {showCalculator && <JambCalculator onClose={() => setShowCalculator(false)} />}
      
      {showChat && docId && (
        <DocumentChat 
          documentId={docId} 
          onClose={() => setShowChat(false)} 
          messages={messages}
          setMessages={setMessages}
          explanationLevel={explanationLevel}
          setExplanationLevel={setExplanationLevel}
        />
      )}
    </div>
  );
}
