import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';
import {
  Leaderboard as LeaderboardAPI,
  Users,
  Community,
  Streaks,
} from '../../services/api';

import { Shield, Trophy, Medal, Crown, Timer, Info, ArrowUpCircle, Flame, Lock } from 'lucide-react';

function formatPoints(n) {
  if (n == null) return '0';
  return Number(n).toLocaleString();
}

function initials(name) {
  if (!name || typeof name !== 'string') return '?';
  const p = name.trim().split(/\s+/);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const TIER_META = {
  Bronze: { icon: Shield, color: 'text-orange-400' },
  Silver: { icon: Trophy, color: 'text-slate-300' },
  Gold: { icon: Medal, color: 'text-amber-400' },
  Diamond: { icon: Crown, color: 'text-cyan-300' },
};

const LEAGUE_TIERS = [
  'Bronze', 'Silver', 'Gold', 'Diamond',
];

const MEDAL_EMOJIS = {
  1: '\u{1F947}',
  2: '\u{1F948}',
  3: '\u{1F949}',
};

function getTimeRemaining() {
  const now = new Date();
  const nextSunday = new Date();
  nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
  nextSunday.setHours(23, 59, 59, 999);
  if (nextSunday < now) nextSunday.setDate(nextSunday.getDate() + 7);
  const diff = nextSunday - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return `${days}d ${hours}h ${minutes}m`;
}

export default function Leaderboard() {
  const [tab, setTab] = useState('League');
  const [roomInfo, setRoomInfo] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [me, setMe] = useState(null);
  const [myStreakFallback, setMyStreakFallback] = useState(0);
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining());
  const [isMeVisible, setIsMeVisible] = useState(true);
  const [leagueTrack, setLeagueTrack] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { highlightUserId } = location.state || {};

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeRemaining()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [meRes, buddiesRes, streakRes] = await Promise.all([
        Users.getMe().catch(() => ({ data: null })),
        Community.getBuddies().catch(() => ({ data: [] })),
        Streaks.getMe().catch(() => ({ data: {} })),
      ]);
      const meData = meRes?.data || null;
      setMe(meData);
      setMyStreakFallback(
        Number(streakRes?.data?.current_streak ?? 0) || 0
      );

      const buddies = Array.isArray(buddiesRes?.data) ? buddiesRes.data : [];
      const bSet = new Set(
        (Array.isArray(buddies) ? buddies : [])
          .map((b) => String(b.user?.id || b.user_id || ''))
          .filter(Boolean)
      );
      const myIdStr = meData?.id ? String(meData.id) : null;

      let raw = [];

        if (tab === 'League') {
          const [res, trackRes] = await Promise.all([
            LeaderboardAPI.league(),
            LeaderboardAPI.leagueTrack().catch(() => ({ data: null })),
          ]);
          raw = Array.isArray(res?.data?.items) ? res.data.items : [];
          setRoomInfo(res?.data?.room_info || null);
          setLeagueTrack(Array.isArray(trackRes?.data?.tiers) ? trackRes.data.tiers : []);
        } else {
          const res = await LeaderboardAPI.global(1, 200);
          raw = Array.isArray(res?.data) ? res.data : [];

        if (tab === 'Friends') {
          raw = raw.filter(
            (r) => (myIdStr && r.user_id === myIdStr) || bSet.has(r.user_id)
          );
          raw.sort((a, b) => (b.points || 0) - (a.points || 0));
          raw = raw.map((r, i) => ({ ...r, rank: i + 1 }));
        } else if (tab === 'School') {
          const school = (meData?.school_name || '').trim().toLowerCase();
          if (school) {
            raw = raw.filter(
              (r) => (r.school_name || '').trim().toLowerCase() === school
            );
            raw.sort((a, b) => (b.points || 0) - (a.points || 0));
            raw = raw.map((r, i) => ({ ...r, rank: i + 1 }));
          } else {
            raw = [];
          }
        }
      }

      setRows(raw);
    } catch (e) {
      setError(e?.error || e?.message || 'Could not load leaderboard.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (highlightUserId) {
      const el = document.getElementById(`student-${highlightUserId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightUserId, rows]);

  const myId = me?.id ? String(me.id) : null;
  const myRow = useMemo(() => rows.find((r) => r.user_id === myId), [rows, myId]);

  useEffect(() => {
    if (!myId) {
      setIsMeVisible(true);
      return;
    }

    const el = document.getElementById(`student-${myId}`);
    if (!el) {
      setIsMeVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsMeVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [myId, rows, tab]);

  const heroTierMeta = TIER_META[roomInfo?.tier] || { icon: Shield, color: 'text-sky-300' };
  const HeroTierIcon = heroTierMeta.icon;
  const headerPromotionCutoff = roomInfo?.total_members
    ? Math.min(10, roomInfo.total_members)
    : 10;
  const tierTrack = useMemo(() => {
    if (leagueTrack.length) return leagueTrack;
    const current = roomInfo?.tier;
    const currentIdx = current && LEAGUE_TIERS.includes(current) ? LEAGUE_TIERS.indexOf(current) : 0;
    return LEAGUE_TIERS.map((tier, index) => ({
      tier,
      index,
      status: index === currentIdx ? 'current' : (index < currentIdx ? 'unlocked' : 'locked'),
      is_current: index === currentIdx,
      is_locked: index > currentIdx,
    }));
  }, [leagueTrack, roomInfo]);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-24">
      <SubScreenHeader title="Leaderboard" />

      {/* Tabs */}
      <div className="sticky top-14 z-30 bg-white/80 dark:bg-[#080C14]/80 backdrop-blur-md border-b border-sky-100 dark:border-sky-900/20">
        <div className="flex overflow-x-auto scrollbar-hide py-3 px-4 gap-2">
          {['League', 'School', 'Friends'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap
                ${tab === t 
                  ? 'bg-sky-600 dark:bg-sky-500 text-white shadow-lg shadow-sky-200 dark:shadow-none' 
                  : 'text-sky-600/70 dark:text-sky-400/70 hover:bg-sky-50 dark:hover:bg-sky-900/20'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* League Header Card (Mimo Style) */}
      {tab === 'League' && roomInfo && (
        <div className="px-5 pt-6 animate-in fade-in slide-in-from-top-4 duration-500 sticky top-28 z-20">
          <div className="bg-gradient-to-br from-sky-500 to-sky-700 dark:from-sky-600 dark:to-sky-800 rounded-3xl p-6 text-white shadow-xl shadow-sky-600/20 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <HeroTierIcon className={`w-12 h-12 ${heroTierMeta.color}`} />
              </div>
              <div className="flex-1">
                <h2 className="font-[var(--font-syne)] text-2xl font-black uppercase tracking-tight">
                  {roomInfo.tier} League
                </h2>
                <div className="flex items-center gap-1.5 mt-1 text-sky-100 font-semibold text-xs">
                  <Timer size={14} />
                  <span>Ends in {timeLeft}</span>
                </div>
              </div>
              <div className="bg-white/20 p-2 rounded-xl">
                <Info size={20} />
              </div>
            </div>
            <div className="mt-6 bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-sky-50">
                  <span className="flex items-center gap-1"><ArrowUpCircle size={14} className="text-emerald-300" /> Promotion Zone</span>
                  <span>Top {headerPromotionCutoff} Only</span>
                </div>
              <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-400 w-[70%]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'League' && roomInfo && (
        <div className="px-5 mt-4">
          <div className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
                League Track
              </h3>
              <span className="text-[10px] font-bold text-sky-500/80 dark:text-sky-400/80">
                Finish this league to unlock the next
              </span>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {(Array.isArray(tierTrack) ? tierTrack : []).map((tier) => {
                const meta = TIER_META[tier.tier] || { icon: Shield, color: 'text-sky-300' };
                const TierIcon = meta.icon;
                const isLocked = tier.is_locked;
                const isCurrent = tier.is_current;
                const isCleared = tier.status === 'unlocked';
                return (
                  <div
                    key={tier.tier}
                    className={`relative min-w-[120px] rounded-xl px-3 py-3 border transition-all
                      ${isCurrent
                        ? 'bg-sky-600 text-white border-sky-500 shadow-lg shadow-sky-600/20'
                        : isLocked
                          ? 'bg-sky-50/70 dark:bg-sky-900/20 text-sky-500 dark:text-sky-600 border-sky-100 dark:border-sky-900/30'
                          : 'bg-white dark:bg-[#0F1C2E] text-sky-700 dark:text-sky-200 border-sky-100 dark:border-sky-900/30'}`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2
                      ${isCurrent ? 'bg-white/20' : 'bg-sky-100 dark:bg-sky-900/40'}`}>
                      <TierIcon
                        className={`w-5 h-5 ${isLocked ? 'text-sky-300/70 dark:text-sky-600' : meta.color}`}
                      />
                    </div>
                    <div className="text-xs font-black uppercase tracking-tight">{tier.tier}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                      {isCurrent ? 'Current' : isLocked ? 'Locked' : isCleared ? 'Cleared' : 'Unlocked'}
                    </div>
                    {isLocked && (
                      <div className="absolute right-2 top-2 text-sky-400/70 dark:text-sky-600/70">
                        <Lock size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="px-5 pt-3 text-sm text-red-600 dark:text-red-400 font-[var(--font-jakarta)]">
          {error}
        </p>
      )}

      <div className="px-5 mt-6 space-y-3">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-sky-600 font-bold">Summoning the leaderboard...</div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-sky-600/50 italic">
            {tab === 'School' && !(me?.school_name || '').trim()
            ? 'Add your school in profile to see school rankings.'
            : 'No entries yet for this view.'}
          </div>
        ) : (
          rows.map((user, idx) => {
            const isMe = String(user.user_id) === String(myId);
            const rank = user.rank || (idx + 1);
            const medal = MEDAL_EMOJIS[rank];
            const totalMembers = roomInfo?.total_members ?? rows.length;
            const promotionCutoff = Math.min(10, totalMembers);
            const demotionEnabled = totalMembers >= 15;
            const demotionStartRank = totalMembers - 5 + 1;
            const inPromotion = tab === 'League' && rank <= promotionCutoff;
            const inDemotion = tab === 'League' && demotionEnabled && rank >= demotionStartRank;
            const showPromotionDivider = tab === 'League' && promotionCutoff < totalMembers && rank === promotionCutoff + 1;
            const showDemotionDivider = tab === 'League' && demotionEnabled && rank === demotionStartRank;

            return (
              <React.Fragment key={user.user_id}>
                {showPromotionDivider && (
                  <div className="py-2 flex items-center gap-2 opacity-60">
                    <div className="h-[1px] flex-1 bg-emerald-400/50" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Promotion Line</span>
                    <div className="h-[1px] flex-1 bg-emerald-400/50" />
                  </div>
                )}
                {showDemotionDivider && (
                  <div className="py-2 flex items-center gap-2 opacity-60">
                    <div className="h-[1px] flex-1 bg-red-400/50" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Demotion Line</span>
                    <div className="h-[1px] flex-1 bg-red-400/50" />
                  </div>
                )}
                <div
                  id={`student-${user.user_id}`}
                  onClick={() => navigate(`/community/students/${user.user_id}`)}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer
                    ${isMe ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20 z-10 ring-4 ring-sky-500/20' : 'bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 hover:border-sky-300 dark:hover:border-sky-700/50'}
                    ${inPromotion && !isMe ? 'border-l-4 border-l-emerald-400 bg-emerald-50/30' : ''}
                    ${inDemotion && !isMe ? 'border-l-4 border-l-red-400 opacity-80' : ''}`}
                >
                  <div className={`w-8 flex justify-center font-black text-lg
                    ${rank === 1 ? 'text-amber-500 scale-125 drop-shadow-sm' : rank === 2 ? 'text-slate-400 scale-110' : rank === 3 ? 'text-orange-400 scale-105' : isMe ? 'text-white' : 'text-sky-900/40 dark:text-sky-100/30'}`}>
                    {medal || rank}
                  </div>
                  <div className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-lg
                    ${isMe ? 'bg-white/20 text-white' : 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 shadow-inner'}`}>
                    {user.photo ? <img src={user.photo} className="w-full h-full object-cover" /> : initials(user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold truncate ${isMe ? 'text-white' : 'text-[#0C4A6E] dark:text-[#F0F9FF]'}`}>
                      {user.name}
                    </h4>
                    <p className={`text-[10px] font-semibold truncate uppercase tracking-wider mt-0.5 ${isMe ? 'text-sky-100' : 'text-sky-500'}`}>
                      {user.school_name || 'Individual Student'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className={`text-sm font-black ${isMe ? 'text-white' : 'text-sky-600 dark:text-sky-400'}`}>
                      {formatPoints(user.points)} <span className="text-[8px] font-bold uppercase opacity-60">Pts</span>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold 
                      ${isMe ? 'bg-white/20 text-white' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600'}`}>
                      <Flame size={12} fill="currentColor" /> {user.streak ?? 0}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Sticky User Row (Mimo Style) */}
      {!loading && myId && !isMeVisible && (
        <div className="fixed bottom-4 left-0 right-0 px-5 z-50 animate-in slide-in-from-bottom-8">
          <div 
             onClick={() => document.getElementById(`student-${myId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
             className="bg-sky-600 rounded-2xl p-4 flex items-center gap-4 text-white shadow-2xl shadow-sky-600/40 cursor-pointer active:scale-95 transition-all"
          >
            <div className="w-8 font-black text-lg">#{myRow?.rank || '\u2014'}</div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              {me?.profile_photo_url ? <img src={me.profile_photo_url} className="w-full h-full object-cover rounded-xl" /> : initials(me?.full_name)}
            </div>
            <div className="flex-1 font-bold">Your Standings</div>
            <div className="flex flex-col items-end">
              <div className="text-sm font-black">{formatPoints(myRow?.points || me?.league_points || 0)} pts</div>
              <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Tap to view</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
