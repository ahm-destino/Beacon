import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle'; // Assumed correct path for ThemeToggle

export default function AnalyzingResults() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Analyzing your answers...");

  // Simplified component since it's an auto-redirect screen
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => navigate('/onboarding/results'), 500);
          return 100;
        }
        
        if (prev === 30) setStatusText("Identifying knowledge gaps...");
        if (prev === 60) setStatusText("Building your study schedule...");
        if (prev === 85) setStatusText("Finalizing your personalized plan...");
        
        return prev + 1;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen w-full bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20 dark:opacity-10">
        <div className="w-[500px] h-[500px] border border-[#0284C7] dark:border-[#38BDF8] rounded-full animate-[spin_60s_linear_infinite]" />
        <div className="absolute w-[300px] h-[300px] border border-[#0284C7] dark:border-[#38BDF8] rounded-full animate-[spin_40s_linear_infinite_reverse]" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
        
        {/* Brain Icon */}
        <div className="relative w-24 h-24 mb-10">
          <div className="absolute inset-0 bg-sky-200 dark:bg-sky-900/50 rounded-full animate-ping opacity-50"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.5)]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
            </svg>
          </div>
        </div>

        {/* Progress Text */}
        <h2 className="font-[var(--font-syne)] font-bold text-2xl text-center text-[#0C4A6E] dark:text-[#F0F9FF] mb-3 animate-pulse">
          {statusText}
        </h2>
        
        <p className="text-sm font-[var(--font-jakarta)] font-medium text-center text-[#0369A1] dark:text-[#7DD3FC] mb-10">
          Please wait while our AI creates your custom learning path.
        </p>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-[#E0F2FE] dark:bg-[#0D1525] rounded-full overflow-hidden shadow-inner border border-sky-100 dark:border-sky-900/30">
          <div 
            className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full transition-all duration-100 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite] w-full" style={{
              backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)'
            }} />
          </div>
        </div>
        
        <div className="mt-4 text-lg font-bold text-[#0284C7] dark:text-[#38BDF8] font-['Plus_Jakarta_Sans'] tracking-widest">
          {progress}%
        </div>

      </div>
    </div>
  );
}

