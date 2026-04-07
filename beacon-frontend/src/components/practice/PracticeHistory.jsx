import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Target, Zap, Trophy, History } from 'lucide-react';
import { Practice } from '../../services/api';

export default function PracticeHistory() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  
  const tabs = ['All', 'Practice', 'Exam', 'Mock'];
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await Practice.getSessions({ status: 'completed' });
        const payload = res?.data || {};
        const items = payload.sessions || payload.items || payload || [];
        if (cancelled) return;
        setSessions(Array.isArray(items) ? items : []);
      } catch (_) {
        if (cancelled) return;
        setSessions([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatSeconds = (seconds) => {
    if (seconds === null || seconds === undefined) return '0s';
    const secs = Math.max(0, Math.floor(Number(seconds)));
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    if (mins <= 0) return `${rem}s`;
    return `${mins}m ${String(rem).padStart(2, '0')}s`;
  };

  const toDateKey = (d) => {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getSessionDate = (session) => {
    const raw = session?.completed_at || session?.started_at;
    const d = raw ? new Date(raw) : new Date();
    return Number.isNaN(d.getTime()) ? new Date() : d;
  };

  const formatDateLabel = (d) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const key = toDateKey(d);
    if (key === toDateKey(today)) return 'Today';
    if (key === toDateKey(yesterday)) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (d) => {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const uiSessions = useMemo(() => {
    return sessions.map((s) => {
      const sessionDate = getSessionDate(s);
      const backendMode = (s.mode || '').toLowerCase();
      const modeLabel = backendMode === 'practice' ? 'Practice' : backendMode === 'exam' ? 'Exam' : backendMode === 'mock' ? 'Mock' : (s.mode || 'Session');

      const icon = modeLabel === 'Practice' ? Target : modeLabel === 'Exam' ? Zap : Trophy;
      const color =
        modeLabel === 'Practice' ? 'text-amber-500' : modeLabel === 'Exam' ? 'text-sky-500' : 'text-rose-500';
      const bg =
        modeLabel === 'Practice'
          ? 'bg-amber-50 dark:bg-amber-900/20'
          : modeLabel === 'Exam'
            ? 'bg-sky-50 dark:bg-sky-900/20'
            : 'bg-rose-50 dark:bg-rose-900/20';

      const topicOrYear =
        s.topic ||
        (s.year
          ? `${s.exam_type ? s.exam_type : 'Year'} ${s.year}`
          : '');

      return {
        ...s,
        mode: modeLabel,
        icon,
        color,
        bg,
        time: formatSeconds(s.time_used),
        sessionDate,
        dateLabel: formatDateLabel(sessionDate),
        dateTimeLabel: formatDateTime(sessionDate),
        topicOrYear,
      };
    });
  }, [sessions]);

  const groupedSessions = useMemo(() => {
    const filtered =
      activeTab === 'All' ? uiSessions : uiSessions.filter((s) => s.mode === activeTab);

    const groupsMap = new Map();
    filtered.forEach((s) => {
      const key = toDateKey(s.sessionDate);
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          label: s.dateLabel,
          date: s.sessionDate,
          sessions: [],
        });
      }
      groupsMap.get(key).sessions.push(s);
    });

    const groups = Array.from(groupsMap.values());
    groups.sort((a, b) => b.date - a.date);
    groups.forEach((g) => {
      g.sessions.sort((a, b) => b.sessionDate - a.sessionDate);
    });
    return groups;
  }, [uiSessions, activeTab]);

  const totalSessions = sessions.length;

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      {/* HEADER */}
      <div className="px-5 pt-8 pb-4">
        <button 
          onClick={() => navigate('/practice')}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 shadow-sm mb-6"
        >
          <ChevronLeft size={20} />
        </button>
        
        <h1 className="font-[var(--font-syne)] font-bold text-2xl text-[#0C4A6E] dark:text-[#F0F9FF] leading-tight">
          Session <span className="text-sky-600 font-extrabold">Archive</span>
        </h1>
        <p className="font-[var(--font-jakarta)] text-[13px] text-sky-600/60 dark:text-sky-400/60 mt-2 leading-relaxed">
          {totalSessions} total learning cycles completed.
        </p>
      </div>

      {/* TABS */}
      <div className="px-5 mb-4 sticky top-0 bg-[#F0F9FF]/80 dark:bg-[#080C14]/80 backdrop-blur-md z-10 py-2">
        <div className="flex bg-white dark:bg-[#0D1525] p-1 rounded-2xl border border-sky-100 dark:border-sky-900/20 shadow-sm overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[70px] py-2.5 rounded-xl transition-all font-[var(--font-syne)] font-bold text-[10px] uppercase tracking-wider ${
                activeTab === tab 
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/10' 
                  : 'text-sky-600/60 dark:text-sky-400/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pb-24 space-y-8 overflow-y-auto">
        {isLoading ? (
          <div className="py-20 text-center opacity-70">
            Loading sessions...
          </div>
        ) : groupedSessions.length === 0 ? (
          <div className="py-20 text-center space-y-4 opacity-50">
            <div className="w-20 h-20 rounded-[2.5rem] bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center mx-auto text-sky-300">
              <History size={40} />
            </div>
            <p className="font-[var(--font-syne)] font-bold text-sky-600/60 italic">No records found for this frequency.</p>
          </div>
        ) : (
          groupedSessions.map((group, gIdx) => (
            <div key={group.key} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${gIdx * 100}ms` }}>
              <div className="flex items-center gap-2 pl-1">
                <span className="h-0.5 w-4 bg-sky-600 rounded-full"></span>
                <h3 className="font-[var(--font-syne)] font-bold text-[10px] text-sky-600 uppercase tracking-widest">{group.label}</h3>
              </div>
              
              <div className="space-y-3">
                {group.sessions.map(session => (
                  <button 
                    key={session.id}
                    onClick={() => navigate(`/practice/history/${session.id}`)}
                    className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-50 dark:border-sky-900/10 rounded-3xl p-4 flex items-center gap-4 text-left shadow-sm hover:shadow-lg hover:shadow-sky-500/[0.03] transition-all duration-300 active:scale-[0.98]"
                  >
                    <div className={`w-12 h-12 rounded-2xl ${session.bg} ${session.color} flex items-center justify-center shrink-0`}>
                      <session.icon size={20} fill="currentColor" fillOpacity={0.2} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] truncate">{session.subject}</h4>
                        <span className="shrink-0 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-900/40 text-[#0EA5E9] text-[8px] font-bold uppercase">
                          {session.mode}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-sky-600/70 dark:text-sky-400/70 truncate">
                        {session.correct || 0}/{session.total_questions || 0} - {session.score || 0}%
                      </p>
                      <p className="text-[10px] font-semibold text-sky-500/60 dark:text-sky-400/60 truncate">
                        {session.topicOrYear ? `${session.topicOrYear} - ` : ''}Time {session.time} - {session.dateTimeLabel}
                      </p>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <div className="font-[var(--font-syne)] font-bold text-lg text-sky-600 dark:text-sky-400">
                          {session.score || 0}<span className="text-[10px]">%</span>
                        </div>
                        <span className="text-[10px] font-bold text-sky-400">Review</span>
                      </div>
                      <ChevronRight size={16} className="text-sky-200" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
