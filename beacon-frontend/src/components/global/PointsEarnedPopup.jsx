import React, { useEffect, useRef, useState } from 'react';

export default function PointsEarnedPopup() {
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState({ amount: 0, reason: '' });
  const hideTimer = useRef(null);

  useEffect(() => {
    const handleEarned = (event) => {
      const amount = Number(event?.detail?.amount || 0);
      if (amount <= 0) return;
      const reason = event?.detail?.reason || 'Points earned';

      setPayload({ amount, reason });
      setVisible(true);

      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
      }, 2600);
    };

    window.addEventListener('beacon-points-earned', handleEarned);
    return () => {
      window.removeEventListener('beacon-points-earned', handleEarned);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-center pb-24 px-5">
      <div className="pointer-events-auto w-full max-w-sm bg-white dark:bg-[#0D1525] rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-4 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 flex items-center justify-center text-xl">
            ⭐
          </div>
          <div className="flex-1">
            <div className="font-['Syne'] font-black text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">
              +{payload.amount} pts
            </div>
            <div className="text-xs font-['Plus_Jakarta_Sans'] text-[#0369A1] dark:text-[#7DD3FC]">
              {payload.reason}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 px-2 py-1 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
