import React from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { Target, Zap, Brain } from 'lucide-react';
import { Onboarding } from '../../services/api';

export default function DiagnosticIntro() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSkipping, setIsSkipping] = React.useState(false);

  const handleStart = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await Onboarding.startDiagnostic();
      const questions = res?.data?.questions || [];
      if (!Array.isArray(questions) || questions.length === 0) {
        window.alert('No questions available. Please try again.');
        return;
      }
      localStorage.setItem(
        'beacon_diagnostic_questions',
        JSON.stringify(questions)
      );
      localStorage.setItem('beacon_diagnostic_total', String(questions.length));
      navigate('/onboarding/diagnostic/1');
    } catch (e) {
      window.alert(e?.error || 'Could not start diagnostic test.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (isSkipping) return;
    setIsSkipping(true);
    try {
      // Mark diagnostic as skipped in backend
      await Onboarding.skipDiagnostic();
      navigate('/onboarding/analyzing');
    } catch (e) {
      console.error('Failed to skip:', e);
      // Still navigate even if API fails
      navigate('/onboarding/analyzing');
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <OnboardingLayout step={5} onBack={() => navigate(-1)}>
      <div className="flex flex-col h-full items-center text-center pt-8">
        
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 bg-sky-200 dark:bg-sky-900/40 rounded-full animate-ping opacity-75"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center shadow-lg">
            <Target className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="font-[var(--font-syne)] font-black text-3xl text-[#0C4A6E] dark:text-[#F0F9FF] tracking-tight mb-4">
          Let's find your baseline
        </h1>
        
        <p className="text-base text-[#0369A1] dark:text-[#7DD3FC] mb-10 max-w-sm">
          Take a quick diagnostic test to help us understand your current level.
        </p>

        <div className="flex flex-col gap-6 w-full max-w-sm text-left mb-12">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#E0F2FE] dark:bg-[#111D2E] flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
            </div>
            <div>
              <h3 className="font-bold text-[#0C4A6E] dark:text-[#F0F9FF] mb-1">Fast & Easy</h3>
              <p className="text-sm text-[#0369A1] dark:text-[#7DD3FC]">Takes less than 3 minutes to complete.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#E0F2FE] dark:bg-[#111D2E] flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
            </div>
            <div>
              <h3 className="font-bold text-[#0C4A6E] dark:text-[#F0F9FF] mb-1">Smart Adaptation</h3>
              <p className="text-sm text-[#0369A1] dark:text-[#7DD3FC]">Questions adapt based on your answers.</p>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-[#F0F9FF] dark:from-[#080C14] via-[#F0F9FF] dark:via-[#080C14] to-transparent z-10">
          <button 
            onClick={handleStart}
            disabled={isLoading}
            className="w-full max-w-lg mx-auto py-3.5 rounded-xl font-[var(--font-syne)] font-bold text-base text-white bg-[#0369A1] dark:bg-[#0EA5E9] hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] shadow-[0_8px_24px_rgba(3,105,161,0.30)] dark:shadow-[0_8px_24px_rgba(14,165,233,0.30)] hover:shadow-[0_12px_32px_rgba(3,105,161,0.40)] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] flex items-center justify-center gap-2"
          >
            {isLoading ? 'Loading...' : 'Start Diagnostic Test →'}
          </button>
          <button 
            onClick={handleSkip}
            disabled={isSkipping}
            className="w-full max-w-lg mx-auto mt-3 py-3 rounded-xl font-[var(--font-jakarta)] font-semibold text-sm text-[#0369A1] dark:text-[#7DD3FC] hover:bg-[#E0F2FE] dark:hover:bg-[#111D2E] transition-colors disabled:opacity-50"
          >
            {isSkipping ? 'Skipping...' : 'Skip for now'}
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
