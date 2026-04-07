import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MessageCircle, UserPlus, MapPin, TrendingUp, Zap } from 'lucide-react';
import { Community } from '../../services/api';

const initials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export default function BuddyProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateBuddy = location.state?.buddy;
  const [buddy, setBuddy] = useState(stateBuddy || null);
  const [loading, setLoading] = useState(!stateBuddy);

  useEffect(() => {
    if (stateBuddy) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await Community.getBuddy();
        if (cancelled) return;
        if (res?.data?.has_buddy) {
          setBuddy(res.data.buddy || null);
        } else {
          setBuddy(null);
        }
      } catch (_) {
        if (!cancelled) setBuddy(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stateBuddy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center">
        <p className="text-sm text-sky-600 dark:text-sky-400">Loading buddy profile…</p>
      </div>
    );
  }

  if (!buddy) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
        <div className="relative h-48 bg-gradient-to-br from-sky-600 to-indigo-700">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-5 w-9 h-9 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all z-10"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        <div className="px-5 max-w-md mx-auto -mt-16 relative z-10 pb-24">
          <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 border border-sky-100 dark:border-sky-900/20 shadow-xl text-center">
            <p className="text-sm text-sky-600 dark:text-sky-400">No active buddy yet.</p>
            <button
              onClick={() => navigate('/community/buddies')}
              className="mt-4 w-full bg-sky-700 text-white rounded-2xl py-3 font-[var(--font-syne)] font-bold"
            >
              Find a Buddy
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] text-[#0C4A6E] dark:text-[#F0F9FF]">
      {/* HEADER */}
      <div className="relative h-48 bg-gradient-to-br from-sky-600 to-indigo-700">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-5 w-9 h-9 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all z-10"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]"></div>
      </div>

      <div className="px-5 max-w-md mx-auto -mt-16 relative z-10 pb-24">
        {/* PROFILE CARD */}
        <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 border border-sky-100 dark:border-sky-900/20 shadow-xl mb-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border-4 border-white dark:border-[#0D1525] bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-4 overflow-hidden">
            {buddy.profile_photo_url ? (
              <img src={buddy.profile_photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(buddy.full_name)
            )}
          </div>

          <h1 className="font-[var(--font-syne)] font-black text-2xl text-[#0369A1] dark:text-[#0EA5E9]">{buddy.full_name}</h1>
          <div className="flex items-center gap-1 text-sm text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 font-medium mb-4">
            <MapPin size={14} /> {buddy.school_name || 'School'} {buddy.state ? `, ${buddy.state}` : ''}
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => navigate('/community/buddies/chat')}
              className="flex-1 bg-sky-700 dark:bg-sky-600 text-white rounded-2xl py-3.5 font-[var(--font-syne)] font-bold text-sm shadow-[0_4px_12px_rgba(3,105,161,0.2)] flex items-center justify-center gap-2 hover:bg-sky-600 transition-all active:scale-95"
            >
              <MessageCircle size={18} /> Message
            </button>
            <button
              onClick={() => navigate('/community/buddies')}
              className="flex-1 bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 rounded-2xl py-3.5 font-[var(--font-syne)] font-bold text-sm flex items-center justify-center gap-2 hover:bg-sky-50 transition-all active:scale-95"
            >
              <UserPlus size={18} /> View Buddy
            </button>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-[#0D1525] p-4 rounded-2xl border border-sky-100 dark:border-sky-900/20 shadow-sm">
             <div className="text-amber-500 mb-2"><TrendingUp size={18} /></div>
             <div className="font-['Plus_Jakarta_Sans'] text-xl font-black">{buddy.accuracy || 0}%</div>
             <div className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">Accuracy</div>
          </div>
          <div className="bg-white dark:bg-[#0D1525] p-4 rounded-2xl border border-sky-100 dark:border-sky-900/20 shadow-sm">
             <div className="text-sky-500 mb-2"><Zap size={18} /></div>
             <div className="font-['Plus_Jakarta_Sans'] text-xl font-black">{buddy.streak || 0}</div>
             <div className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">Day Streak</div>
          </div>
        </div>

        {/* SUBJECTS */}
        <div className="mb-6">
          <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-3">Favorite Subjects</h3>
          <div className="flex flex-wrap gap-2">
            {(buddy.subjects || []).length ? (buddy.subjects || []).map(sub => (
              <span key={sub} className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 px-4 py-2 rounded-xl text-xs font-bold border border-sky-200 dark:border-sky-800/30">
                {sub}
              </span>
            )) : (
              <span className="text-xs text-sky-500">No subjects listed yet.</span>
            )}
          </div>
        </div>

        {/* BADGES */}
        <div>
          <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-3">Achievements</h3>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {['🏆', '🔥', '⚡', '🎯'].map((badge, i) => (
              <div key={i} className="shrink-0 flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 shadow-sm flex items-center justify-center text-2xl">
                  {badge}
                </div>
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Badge</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
