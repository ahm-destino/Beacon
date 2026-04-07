import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../shared/AppHeader';
import BottomNav from '../shared/BottomNav';
import { Community, Notifications } from '../../services/api';

function timeAgo(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} days ago`;
  return new Date(iso).toLocaleDateString();
}

function iconForType(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('streak')) return '🔥';
  if (t.includes('challenge') || t.includes('social')) return '⚔️';
  if (t.includes('badge') || t.includes('perf')) return '🏆';
  if (t.includes('rank') || t.includes('leader')) return '📊';
  return '🔔';
}

export default function CommunityHome() {
  const navigate = useNavigate();
  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [pendingChallenges, setPendingChallenges] = useState(0);
  const [qaTotal, setQaTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [notifRes, chRes, qRes] = await Promise.all([
          Notifications.list(1).catch(() => ({ data: { items: [] } })),
          Community.listChallenges().catch(() => ({ data: [] })),
          Community.listQuestions(1).catch(() => ({ data: { total: 0 } })),
        ]);
        if (cancelled) return;

        const items = notifRes?.data?.items || notifRes?.data || [];
        const list = Array.isArray(items) ? items : [];
        setFeed(
          list.slice(0, 12).map((n) => ({
            id: n.id,
            type: n.type || 'notice',
            title: n.title || 'Update',
            body: n.body || '',
            timeAgo: timeAgo(n.created_at),
            is_read: n.is_read,
            data: n.data || {},
          }))
        );

        const challenges = Array.isArray(chRes?.data) ? chRes.data : [];
        setPendingChallenges(
          challenges.filter(
            (c) => c.status === 'pending' && c.my_role === 'opponent'
          ).length
        );

        const total = qRes?.data?.total;
        setQaTotal(typeof total === 'number' ? total : 0);
      } catch (_) {
        if (!cancelled) {
          setFeed([]);
          setPendingChallenges(0);
          setQaTotal(0);
        }
      } finally {
        if (!cancelled) setLoadingFeed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNotifAction = (n) => {
    const d = n.data || {};
    if (d.path && typeof d.path === 'string') {
      navigate(d.path);
      return;
    }
    if (d.challenge_id) {
      navigate('/community/challenges', {
        state: { highlightChallengeId: d.challenge_id },
      });
      return;
    }
    if (d.question_id) {
      navigate(`/community/qa/${d.question_id}`);
      return;
    }
    if (d.user_id) {
      navigate(`/community/students/${d.user_id}`);
      return;
    }
    navigate('/notifications');
  };

  const qaBadge = useMemo(() => {
    if (qaTotal <= 0) return null;
    if (qaTotal > 99) return '99+';
    return String(qaTotal);
  }, [qaTotal]);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-24">
      <AppHeader title="Community" />

      <div className="max-w-md mx-auto pt-4">
        <div className="px-5 mb-5">
          <h1 className="font-[var(--font-syne)] font-black text-2xl text-[#0369A1] dark:text-[#0EA5E9] mb-1">
            Student Hub
          </h1>
          <p className="text-sm text-[#0369A1] dark:text-[#7DD3FC] font-medium">
            Connect, compete and grow together
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 px-5 mb-5">
          <Link
            to="/community/leaderboard"
            className="bg-white dark:bg-[#0D1525] p-5 rounded-2xl border border-sky-100 dark:border-sky-900/20 shadow-sm relative overflow-hidden group hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
          >
            <div className="text-3xl mb-3 text-amber-500">🏆</div>
            <div className="absolute top-4 right-4 w-2 h-2 bg-amber-500 rounded-full" />
            <h2 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mb-1">
              Leaderboard
            </h2>
            <p className="font-[var(--font-jakarta)] text-xs text-[#0369A1] dark:text-[#7DD3FC]">
              Check rankings
            </p>
          </Link>

          <Link
            to="/community/qa"
            className="bg-white dark:bg-[#0D1525] p-5 rounded-2xl border border-sky-100 dark:border-sky-900/20 shadow-sm relative overflow-hidden group hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
          >
            <div className="text-3xl mb-3 text-sky-500">💬</div>
            {qaBadge && (
              <div className="absolute top-4 right-4 min-w-[1.25rem] h-5 px-1 bg-sky-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                {qaBadge}
              </div>
            )}
            <h2 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mb-1">
              Q&A Feed
            </h2>
            <p className="font-[var(--font-jakarta)] text-xs text-[#0369A1] dark:text-[#7DD3FC]">
              Ask anything
            </p>
          </Link>

          <Link
            to="/community/buddies"
            className="bg-white dark:bg-[#0D1525] p-5 rounded-2xl border border-sky-100 dark:border-sky-900/20 shadow-sm relative overflow-hidden group hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
          >
            <div className="text-3xl mb-3 text-green-500">🤝</div>
            <div className="absolute top-4 right-4 w-2 h-2 bg-green-500 rounded-full" />
            <h2 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mb-1">
              Study Buddies
            </h2>
            <p className="font-[var(--font-jakarta)] text-xs text-[#0369A1] dark:text-[#7DD3FC]">
              Find partners
            </p>
          </Link>

          <Link
            to="/community/rooms"
            className="bg-white dark:bg-[#0D1525] p-5 rounded-2xl border border-sky-100 dark:border-sky-900/20 shadow-sm relative overflow-hidden group hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
          >
            <div className="text-3xl mb-3 text-purple-500">🚪</div>
            <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400 rounded-full" />
            <h2 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mb-1">
              Study Rooms
            </h2>
            <p className="font-[var(--font-jakarta)] text-xs text-[#0369A1] dark:text-[#7DD3FC]">
              Join sessions
            </p>
          </Link>

          <Link
            to="/community/challenges"
            className="bg-white dark:bg-[#0D1525] p-5 rounded-2xl border border-sky-100 dark:border-sky-900/20 shadow-sm relative overflow-hidden group hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
          >
            <div className="text-3xl mb-3 text-orange-500">⚔️</div>
            {pendingChallenges > 0 && (
              <div className="absolute top-4 right-4 min-w-[1.25rem] h-5 px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                {pendingChallenges > 9 ? '9+' : pendingChallenges}
              </div>
            )}
            <h2 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mb-1">
              Challenges
            </h2>
            <p className="font-[var(--font-jakarta)] text-xs text-[#0369A1] dark:text-[#7DD3FC]">
              Win prizes
            </p>
          </Link>

          <Link
            to="/community/tutors"
            className="bg-white dark:bg-[#0D1525] p-5 rounded-2xl border border-sky-100 dark:border-sky-900/20 shadow-sm relative overflow-hidden group hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
          >
            <div className="text-3xl mb-3 text-sky-700 dark:text-sky-400">🧑‍🏫</div>
            <h2 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mb-1">
              Expert Tutors
            </h2>
            <p className="font-[var(--font-jakarta)] text-xs text-[#0369A1] dark:text-[#7DD3FC]">
              Get help now
            </p>
          </Link>
        </div>

        <div className="px-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] uppercase tracking-wider">
              Recent activity
            </h2>
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="text-xs font-[var(--font-jakarta)] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              See all
            </button>
          </div>
          {loadingFeed ? (
            <p className="text-sm text-sky-600 dark:text-sky-400 font-[var(--font-jakarta)] py-4">
              Loading activity…
            </p>
          ) : feed.length === 0 ? (
            <div className="bg-white dark:bg-[#0D1525] p-4 rounded-2xl border border-sky-100 dark:border-sky-900/20">
              <p className="font-['Plus_Jakarta_Sans'] text-sm text-sky-700 dark:text-sky-300">
                No notifications yet. Complete a practice session or check the
                leaderboard to get updates.
              </p>
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="mt-3 w-full py-2.5 rounded-xl border border-sky-200 dark:border-sky-800/30 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20"
              >
                Notification settings
              </button>
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              {feed.map((activity) => (
                <div
                  key={activity.id}
                  className={`bg-white dark:bg-[#0D1525] p-4 rounded-2xl border shadow-sm ${
                    activity.is_read
                      ? 'border-sky-100 dark:border-sky-900/20'
                      : 'border-sky-200 dark:border-sky-700/40 border-l-4 border-l-sky-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-lg shrink-0">
                      {iconForType(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-['Plus_Jakarta_Sans'] text-sm font-semibold text-sky-900 dark:text-sky-100">
                        {activity.title}
                      </p>
                      {activity.body ? (
                        <p className="font-['Plus_Jakarta_Sans'] text-xs text-sky-600 dark:text-sky-400 mt-0.5 line-clamp-3">
                          {activity.body}
                        </p>
                      ) : null}
                      <p className="font-['Plus_Jakarta_Sans'] text-xs text-sky-400 mt-0.5">
                        {activity.timeAgo}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNotifAction(activity)}
                    className="mt-3 w-full py-2.5 rounded-xl border border-sky-200 dark:border-sky-800/30 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
