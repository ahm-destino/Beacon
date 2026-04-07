import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from '../../services/api';

export default function PointsBadge({ className = '', compact = false }) {
  const [points, setPoints] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    let inFlight = false;

    const fetchPoints = () => {
      if (inFlight) return;
      inFlight = true;
      Users.getMe()
        .then((res) => {
          if (!alive) return;
          const balance = res?.data?.points_balance ?? 0;
          setPoints(balance);
        })
        .catch(() => {
          if (!alive) return;
          setPoints(0);
        })
        .finally(() => {
          inFlight = false;
        });
    };

    fetchPoints();
    const handleRefresh = () => fetchPoints();
    window.addEventListener('beacon-points-refresh', handleRefresh);
    window.addEventListener('beacon-points-earned', handleRefresh);
    return () => {
      alive = false;
      window.removeEventListener('beacon-points-refresh', handleRefresh);
      window.removeEventListener('beacon-points-earned', handleRefresh);
    };
  }, []);

  const label = points == null ? '—' : Number(points).toLocaleString();

  return (
    <button
      type="button"
      onClick={() => navigate('/profile')}
      title="Points balance"
      aria-label={`Points balance ${label}`}
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 shadow-sm transition-all duration-200 hover:bg-amber-100 active:scale-95 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300 ${compact ? 'py-0.5' : ''} ${className}`}
    >
      <span className="text-[12px]">⭐</span>
      <span className="leading-none">{label}</span>
      {!compact && <span className="text-[10px] font-semibold opacity-70">pts</span>}
    </button>
  );
}
