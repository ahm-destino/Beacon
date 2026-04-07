import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex w-full bg-[#F0F9FF] dark:bg-[#080C14]">
      <div className="hidden md:flex flex-col justify-center w-[40%] min-h-screen sticky top-0 bg-gradient-to-br from-[#0C4A6E] via-[#0369A1] to-[#0284C7] dark:from-[#080C14] dark:via-[#0C1829] dark:to-[#0369A1] bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.05),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.15),transparent_50%)] px-10">
        
        {/* TOP SECTION */}
        <div className="mb-12">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="4" fill="#0369A1"/>
                <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="#0369A1" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-[var(--font-syne)] font-bold text-2xl text-white">BEACON</span>
          </Link>
        </div>

        {/* MIDDLE SECTION */}
        <div>
          <h1 className="font-[var(--font-syne)] font-bold text-3xl text-white leading-tight mb-4">
            The smartest way to prepare for your exam
          </h1>
          <p className="text-base text-sky-200 leading-relaxed mb-10">
            Join 4,800+ Nigerian students who are studying smarter, scoring higher, and passing with confidence.
          </p>

          <div className="flex flex-col gap-4 mb-12">
            {[
              "10,000+ real past exam questions",
              "AI tutor available 24/7",
              "Personalized study plan built for you"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-white text-xs shrink-0">
                  ✓
                </div>
                <span className="text-sm text-sky-100">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
          <div className="text-amber-300 text-sm mb-3">⭐⭐⭐⭐⭐</div>
          <p className="text-sm text-white/90 leading-relaxed italic mb-4">
            "Beacon took me from 240 to 318 in 4 months. The AI tutor explained things my school teacher never could. Worth every naira."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              CO
            </div>
            <div>
              <div className="font-[var(--font-syne)] font-bold text-sm text-white">Chukwuemeka O.</div>
              <div className="text-xs text-sky-300">JAMB 2024 · Score: 318</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel (Right column) */}
      <div className="w-full md:w-[60%] bg-white dark:bg-[#080C14] px-8 md:px-16 py-12 flex flex-col justify-center min-h-screen relative">
        
        {/* Theme Toggle */}
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        {/* Mobile header */}
        <div className="md:hidden flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="4" fill="white"/>
                <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-[var(--font-syne)] font-bold text-xl text-sky-900 dark:text-sky-50">BEACON</span>
          </Link>
        </div>
        
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
