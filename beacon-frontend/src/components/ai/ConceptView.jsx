import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Play, FileText, MessageSquare, Bookmark, Sparkles } from 'lucide-react';
import api, { API_BASE_URL, AITutor } from '../../services/api';
import BookmarkButton from '../shared/BookmarkButton';
import { useBookmarkIds } from '../../utils/bookmarks';

const LEVELS = [
  { id: 'basic', label: '🌱 BASIC' },
  { id: 'normal', label: '⚡ NORMAL' },
  { id: 'deep', label: '🔥 DEEP' },
];

const confidenceLabels = ['Not yet', 'A little', 'Pretty well', 'Got it'];
const STEPS = [
  { id: 'summary', label: 'Summary' },
  { id: 'breakdown', label: 'Breakdown' },
  { id: 'examples', label: 'Examples' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'confidence', label: 'Confidence' },
];
const stepHints = {
  summary: 'Quick overview and key takeaway before the deep dive.',
  breakdown: 'Step-by-step explanation tailored to your level.',
  examples: 'See how it appears in real questions and videos.',
  quiz: 'Practice immediately to lock it in.',
  confidence: 'Rate understanding and ask follow-ups.',
};

export default function ConceptView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const conceptData = location.state?.concept;
  const concept = conceptData || { id, name: id, subject: location.state?.subject || 'General' };
  const conceptName = concept?.name || concept?.id || id;
  const conceptSubject = concept?.subject || 'General';
  const isFreeform = Boolean(conceptData?.is_freeform);

  const levelParam = searchParams.get('level');
  const initialLevel = LEVELS.find((l) => l.id === levelParam)?.id || 'normal';

  const [level, setLevel] = useState(initialLevel);
  const [details, setDetails] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [videos, setVideos] = useState([]);
  const [relatedQuestions, setRelatedQuestions] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [quizCount, setQuizCount] = useState(10);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [confidence, setConfidence] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const { bookmarkIds, updateBookmarkId } = useBookmarkIds();

  const streamAbortRef = useRef(null);
  const stepTopRef = useRef(null);

  useEffect(() => {
    setLevel(initialLevel);
  }, [initialLevel, id]);

  useEffect(() => {
    setCurrentStep(0);
  }, [conceptName]);

  useEffect(() => {
    if (stepTopRef.current) {
      stepTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep]);

  useEffect(() => {
    if (isFreeform) {
      setDetails(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/api/ai-tutor/concepts/${encodeURIComponent(conceptName)}`);
        if (cancelled) return;
        setDetails(res?.data || null);
      } catch (_) {
        if (!cancelled) setDetails(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conceptName, isFreeform]);

  const loadExplanation = async (selectedLevel) => {
    if (!conceptName) return;
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
    }
    const controller = new AbortController();
    streamAbortRef.current = controller;

    setExplanation('');
    setVideos([]);
    setRelatedQuestions([]);
    setStreaming(true);

    try {
      const token = localStorage.getItem('beacon_token');
      const res = await fetch(
        `${API_BASE_URL}/api/ai-tutor/concepts/${encodeURIComponent(conceptName)}/explain`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            concept: conceptName,
            subject: conceptSubject,
            level: selectedLevel,
          }),
          signal: controller.signal,
        }
      );

      if (!res.ok || !res.body) {
        throw new Error('Failed to stream explanation');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') {
            setStreaming(false);
            break;
          }
          try {
            const parsed = JSON.parse(raw);
            if (parsed.text) {
              setExplanation((prev) => prev + parsed.text);
            }
            if (parsed.videos) {
              setVideos(parsed.videos);
            }
            if (parsed.related_questions) {
              setRelatedQuestions(parsed.related_questions);
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        toast.error('Could not load explanation.');
      }
    } finally {
      setStreaming(false);
    }
  };

  useEffect(() => {
    loadExplanation(level);
    return () => {
      if (streamAbortRef.current) streamAbortRef.current.abort();
    };
  }, [conceptName, level]);

  const displayVideos = videos.length ? videos : details?.videos || [];
  const displayRelated = relatedQuestions.length ? relatedQuestions : details?.related_questions || [];

  const handleLevelChange = (next) => {
    if (next === level) return;
    setLevel(next);
  };

  const goNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const goPrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100);
  const nextStepLabel = STEPS[currentStep + 1]?.label;

  const normalizeQuizQuestion = (q, idx, sessionId) => {
    const optionA = q.option_a || q.optionA || q.option_a_text || q.options?.A || '';
    const optionB = q.option_b || q.optionB || q.option_b_text || q.options?.B || '';
    const optionC = q.option_c || q.optionC || q.option_c_text || q.options?.C || '';
    const optionD = q.option_d || q.optionD || q.option_d_text || q.options?.D || '';

    return {
      id: q.id || `${sessionId}-${idx}`,
      text: q.question_text || q.text || q.question || 'Question',
      options: [`A. ${optionA}`, `B. ${optionB}`, `C. ${optionC}`, `D. ${optionD}`],
      correctAnswer: (q.correct_answer || q.correct || 'A').toUpperCase(),
      explanation: q.explanation || '',
      topic: conceptName,
      subject: conceptSubject,
    };
  };

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const res = await AITutor.generateConceptQuiz({
        concept: conceptName,
        subject: conceptSubject,
        count: quizCount,
      });
      const payload = res?.data || {};
      const sessionId = payload.session_id;
      const questions = (payload.questions || []).map((q, idx) => normalizeQuizQuestion(q, idx, sessionId));
      if (!sessionId || questions.length === 0) {
        toast.error('Quiz could not be generated.');
        setGeneratingQuiz(false);
        return;
      }

      navigate(`/practice/session/${sessionId}`, {
        state: {
          id: sessionId,
          mode: 'practice',
          subject: conceptSubject,
          topic: conceptName,
          questions,
          answers: {},
          currentIndex: 0,
        },
      });
    } catch (err) {
      toast.error(err?.error || 'Failed to generate quiz.');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleConfidenceRate = async (rating) => {
    setConfidence(rating);
    try {
      await AITutor.rateConceptConfidence({
        concept: conceptName,
        subject: conceptSubject,
        rating,
      });
    } catch (_) {}
  };

  const shortSummary = useMemo(() => {
    return details?.summary || `${conceptName} is a key topic in ${conceptSubject}.`;
  }, [details, conceptName, conceptSubject]);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <style>{`
        @keyframes stepFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <SubScreenHeader
        title={conceptName || 'Concept'}
        rightAction={<Bookmark size={20} className="text-sky-600 dark:text-sky-400" />}
      />

      {/* TAGS */}
      <div className="px-5 pt-2 flex gap-2">
        <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-md text-[10px] font-black uppercase tracking-widest">
          {conceptSubject}
        </span>
        <span className="px-3 py-1 bg-sky-50 dark:bg-sky-800/10 text-sky-600 dark:text-sky-500 rounded-md text-[10px] font-black uppercase tracking-widest">
          Deep Dive
        </span>
      </div>

      {/* STEPPER */}
      <div ref={stepTopRef} className="px-5 mt-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-sky-500 dark:text-sky-400">
          <span>Step {currentStep + 1} of {STEPS.length}</span>
          <span>{STEPS[currentStep]?.label}</span>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-sky-100 dark:bg-sky-900/30 overflow-hidden">
          <div
            className="h-full bg-sky-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="grid grid-cols-5 gap-2 mt-3">
          {STEPS.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(idx)}
              className={`rounded-xl py-2 text-[10px] font-bold transition-all ${
                idx === currentStep
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                  : idx < currentStep
                    ? 'bg-sky-100 text-sky-700'
                    : 'bg-white/70 dark:bg-[#0D1525] text-sky-500 border border-sky-100 dark:border-sky-900/20'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-sky-600/80 dark:text-sky-300/80">
          {stepHints[STEPS[currentStep]?.id]}
        </p>
      </div>

      <div className="px-5 space-y-6 mt-4" key={currentStep} style={{ animation: 'stepFade 0.35s ease' }}>
        {currentStep === 0 && (
          <>
            <div className="w-full aspect-video bg-gray-900 rounded-2xl relative overflow-hidden group cursor-pointer shadow-lg shadow-sky-900/10 dark:shadow-none">
              <img
                src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80"
                alt="Video thumbnail"
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-sky-500/80 transition-colors">
                  <Play size={24} className="ml-1" fill="currentColor" />
                </div>
              </div>
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-white font-['Plus_Jakarta_Sans']">
                {displayVideos.length > 0 ? 'Video' : 'No video'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20 shadow-sm">
              <h2 className="font-[var(--font-syne)] font-bold text-lg text-[#0369A1] dark:text-[#0EA5E9] flex items-center gap-2 mb-3">
                <FileText size={20} />
                Quick Summary
              </h2>
              <p className="text-sm text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80 leading-relaxed">
                {shortSummary}
              </p>
            </div>

            {displayVideos.length > 0 && (
              <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl p-4 border border-sky-100 dark:border-sky-900/30 text-xs text-sky-600 dark:text-sky-300">
                {displayVideos.length} video{displayVideos.length > 1 ? 's' : ''} found. Jump to Step 3 to watch.
              </div>
            )}
          </>
        )}

        {currentStep === 1 && (
          <>
            <div className="bg-white/60 dark:bg-sky-900/10 p-4 rounded-2xl border border-sky-100 dark:border-sky-900/20">
              <p className="text-[11px] uppercase tracking-[0.2em] text-sky-500 dark:text-sky-400 mb-3">Choose depth</p>
              <div className="flex bg-white/70 dark:bg-[#0D1525] p-1.5 rounded-2xl border border-sky-100 dark:border-sky-900/20 gap-2">
                {LEVELS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleLevelChange(opt.id)}
                    className={`flex-1 py-3 rounded-xl font-[var(--font-syne)] font-bold text-[10px] tracking-widest transition-all duration-300 active:scale-95 ${
                      level === opt.id
                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                        : 'text-sky-600/60 dark:text-sky-400/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#0D1525] rounded-[2.5rem] p-6 border border-sky-100 dark:border-sky-900/20 shadow-xl shadow-sky-500/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9]">
                  {level === 'basic' ? 'Quick Explain' : level === 'deep' ? 'Deep Breakdown' : 'Step-by-step Explain'}
                </h3>
                {streaming && (
                  <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">Streaming…</span>
                )}
              </div>
              <div className="text-sm text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80 whitespace-pre-wrap leading-relaxed">
                {explanation || 'Generating explanation…'}
              </div>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            {displayRelated.length > 0 ? (
              <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20">
                <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">
                  Related Past Questions
                </h3>
                <div className="space-y-3">
                  {displayRelated.slice(0, 4).map((q, idx) => {
                    const qId = q.id || q.question_id;
                    const isBookmarked = qId ? bookmarkIds.has(String(qId)) : false;
                    return (
                      <div
                        key={qId || `${conceptName}-${idx}`}
                        className="p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/30 flex items-start justify-between gap-3"
                      >
                        <p className="text-sm font-medium text-[#0C4A6E] dark:text-[#F0F9FF]">
                          {q.question_text || q.text}
                        </p>
                        {qId && (
                          <BookmarkButton
                            questionId={qId}
                            initialState={isBookmarked}
                            onChange={(next) => updateBookmarkId(qId, next)}
                            className="w-8 h-8 rounded-lg"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => navigate('/practice/setup/topic', { state: { prefilledSubject: conceptSubject, prefilledTopic: conceptName } })}
                  className="w-full mt-4 bg-sky-600 text-white rounded-xl py-2.5 font-[var(--font-syne)] font-bold"
                >
                  Practice These
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20 text-sm text-sky-600 dark:text-sky-300">
                No related questions yet. We’ll surface more as you practice.
              </div>
            )}

            {displayVideos.length > 0 ? (
              <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/20">
                <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-3">
                  Related Videos
                </h3>
                <div className="space-y-2">
                  {displayVideos.map((v, idx) => (
                    <a
                      key={`${v.url}-${idx}`}
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm text-sky-700 dark:text-sky-300 underline-offset-2 hover:underline"
                    >
                      {v.title}
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl p-4 border border-sky-100 dark:border-sky-900/30 text-xs text-sky-600 dark:text-sky-300">
                No videos linked yet for this concept.
              </div>
            )}
          </>
        )}

        {currentStep === 3 && (
          <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-amber-500" />
              <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9]">Generate Quiz</h3>
            </div>
            <div className="flex gap-2 mb-4">
              {[5, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuizCount(count)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold ${
                    quizCount === count
                      ? 'bg-sky-600 text-white'
                      : 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            <button
              onClick={handleGenerateQuiz}
              disabled={generatingQuiz}
              className="w-full bg-sky-700 text-white rounded-xl py-3 font-[var(--font-syne)] font-bold disabled:opacity-60"
            >
              {generatingQuiz ? 'Generating…' : 'Start Concept Quiz'}
            </button>
          </div>
        )}

        {currentStep === 4 && (
          <>
            <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20">
              <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">
                How confident are you?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {confidenceLabels.map((label, idx) => (
                  <button
                    key={label}
                    onClick={() => handleConfidenceRate(idx)}
                    className={`rounded-xl py-3 text-xs font-bold border ${
                      confidence === idx
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-900/20'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl p-5 border border-sky-100 dark:border-sky-900/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#7DD3FC]">Ask Beacon AI</h3>
                <div className="w-8 h-8 rounded-full bg-sky-200 dark:bg-sky-800 flex items-center justify-center text-sky-700 dark:text-sky-300">
                  🤖
                </div>
              </div>
              <p className="text-sm text-[#0C4A6E]/70 dark:text-[#F0F9FF]/70 mb-4">
                Need another explanation or a mnemonic? Ask Beacon AI.
              </p>
              <button
                onClick={() => navigate('/ai-tutor/chat', {
                  state: {
                    initialMessage: `Explain ${conceptName} with Nigerian examples`,
                    autoSend: true,
                    subject: conceptSubject,
                  }
                })}
                className="w-full bg-white dark:bg-[#0D1525] text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/30 rounded-xl py-2.5 font-[var(--font-syne)] font-bold text-sm hover:bg-sky-50 dark:hover:bg-sky-900/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <MessageSquare size={16} /> Ask AI Tutor
              </button>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className="flex-1 rounded-xl py-3 text-xs font-bold border border-sky-200 dark:border-sky-800/30 text-sky-600 dark:text-sky-300 disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={goNext}
            disabled={currentStep === STEPS.length - 1}
            className="flex-1 rounded-xl py-3 text-xs font-bold bg-sky-600 text-white disabled:opacity-50"
          >
            {currentStep === STEPS.length - 1 ? 'Done' : nextStepLabel ? `Next: ${nextStepLabel}` : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
