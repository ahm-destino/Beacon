import React, { createContext, useContext, useState, useCallback } from 'react';

const OnboardingContext = createContext(null);

export const OnboardingProvider = ({ children }) => {
  const [onboardingData, setOnboardingData] = useState(() => {
    // Try to load from localStorage on init
    try {
      const saved = localStorage.getItem('beacon_onboarding_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load onboarding data:', e);
    }
    
    return {
      step1: {
        full_name: '',
        username: '',
        class_level: '',
        state: '',
        school_name: ''
      },
      step2: {
        primary_exam: '',
        exam_date: '',
        target_course: '',
        target_university: ''
      },
      step3: {
        subjects: []
      },
      step4: {
        study_habit: ''
      }
    };
  });

  const updateStep = useCallback((step, data) => {
    setOnboardingData(prev => {
      const updated = {
        ...prev,
        [step]: { ...prev[step], ...data }
      };
      // Persist to localStorage immediately
      try {
        localStorage.setItem('beacon_onboarding_data', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save onboarding data:', e);
      }
      return updated;
    });
  }, []);

  const clearOnboardingData = useCallback(() => {
    setOnboardingData({
      step1: { full_name: '', username: '', class_level: '', state: '', school_name: '' },
      step2: { primary_exam: '', exam_date: '', target_course: '', target_university: '' },
      step3: { subjects: [] },
      step4: { study_habit: '' }
    });
    localStorage.removeItem('beacon_onboarding_data');
  }, []);

  return (
    <OnboardingContext.Provider value={{
      onboardingData,
      updateStep,
      clearOnboardingData
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};
