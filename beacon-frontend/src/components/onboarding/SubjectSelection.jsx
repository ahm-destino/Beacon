import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { Onboarding } from '../../services/api';
import { useOnboarding } from '../../store/OnboardingContext';

export default function SubjectSelection() {
  const navigate = useNavigate();
  const { onboardingData, updateStep } = useOnboarding();
  const examType = (localStorage.getItem('beacon_exam') || 'JAMB').toUpperCase();
  const ENGLISH_VALUE = 'English';

  const SUBJECT_GROUPS = [
    {
      label: 'LANGUAGES',
      chips: [
        { value: ENGLISH_VALUE, label: 'Use of English', lockedForJamb: true },
        { value: 'Yoruba', label: 'Yoruba' },
        { value: 'Igbo', label: 'Igbo' },
        { value: 'Hausa', label: 'Hausa' },
        { value: 'French', label: 'French' },
      ],
    },
    {
      label: 'SCIENCES',
      chips: [
        { value: 'Mathematics', label: 'Mathematics' },
        { value: 'Physics', label: 'Physics' },
        { value: 'Chemistry', label: 'Chemistry' },
        { value: 'Biology', label: 'Biology' },
        { value: 'Agricultural Science', label: 'Agricultural Science' },
        { value: 'Further Mathematics', label: 'Further Mathematics' },
        { value: 'Computer Studies', label: 'Computer Studies' },
      ],
    },
    {
      label: 'COMMERCIAL',
      chips: [
        { value: 'Economics', label: 'Economics' },
        { value: 'Commerce', label: 'Commerce' },
        { value: 'Accounting', label: 'Accounting' },
        { value: 'Business Studies', label: 'Business Studies' },
      ],
    },
    {
      label: 'ARTS & SOCIAL SCIENCES',
      chips: [
        { value: 'Literature in English', label: 'Literature in English' },
        { value: 'Government', label: 'Government' },
        { value: 'History', label: 'History' },
        { value: 'Geography', label: 'Geography' },
        { value: 'Christian Religious Studies (CRS)', label: 'Christian Religious Studies (CRS)' },
        { value: 'Islamic Religious Studies (IRS)', label: 'Islamic Religious Studies (IRS)' },
        { value: 'Civic Education', label: 'Civic Education' },
      ],
    },
  ];

  const ensureEnglishForJamb = (subjects) => {
    if (examType !== 'JAMB') return subjects;
    const withoutEnglish = subjects.filter((s) => s !== ENGLISH_VALUE);
    return [ENGLISH_VALUE, ...withoutEnglish];
  };

  const getInitialSelected = () => {
    // Load from persistent context first
    const savedSubjects = onboardingData.step3.subjects || [];
    if (savedSubjects.length > 0) {
      return ensureEnglishForJamb(savedSubjects);
    }
    // Default for JAMB
    if (examType === 'JAMB') return [ENGLISH_VALUE];
    return [];
  };

  const [selectedSubjects, setSelectedSubjects] = useState(getInitialSelected);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (examType !== 'JAMB') return;
    setSelectedSubjects((prev) => {
      if (prev.includes(ENGLISH_VALUE)) return prev;
      const next = [ENGLISH_VALUE, ...prev];
      updateStep('step3', { subjects: next });
      return next;
    });
  }, [examType, updateStep]);

  const selectedOthersCount =
    examType === 'JAMB'
      ? selectedSubjects.filter((s) => s !== ENGLISH_VALUE).length
      : selectedSubjects.length;

  const maxTotal = examType === 'WAEC' || examType === 'NECO' ? 9 : examType === 'JUPEB' ? 3 : 4;
  const maxOthers = 3; // JAMB: English + 3 others

  const canSelectChip = (value) => {
    const isSelected = selectedSubjects.includes(value);

    // JAMB: English is locked & always selected
    if (examType === 'JAMB' && value === ENGLISH_VALUE) return isSelected;

    // If already selected, allow deselect for non-locked chips
    if (isSelected) return true;

    if (examType === 'JAMB') {
      return selectedOthersCount < maxOthers; // prevent selecting more than 3 others
    }

    // WAEC/NECO: max 9 total
    if (examType === 'WAEC' || examType === 'NECO') {
      return selectedSubjects.length < maxTotal;
    }

    // JUPEB: exactly 3 total (cap at 3 while selecting)
    if (examType === 'JUPEB') {
      return selectedSubjects.length < maxTotal;
    }

    // Fallback: behave like WAEC/NECO
    return selectedSubjects.length < maxTotal;
  };

  const toggleSubject = (value) => {
    // JAMB English locked
    if (examType === 'JAMB' && value === ENGLISH_VALUE) return;

    setSelectedSubjects((prev) => {
      const isSelected = prev.includes(value);
      let newSelection;
      if (isSelected) {
        newSelection = prev.filter((s) => s !== value);
      } else if (!canSelectChip(value)) {
        return prev;
      } else {
        newSelection = [...prev, value];
      }
      // Save to persistent context immediately
      updateStep('step3', { subjects: newSelection });
      return newSelection;
    });
  };

  const proceedEnabled =
    examType === 'JAMB'
      ? selectedOthersCount === 3
      : examType === 'JUPEB'
        ? selectedSubjects.length === 3
        : examType === 'WAEC' || examType === 'NECO'
          ? selectedSubjects.length > 0
          : selectedSubjects.length > 0;

  const handleNext = async () => {
    if (!proceedEnabled || isLoading) return;

    setIsLoading(true);
    try {
      // Save to backend and context
      await Onboarding.subjectSelection({
        subjects: selectedSubjects,
        target_course: null,
        target_university: null,
      });
      // Ensure context is up to date
      updateStep('step3', { subjects: selectedSubjects });
      localStorage.setItem('beacon_subjects', JSON.stringify(selectedSubjects));
      // Navigate to school step with state to bypass guard check  
      navigate('/onboarding/school', { state: { fromSubjects: true } });
    } catch (e) {
      window.alert(e?.error || 'Could not save subject selection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      // Save empty subjects and proceed
      await Onboarding.subjectSelection({
        subjects: [],
        target_course: null,
        target_university: null,
      });
      updateStep('step3', { subjects: [] });
      localStorage.setItem('beacon_subjects', JSON.stringify([]));
      navigate('/onboarding/school', { state: { fromSubjects: true } });
    } catch (e) {
      console.error('Skip failed:', e);
      navigate('/onboarding/school', { state: { fromSubjects: true } });
    } finally {
      setIsLoading(false);
    }
  };

  const counterText =
    examType === 'JAMB'
      ? `${selectedOthersCount}/3 subjects selected`
      : examType === 'JUPEB'
        ? `${selectedSubjects.length}/3 subjects selected`
        : `${selectedSubjects.length}/9 subjects selected`;

  const headerTitle =
    examType === 'JAMB'
      ? 'Select your 4 JAMB subjects'
      : examType === 'JUPEB'
        ? 'Select exactly 3 JUPEB subjects'
        : 'Select your subjects';

  return (
    <OnboardingLayout step={2} onBack={() => navigate(-1)}>
      <div className="flex flex-col h-full">
        <h1 className="font-[var(--font-syne)] font-black text-3xl text-[#0C4A6E] dark:text-[#F0F9FF] tracking-tight mb-3">
          {headerTitle}
        </h1>
        <p className="text-base font-[var(--font-jakarta)] font-medium text-[#0369A1] dark:text-[#7DD3FC] mb-6">
          {examType === 'JAMB' ? (
            <span>
              Use of English is <span className="font-bold">compulsory</span> and locked.
            </span>
          ) : null}
          <span className="font-bold text-[#0C4A6E] dark:text-[#F0F9FF]"> {counterText}</span>
        </p>

        <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto pb-24 pr-1">
          {SUBJECT_GROUPS.flatMap((group) => group.chips).map((subject) => {
            const isSelected = selectedSubjects.includes(subject.value);
            const isLocked =
              examType === 'JAMB' &&
              subject.value === ENGLISH_VALUE &&
              subject.lockedForJamb;

            const isDisabled = !isSelected && !canSelectChip(subject.value);

            return (
              <button
                key={subject.value}
                onClick={() => toggleSubject(subject.value)}
                disabled={isLocked || isDisabled}
                className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col gap-3 ${
                  isSelected
                    ? 'border-[#0284C7] dark:border-[#38BDF8] bg-[#E0F2FE] dark:bg-[#111D2E] shadow-sm transform scale-[1.02]'
                    : isLocked || isDisabled
                      ? 'border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] bg-[#F0F9FF] dark:bg-[#080C14] opacity-50 cursor-not-allowed'
                      : 'border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] bg-[#FFFFFF] dark:bg-[#0D1525] hover:border-[#7DD3FC] dark:hover:border-[rgba(14,165,233,0.30)] hover:bg-[#F0F9FF] dark:hover:bg-[#111D2E]/50 focus:outline-none focus:ring-2 focus:ring-sky-500/30 active:scale-[0.98]'
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shadow-sm ${
                    isSelected 
                      ? 'border-[#0284C7] dark:border-[#38BDF8] bg-[#0284C7] dark:bg-[#38BDF8]' 
                      : 'border-[#BAE6FD] dark:border-[rgba(14,165,233,0.30)] bg-white dark:bg-[#0D1525]'
                  }`}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  {isLocked ? (
                    <span className="text-[9px] uppercase tracking-wider font-bold text-[#0284C7] dark:text-[#38BDF8] bg-[#BAE6FD]/40 dark:bg-[#0284C7]/20 px-2 py-1 rounded-md">
                      Locked
                    </span>
                  ) : null}
                </div>
                <span className={`font-semibold text-sm mt-1 leading-snug ${isSelected ? 'text-[#0C4A6E] dark:text-[#F0F9FF]' : 'text-[#0369A1] dark:text-[#7DD3FC]'}`}>
                  {subject.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-[#F0F9FF] dark:from-[#080C14] via-[#F0F9FF] dark:via-[#080C14] to-transparent z-10 flex flex-col gap-3">
          <button 
            onClick={handleNext}
            disabled={!proceedEnabled || isLoading}
            className="w-full max-w-lg mx-auto py-4 rounded-xl font-[var(--font-syne)] font-bold text-base text-white bg-[#0369A1] dark:bg-[#0EA5E9] hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] shadow-[0_8px_24px_rgba(3,105,161,0.30)] dark:shadow-[[0_8px_24px_rgba(14,165,233,0.30)] hover:shadow-[0_12px_32px_rgba(3,105,161,0.40)] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {examType === 'JAMB' ? (
              selectedOthersCount === 3 ? (
                <>
                  Continue{' '}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              ) : (
                `Select ${3 - selectedOthersCount} more`
              )
            ) : examType === 'JUPEB' ? (
              selectedSubjects.length === 3 ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              ) : (
                `Select ${3 - selectedSubjects.length} more`
              )
            ) : (
              selectedSubjects.length > 0 ? (
                <>
                  Continue{' '}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              ) : (
                'Select subjects'
              )
            )}
          </button>
          
          <button 
            onClick={handleSkip}
            disabled={isLoading}
            className="w-full max-w-lg mx-auto py-3 rounded-xl font-[var(--font-jakarta)] font-medium text-sm text-[#0369A1] dark:text-[#7DD3FC] hover:text-[#0284C7] dark:hover:text-[#38BDF8] transition-all duration-200 disabled:opacity-50"
          >
            Skip for now →
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
