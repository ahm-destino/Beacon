import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { Admin } from '../../services/api';

const MiniCard = ({ label, value }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
    <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
    <div className="text-xl font-black text-slate-800 mt-2">{value ?? '--'}</div>
  </div>
);

export default function AdminAnalytics() {
  const [summary, setSummary] = useState(null);
  const [engagement, setEngagement] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [ai, setAi] = useState(null);
  const [subs, setSubs] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [summaryRes, engagementRes, subjectsRes, aiRes, subsRes] = await Promise.all([
          Admin.analyticsSummary(),
          Admin.analyticsEngagement(30),
          Admin.analyticsSubjects(),
          Admin.analyticsAI(),
          Admin.analyticsSubscriptions(),
        ]);
        if (!active) return;
        setSummary(summaryRes?.data);
        setEngagement(engagementRes?.data?.daily || []);
        setSubjects(subjectsRes?.data || []);
        setAi(aiRes?.data);
        setSubs(subsRes?.data);
      } catch (e) {}
    };
    load();
    return () => { active = false; };
  }, []);

  const latest = engagement[engagement.length - 1];

  return (
    <AdminLayout title="Analytics" subtitle="Monitor usage, learning activity, and AI load">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniCard label="Active Users (7d)" value={summary?.users?.active_7d} />
        <MiniCard label="Active Users (30d)" value={summary?.users?.active_30d} />
        <MiniCard label="Answers (7d)" value={summary?.usage?.answers_7d} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <MiniCard label="AI Messages" value={ai?.ai_messages} />
        <MiniCard label="Option Explanations" value={ai?.option_explanations} />
        <MiniCard label="Answer Verifications" value={ai?.answer_verifications} />
      </div>

      <div className="mt-8">
        <h3 className="font-[var(--font-syne)] text-lg text-slate-800 mb-3">30-Day Engagement</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MiniCard label="Today Questions" value={latest?.questions_answered ?? 0} />
          <MiniCard label="Today Active Users" value={latest?.active_users ?? 0} />
          <MiniCard label="Today Minutes" value={latest?.minutes_studied ?? 0} />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-xs text-slate-600">
            <thead>
              <tr className="text-left border-b border-slate-100">
                <th className="py-2">Date</th>
                <th className="py-2">Questions</th>
                <th className="py-2">Active Users</th>
                <th className="py-2">Minutes</th>
              </tr>
            </thead>
            <tbody>
              {engagement.slice(-10).map((row) => (
                <tr key={row.date} className="border-b border-slate-50">
                  <td className="py-2">{row.date}</td>
                  <td className="py-2">{row.questions_answered}</td>
                  <td className="py-2">{row.active_users}</td>
                  <td className="py-2">{row.minutes_studied}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-[var(--font-syne)] text-lg text-slate-800 mb-3">Top Subjects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subjects.slice(0, 8).map((item) => (
            <div key={item.subject} className="border border-slate-100 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">{item.subject}</span>
                <span className="text-xs text-slate-500">{item.total} answers</span>
              </div>
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500" style={{ width: `${item.accuracy}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{item.accuracy}% accuracy</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-[var(--font-syne)] text-lg text-slate-800 mb-3">Subscription Mix</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {subs?.by_tier?.map((tier) => (
            <MiniCard key={tier.tier} label={tier.tier} value={tier.count} />
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Active: {subs?.totals?.active || 0} • Cancelled: {subs?.totals?.cancelled || 0} • Expired: {subs?.totals?.expired || 0}
        </div>
      </div>
    </AdminLayout>
  );
}
