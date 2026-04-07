import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Flag, ArrowRight, Calculator } from 'lucide-react';
import { Practice, STREAK_MILESTONE_POINTS } from '../../services/api';
import QuestionTextFormatter from '../shared/QuestionTextFormatter';
import JambCalculator from '../shared/JambCalculator';

const JAMB_FULL_SECONDS = 120 * 60; // 7200

function formatTime(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function normalizeQuestion(q) {
  const originalOptions = [
    { original: 'A', text: q.option_a },
    { original: 'B', text: q.option_b },
    { original: 'C', text: q.option_c },
    { original: 'D', text: q.option_d },
  ];
  
  const shuffledOpts = shuffleArray(originalOptions);

  return {
    id: q.id,
    text: q.question_text,
    imageUrl: q.image_url,
    options: shuffledOpts.map(o => o.text),
    // Map visual index (0,1,2,3) to internal letter (A,B,C,D)
    optionMapping: shuffledOpts.map(o => o.original),
    correctAnswer: q.correct_answer,
    explanation: q.explanation,
    subject: q.subject,
    topic: q.topic,
    referenceLink: q.reference_link,
  };
}

export default function JAMBFullExamScreen() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [sections, setSections] = useState([]); // {subject, questions:[normalized]}
  const [flatQuestions, setFlatQuestions] = useState([]); // normalized, 180

  const [answersById, setAnswersById] = useState({});
  const [flaggedById, setFlaggedById] = useState({});

  const [timeRemaining, setTimeRemaining] = useState(JAMB_FULL_SECONDS);
  const [startedAtMs, setStartedAtMs] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  // Navigation state
  const [currentGlobalIndex, setCurrentGlobalIndex] = useState(0);
  const [currentGlobalIndexBySection, setCurrentGlobalIndexBySection] = useState([]);
  const [sectionStarts, setSectionStarts] = useState([]);

  const letterByOptionIndex = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await Practice.createJambFullSession();
        const payload = res?.data || {};
        const nextSections = (payload.sections || []).map((s) => ({
          subject: s.subject,
          questions: (s.questions || []).map(normalizeQuestion),
        }));
        const nextFlat = nextSections.flatMap((s) => s.questions);

        if (!mounted) return;

        setSession(payload.session || null);
        setSections(nextSections);
        setFlatQuestions(nextFlat);
        setIsLoading(false);

        const nextTime = payload.time_limit_seconds || JAMB_FULL_SECONDS;
        setTimeRemaining(nextTime);
        setStartedAtMs(Date.now());

        const starts = [];
        let cursor = 0;
        nextSections.forEach((sec, idx) => {
          starts[idx] = cursor;
          cursor += sec.questions.length;
        });
        setSectionStarts(starts);
        setCurrentGlobalIndexBySection(starts.map((s) => s));
        setCurrentGlobalIndex(starts[0] || 0);
      } catch (e) {
        window.alert(e?.error || 'Could not start JAMB full simulation.');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totalQuestions = flatQuestions.length || 180;

  const currentQuestion = flatQuestions[currentGlobalIndex] || null;
  const currentSectionIndex = useMemo(() => {
    if (!currentQuestion) return 0;
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const start = sectionStarts[sIdx] ?? 0;
      const end = start + (sections[sIdx]?.questions?.length || 0) - 1;
      if (currentGlobalIndex >= start && currentGlobalIndex <= end) return sIdx;
    }
    return 0;
  }, [currentGlobalIndex, currentQuestion, sectionStarts, sections]);

  const currentSection = sections[currentSectionIndex] || null;
  const currentSectionIndexInSection = currentSection
    ? currentGlobalIndex - (sectionStarts[currentSectionIndex] || 0)
    : 0;

  const sectionStats = useMemo(() => {
    return sections.map((sec) => {
      const answeredCount = sec.questions.reduce((acc, q) => acc + (answersById[q.id] ? 1 : 0), 0);
      const unanswered = sec.questions.length - answeredCount;
      return { answeredCount, unanswered };
    });
  }, [sections, answersById]);

  const finishExam = async () => {
    if (!session || isFinishing) return;
    setIsFinishing(true);
    const timeUsedSeconds = startedAtMs ? Math.round((Date.now() - startedAtMs) / 1000) : 0;

    let streakBonus = 0;
    try {
      const completion = await Practice.completeSession(session.id);
      const currentStreak = completion?.data?.streak?.current_streak;
      streakBonus = STREAK_MILESTONE_POINTS[currentStreak] || 0;
    } catch (_) {
      // best effort
    }

    const total = flatQuestions.length || 1;
    const correct = flatQuestions.filter((q) => answersById[q.id] && answersById[q.id] === q.correctAnswer).length;
    const score = Math.round((correct / total) * 100);
    const answerPoints = correct * 10;
    const pointsSummary = {
      total: answerPoints + streakBonus,
      answerPoints,
      speedBonus: 0,
      streakBonus,
    };

    navigate(`/practice/jamb-full/results/${session.id}`, {
      state: {
        sessionId: session.id,
        flatQuestions,
        sections,
        answersById,
        flaggedById,
        timeUsedSeconds,
        correctCount: correct,
        score,
        pointsSummary,
      },
    });
  };

  useEffect(() => {
    if (isLoading || !startedAtMs) return;
    if (isFinishing) return;

    const intervalId = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isLoading, startedAtMs, isFinishing]);

  const submitAnswer = async (questionId, selectedLetter) => {
    if (!session) return;
    try {
      await Practice.submitAnswer(session.id, {
        question_id: questionId,
        selected_option: selectedLetter,
        is_flagged: !!flaggedById[questionId],
        time_spent: 0,
      });
    } catch (_) {
      // best effort
    }
  };

  const handleSelectOption = async (letter) => {
    if (!currentQuestion || !session) return;
    const qid = currentQuestion.id;
    if (answersById[qid]) return;

    // letter is visual A,B,C,D. Map back to original database letter.
    const visualIndex = letterByOptionIndex.indexOf(letter);
    const originalLetter = currentQuestion.optionMapping 
      ? currentQuestion.optionMapping[visualIndex] 
      : letter;

    setAnswersById((prev) => ({ ...prev, [qid]: originalLetter }));
    await submitAnswer(qid, originalLetter);

    // Notify WeakAreas page to refresh based on updated SessionAnswer history.
    window.dispatchEvent(new Event('beacon-weakareas-refresh'));
  };

  const goToGlobalIndex = (globalIdx) => {
    setCurrentGlobalIndex(globalIdx);
    // update per-section pointer for tab switching
    const sIdx = (() => {
      for (let i = 0; i < sections.length; i++) {
        const start = sectionStarts[i] ?? 0;
        const end = start + (sections[i]?.questions?.length || 0) - 1;
        if (globalIdx >= start && globalIdx <= end) return i;
      }
      return 0;
    })();
    setCurrentGlobalIndexBySection((prev) => {
      const next = [...prev];
      next[sIdx] = globalIdx;
      return next;
    });
  };

  const goPrevInSection = () => {
    if (!currentSection) return;
    const nextInSection = Math.max(0, currentSectionIndexInSection - 1);
    const nextGlobal = (sectionStarts[currentSectionIndex] || 0) + nextInSection;
    goToGlobalIndex(nextGlobal);
  };

  const goNextInSection = () => {
    if (!currentSection) return;
    const maxIdx = currentSection.questions.length - 1;
    const nextInSection = Math.min(maxIdx, currentSectionIndexInSection + 1);
    const nextGlobal = (sectionStarts[currentSectionIndex] || 0) + nextInSection;
    goToGlobalIndex(nextGlobal);
  };

  const toggleFlag = () => {
    if (!currentQuestion) return;
    const qid = currentQuestion.id;
    setFlaggedById((prev) => {
      const next = { ...prev };
      if (next[qid]) delete next[qid];
      else next[qid] = true;
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center">
        <p className="font-[var(--font-syne)] font-bold text-[#0369A1]">Loading JAMB full simulation…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] text-[#0C4A6E] dark:text-[#F0F9FF]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/85 dark:bg-[#080C14]/90 backdrop-blur-xl border-b border-sky-100 dark:border-sky-900/20">
        <div className="max-w-md mx-auto px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-sky-600/70">JAMB UTME</div>
              <div className="text-sm font-bold">
                {currentSection?.subject || 'Section'} • Q{currentSectionIndexInSection + 1}/{currentSection?.questions.length || 0}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowCalculator(!showCalculator)} 
                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors ${showCalculator ? 'bg-sky-600 text-white border-sky-600' : 'bg-white dark:bg-[#0D1525] border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400'}`}
                title="Toggle Calculator"
              >
                <Calculator size={16} />
              </button>
              <div className="flex items-center gap-2 bg-sky-700/10 dark:bg-sky-900/20 border border-sky-500/20 rounded-xl px-3 py-2">
                <Clock size={14} className="text-sky-700 dark:text-sky-300" />
                <div
                  className={`font-[var(--font-syne)] font-bold text-xs ${
                    timeRemaining <= 300 ? 'text-red-600' : timeRemaining <= 600 ? 'text-amber-500' : 'text-sky-700'
                  }`}
                >
                  {formatTime(timeRemaining)}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            {sections.map((sec, idx) => {
              const stats = sectionStats[idx] || { unanswered: 0 };
              const unanswered = stats.unanswered;
              const isActive = idx === currentSectionIndex;
              return (
                <button
                  key={sec.subject}
                  onClick={() => {
                    const globalIdx = currentGlobalIndexBySection[idx] ?? sectionStarts[idx] ?? 0;
                    goToGlobalIndex(globalIdx);
                  }}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'bg-white dark:bg-[#0D1525] border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-300'
                  }`}
                >
                  {sec.subject}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="opacity-80">({sec.questions.length})</span>
                    {unanswered > 0 && (
                      <span className="bg-amber-400 text-white px-2 py-0.5 rounded-full text-[10px]">
                        {unanswered}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      {currentQuestion && (
        <div className="max-w-md mx-auto px-5 pt-6 pb-28">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold uppercase tracking-widest text-sky-600/70">
              {currentQuestion.subject} • {currentQuestion.topic || 'General'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleFlag}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  flaggedById[currentQuestion.id]
                    ? 'bg-amber-400 border-amber-500 text-white'
                    : 'bg-white dark:bg-[#0D1525] border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-300'
                }`}
                aria-label="Flag question"
              >
                <Flag size={18} />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-3xl p-5 shadow-sm mb-5">
            <div className="text-sm font-bold mb-4 leading-relaxed flex gap-2 w-full">
              <span className="shrink-0">{currentGlobalIndex + 1}.</span>
              <div className="flex-1 w-full">
                {currentQuestion.imageUrl && (
                  <div className="w-full mb-6 rounded-2xl overflow-hidden border border-sky-100 dark:border-sky-900/40 shadow-sm relative bg-white flex justify-center p-2">
                    <img src={currentQuestion.imageUrl} alt="Question figure" className="w-full h-auto object-contain max-h-56" />
                  </div>
                )}
                <QuestionTextFormatter text={currentQuestion.text} />
              </div>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((opt, idx) => {
                const visualLetter = letterByOptionIndex[idx];
                const mappedLetter = currentQuestion.optionMapping ? currentQuestion.optionMapping[idx] : visualLetter;
                const isSelected = answersById[currentQuestion.id] === mappedLetter;
                return (
                  <button
                    key={visualLetter}
                    onClick={() => handleSelectOption(visualLetter)}
                    disabled={!!answersById[currentQuestion.id]}
                    className={`w-full text-left p-4 rounded-2xl border-2 text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-sky-700 text-white border-sky-700'
                        : 'bg-white dark:bg-[#0D1525] border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-300 hover:border-sky-300 dark:hover:border-sky-700'
                    } ${answersById[currentQuestion.id] ? 'opacity-90 cursor-not-allowed' : ''}`}
                  >
                    <span className="inline-block mr-3 px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs">
                      {visualLetter}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prev/Next */}
          <div className="flex gap-3">
            <button
              onClick={goPrevInSection}
              disabled={currentSectionIndexInSection === 0}
              className="flex-1 py-4 rounded-2xl bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-300 font-bold disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={goNextInSection}
              disabled={currentSectionIndexInSection >= (currentSection?.questions.length || 1) - 1}
              className="flex-1 py-4 rounded-2xl bg-sky-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              Next <ArrowRight size={16} />
            </button>
          </div>

          {/* Question map */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold uppercase tracking-widest text-sky-600/70">Question map</div>
              <div className="text-[10px] font-bold text-sky-600/60">
                Answered {Object.keys(answersById).length}/{totalQuestions}
              </div>
            </div>
            <div className="grid grid-cols-10 gap-2">
              {flatQuestions.map((q, idx) => {
                const answered = !!answersById[q.id];
                const isFlagged = !!flaggedById[q.id];
                const isActive = idx === currentGlobalIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => goToGlobalIndex(idx)}
                    className={`w-6 h-6 rounded-md border text-[10px] font-bold ${
                      isActive
                        ? 'ring-4 ring-sky-500/20 bg-sky-700 text-white border-sky-700'
                        : isFlagged
                          ? 'bg-amber-400 text-white border-amber-500'
                          : answered
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white dark:bg-[#0D1525] border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-300'
                    }`}
                    title={`Q${idx + 1}`}
                    aria-label={`Jump to question ${idx + 1}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/85 dark:bg-[#080C14]/90 backdrop-blur-xl border-t border-sky-100 dark:border-sky-900/20 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={finishExam}
            disabled={isFinishing}
            className="w-full py-4 rounded-2xl bg-sky-700 text-white font-bold disabled:opacity-60"
          >
            Finish & Submit
          </button>
        </div>
      </div>
      
      {showCalculator && <JambCalculator onClose={() => setShowCalculator(false)} />}
    </div>
  );
}
