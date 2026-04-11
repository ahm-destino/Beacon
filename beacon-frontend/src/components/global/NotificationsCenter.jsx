import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notifications as NotificationsAPI } from '../../services/api';

function timeAgo(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function iconFor(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('streak')) return { icon: 'ðŸ”¥', bg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300' };
  if (t.includes('challenge')) return { icon: 'âš”ï¸', bg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300' };
  if (t.includes('badge')) return { icon: 'ðŸ†', bg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300' };
  if (t.includes('rank') || t.includes('leader')) return { icon: 'ðŸ“Š', bg: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300' };
  if (t.includes('study') || t.includes('plan')) return { icon: 'ðŸ“‹', bg: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300' };
  if (t.includes('buddy') || t.includes('message')) return { icon: '💬', bg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' };
  return { icon: 'ðŸ””', bg: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300' };
}

function bucketLabel(iso) {
  if (!iso) return 'Earlier';
  const d = new Date(iso);
  const today = new Date();
  const day = 86400000;
  if (d.toDateString() === today.toDateString()) return 'Today';
  const y = new Date(today - day);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  if (Date.now() - d.getTime() < 7 * day) return 'This week';
  return 'Earlier';
}

export default function NotificationsCenter() {
  const navigate = useNavigate();
  const filters = ['All', 'Unread', 'Streak', 'Social', 'Performance'];
  const [filter, setFilter] = useState('All');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await NotificationsAPI.list(1);
      const raw = res?.data?.items || res?.data || [];
      setItems(Array.isArray(raw) ? raw : []);
    } catch (_) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      const type = (n.type || '').toLowerCase();
      if (filter === 'Unread') return !n.is_read;
      if (filter === 'Streak') return type.includes('streak');
      if (filter === 'Social') return type.includes('challenge') || type.includes('buddy') || type.includes('community');
      if (filter === 'Performance') return type.includes('perf') || type.includes('badge') || type.includes('prediction');
      return true;
    });
  }, [items, filter]);

  const sections = useMemo(() => {
    const map = new Map();
    for (const n of filtered) {
      const key = bucketLabel(n.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(n);
    }
    const order = ['Today', 'Yesterday', 'This week', 'Earlier'];
    return order.filter((k) => map.has(k)).map((k) => ({ title: k, items: map.get(k) }));
  }, [filtered]);

  const handleOpen = async (n) => {
    if (!n.is_read) {
      try {
        await NotificationsAPI.markRead(n.id);
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
      } catch (_) {}
    }
    const d = n.data || {};
    // Deep linking logic
    if (d.path && typeof d.path === 'string') {
      navigate(d.path);
      return;
    }
    
    // Legacy fallbacks
    if (d.challenge_id) {
      navigate('/community/challenges');
      return;
    }
    if (d.question_id) {
      navigate(`/community/qa/${d.question_id}`);
      return;
    }
    if (n.type?.includes('buddy')) {
      navigate('/community/buddies');
      return;
    }
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      await NotificationsAPI.markAllRead();
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    } catch (_) {
      window.alert('Could not mark all as read.');
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-24">
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-[#0D1525]/90 backdrop-blur border-b border-sky-100 dark:border-sky-900/20">
        <div className="flex items-center justify-between px-5 h-14">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 flex items-center justify-center hover:bg-sky-100 dark:hover:bg-sky-900/30 active:scale-95 focus:ring-2 focus:ring-sky-400/40 transition-all duration-200"
          >
            â†
          </button>
          <div className="font-['Syne'] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF]">
            Notifications
          </div>
          <button
            type="button"
            disabled={marking || items.length === 0}
            onClick={handleMarkAll}
            className="text-xs font-['Plus_Jakarta_Sans'] text-sky-600 dark:text-sky-400 hover:underline active:scale-95 disabled:opacity-40"
          >
            {marking ? 'â€¦' : 'Mark all read'}
          </button>
        </div>
      </div>

      <div className="px-5 mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {filters.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
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

      <div className="px-5 mt-4 space-y-6">
        {loading ? (
          <p className="text-sm text-sky-600 dark:text-sky-400 py-8 text-center font-['Plus_Jakarta_Sans']">
            Loadingâ€¦
          </p>
        ) : sections.length === 0 ? (
          <p className="text-sm text-sky-600 dark:text-sky-400 py-8 text-center font-['Plus_Jakarta_Sans']">
            No notifications here.
          </p>
        ) : (
          sections.map((sec) => (
            <div key={sec.title}>
              <div className="font-['Syne'] font-bold text-xs text-[#0369A1] dark:text-[#7DD3FC] uppercase tracking-wide mb-2">
                {sec.title}
              </div>
              <div className="space-y-2">
                {sec.items.map((n) => {
                  const { icon, bg } = iconFor(n.type);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleOpen(n)}
                      className={`w-full text-left flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] focus:ring-2 focus:ring-sky-400/40 ${
                        !n.is_read
                          ? 'bg-sky-50 dark:bg-sky-900/15 border border-sky-200 dark:border-sky-800/30 border-l-4 border-l-sky-500'
                          : 'bg-white dark:bg-[#0D1525] border border-sky-50 dark:border-sky-900/20'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${bg}`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF]">
                          {n.title || 'Notification'}
                        </div>
                        {n.body ? (
                          <div className="font-['Plus_Jakarta_Sans'] text-xs text-[#0369A1] dark:text-[#7DD3FC] mt-0.5 leading-relaxed line-clamp-4">
                            {n.body}
                          </div>
                        ) : null}
                        <div className="font-['Plus_Jakarta_Sans'] text-[10px] text-[#7DD3FC] mt-1.5">
                          {timeAgo(n.created_at)}
                        </div>
                      </div>
                      {!n.is_read && <span className="w-2 h-2 bg-sky-500 rounded-full mt-1 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
