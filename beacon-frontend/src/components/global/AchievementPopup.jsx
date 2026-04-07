import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AchievementPopup() {
  const navigate = useNavigate();
  const confetti = [
    { left: 'left-[5%]', top: 'top-2', color: 'bg-sky-400' },
    { left: 'left-[15%]', top: 'top-6', color: 'bg-amber-400' },
    { left: 'left-[25%]', top: 'top-10', color: 'bg-green-400' },
    { left: 'left-[35%]', top: 'top-4', color: 'bg-orange-400' },
    { left: 'left-[45%]', top: 'top-8', color: 'bg-sky-300' },
    { left: 'left-[55%]', top: 'top-3', color: 'bg-amber-300' },
    { left: 'left-[65%]', top: 'top-7', color: 'bg-green-300' },
    { left: 'left-[75%]', top: 'top-5', color: 'bg-orange-300' },
    { left: 'left-[85%]', top: 'top-9', color: 'bg-sky-500' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
      onClick={() => navigate(-1)}
    >
      <div
        className="mx-5 w-full max-w-md bg-white dark:bg-[#0D1525] rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.4)] transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-amber-400 to-amber-500 dark:from-amber-600 dark:to-amber-700 py-8 text-center overflow-hidden">
          {confetti.map((c, idx) => (
            <span
              key={idx}
              className={`absolute ${c.left} ${c.top} ${c.color} w-2 h-2 rounded-full animate-bounce`}
            />
          ))}
          <div className="text-6xl animate-bounce mb-2">🏆</div>
        </div>

        <div className="py-6 px-6 text-center">
          <div className="font-['Syne'] font-black text-xs text-amber-500 uppercase tracking-widest mb-2">
            Badge Unlocked! 🎉
          </div>
          <div className="font-['Syne'] font-black text-2xl text-[#0C4A6E] dark:text-[#F0F9FF]">On Fire</div>
          <div className="font-['Plus_Jakarta_Sans'] text-sm text-[#0369A1] dark:text-[#7DD3FC] mt-2 leading-relaxed">
            7-day streak achieved. You're officially on fire! Keep it going.
          </div>

          <div className="mt-4 flex gap-3 justify-center">
            {[
              { value: '100', label: 'Points added' },
              { value: '1', label: 'Badge earned' },
            ].map((r) => (
              <div key={r.label} className="bg-sky-50 dark:bg-sky-900/20 rounded-xl px-4 py-2.5 text-center">
                <div className="font-['Plus_Jakarta_Sans'] font-black text-sky-600 text-lg">{r.value}</div>
                <div className="font-['Plus_Jakarta_Sans'] text-xs text-[#0369A1] dark:text-[#7DD3FC] mt-0.5">{r.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <button
              onClick={() => navigate('/profile/badges')}
              className="w-full py-3 rounded-xl font-['Syne'] font-bold text-sm text-white bg-[#0369A1] dark:bg-[#0EA5E9] hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] active:scale-[0.98] transition-all duration-200 focus:ring-2 focus:ring-sky-400/40"
            >
              View My Badges
            </button>
            <button className="w-full py-3 rounded-xl font-['Syne'] font-bold text-sm text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 active:scale-[0.98] transition-all duration-200 focus:ring-2 focus:ring-sky-400/40">
              Share Achievement 📤
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full py-3 rounded-xl font-['Plus_Jakarta_Sans'] text-sm text-sky-600 dark:text-sky-400 hover:underline active:scale-95 focus:ring-2 focus:ring-sky-400/40 transition-all duration-200"
            >
              Keep Studying →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

