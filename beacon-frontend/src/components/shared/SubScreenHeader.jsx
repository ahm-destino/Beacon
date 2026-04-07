import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PointsBadge from './PointsBadge';

export default function SubScreenHeader({ title, rightAction, backPath, showPoints = true }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
      return;
    }
    navigate(-1);
  };

  return (
    <div className="sticky top-0 z-40 h-14 bg-white/85 dark:bg-[rgba(14,165,233,0.08)]">
      <div className="flex items-center justify-between px-5 h-full max-w-md mx-auto">
        <button 
          onClick={handleBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-all duration-200 active:scale-95 focus:ring-2 focus:ring-sky-500/50"
        >
          <ChevronLeft size={20} />
        </button>
        
        <h1 className="flex-1 text-center font-['Syne'] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] truncate px-4">
          {title}
        </h1>

        <div className="flex items-center justify-end gap-2 min-w-[2.25rem] h-9">
          {showPoints ? <PointsBadge compact /> : null}
          {rightAction}
        </div>
      </div>
    </div>
  );
}
