import React from 'react';
import ThemeToggle from '../ThemeToggle'; // Adjust path if ThemeToggle is elsewhere

export default function OnboardingLayout({ 
  children, 
  step, 
  totalSteps = 6, 
  onBack 
}) {
  return (
    <div className="min-h-screen w-full bg-[#F0F9FF] dark:bg-[#080C14] text-[#0C4A6E] dark:text-[#F0F9FF] font-[var(--font-jakarta)] relative overflow-x-hidden transition-colors duration-300">
      
      {/* Top Navigation Bar */}
      <div className="fixed top-0 w-full px-5 py-6 flex items-center justify-between z-50">
        {/* Left: Back Button or Logo */}
        <div className="flex items-center gap-2">
          {onBack ? (
            <button 
              onClick={onBack}
              className="text-[#0284C7] hover:text-[#0369A1] dark:text-[#38BDF8] dark:hover:text-[#7DD3FC] transition-colors p-2 -ml-2 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900/40"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center shadow-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="4" fill="white"/>
                <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          )}
        </div>

        {/* Right: Progress Indicator & Theme Toggle */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {step > 0 && (
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-xs font-semibold text-[#0284C7] dark:text-[#38BDF8]">
                Step {step} of {totalSteps}
              </span>
              <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => {
                  const current = i + 1;
                  return (
                    <div 
                      key={i} 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        current === step ? 'w-6 bg-[#0284C7] dark:bg-[#38BDF8]' : 
                        current < step ? 'w-2 bg-[#7DD3FC] dark:bg-[#0284C7]' :
                        'w-2 bg-[#E0F2FE] dark:bg-[#111D2E]'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="w-full h-full min-h-screen flex flex-col justify-center max-w-lg mx-auto px-5 pt-20 pb-24 relative">
        <div className="animate-in slide-in-from-right-8 duration-300 ease-in-out fade-in w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
