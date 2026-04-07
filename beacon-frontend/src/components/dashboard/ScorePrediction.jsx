import React, { useEffect, useMemo, useState } from 'react';
import SubScreenHeader from '../shared/SubScreenHeader';
import { ArrowUp } from 'lucide-react';
import { Analytics } from '../../services/api';

export default function ScorePrediction() {
  const [prediction, setPrediction] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [trends, setTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [predRes, subjectRes, trendRes] = await Promise.all([
          Analytics.prediction(),
          Analytics.subjects(),
          Analytics.trends(),
        ]);
        if (cancelled) return;
        const predData = predRes?.data || {};
        setPrediction(predData);
        setMessage(predData?.message || '');
        setSubjects(Array.isArray(subjectRes?.data) ? subjectRes.data : []);
        const daily = trendRes?.data?.daily_activity || [];
        setTrends(Array.isArray(daily) ? daily : []);
      } catch (e) {
        if (cancelled) return;
        setMessage(e?.error || 'Could not load prediction yet.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const predictedScore = Number(prediction?.predicted_score || 0);
  const confidence = Number(prediction?.confidence || 0);
  const rangeLow = Number(prediction?.score_range_low || Math.max(0, predictedScore - 10));
  const rangeHigh = Number(prediction?.score_range_high || Math.min(400, predictedScore + 10));

  const chartPoints = useMemo(() => {
    const recent = trends.slice(-5);
    if (!recent.length) return [245, 256, 269, 281, 306];
    const values = recent.map((d) => Math.max(0, Number(d.questions_done || 0)));
    const max = Math.max(...values, 1);
    return values.map((v) => Math.round((v / max) * 400));
  }, [trends]);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="Score Prediction" />

      {/* PREDICTION HERO */}
      <div className="px-5 py-8 text-center">
        <div className="bg-gradient-to-br from-sky-600 to-sky-800 dark:from-sky-800 dark:to-[#080C14] rounded-3xl p-8 border border-sky-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-400 rounded-full blur-3xl opacity-30"></div>
          
          <p className="font-[var(--font-jakarta)] text-sm text-sky-200 text-center uppercase tracking-widest font-bold">Predicted JAMB Score</p>
          <div className="mt-2">
            <span className="font-['Plus_Jakarta_Sans'] text-7xl font-black text-white">{isLoading ? '...' : predictedScore}</span>
            <span className="text-sky-300 text-2xl font-bold ml-1">/ 400</span>
          </div>
          
          <p className="font-[var(--font-jakarta)] text-sm text-sky-200 mt-2 font-medium">{confidence || 0}% confident</p>
          <p className="font-[var(--font-jakarta)] text-xs text-sky-300 mt-1">
            You'll likely score between {rangeLow}-{rangeHigh}
          </p>

          <div className="flex gap-2 justify-center mt-6 flex-wrap">
            <span className="bg-green-500/20 text-green-300 border border-green-500/30 rounded-full px-3 py-1.5 text-xs font-[var(--font-jakarta)] font-bold">99.8% chance of passing</span>
            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full px-3 py-1.5 text-xs font-[var(--font-jakarta)] font-bold">87% chance of 300+</span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-3 py-1.5 text-xs font-[var(--font-jakarta)] font-bold">65% chance of 320+</span>
          </div>
        </div>
      </div>
      {message ? (
        <div className="px-5 -mt-4 mb-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300 font-semibold">
            {message}
          </div>
        </div>
      ) : null}

      {/* SUBJECT BREAKDOWN */}
      <div className="px-5 mt-2">
        <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20 shadow-sm">
          <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">Subject Breakdown</h2>
          
          {(subjects.length ? subjects : [
            { subject: 'English', accuracy: 85, total: 100, correct: 85 },
            { subject: 'Mathematics', accuracy: 78, total: 100, correct: 78 },
            { subject: 'Physics', accuracy: 88, total: 100, correct: 88 },
            { subject: 'Chemistry', accuracy: 65, total: 100, correct: 65 },
          ]).map((sub, i) => (
            <div key={i} className="flex items-center gap-3 mb-4 last:mb-0">
              <div className="w-24">
                <span className="font-[var(--font-jakarta)] text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF]">{sub.subject}</span>
              </div>
              <div className="flex-1 h-2.5 bg-sky-100 dark:bg-sky-900/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full" style={{ width: `${sub.accuracy}%` }}></div>
              </div>
              <div className="flex flex-col items-end w-12">
                <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#0369A1] dark:text-[#0EA5E9]">{sub.correct || 0}</span>
                <span className="font-[var(--font-jakarta)] text-[10px] text-sky-400 font-bold uppercase">{sub.accuracy}% acc</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WHAT IMPROVES YOUR SCORE */}
      <div className="px-5 mt-4">
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 rounded-2xl p-5">
          <h2 className="font-[var(--font-syne)] font-bold text-base text-amber-800 dark:text-amber-300 mb-4">💡 To reach 320+</h2>
          
          <div className="space-y-3">
            {[
              "Improve Chemistry to 80% → +12 predicted points",
              "Complete 500 more questions → +8 predicted points",
              "Maintain 30-day streak → +5 predicted points"
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/50 dark:bg-black/20 p-3 rounded-xl">
                <ArrowUp className="text-amber-500 mt-0.5 shrink-0" size={16} />
                <span className="font-[var(--font-jakarta)] text-sm text-amber-800 dark:text-amber-200 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PREDICTION HISTORY CHART */}
      <div className="px-5 mt-4 pb-10">
        <div className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-5 shadow-sm">
          <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">Score Trend</h2>
          
          <div className="h-28 relative overflow-hidden bg-sky-50/50 dark:bg-sky-900/10 rounded-xl p-2">
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
              <polyline points="0,80 25,70 50,55 75,40 100,10" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="0" cy="80" r="3" fill="#0EA5E9" />
              <circle cx="25" cy="70" r="3" fill="#0EA5E9" />
              <circle cx="50" cy="55" r="3" fill="#0EA5E9" />
              <circle cx="75" cy="40" r="3" fill="#0EA5E9" />
              <circle cx="100" cy="10" r="3" fill="#ffffff" stroke="#0EA5E9" strokeWidth="2" />
            </svg>
          </div>
          
          <div className="flex justify-between mt-3">
            {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Now'].map((label, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="font-[var(--font-jakarta)] text-[9px] text-sky-500 dark:text-sky-400 font-bold uppercase tracking-wider mb-1">{label}</span>
                <span className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-sky-800 dark:text-sky-300">{chartPoints[i] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

