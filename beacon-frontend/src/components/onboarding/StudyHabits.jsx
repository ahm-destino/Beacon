import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { Onboarding } from '../../services/api';
import { useOnboarding } from '../../store/OnboardingContext';

export default function StudyHabits() {
  const navigate = useNavigate();
  const { onboardingData, updateStep } = useOnboarding();
  
  // Load saved data from context on mount
  const [selectedHabit, setSelectedHabit] = useState(onboardingData.step4.study_habit || null);
  const [isLoading, setIsLoading] = useState(false);

  const habits = [
    { id: 'crammer', emoji: '🦉', title: 'Night Owl', desc: 'I study best late at night when it\'s quiet.' },
    { id: 'earlybird', emoji: '🌅', title: 'Early Bird', desc: 'I wake up early to get my reading done.' },
    { id: 'sprinter', emoji: '🏃', title: 'Sprinter', desc: 'I study in short, intense bursts.' },
    { id: 'marathoner', emoji: '🐢', title: 'Marathoner', desc: 'I can sit and read for hours straight.' },
  ];

  // Save to context immediately when selection changes
  const handleHabitSelect = (habitId) => {
    setSelectedHabit(habitId);
    updateStep('step4', { study_habit: habitId });
    localStorage.setItem('beacon_habit', habitId);
  };

  const handleNext = async () => {
    if (!selectedHabit || isLoading) return;
    
    setIsLoading(true);
    try {
      // Update backend onboarding step
      await Onboarding.saveHabits({ habit: selectedHabit });
      // Ensure context is up to date
      updateStep('step4', { study_habit: selectedHabit });
      // Navigate to diagnostic with state to bypass guard check
      navigate('/onboarding/diagnostic-intro', { state: { fromHabits: true } });
    } catch (err) {
      console.error('Failed to save habits:', err);
      // Still navigate even if API fails
      navigate('/onboarding/diagnostic-intro', { state: { fromHabits: true } });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout step={4} onBack={() => navigate(-1)}>
      <div className="flex flex-col h-full">
        <h1 className="font-[var(--font-syne)] font-black text-3xl text-[#0C4A6E] dark:text-[#F0F9FF] tracking-tight mb-3">
          How do you usually study?
        </h1>
        <p className="text-base text-[#0369A1] dark:text-[#7DD3FC] mb-8">
          This helps us schedule your practice sessions at the best times.
        </p>

        <div className="flex flex-col gap-4 flex-1 overflow-y-auto pb-24">
          {habits.map((habit) => (
            <button
              key={habit.id}
              onClick={() => handleHabitSelect(habit.id)}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                selectedHabit === habit.id
                  ? 'border-[#0284C7] dark:border-[#38BDF8] bg-[#E0F2FE] dark:bg-[#111D2E] shadow-sm'
                  : 'border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] bg-[#FFFFFF] dark:bg-[#0D1525] hover:border-[#7DD3FC] dark:hover:border-[rgba(14,165,233,0.30)] hover:bg-[#F0F9FF] dark:hover:bg-[#111D2E]/50'
              }`}
            >
              <div className="text-4xl">{habit.emoji}</div>
              <div className="flex flex-col flex-1">
                <span className="font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">{habit.title}</span>
                <span className="text-sm text-[#0369A1] dark:text-[#7DD3FC]">{habit.desc}</span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                selectedHabit === habit.id 
                  ? 'border-[#0284C7] dark:border-[#38BDF8] bg-[#0284C7] dark:bg-[#38BDF8]' 
                  : 'border-[#BAE6FD] dark:border-[rgba(14,165,233,0.30)]'
              }`}>
                {selectedHabit === habit.id && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-[#F0F9FF] dark:from-[#080C14] via-[#F0F9FF] dark:via-[#080C14] to-transparent z-10">
          <button 
            onClick={handleNext}
            disabled={!selectedHabit || isLoading}
            className="w-full max-w-lg mx-auto py-3.5 rounded-xl font-[var(--font-syne)] font-bold text-base text-white bg-[#0369A1] dark:bg-[#0EA5E9] hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] shadow-[0_8px_24px_rgba(3,105,161,0.30)] dark:shadow-[0_8px_24px_rgba(14,165,233,0.30)] hover:shadow-[0_12px_32px_rgba(3,105,161,0.40)] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Continue →'}
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
