import React, { useEffect, useMemo, useState } from 'react';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Users } from '../../services/api';
import { toast } from 'sonner';

const requirementText = (b) => {
  if (!b) return '';
  const req = b.requirement;
  if (!req) return '';
  if (typeof req === 'string') return req;
  const type = req.type;
  if (type === 'streak') return `${req.days || 0}-day streak`;
  if (type === 'score') return `Score ${req.value || 0}% in a session`;
  if (type === 'avg_time') return `Average under ${req.seconds || 0}s per question`;
  if (type === 'total_questions') return `Answer ${req.count || 0} questions`;
  return '';
};

const progressPercent = (b) => {
  if (!b) return 0;
  const req = b.requirement || {};
  if (req.type === 'avg_time') {
    const target = Number(req.seconds || b.target || 0);
    const progress = Number(b.progress || 0);
    if (!progress) return 0;
    return Math.min(100, Math.round((target / progress) * 100));
  }
  const target = Number(b.target || 0);
  const progress = Number(b.progress || 0);
  if (!target) return 0;
  return Math.min(100, Math.round((progress / target) * 100));
};

const progressLabelText = (b) => {
  const req = b?.requirement || {};
  if (req.type === 'avg_time') {
    return `Avg ${b.progress || 0}s / ${req.seconds || b.target || 0}s`;
  }
  return `${b?.progress || 0}/${b?.target || 0}`;
};

const badgeTooltipText = (b, variant) => {
  const reqText = requirementText(b);
  if (!reqText) return '';
  if (variant === 'earned') return `Unlocked by: ${reqText}`;
  if (variant === 'progress') return `Requirement: ${reqText} • ${progressLabelText(b)}`;
  return `Requirement: ${reqText}`;
};

function BadgeTooltip({ text }) {
  if (!text) return null;
  return (
    <span className="pointer-events-none absolute z-20 left-1/2 -translate-x-1/2 -top-2 -translate-y-full opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-150">
      <span className="relative block max-w-[200px] rounded-xl bg-sky-900 text-white text-[10px] font-bold px-3 py-2 shadow-lg text-center">
        {text}
        <span className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] w-2 h-2 rotate-45 bg-sky-900" />
      </span>
    </span>
  );
}

export default function Badges() {
  const filters = ['All', 'Earned', 'In Progress', 'Locked'];
  const [activeFilter, setActiveFilter] = useState('All');
  const [badges, setBadges] = useState({ earned: [], in_progress: [], locked: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await Users.getBadges();
        if (!cancelled) {
          setBadges(res?.data || { earned: [], in_progress: [], locked: [] });
        }
      } catch (_) {
        if (!cancelled) toast.error('Failed to load badges');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const earned = badges.earned || [];
  const inProgress = badges.in_progress || [];
  const locked = badges.locked || [];

  const shouldShow = (label) => activeFilter === 'All' || activeFilter === label;

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-20">
      <SubScreenHeader title="My Badges" />

      <div className="px-5 pt-4 flex items-center gap-4 justify-center">
        {[
          { value: String(earned.length), label: 'Earned' },
          { value: String(inProgress.length), label: 'In Progress' },
          { value: String(locked.length), label: 'Locked' },
        ].map((s, idx) => (
          <div key={s.label} className="text-center flex-1">
            <div className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-[#0C4A6E] dark:text-[#F0F9FF]">{s.value}</div>
            <div className="font-['Plus_Jakarta_Sans'] text-xs text-[#0369A1] dark:text-[#7DD3FC] mt-1">{s.label}</div>
            {idx < 2 && <div className="mt-2 h-6 border-r border-sky-100 dark:border-sky-900/20 mx-auto w-0" />}
          </div>
        ))}
      </div>

      <div className="px-5 mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {filters.map((f) => {
          const active = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-full px-4 py-2 text-xs font-['Syne'] font-bold transition-all duration-200 hover:scale-[1.02] active:scale-95 focus:ring-2 focus:ring-sky-500/40 ${
                active
                  ? 'bg-sky-600 text-white'
                  : 'bg-transparent border border-sky-200 dark:border-sky-800/30 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/20'
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="px-5 mt-6 text-sm text-sky-500">Loading badges...</div>
      )}

      {!loading && shouldShow('Earned') && (
        <div className="mt-5">
          <div className="px-5 mb-3 font-['Syne'] font-bold text-xs text-[#0369A1] dark:text-[#7DD3FC] uppercase tracking-widest">
            Earned
          </div>
          <div className="grid grid-cols-3 gap-4 px-5">
            {earned.map((b) => (
              <button
                key={b.name}
                title={badgeTooltipText(b, 'earned')}
                className="relative group flex flex-col items-center text-center cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-95 focus:ring-2 focus:ring-amber-300/40"
              >
                <BadgeTooltip text={badgeTooltipText(b, 'earned')} />
                <div className="w-20 h-20 rounded-3xl mb-2 flex items-center justify-center text-3xl shadow-[0_4px_16px_rgba(245,158,11,0.20)] bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-2 border-amber-200 dark:border-amber-700/30">
                  {b.icon}
                </div>
                <div className="font-['Syne'] font-bold text-xs text-[#0C4A6E] dark:text-[#F0F9FF]">{b.name}</div>
                <div className="font-['Plus_Jakarta_Sans'] text-[10px] text-[#0369A1] dark:text-[#7DD3FC] mt-0.5 line-clamp-1">
                  {b.category || ''}
                </div>
              </button>
            ))}
            {earned.length === 0 && (
              <p className="text-xs text-sky-500">No badges earned yet.</p>
            )}
          </div>
        </div>
      )}

      {!loading && shouldShow('In Progress') && (
        <div className="mt-6">
          <div className="px-5 mb-3 font-['Syne'] font-bold text-xs text-[#0369A1] dark:text-[#7DD3FC] uppercase tracking-widest">
            In Progress
          </div>
          <div className="grid grid-cols-3 gap-4 px-5">
            {inProgress.map((b) => (
              <button
                key={b.name}
                title={badgeTooltipText(b, 'progress')}
                className="relative group flex flex-col items-center text-center cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-95 focus:ring-2 focus:ring-sky-400/40"
              >
                <BadgeTooltip text={badgeTooltipText(b, 'progress')} />
                <div className="w-20 h-20 rounded-3xl mb-2 flex items-center justify-center text-3xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/30 opacity-80">
                  {b.icon}
                </div>
                <div className="w-full mt-1">
                  <div className="h-1.5 rounded-full bg-sky-100 dark:bg-sky-900/30 overflow-hidden">
                    <div
                      className="h-full bg-sky-500"
                      style={{ width: `${progressPercent(b)}%` }}
                    />
                  </div>
                  <div className="font-['Plus_Jakarta_Sans'] text-[10px] text-[#0369A1] dark:text-[#7DD3FC] mt-1">
                    {progressLabelText(b)}
                  </div>
                  <div className="text-[10px] text-sky-600 dark:text-sky-400 font-['Plus_Jakarta_Sans']">
                    Keep going to unlock!
                  </div>
                </div>
              </button>
            ))}
            {inProgress.length === 0 && (
              <p className="text-xs text-sky-500">No badges in progress.</p>
            )}
          </div>
        </div>
      )}

      {!loading && shouldShow('Locked') && (
        <div className="mt-6 mb-6">
          <div className="px-5 mb-3 font-['Syne'] font-bold text-xs text-[#0369A1] dark:text-[#7DD3FC] uppercase tracking-widest">
            Locked
          </div>
          <div className="grid grid-cols-3 gap-4 px-5">
            {locked.map((b) => (
              <button
                key={b.name}
                title={badgeTooltipText(b, 'locked')}
                className="relative group flex flex-col items-center text-center cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-95 focus:ring-2 focus:ring-sky-400/40"
              >
                <BadgeTooltip text={badgeTooltipText(b, 'locked')} />
                <div className="relative w-20 h-20 rounded-3xl mb-2 flex items-center justify-center text-3xl bg-sky-50 dark:bg-sky-900/20 border border-dashed border-sky-200 dark:border-sky-800/30 opacity-60">
                  {b.icon}
                  <span className="absolute bottom-2 right-2 text-xs">??</span>
                </div>
                <div className="font-['Syne'] font-bold text-xs text-[#0369A1] dark:text-[#7DD3FC]">{b.name}</div>
                <div className="text-[10px] text-sky-600 dark:text-sky-400 font-['Plus_Jakarta_Sans'] mt-0.5">
                  {b.requirement || 'How to earn'}
                </div>
              </button>
            ))}
            {locked.length === 0 && (
              <p className="text-xs text-sky-500">No locked badges.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

