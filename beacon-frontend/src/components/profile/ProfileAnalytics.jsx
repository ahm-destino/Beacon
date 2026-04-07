import React, { useEffect, useMemo, useState } from 'react';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Analytics } from '../../services/api';
import { toast } from 'sonner';

export default function ProfileAnalytics() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [dashboard, subjects, trends, prediction, errors, heatmap] = await Promise.allSettled([
          Analytics.dashboard(),
          Analytics.subjects(),
          Analytics.trends(),
          Analytics.prediction(),
          Analytics.errors(),
          Analytics.heatmap(),
        ]);

        if (cancelled) return;
        setData({
          dashboard: dashboard.value?.data,
          subjects: subjects.value?.data,
          trends: trends.value?.data,
          prediction: prediction.value?.data,
          errors: errors.value?.data,
          heatmap: heatmap.value?.data,
        });
      } catch (_) {
        if (!cancelled) toast.error('Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const dashboard = data.dashboard || {};
  const subjects = data.subjects || [];
  const trends = data.trends?.daily_activity || [];
  const errors = Array.isArray(data.errors) ? data.errors : [];
  const heatmap = data.heatmap || {};
  const prediction = data.prediction || {};

  const totalMinutes = trends.reduce((sum, d) => sum + (d.minutes_studied || 0), 0);
  const totalHours = totalMinutes ? (totalMinutes / 60).toFixed(1) : '0.0';

  const summaryStats = [
    { value: String(dashboard.total_questions || 0), label: 'Questions Answered' },
    { value: `${dashboard.overall_accuracy || 0}%`, label: 'Overall Accuracy' },
    { value: `${totalHours}h`, label: 'Total Study Time' },
    { value: String(dashboard.sessions_completed || 0), label: 'Sessions Completed' },
  ];

  const trendSeries = useMemo(() => {
    const last = trends.slice(-6);
    if (last.length === 0) return [0, 0, 0, 0, 0, 0];
    const values = last.map((d) => d.questions_done || 0);
    while (values.length < 6) values.unshift(0);
    return values;
  }, [trends]);

  const trendPoints = useMemo(() => {
    const maxVal = Math.max(1, ...trendSeries);
    const points = trendSeries.map((val, idx) => {
      const x = (idx / (trendSeries.length - 1)) * 320;
      const y = 110 - (val / maxVal) * 70;
      return { x, y };
    });
    const path = points.reduce((acc, p, i) => (i === 0 ? `M${p.x} ${p.y}` : `${acc} L${p.x} ${p.y}`), '');
    return { points, path };
  }, [trendSeries]);

  const week = trends.slice(-7);
  const weekValues = week.length ? week : Array.from({ length: 7 }).map(() => ({ minutes_studied: 0, date: null }));

  const timeRanges = ['1W', '1M', '3M', 'All Time'];

  const topErrors = errors.slice(0, 6);

  const heatmapGrid = heatmap.values || [];
  const heatmapDays = heatmap.days || [];
  const heatmapBuckets = heatmap.buckets || [];
  const heatmapMax = heatmap.max || 0;

  const predictionText = prediction.message
    ? prediction.message
    : prediction.predicted_score
      ? `Predicted score: ${prediction.predicted_score} (Range ${prediction.range_low}-${prediction.range_high})`
      : 'Prediction unavailable yet.';

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-24">
      <SubScreenHeader
        title="Analytics"
        rightAction={
          <button className="px-3 py-1.5 rounded-lg bg-white/10 dark:bg-white/5 text-sky-100 dark:text-sky-200 text-xs font-['Plus_Jakarta_Sans'] font-semibold hover:bg-white/20 dark:hover:bg-white/10 active:scale-95 focus:ring-2 focus:ring-white/30 transition-all duration-200">
            Export
          </button>
        }
      />

      {loading && (
        <div className="px-5 pt-6 text-sm text-sky-500">Loading analytics...</div>
      )}

      {!loading && (
        <>
          <div className="px-5 pt-4">
            <div className="rounded-2xl p-5 bg-gradient-to-br from-sky-600 to-sky-800 dark:from-sky-900 dark:to-[#080C14] border border-white/10">
              <div className="grid grid-cols-2 gap-4 text-center text-white">
                {summaryStats.map((stat) => (
                  <div key={stat.label}>
                    <div className="font-['Plus_Jakarta_Sans'] text-2xl font-black">{stat.value}</div>
                    <div className="font-['Plus_Jakarta_Sans'] text-xs text-sky-200 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs text-sky-200">
                <div>Streak: {dashboard.current_streak || 0} days</div>
                <div>Longest: {dashboard.longest_streak || 0} days</div>
                <div>Points: {dashboard.points_balance || 0}</div>
              </div>
            </div>
          </div>

          <div className="px-5 mt-4 flex gap-2">
            {timeRanges.map((range, idx) => {
              const active = idx === 0;
              return (
                <button
                  key={range}
                  className={`rounded-lg px-4 py-1.5 text-xs font-['Syne'] font-bold transition-all duration-200 hover:scale-[1.02] active:scale-95 focus:ring-2 focus:ring-sky-500/40 ${
                    active
                      ? 'bg-sky-600 text-white'
                      : 'bg-transparent border border-sky-200 dark:border-sky-800/30 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/20'
                  }`}
                >
                  {range}
                </button>
              );
            })}
          </div>

          <div className="px-5 mt-4">
            <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
              <div className="font-['Syne'] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF] mb-4">
                Daily Questions Trend
              </div>
              <div className="w-full">
                <svg viewBox="0 0 320 140" className="w-full h-[140px]">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(14,165,233,0.2)" />
                      <stop offset="100%" stopColor="rgba(14,165,233,0)" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="35" x2="320" y2="35" stroke="rgba(14,165,233,0.15)" strokeDasharray="4 4" />
                  <line x1="0" y1="70" x2="320" y2="70" stroke="rgba(14,165,233,0.15)" strokeDasharray="4 4" />
                  <line x1="0" y1="105" x2="320" y2="105" stroke="rgba(14,165,233,0.15)" strokeDasharray="4 4" />

                  <path d={trendPoints.path} fill="none" stroke="#0EA5E9" strokeWidth="2.5" />
                  <path d={`${trendPoints.path} L320 140 L0 140 Z`} fill="url(#chartGradient)" />

                  {trendPoints.points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill="#0EA5E9" />
                  ))}
                </svg>
              </div>
            </div>
          </div>

          <div className="px-5 mt-4">
            <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
              <div className="font-['Syne'] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF]">
                Study Hours This Week
              </div>
              <div className="grid grid-cols-7 gap-1.5 items-end h-24 mt-4">
                {weekValues.map((d, i) => {
                  const hours = (d.minutes_studied || 0) / 60;
                  const height = Math.min(96, Math.round((hours / 3) * 96));
                  const label = d.date ? new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }) : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i];
                  return (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <button
                        className="w-full rounded-t-lg transition-all duration-200 hover:opacity-90 active:scale-[0.98] focus:ring-2 focus:ring-sky-400/40 bg-sky-500"
                        style={{ height: `${height}px` }}
                      />
                      <div className="text-[10px] font-['Plus_Jakarta_Sans'] text-[#0369A1] dark:text-[#7DD3FC]">
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="px-5 mt-4">
            <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
              <div className="font-['Syne'] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF] mb-4">
                Subject Breakdown
              </div>
              {subjects.length === 0 && (
                <p className="text-sm text-sky-500">No subject data yet.</p>
              )}
              {subjects.map((s) => {
                const acc = Number(s.accuracy || 0);
                const color = acc >= 80 ? 'from-green-400 to-green-500' : acc >= 60 ? 'from-sky-400 to-sky-500' : 'from-amber-400 to-amber-500';
                const text = acc >= 80 ? 'text-green-500' : acc >= 60 ? 'text-sky-500' : 'text-amber-500';
                return (
                  <div key={s.subject} className="flex items-center gap-3 mb-4">
                    <div className="w-28 shrink-0 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF]">
                      {s.subject}
                    </div>
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-sky-100 dark:bg-sky-900/30">
                      <div className={`h-full bg-gradient-to-r ${color}`} style={{ width: `${acc}%` }} />
                    </div>
                    <div className={`font-['Plus_Jakarta_Sans'] text-sm font-bold w-12 text-right ${text}`}>{acc}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-5 mt-4">
            <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
              <div className="font-['Syne'] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF] mb-3">Score Prediction</div>
              <p className="text-sm text-sky-700 dark:text-sky-300">{predictionText}</p>
            </div>
          </div>

          <div className="px-5 mt-4">
            <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
              <div className="font-['Syne'] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF] mb-3">Top Error Areas</div>
              {topErrors.length === 0 ? (
                <p className="text-sm text-sky-500">No error patterns yet.</p>
              ) : (
                <div className="space-y-2">
                  {topErrors.map((e) => (
                    <div key={e.area} className="flex items-center justify-between text-sm">
                      <span className="text-sky-700 dark:text-sky-300">{e.area}</span>
                      <span className="text-xs font-bold text-rose-500">{e.errors}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-5 mt-4 mb-6">
            <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
              <div className="font-['Syne'] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF] mb-3">Study Heatmap</div>
              {heatmapGrid.length === 0 ? (
                <p className="text-sm text-sky-500">Heatmap data not available yet.</p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-1 text-[10px] text-sky-500">
                    {heatmapDays.map((d) => (
                      <div key={d} className="text-center">{d}</div>
                    ))}
                  </div>
                  {heatmapBuckets.map((bucket, rowIdx) => (
                    <div key={bucket} className="grid grid-cols-7 gap-1">
                      {heatmapDays.map((_, colIdx) => {
                        const value = heatmapGrid[colIdx]?.[rowIdx] || 0;
                        const intensity = heatmapMax ? Math.round((value / heatmapMax) * 100) : 0;
                        const bg = intensity > 80 ? 'bg-sky-700' : intensity > 60 ? 'bg-sky-600' : intensity > 40 ? 'bg-sky-500' : intensity > 20 ? 'bg-sky-400' : 'bg-sky-200/60';
                        return (
                          <div key={`${rowIdx}-${colIdx}`} className={`h-4 rounded ${bg}`} title={`${bucket}: ${value}`} />
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

