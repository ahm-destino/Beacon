import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, TrendingUp, Target, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { Onboarding } from '../../services/api';

export default function ResultsReveal() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const userName = localStorage.getItem('beacon_username') || localStorage.getItem('beacon_user_name') || 'Student';
  const exam = localStorage.getItem('beacon_exam') || 'jamb';
  const diagnosticResult = (() => {
    try {
      return JSON.parse(localStorage.getItem('beacon_diagnostic_result') || '{}') || {};
    } catch (_) {
      return {};
    }
  })();
  const totalQuestions = Number(diagnosticResult?.total ?? diagnosticResult?.total_questions ?? diagnosticResult?.totalQuestions ?? 0);
  const correctCount = Number(diagnosticResult?.correct ?? diagnosticResult?.correct_count ?? diagnosticResult?.correctCount ?? 0);
  const wrongCount = Math.max(0, totalQuestions - correctCount);
  const scoreValue = Number.isFinite(diagnosticResult?.score)
    ? diagnosticResult.score
    : (totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0);
  const scorePct = Math.max(0, Math.min(100, scoreValue));

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleFinish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    
    try {
      // Mark onboarding as complete in backend
      await Onboarding.complete();
      navigate('/dashboard');
    } catch (e) {
      console.error('Failed to complete onboarding:', e);
      // Still navigate even if API fails
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F0F9FF] dark:bg-[#080C14] pb-24 transition-colors duration-300 relative overflow-hidden">
      
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Header/Hero Area */}
      <div className="relative pt-16 pb-12 px-5 bg-gradient-to-b from-sky-100 to-[#F0F9FF] dark:from-sky-900/20 dark:to-[#080C14] border-b border-sky-100 dark:border-sky-900/10">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 dark:opacity-10 mix-blend-overlay"></div>
        
        <div className={`max-w-lg mx-auto flex flex-col items-center text-center transition-all duration-700 transform ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.4)] mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="font-[var(--font-syne)] font-black text-3xl md:text-4xl text-[#0C4A6E] dark:text-[#F0F9FF] tracking-tight mb-3">
            Your Plan is Ready, {userName}!
          </h1>
          
          <p className="text-base font-[var(--font-jakarta)] font-medium text-[#0369A1] dark:text-[#7DD3FC] max-w-sm">
            Based on your diagnostic, we've built a personalized roadmap to help you crush your {exam.toUpperCase()} exam.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-5 flex flex-col gap-6 relative z-10 pt-4">
        
        {/* Score Card */}
        <div className={`bg-[#FFFFFF] dark:bg-[#0D1525] rounded-3xl p-6 border border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] shadow-sm transition-all duration-700 delay-100 transform ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">Current Baseline</h3>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0284C7] dark:text-[#38BDF8] bg-[#E0F2FE] dark:bg-[#111D2E] px-3 py-1 rounded-full">
              Estimated Score
            </span>
          </div>
          
          <div className="flex items-end gap-3 mb-2">
            <span className="font-[var(--font-syne)] font-black text-5xl text-[#0C4A6E] dark:text-[#F0F9FF] leading-none">
              {scoreValue}
            </span>
            <span className="text-lg text-[#0369A1] dark:text-[#7DD3FC] font-semibold mb-1">/ 100</span>
          </div>
          
          <div className="w-full h-2 bg-[#E0F2FE] dark:bg-[#111D2E] rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]"
              style={{ width: `${scorePct}%` }}
            ></div>
          </div>
          <p className="text-sm font-[var(--font-jakarta)] font-medium text-[#0369A1] dark:text-[#7DD3FC] mt-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            You're halfway there. Let's push for 300+.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Correct</p>
              <p className="font-[var(--font-syne)] font-black text-2xl text-emerald-700 dark:text-emerald-300">{correctCount}</p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-300/80">{totalQuestions || '--'} total</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Wrong</p>
              <p className="font-[var(--font-syne)] font-black text-2xl text-red-700 dark:text-red-300">{wrongCount}</p>
              <p className="text-xs text-red-600/80 dark:text-red-300/80">Need review</p>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className={`grid grid-cols-2 gap-4 transition-all duration-700 delay-200 transform ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="bg-[#FFFFFF] dark:bg-[#0D1525] rounded-2xl p-5 border border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] shadow-sm">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mb-1">Strongest</h4>
            <p className="text-xs font-[var(--font-jakarta)] font-medium text-[#0369A1] dark:text-[#7DD3FC]">Use of English</p>
          </div>
          
          <div className="bg-[#FFFFFF] dark:bg-[#0D1525] rounded-2xl p-5 border border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] shadow-sm">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h4 className="font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mb-1">Focus Area</h4>
            <p className="text-xs font-[var(--font-jakarta)] font-medium text-[#0369A1] dark:text-[#7DD3FC]">Physics (Mechanics)</p>
          </div>
        </div>

        {/* Action Plan */}
        <div className={`bg-[#FFFFFF] dark:bg-[#0D1525] rounded-3xl p-6 border border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] shadow-sm transition-all duration-700 delay-300 transform ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h3 className="font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF] mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
            Your Weekly Plan
          </h3>
          
          <ul className="flex flex-col gap-5">
            <li className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-[#E0F2FE] dark:bg-[#111D2E] border border-sky-100 dark:border-sky-900/30 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-[#0284C7] dark:text-[#38BDF8]">1</div>
              <div>
                <p className="text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF] mb-0.5">2 hrs daily study</p>
                <p className="text-xs font-[var(--font-jakarta)] font-medium text-[#0369A1] dark:text-[#7DD3FC]">Based on your 'Night Owl' preference</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-[#E0F2FE] dark:bg-[#111D2E] border border-sky-100 dark:border-sky-900/30 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-[#0284C7] dark:text-[#38BDF8]">2</div>
              <div>
                <p className="text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF] mb-0.5">Focus on Physics & Math</p>
                <p className="text-xs font-[var(--font-jakarta)] font-medium text-[#0369A1] dark:text-[#7DD3FC]">60% of your time will go to weak areas</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-[#E0F2FE] dark:bg-[#111D2E] border border-sky-100 dark:border-sky-900/30 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-[#0284C7] dark:text-[#38BDF8]">3</div>
              <div>
                <p className="text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF] mb-0.5">1 Mock Exam per week</p>
                <p className="text-xs font-[var(--font-jakarta)] font-medium text-[#0369A1] dark:text-[#7DD3FC]">Every Saturday to track progress</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className={`fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-[#F0F9FF] dark:from-[#080C14] via-[#F0F9FF] dark:via-[#080C14] to-transparent z-20 transition-all duration-700 delay-500 transform ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
        <button 
          onClick={handleFinish}
          disabled={isFinishing}
          className="w-full max-w-lg mx-auto py-4 rounded-xl font-[var(--font-syne)] font-bold text-base text-white bg-[#0369A1] dark:bg-[#0EA5E9] hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] shadow-[0_8px_24px_rgba(3,105,161,0.30)] dark:shadow-[0_8px_24px_rgba(14,165,233,0.30)] hover:shadow-[0_12px_32px_rgba(3,105,161,0.40)] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isFinishing ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Setting up...
            </>
          ) : (
            <>Go to Dashboard <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </div>

    </div>
  );
}
