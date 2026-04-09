import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { Onboarding } from '../../services/api';
import QuestionTextFormatter from '../shared/QuestionTextFormatter';

export default function DiagnosticQuestion() {
  const navigate = useNavigate();
  const { id } = useParams();
  const questionNumber = parseInt(id || '1', 10);
  const [questions, setQuestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalQuestions = questions.length;
  
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const letters = useMemo(() => ['A', 'B', 'C', 'D'], []);
  const currentQuestion = questions[Math.min(questionNumber - 1, Math.max(questions.length - 1, 0))] || null;
  const currentOptions = currentQuestion
    ? [currentQuestion.option_a, currentQuestion.option_b, currentQuestion.option_c, currentQuestion.option_d]
    : [];
  const imageUrl = currentQuestion?.image_url || currentQuestion?.imageUrl;

  useEffect(() => {
    // Filled by DiagnosticIntro after calling /api/onboarding/diagnostic/start
    try {
      const storedQuestions = JSON.parse(
        localStorage.getItem('beacon_diagnostic_questions') || '[]'
      );
      setQuestions(Array.isArray(storedQuestions) ? storedQuestions : []);
    } catch (_) {
      setQuestions([]);
    }
  }, []);

  // Restore selection + reset timer when question changes
  useEffect(() => {
    setTimeLeft(60);
    if (!currentQuestion?.id) {
      setSelectedOption(null);
      return;
    }
    try {
      const storedAnswers = JSON.parse(localStorage.getItem('beacon_diagnostic_answers') || '{}');
      const storedLetter = storedAnswers[currentQuestion.id];
      const idx = letters.indexOf(storedLetter);
      setSelectedOption(idx >= 0 ? idx : null);
    } catch (_) {
      setSelectedOption(null);
    }
  }, [questionNumber, currentQuestion?.id, letters]);

  // Timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const persistAnswer = (questionId, selectedLetter) => {
    const stored = JSON.parse(localStorage.getItem('beacon_diagnostic_answers') || '{}');
    stored[questionId] = selectedLetter;
    localStorage.setItem('beacon_diagnostic_answers', JSON.stringify(stored));
  };

  const handleNext = async () => {
    if (selectedOption === null || !currentQuestion || isSubmitting) return;

    const selectedLetter = letters[selectedOption];
    persistAnswer(currentQuestion.id, selectedLetter);

    if (questionNumber < totalQuestions) {
      navigate(`/onboarding/diagnostic/${questionNumber + 1}`);
      return;
    }

    // Final submit
    setIsSubmitting(true);
    try {
      const storedAnswers = JSON.parse(localStorage.getItem('beacon_diagnostic_answers') || '{}');
      const answers = questions
        .map((q) => ({
          question_id: q.id,
          selected_option: storedAnswers[q.id],
        }))
        .filter((a) => !!a.selected_option);

      const res = await Onboarding.submitDiagnostic({ answers });
      localStorage.setItem('beacon_diagnostic_result', JSON.stringify(res?.data || res));

      try {
        await Onboarding.complete();
      } catch (_) {
        // Don't block the flow if the completion call fails
      }
      localStorage.removeItem('beacon_diagnostic_answers');
      navigate('/onboarding/analyzing');
    } catch (e) {
      window.alert(e?.error || 'Could not submit diagnostic test.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingLayout step={6} totalSteps={6} onBack={() => navigate(-1)}>
      <div className="flex flex-col h-full pt-4">
        
        {/* Header Info */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0284C7] dark:text-[#38BDF8] bg-[#E0F2FE] dark:bg-[#111D2E] px-3 py-1 rounded-full">
              {currentQuestion?.subject}
            </span>
            <span className="text-xs font-medium text-[#0369A1] dark:text-[#7DD3FC]">
              Question {questionNumber} of {totalQuestions}
            </span>
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-['Plus_Jakarta_Sans'] font-semibold ${
            timeLeft < 10 ? 'text-red-500' : 'text-[#0369A1] dark:text-[#7DD3FC]'
          }`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            00:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Question */}
        {imageUrl && (
          <div className="w-full mb-6 rounded-2xl overflow-hidden border-2 border-sky-100 dark:border-sky-900/40 shadow-sm relative bg-white flex justify-center p-2">
            <img src={imageUrl} alt="Question figure" className="w-full h-auto object-contain max-h-56" />
          </div>
        )}

        <div className="font-[var(--font-jakarta)] text-lg font-medium leading-relaxed text-[#0C4A6E] dark:text-[#F0F9FF] mb-8">
          <QuestionTextFormatter text={currentQuestion?.question_text} />
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto pb-24">
          {currentOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedOption(index);
                if (currentQuestion?.id) {
                  persistAnswer(currentQuestion.id, letters[index]);
                }
              }}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                selectedOption === index
                  ? 'border-[#0284C7] dark:border-[#38BDF8] bg-[#E0F2FE] dark:bg-[#111D2E] shadow-sm'
                  : 'border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] bg-[#FFFFFF] dark:bg-[#0D1525] hover:border-[#7DD3FC] dark:hover:border-[rgba(14,165,233,0.30)] hover:bg-[#F0F9FF] dark:hover:bg-[#111D2E]/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors ${
                selectedOption === index 
                  ? 'border-[#0284C7] dark:border-[#38BDF8] bg-[#0284C7] dark:bg-[#38BDF8] text-white' 
                  : 'border-[#BAE6FD] dark:border-[rgba(14,165,233,0.30)] text-[#0369A1] dark:text-[#7DD3FC]'
              }`}>
                {String.fromCharCode(65 + index)}
              </div>
              <span className={`font-semibold text-base ${selectedOption === index ? 'text-[#0C4A6E] dark:text-[#F0F9FF]' : 'text-[#0C4A6E] dark:text-[#F0F9FF]'}`}>
                {option}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-[#F0F9FF] dark:from-[#080C14] via-[#F0F9FF] dark:via-[#080C14] to-transparent z-10">
          <button 
            onClick={handleNext}
            disabled={selectedOption === null || isSubmitting || totalQuestions === 0}
            className="w-full max-w-lg mx-auto py-3.5 rounded-xl font-[var(--font-syne)] font-bold text-base text-white bg-[#0369A1] dark:bg-[#0EA5E9] hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] shadow-[0_8px_24px_rgba(3,105,161,0.30)] dark:shadow-[0_8px_24px_rgba(14,165,233,0.30)] hover:shadow-[0_12px_32px_rgba(3,105,161,0.40)] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Submitting...' : (questionNumber < totalQuestions ? "Next Question →" : "Finish Test →")}
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
