import React, { useEffect, useMemo, useRef, useState } from 'react';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Target, Brain, PlayCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { Analytics } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function WeakAreas() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All Subjects');
  const [weakAreas, setWeakAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const debounceRef = useRef(null);

  const fetchWeakAreas = async () => {
    try {
      const res = await Analytics.weakAreas();
      const data = res?.data || {};
      setWeakAreas(Array.isArray(data.weak_areas) ? data.weak_areas : []);
    } catch (e) {
      window.alert(e?.error || e?.data?.error || 'Could not load weak areas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      setIsLoading(true);
      await fetchWeakAreas();
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setIsLoading(true);
        fetchWeakAreas();
      }, 600);
    };

    window.addEventListener('beacon-weakareas-refresh', handler);
    return () => {
      window.removeEventListener('beacon-weakareas-refresh', handler);
    };
  }, []);

  const filteredWeakAreas = useMemo(() => {
    if (filter === 'All Subjects') return weakAreas;
    const f = filter.toLowerCase();
    return weakAreas.filter((a) => {
      const subj = (a.subject || '').toLowerCase();
      if (f === 'math') return subj.includes('math');
      if (f === 'chemistry') return subj.includes('chem');
      if (f === 'physics') return subj.includes('phys');
      return false;
    });
  }, [weakAreas, filter]);

  const areasToShow = filteredWeakAreas.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <SubScreenHeader title="Weak Areas" />

      {/* HEADER SUMMARY */}
      <div className="px-5 pt-4 mb-4">
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 rounded-2xl p-4 flex gap-4 items-center">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-500 text-2xl shrink-0">
            ⚠️
          </div>
          <div>
            <h2 className="font-[var(--font-syne)] font-bold text-base text-amber-800 dark:text-amber-400">3 Priority Areas</h2>
            <p className="font-[var(--font-jakarta)] text-xs text-amber-700 dark:text-amber-300/80 mt-1 font-medium">Focusing on these could boost your predicted score by +15 points.</p>
          </div>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {['All Subjects', 'Math', 'Chemistry', 'Physics'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-[var(--font-jakarta)] font-semibold transition-all duration-200
                ${filter === f 
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-900/20' 
                  : 'border border-sky-200 dark:border-sky-800/30 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* WEAK AREA CARDS */}
      <div className="px-5 space-y-4">
        {isLoading ? (
          <div className="py-10 text-center opacity-70">Loading…</div>
        ) : areasToShow.length === 0 ? (
          <div className="py-10 text-center opacity-70">
            No weak areas yet. Answer a few questions to unlock suggestions.
          </div>
        ) : areasToShow.map((area, i) => (
          <div key={i} className={`bg-white dark:bg-[#0D1525] rounded-2xl p-5 border shadow-sm transition-all duration-200
            ${area.accuracy < 60 ? 'border-red-100 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-700/50' : 'border-amber-100 dark:border-amber-900/30 hover:border-amber-300 dark:hover:border-amber-700/50'}`}>
            
            <div className="flex justify-between items-start">
              <div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  area.accuracy < 60 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                }`}>
                  {area.subject}
                </span>
                <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF] mt-2 leading-tight">
                  {area.topic}
                </h3>
              </div>
              <span className={`font-['Plus_Jakarta_Sans'] text-xl font-black ${area.accuracy < 60 ? 'text-red-500' : 'text-amber-500'}`}>
                {area.accuracy}%
              </span>
            </div>

            <div className="mt-4">
              <div className="h-2.5 bg-sky-50 dark:bg-sky-900/20 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${area.accuracy < 60 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${area.accuracy}%` }}></div>
              </div>
              <div className={`flex items-center gap-1.5 mt-2 font-[var(--font-jakarta)] text-xs font-semibold ${
                area.trend === 'declining' ? 'text-red-500' : area.trend === 'improving' ? 'text-green-500' : 'text-sky-500'
              }`}>
                {area.trend === 'declining' ? (
                  <>
                    <TrendingDown size={14} /> Declining — was {typeof area.prev_accuracy === 'number' ? `${area.prev_accuracy}%` : '—'} recent
                  </>
                ) : area.trend === 'improving' ? (
                  <>
                    <TrendingUp size={14} /> Improving — was {typeof area.prev_accuracy === 'number' ? `${area.prev_accuracy}%` : '—'} recent
                  </>
                ) : (
                  <>
                    <Target size={14} /> Stable — keep practicing
                  </>
                )}
              </div>
              <div className="mt-2 text-[10px] font-bold text-sky-600/60 dark:text-sky-400/60 uppercase tracking-widest">
                {area.attempts} attempts
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  const examType = (localStorage.getItem('beacon_exam') || 'JAMB').toUpperCase();
                  navigate('/practice/generating', {
                    state: {
                      mode: 'practice',
                      practiceType: 'topic',
                      examType,
                      subject: area.subject,
                      topic: area.topic,
                      difficulty: 'Normal',
                      timer: 30 * 60,
                    },
                  });
                }}
                className="flex-1 bg-sky-600 dark:bg-sky-500 text-white rounded-xl px-3 py-2.5 text-xs font-[var(--font-jakarta)] font-semibold hover:bg-sky-700 dark:hover:bg-sky-600 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Target size={14} /> Drill Topic
              </button>
              <button
                onClick={() => {
                  const level = localStorage.getItem('ai_tutor_level') || 'normal';
                  navigate('/ai-tutor/chat/new', {
                    state: {
                      conceptContext: { name: area.topic },
                      level,
                    },
                  });
                }}
                className="flex-1 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-xl px-3 py-2.5 text-xs font-[var(--font-jakarta)] font-semibold hover:bg-sky-100 dark:hover:bg-sky-900/50 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                <Brain size={14} /> Explain
              </button>
              <button
                onClick={() => {
                  const examType = (localStorage.getItem('beacon_exam') || 'JAMB').toUpperCase();
                  navigate('/practice/generating', {
                    state: {
                      mode: 'practice',
                      practiceType: 'topic',
                      examType,
                      subject: area.subject,
                      topic: area.topic,
                      difficulty: 'Normal',
                      timer: 30 * 60,
                    },
                  });
                }}
                className="flex-none bg-white dark:bg-[#0D1525] border border-sky-200 dark:border-sky-800/30 text-sky-600 dark:text-sky-400 rounded-xl px-3 py-2.5 text-xs font-semibold hover:bg-sky-50 dark:hover:bg-sky-900/20 active:scale-95 transition-all duration-200 flex items-center justify-center"
              >
                <PlayCircle size={18} />
              </button>
            </div>
            
          </div>
        ))}
      </div>

    </div>
  );
}

