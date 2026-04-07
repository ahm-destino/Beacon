import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import BottomNav from '../shared/BottomNav';
import PointsBadge from '../shared/PointsBadge';
import { Analytics, Community, Users } from '../../services/api';
import { toast } from 'sonner';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [badges, setBadges] = useState({ earned: [], in_progress: [], locked: [] });
  const [referral, setReferral] = useState(null);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [meRes, statsRes, subjectsRes, badgesRes, referralRes] = await Promise.allSettled([
          Users.getMe(),
          Users.getStats(),
          Analytics.subjects(),
          Users.getBadges(),
          Users.getReferral(),
        ]);

        if (cancelled) return;
        const me = meRes.value?.data || null;
        setUser(me);
        setStats(statsRes.value?.data || null);
        setSubjects(subjectsRes.value?.data || []);
        setBadges(badgesRes.value?.data || { earned: [], in_progress: [], locked: [] });
        setReferral(referralRes.value?.data || null);

        if (me?.id) {
          const rankRes = await Community.getStudent(me.id).catch(() => null);
          if (!cancelled) {
            setRank(rankRes?.data?.rank ?? null);
          }
        }
      } catch (_) {
        if (!cancelled) toast.error('Failed to load profile data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const initials = useMemo(() => {
    const name = user?.full_name || '';
    if (!name) return 'U';
    return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  }, [user?.full_name]);

  const planLabel = useMemo(() => {
    const tier = (user?.subscription_tier || 'seeker').toString();
    return tier
      .split('_')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }, [user?.subscription_tier]);

  const examYear = useMemo(() => {
    if (!user?.exam_date) return null;
    const d = new Date(user.exam_date);
    return Number.isNaN(d.getTime()) ? null : d.getFullYear();
  }, [user?.exam_date]);

  const statCards = [
    { label: 'Streak', value: String(stats?.current_streak ?? 0) },
    { label: 'Accuracy', value: `${stats?.overall_accuracy ?? 0}%` },
    { label: 'Points', value: String(stats?.points_balance ?? 0) },
    { label: 'Rank', value: rank ? `#${rank}` : '—' },
  ];

  const earnedBadges = badges.earned || [];
  const lockedBadges = badges.locked || [];
  const recentBadges = earnedBadges.slice(-5).reverse();

  const featureCards = [
    { icon: '🔥', title: 'My Streak', sub: `${stats?.current_streak ?? 0}-day streak`, to: '/streak' },
    { icon: '📊', title: 'Analytics', sub: `${stats?.overall_accuracy ?? 0}% accuracy`, to: '/profile/analytics' },
    { icon: '🏆', title: 'Badges', sub: `${earnedBadges.length} earned · ${lockedBadges.length} locked`, to: '/profile/badges' },
    { icon: '💎', title: 'Subscription', sub: `${planLabel} Plan`, to: '/profile/subscription' },
    { icon: '👥', title: 'Referrals', sub: `${referral?.total_referrals ?? 0} friends invited`, to: '/profile/referrals' },
    { icon: '⚙️', title: 'Settings', sub: 'Account & preferences', to: '/settings' }
  ];

  const subjectPerf = subjects.slice(0, 4).map((s) => ({
    name: s.subject,
    acc: Number(s.accuracy || 0),
  }));

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-24">
      {/* PROFILE HEADER BANNER */}
      <div className="relative h-40 bg-gradient-to-br from-sky-700 via-sky-600 to-sky-800 dark:from-[#080C14] dark:via-sky-900 dark:to-[#0C4A6E]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.06),transparent_50%)]"></div>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <PointsBadge compact className="bg-white/90 text-amber-700 border-white/50" />
          <Link
            to="/profile/edit"
            className="bg-white/20 dark:bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl px-4 py-2 text-xs font-['Plus_Jakarta_Sans'] font-semibold hover:bg-white/30 dark:hover:bg-white/20 active:scale-95 focus:ring-2 focus:ring-white/50 transition-all duration-200"
          >
            ✏️ Edit Profile
          </Link>
        </div>
      </div>

      {loading && (
        <div className="px-5 pt-4 text-sm text-sky-500">Loading profile...</div>
      )}

      {/* AVATAR */}
      <div className="relative -mt-12 mx-auto w-24 h-24 rounded-3xl ring-4 ring-white dark:ring-[#080C14] bg-gradient-to-br from-sky-500 to-sky-700 text-white font-['Plus_Jakarta_Sans'] text-3xl font-black flex items-center justify-center z-10 overflow-hidden">
        {user?.profile_photo_url ? (
          <img src={user.profile_photo_url} alt={user.full_name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>

      <div className="px-5 pt-4 pb-2 text-center">
        <h1 className="font-['Syne'] font-black text-2xl text-[#0C4A6E] dark:text-[#F0F9FF]">{user?.full_name || 'Student'}</h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800/30 rounded-full px-3 py-1 text-xs font-['Plus_Jakarta_Sans'] font-semibold">
            {user?.class_level || 'Student'}
          </span>
        </div>
        <p className="font-['Plus_Jakarta_Sans'] text-sm text-[#0369A1] dark:text-[#7DD3FC] mt-1">
          {(user?.state || 'Nigeria') + (user?.school_name ? ` · ${user.school_name}` : '')}
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/20 rounded-full px-3 py-1.5 text-xs font-['Syne'] font-bold">
            {user?.primary_exam || 'Exam'}{examYear ? ` ${examYear}` : ''}{user?.target_course ? ` · ${user.target_course}` : ''}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="bg-sky-600 dark:bg-sky-500 text-white rounded-full px-3 py-1.5 text-xs font-['Syne'] font-bold">
            🌟 {planLabel} Plan
          </span>
        </div>
      </div>

      {user?.bio && (
        <div className="mx-5 mt-2 bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-4">
          <p className="font-['Syne'] text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-widest mb-2">
            Bio
          </p>
          <p className="font-['Plus_Jakarta_Sans'] text-sm text-[#0369A1] dark:text-[#7DD3FC] leading-relaxed">
            {user.bio}
          </p>
        </div>
      )}

      {/* QUICK STATS */}
      <div className="grid grid-cols-4 gap-1 mt-5 mx-5 border-b border-sky-100 dark:border-sky-900/20">
        {statCards.map((s, i) => (
          <div key={i} className={`text-center py-3 ${i < statCards.length - 1 ? 'border-r border-sky-100 dark:border-sky-900/20' : ''}`}>
            <div className="font-['Plus_Jakarta_Sans'] text-xl font-black text-[#0C4A6E] dark:text-[#F0F9FF]">{s.value}</div>
            <div className="text-[10px] font-['Plus_Jakarta_Sans'] text-[#0369A1] dark:text-[#7DD3FC] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* FEATURE GRID */}
      <div className="grid grid-cols-2 gap-3 mt-5 px-5">
        {featureCards.map((f, i) => (
          <Link
            key={i}
            to={f.to}
            className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20 hover:border-sky-300 dark:hover:border-sky-700/40 hover:shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-sky-500/50"
          >
            <div className="text-2xl mb-3">{f.icon}</div>
            <h3 className="font-['Syne'] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">{f.title}</h3>
            <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#0369A1] dark:text-[#7DD3FC] mt-0.5">{f.sub}</p>
          </Link>
        ))}
      </div>

      {/* SUBJECT PERFORMANCE */}
      <div className="mt-5 mx-5 bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-['Syne'] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF]">Subject Performance</h3>
          <Link
            to="/profile/analytics"
            className="text-xs text-sky-600 dark:text-sky-400 hover:underline active:scale-95 focus:ring-2 focus:ring-sky-500/50 transition-all duration-200 flex items-center gap-1"
          >
            Full Analytics <ArrowRight size={12} />
          </Link>
        </div>

        <div className="space-y-4 mt-4">
          {subjectPerf.length === 0 && (
            <p className="text-sm text-sky-500">No subject data yet.</p>
          )}
          {subjectPerf.map((s, i) => {
            const color = s.acc >= 80 ? 'from-green-400 to-green-500' : s.acc >= 60 ? 'from-sky-400 to-sky-500' : 'from-amber-400 to-amber-500';
            const text = s.acc >= 80 ? 'text-green-500' : s.acc >= 60 ? 'text-sky-500' : 'text-amber-500';
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-28 shrink-0 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF]">
                  {s.name}
                </div>
                <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-sky-100 dark:bg-sky-900/30">
                  <div
                    className={`h-full bg-gradient-to-r ${color} transition-all duration-700`}
                    style={{ width: `${s.acc}%` }}
                  />
                </div>
                <div className={`font-['Plus_Jakarta_Sans'] text-sm font-bold w-12 text-right ${text}`}>{s.acc}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RECENT BADGES */}
      <div className="mt-5 mx-5 bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-['Syne'] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF]">Recent Badges</h3>
          <Link
            to="/profile/badges"
            className="text-xs text-sky-600 dark:text-sky-400 hover:underline active:scale-95 focus:ring-2 focus:ring-sky-500/50 transition-all duration-200 flex items-center gap-1"
          >
            See All <ChevronRight size={12} />
          </Link>
        </div>

        <div className="flex gap-3 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {recentBadges.length === 0 && (
            <p className="text-sm text-sky-500">No badges earned yet.</p>
          )}
          {recentBadges.map((b, i) => (
            <Link
              key={i}
              to="/profile/badges"
              className="shrink-0 flex flex-col items-center gap-1.5 w-16 hover:scale-105 active:scale-95 focus:ring-2 focus:ring-sky-500/50 transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-amber-100 dark:bg-amber-900/20 shadow-sm">
                {b.icon}
              </div>
              <div className="font-['Plus_Jakarta_Sans'] text-[10px] text-[#0369A1] dark:text-[#7DD3FC] text-center line-clamp-2">
                {b.name}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
