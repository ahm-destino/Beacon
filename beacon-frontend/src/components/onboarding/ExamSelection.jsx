import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { Onboarding } from '../../services/api';
import { useOnboarding } from '../../store/OnboardingContext';

export default function ExamSelection() {
  const navigate = useNavigate();
  const { onboardingData, updateStep } = useOnboarding();
  
  // Load saved data from context on mount
  const [selectedExam, setSelectedExam] = useState(onboardingData.step2.primary_exam || null);
  const [isLoading, setIsLoading] = useState(false);

  const exams = [
    { id: 'JAMB', name: 'JAMB UTME', desc: 'University Tertiary Matriculation Exam' },
    { id: 'WAEC', name: 'WAEC SSCE', desc: 'West African Senior School Certificate' },
    { id: 'NECO', name: 'NECO SSCE', desc: 'National Examinations Council' },
    { id: 'JUPEB', name: 'JUPEB', desc: 'Joint Universities Preliminary Examinations Board' },
  ];

  // Save to context immediately when selection changes
  const handleExamSelect = (examId) => {
    setSelectedExam(examId);
    updateStep('step2', { primary_exam: examId });
    localStorage.setItem('beacon_exam', examId);
  };

  const handleNext = async () => {
    if (!selectedExam || isLoading) return;

    setIsLoading(true);
    try {
      // Save to backend
      await Onboarding.examSelection({
        primary_exam: selectedExam,
        exam_date: null,
      });
      navigate('/onboarding/subjects', { state: { fromExam: true } });
    } catch (e) {
      window.alert(e?.error || 'Could not save exam selection. Please sign in again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout step={1} onBack={() => navigate(-1)}>
      <div className="flex flex-col h-full">
        <h1 className="font-[var(--font-syne)] font-black text-3xl text-[#0C4A6E] dark:text-[#F0F9FF] tracking-tight mb-3">
          Which exam are you preparing for?
        </h1>
        <p className="text-base text-[#0369A1] dark:text-[#7DD3FC] mb-8">
          We'll tailor your study plan and questions to this specific syllabus.
        </p>

        <div className="flex flex-col gap-4 flex-1 overflow-y-auto pb-24">
          {exams.map((exam) => (
            <button
              key={exam.id}
              onClick={() => handleExamSelect(exam.id)}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col gap-1 ${
                selectedExam === exam.id
                  ? 'border-[#0284C7] dark:border-[#38BDF8] bg-[#E0F2FE] dark:bg-[#111D2E] shadow-sm'
                  : 'border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] bg-[#FFFFFF] dark:bg-[#0D1525] hover:border-[#7DD3FC] dark:hover:border-[rgba(14,165,233,0.30)] hover:bg-[#F0F9FF] dark:hover:bg-[#111D2E]/50'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">{exam.name}</span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedExam === exam.id 
                    ? 'border-[#0284C7] dark:border-[#38BDF8] bg-[#0284C7] dark:bg-[#38BDF8]' 
                    : 'border-[#BAE6FD] dark:border-[rgba(14,165,233,0.30)]'
                }`}>
                  {selectedExam === exam.id && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-[#0369A1] dark:text-[#7DD3FC]">{exam.desc}</span>
            </button>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-[#F0F9FF] dark:from-[#080C14] via-[#F0F9FF] dark:via-[#080C14] to-transparent z-10">
          <button 
            onClick={handleNext}
            disabled={!selectedExam}
            className="w-full max-w-lg mx-auto py-3.5 rounded-xl font-[var(--font-syne)] font-bold text-base text-white bg-[#0369A1] dark:bg-[#0EA5E9] hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] shadow-[0_8px_24px_rgba(3,105,161,0.30)] dark:shadow-[0_8px_24px_rgba(14,165,233,0.30)] hover:shadow-[0_12px_32px_rgba(3,105,161,0.40)] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Continue →'}
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
