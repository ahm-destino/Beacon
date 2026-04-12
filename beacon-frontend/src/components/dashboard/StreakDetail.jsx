import React, { useEffect, useMemo, useState } from 'react';
import SubScreenHeader from '../shared/SubScreenHeader';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Streaks } from '../../services/api';
import { toast } from 'sonner';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function StreakDetail() {
  const [streak, setStreak] = useState(null);
  const [calendar, setCalendar] = useState([]);
  const [society, setSociety] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    setLoading(true);
    const [streakRes, calendarRes, societyRes, friendsRes] = await Promise.allSettled([
      Streaks.getMe(),
      Streaks.getCalendar(),
      Streaks.getSociety(),
      Streaks.getFriends(),
    ]);

    if (streakRes.status === 'fulfilled') {
      setStreak(streakRes.value?.data || null);
    }
    if (calendarRes.status === 'fulfilled') {
      setCalendar(calendarRes.value?.data?.calendar || []);
    }
    if (societyRes.status === 'fulfilled') {
      setSociety(Array.isArray(societyRes.value?.data) ? societyRes.value.data : []);
    }
    if (friendsRes.status === 'fulfilled') {
      setFriends(friendsRes.value?.data?.friends || []);
    }

    setLoading(false);
  };

  const handleBuyFreeze = async () => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      const res = await Streaks.buyFreeze();
      const data = res?.data || {};
      setStreak((prev) => ({
        ...(prev || {}),
        freezes_remaining: data.freezes_remaining ?? prev?.freezes_remaining ?? 0,
        points_balance: data.points_balance ?? prev?.points_balance ?? 0,
      }));
      toast.success('Freeze purchased!');
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to buy freeze');
    } finally {
      setActionBusy(false);
    }
  };

  const handleRepairFree = async () => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await Streaks.repairFree();
      await loadStreakData();
      toast.success('Streak repaired!');
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to repair');
    } finally {
      setActionBusy(false);
    }
  };

  const handleRepairPoints = async () => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await Streaks.repairPoints();
      await loadStreakData();
      toast.success('Streak repaired with points!');
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to repair with points');
    } finally {
      setActionBusy(false);
    }
  };

  const calendarMap = useMemo(() => {
    const map = new Map();
    const list = Array.isArray(calendar) ? calendar : [];
    for (const entry of list) {
      if (entry?.date) map.set(entry.date, entry);
    }
    return map;
  }, [calendar]);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().slice(0, 10), [today]);

  const currentMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset, 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [monthOffset]);

  const monthLabel = useMemo(() => {
    return currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstWeekday = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    const totalCells = 42;

    for (let i = 0; i < totalCells; i += 1) {
      const dayNum = i - firstWeekday + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        cells.push({ date: '', state: 'future' });
        continue;
      }

      const dateObj = new Date(year, month, dayNum);
      const dateStr = dateObj.toISOString().slice(0, 10);
      const entry = calendarMap.get(dateStr);
      const status = entry?.status;

      let state = 'none';
      if (dateStr === todayStr) {
        state = 'today';
      } else if (dateObj > today) {
        state = 'future';
      } else if (status === 'studied' || status === 'repair_used') {
        state = 'studied';
      } else if (status === 'freeze_used') {
        state = 'freeze';
      } else if (status === 'missed') {
        state = 'missed';
      }

      cells.push({ date: dayNum, state });
    }

    return cells;
  }, [calendarMap, currentMonth, today, todayStr]);

  const weekDays = useMemo(() => {
    const day = (today.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(today);
    monday.setDate(today.getDate() - day);
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const entry = calendarMap.get(dateStr);
      const status = entry?.status;
      const done = status === 'studied' || status === 'repair_used' || status === 'freeze_used';
      const isToday = dateStr === todayStr;
      return {
        label: DAYS[i],
        done,
        isToday,
      };
    });
  }, [calendarMap, today, todayStr]);

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const totalStudyDays = streak?.total_study_days || 0;
  const freezesRemaining = streak?.freezes_remaining || 0;
  const pointsBalance = streak?.points_balance || 0;

  const milestones = [7, 14, 21, 30, 60, 100, 365];
  const nextMilestone = milestones.find((m) => m > currentStreak) || milestones[milestones.length - 1];
  const milestoneLeft = Math.max(0, nextMilestone - currentStreak);
  const milestoneProgress = Math.min(100, Math.round((currentStreak / nextMilestone) * 100));

  const societyTier = (streak?.society_tier || 'none').toUpperCase();
  const topSociety = society.slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
          <p className="text-sky-600 dark:text-sky-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <SubScreenHeader title="My Streak" />

      {/* FLAME HERO */}
      <div className="relative text-center py-8 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at center, rgba(249,115,22,0.15), transparent 60%)'
        }} />
        
        <div className="relative z-10">
          <div className="text-8xl animate-pulse-slow">🔥</div>
          <div className="font-['Plus_Jakarta_Sans'] text-7xl font-black text-orange-500 dark:text-orange-400 tracking-[-4px] mt-2">
            {currentStreak}
          </div>
          <div className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#7DD3FC] mt-2 tracking-widest uppercase">
            DAY STREAK
          </div>

          <div className="mt-6 flex justify-center">
            <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/30 rounded-full px-5 py-2 text-sm font-semibold flex flex-col items-center gap-2">
              <span>Study 15 min to protect your streak</span>
              <button className="bg-orange-500 text-white rounded-lg px-4 py-1.5 text-xs font-[var(--font-syne)] font-bold hover:bg-orange-600 active:scale-95 transition-all duration-200 focus:ring-2 focus:ring-orange-500/50">
                Study Now →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 gap-3 px-5 mt-4">
        {[
          { icon: '🔥', val: String(currentStreak), label: 'Current streak' },
          { icon: '🏆', val: String(longestStreak), label: 'Best ever' },
          { icon: '📅', val: String(totalStudyDays), label: 'Total study days' },
          { icon: '❄️', val: String(freezesRemaining), label: 'Freezes left' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#0D1525] p-4 rounded-2xl border border-sky-100 dark:border-sky-900/20 shadow-sm flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-1">
              <span>{stat.icon}</span>
              <span className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-[#0369A1] dark:text-[#0EA5E9]">{stat.val}</span>
            </div>
            <span className="text-xs text-[#0369A1] dark:text-[#7DD3FC] font-medium">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* STREAK CALENDAR */}
      <div className="px-5 mt-5">
        <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9]">{monthLabel}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setMonthOffset((m) => m - 1)}
                className="w-8 h-8 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 flex items-center justify-center transition-all duration-200 active:scale-95"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setMonthOffset((m) => m + 1)}
                className="w-8 h-8 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 flex items-center justify-center transition-all duration-200 active:scale-95"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center font-['Plus_Jakarta_Sans'] text-xs text-[#0369A1] dark:text-[#7DD3FC] font-bold">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => (
              <div key={i} className={`w-full aspect-square rounded-lg flex items-center justify-center font-['Plus_Jakarta_Sans'] text-xs font-semibold cursor-pointer transition-all duration-200 hover:scale-[1.05]
                ${day.state === 'studied' ? 'bg-orange-500 text-white shadow-[0_2px_8px_rgba(249,115,22,0.3)]' : ''}
                ${day.state === 'freeze' ? 'bg-sky-200 dark:bg-sky-800 text-sky-700 dark:text-sky-300' : ''}
                ${day.state === 'missed' ? 'bg-sky-50 dark:bg-sky-900/10 text-sky-300 dark:text-sky-700 border border-sky-100 dark:border-sky-900/20' : ''}
                ${day.state === 'future' ? 'bg-transparent text-sky-200 dark:text-sky-800/50' : ''}
                ${day.state === 'none' ? 'bg-transparent text-sky-300 dark:text-sky-700' : ''}
                ${day.state === 'today' ? 'ring-2 ring-orange-400 dark:ring-orange-500 text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10' : ''}
              `}>
                {day.date || ''}
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center mt-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0369A1] dark:text-[#7DD3FC]"><span className="text-base">🔥</span> Studied</div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0369A1] dark:text-[#7DD3FC]"><span className="text-base">❄️</span> Freeze</div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0369A1] dark:text-[#7DD3FC]"><span className="text-base">○</span> Missed</div>
          </div>
        </div>
      </div>

      {/* THIS WEEK PROGRESS */}
      <div className="px-5 mt-4">
        <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20 shadow-sm">
          <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">This Week</h2>
          
          <div className="flex gap-2 justify-between">
            {weekDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-[#0369A1] dark:text-[#7DD3FC] font-bold uppercase tracking-wider">{d.label}</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-['Plus_Jakarta_Sans'] font-bold transition-all
                  ${d.done ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md' : ''}
                  ${d.isToday && !d.done ? 'ring-2 ring-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-500' : ''}
                  ${!d.done && !d.isToday ? 'bg-sky-50 dark:bg-sky-900/10 text-sky-300 dark:text-sky-700' : ''}
                `}>
                  {d.done ? '✓' : ''}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 mt-5 border border-amber-100 dark:border-amber-800/20">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              ⭐ <span>Study all 7 days: <span className="font-bold">+500 pts</span> + Perfect Week badge</span>
            </p>
          </div>
        </div>
      </div>

      {/* MILESTONE PROGRESS */}
      <div className="px-5 mt-4">
        <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20 shadow-sm">
          <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">Milestones</h2>
          
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] flex items-center gap-1.5">
                {nextMilestone} Days — Next Goal
              </h3>
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md font-bold">
                {milestoneLeft} more days
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-sky-100 dark:bg-sky-900/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]" style={{ width: `${milestoneProgress}%` }}></div>
              </div>
              <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-sky-600 dark:text-sky-400">{currentStreak}/{nextMilestone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FREEZE MANAGER */}
      <div className="px-5 mt-4">
        <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9]">Streak Freezes</h2>
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">Balance: {pointsBalance} pts</span>
          </div>

          <div className="flex gap-4 justify-center my-6">
            {Array.from({ length: 3 }).map((_, i) => {
              const active = i < freezesRemaining;
              return (
                <div
                  key={i}
                  className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl shadow-sm transform ${active ? '-rotate-6' : 'rotate-6'} ${
                    active
                      ? 'bg-sky-100 dark:bg-sky-900/20 border-sky-300 dark:border-sky-700'
                      : 'bg-sky-50 dark:bg-sky-900/10 border-sky-200 dark:border-sky-800/30 opacity-50'
                  }`}
                >
                  ❄️
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center mt-4 bg-sky-50 dark:bg-sky-900/10 p-3 rounded-xl border border-sky-100 dark:border-sky-900/20">
            <span className="text-xs font-semibold text-[#0369A1] dark:text-[#7DD3FC]">Earn more:</span>
            <button
              onClick={handleBuyFreeze}
              disabled={actionBusy}
              className="bg-white dark:bg-[#0D1525] border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400 rounded-lg px-3 py-2 text-xs font-bold hover:bg-sky-50 dark:hover:bg-sky-900/30 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-60"
            >
              Use 500 pts — Get 1 Freeze
            </button>
          </div>
        </div>
      </div>

      {/* REPAIR SECTION */}
      {streak?.streak_broken_today && (
        <div className="px-5 mt-4">
          <div className="bg-rose-50 dark:bg-rose-900/10 rounded-2xl p-5 border border-rose-200 dark:border-rose-800/20 shadow-sm">
            <h2 className="font-[var(--font-syne)] font-bold text-base text-rose-700 dark:text-rose-300 mb-3">Streak Broken</h2>
            <p className="text-xs text-rose-600 dark:text-rose-400 mb-4">
              Repair your streak to keep your momentum.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRepairFree}
                disabled={actionBusy}
                className="flex-1 bg-rose-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-rose-700 transition-all disabled:opacity-60"
              >
                Repair Free
              </button>
              <button
                onClick={handleRepairPoints}
                disabled={actionBusy}
                className="flex-1 bg-white border border-rose-200 text-rose-700 rounded-xl py-2 text-xs font-bold hover:bg-rose-50 transition-all disabled:opacity-60"
              >
                Repair with Points
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STREAK SOCIETY */}
      <div className="px-5 mt-4">
        <div className="bg-gradient-to-br from-[#0c4a6e] to-[#075985] dark:from-sky-950 dark:to-[#080C14] rounded-2xl p-6 border border-sky-600/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          
          <h2 className="font-[var(--font-syne)] font-bold text-xs text-sky-300 text-center tracking-[0.2em] relative z-10">BEACON STREAK SOCIETY</h2>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 w-fit mx-auto mt-4 mb-4 relative z-10 shadow-xl">
            <span className="font-[var(--font-syne)] font-black text-2xl text-white tracking-wide">🔥 {societyTier}</span>
          </div>

          {(Array.isArray(topSociety) ? topSociety : []).length > 0 ? (
            <div className="space-y-1 relative z-10">
              {(Array.isArray(topSociety) ? topSociety : []).map((row, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
                  <span className="text-xl">🔥</span>
                  <span className="font-[var(--font-syne)] font-bold text-sm text-white flex-1 tracking-wider">{row.name || 'Student'}</span>
                  <span className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-sky-300">{row.streak || 0} days</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-sky-200 mt-6 relative z-10">No society data yet.</p>
          )}
        </div>
      </div>

      {/* FRIEND STREAKS */}
      {(Array.isArray(friends) ? friends : []).length > 0 && (
        <div className="px-5 mt-4">
          <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20 shadow-sm">
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">Friend Streaks</h2>
            <div className="space-y-3">
              {(Array.isArray(friends) ? friends : []).map((f) => (
                <div key={f.user_id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sm font-bold text-sky-700 dark:text-sky-300">
                    {(f.name || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF]">{f.name || 'Student'}</div>
                    <div className="text-xs text-sky-500 dark:text-sky-400">{f.current_streak || 0} day streak</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
