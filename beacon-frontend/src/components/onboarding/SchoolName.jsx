import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { Onboarding } from '../../services/api';
import { useOnboarding } from '../../store/OnboardingContext';

export default function SchoolName() {
  const navigate = useNavigate();
  const { onboardingData, updateStep } = useOnboarding();
  
  const [schoolName, setSchoolName] = useState(onboardingData.step1?.school_name || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      // Save school name to backend (optional, can be empty)
      if (schoolName.trim()) {
        await Onboarding.personalSetup?.({ school_name: schoolName.trim() }) || 
        await Onboarding.welcome({ username: localStorage.getItem('beacon_username') || localStorage.getItem('beacon_user_name') || '' });
      }
      updateStep('step1', { school_name: schoolName.trim() });
      localStorage.setItem('beacon_school_name', schoolName.trim());
      navigate('/onboarding/habits', { state: { fromSchool: true } });
    } catch (err) {
      console.error('Failed to save school:', err);
      navigate('/onboarding/habits', { state: { fromSchool: true } });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/onboarding/habits', { state: { fromSchool: true } });
  };

  return (
    <OnboardingLayout step={3} onBack={() => navigate(-1)}>
      <div className="flex flex-col h-full">
        <h1 className="font-[var(--font-syne)] font-black text-3xl text-[#0C4A6E] dark:text-[#F0F9FF] tracking-tight mb-3">
          What school do you attend?
        </h1>
        <p className="text-base text-[#0369A1] dark:text-[#7DD3FC] mb-8">
          This helps us tailor content to your curriculum. (Optional)
        </p>

        <div className="flex flex-col gap-4 flex-1 overflow-y-auto pb-24">
          <input 
            type="text" 
            placeholder="e.g. Government Secondary School"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="w-full px-4 py-4 rounded-xl text-lg font-semibold text-center bg-[#FFFFFF] dark:bg-[#0D1525] border border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] text-[#0C4A6E] dark:text-[#F0F9FF] placeholder:text-[#7DD3FC] dark:placeholder:text-[rgba(125,211,252,0.4)] outline-none transition-all duration-200 focus:border-[#7DD3FC] dark:focus:border-[rgba(14,165,233,0.30)] focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] focus:bg-[#E0F2FE] dark:focus:bg-[#111D2E]"
          />
        </div>

        <div className="fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-[#F0F9FF] dark:from-[#080C14] via-[#F0F9FF] dark:via-[#080C14] to-transparent z-10 flex flex-col gap-3">
          <button 
            onClick={handleNext}
            disabled={isLoading}
            className="w-full max-w-lg mx-auto py-3.5 rounded-xl font-[var(--font-syne)] font-bold text-base text-white bg-[#0369A1] dark:bg-[#0EA5E9] hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] shadow-[0_8px_24px_rgba(3,105,161,0.30)] dark:shadow-[0_8px_24px_rgba(14,165,233,0.30)] hover:shadow-[0_12px_32px_rgba(3,105,161,0.40)] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? 'Saving...' : schoolName.trim() ? 'Continue →' : 'Continue →'}
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
