import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';
import { Onboarding } from '../../services/api';

export default function Welcome() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);
    try {
      // Save name to backend and advance onboarding step
      await Onboarding.welcome({ username: name.trim() });
      
      // Also save to localStorage for UI display
      localStorage.setItem('beacon_username', name.trim());
      localStorage.setItem('beacon_user_name', name.trim()); // backward compatibility
      
      // Navigate to exam selection with state to indicate we just completed welcome
      navigate('/onboarding/exam', { state: { fromWelcome: true } });
    } catch (error) {
      console.error('Failed to save welcome info:', error);
      if (error?.status === 409) {
        window.alert(error?.error || 'Username already taken. Please choose another.');
        return;
      }
      // Still navigate even if API fails (network, etc.)
      localStorage.setItem('beacon_username', name.trim());
      localStorage.setItem('beacon_user_name', name.trim()); // backward compatibility
      navigate('/onboarding/exam');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#F0F9FF] to-[#F0F9FF] dark:from-[#080C14] dark:to-[#080C14] flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Radial Glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at center, rgba(14,165,233,0.12), transparent 60%)'
      }} />

      <div className="w-full max-w-lg mx-auto relative z-10 animate-in slide-in-from-right-8 duration-300 ease-in-out fade-in">
        
        {/* BEACON ICON */}
        <div className="w-20 h-20 rounded-3xl mx-auto mb-6 bg-gradient-to-br from-sky-500 to-sky-700 shadow-[0_16px_40px_rgba(14,165,233,0.35)] flex items-center justify-center animate-pulse-slow">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="white"/>
            <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>

        {/* HEADLINE */}
        <h1 className="font-[var(--font-syne)] font-bold text-3xl text-center leading-tight mb-4 text-[#0C4A6E] dark:text-[#F0F9FF]">
          Welcome to <br/>
          BEACON <span className="drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">🔦</span>
        </h1>

        {/* SUBTEXT */}
        <p className="text-base text-center text-[#0369A1] dark:text-[#7DD3FC] leading-relaxed mb-12 max-w-xs mx-auto">
          Let's set up your personal exam experience. Takes about 2 minutes.
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] text-center">
              What's your username?
            </label>
            <input 
              type="text" 
              placeholder="e.g. chioma_studies"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-4 rounded-xl text-lg font-semibold text-center bg-[#FFFFFF] dark:bg-[#0D1525] border border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] text-[#0C4A6E] dark:text-[#F0F9FF] placeholder:text-[#7DD3FC] dark:placeholder:text-[rgba(125,211,252,0.4)] outline-none transition-all duration-200 focus:border-[#7DD3FC] dark:focus:border-[rgba(14,165,233,0.30)] focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] focus:bg-[#E0F2FE] dark:focus:bg-[#111D2E]"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={!name.trim() || isLoading}
            className="w-full py-3.5 rounded-xl font-[var(--font-syne)] font-bold text-base text-white bg-[#0369A1] dark:bg-[#0EA5E9] hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] shadow-[0_8px_24px_rgba(3,105,161,0.30)] dark:shadow-[0_8px_24px_rgba(14,165,233,0.30)] hover:shadow-[0_12px_32px_rgba(3,105,161,0.40)] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] disabled:opacity-60 disabled:cursor-not-allowed mt-8 sticky bottom-8"
          >
            {isLoading ? 'Loading...' : name.trim() ? `Let's Go, ${name}! →` : "Let's Go →"}
          </button>
        </form>

      </div>
    </div>
  );
}
