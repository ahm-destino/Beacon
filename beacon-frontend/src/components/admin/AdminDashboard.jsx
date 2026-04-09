import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { Admin } from '../../services/api';

const StatCard = ({ label, value, helper }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    <div className="text-2xl font-black text-slate-800 mt-2">{value ?? '--'}</div>
    {helper ? <p className="text-xs text-slate-500 mt-1">{helper}</p> : null}
  </div>
);

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [summary, setSummary] = useState(null);
  const [broadcast, setBroadcast] = useState({ title: '', body: '', tier: '' });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [dashRes, summaryRes] = await Promise.all([
          Admin.dashboard(),
          Admin.analyticsSummary(),
        ]);
        if (!active) return;
        setDashboard(dashRes?.data);
        setSummary(summaryRes?.data);
      } catch (e) {
        if (!active) return;
        setMessage(e?.error || e?.message || 'Failed to load admin dashboard.');
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const handleBroadcast = async () => {
    if (!broadcast.title || !broadcast.body) return;
    setSending(true);
    setMessage('');
    try {
      const res = await Admin.broadcast(broadcast);
      setMessage(res?.message || 'Broadcast sent.');
      setBroadcast({ title: '', body: '', tier: '' });
    } catch (e) {
      setMessage(e?.error || e?.message || 'Failed to send broadcast.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Live system overview and quick actions"
      actions={
        <button
          className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      }
    >
      {message ? (
        <div className="mb-4 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Users" value={summary?.users?.total} helper="All time" />
        <StatCard label="Active (7d)" value={summary?.users?.active_7d} helper="Last 7 days" />
        <StatCard label="New Users (7d)" value={summary?.users?.new_7d} helper="Last 7 days" />
        <StatCard label="Total Questions" value={summary?.questions?.total} helper="Active pool" />
        <StatCard label="Pending Reports" value={summary?.questions?.pending_reports} helper="Needs review" />
        <StatCard label="Pending AI Reviews" value={summary?.questions?.pending_ai_reviews} helper="Needs approval" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <StatCard label="Sessions (7d)" value={summary?.usage?.sessions_7d} />
        <StatCard label="Answers (7d)" value={summary?.usage?.answers_7d} />
        <StatCard label="AI Messages (7d)" value={summary?.usage?.ai_messages_7d} />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Paid Users" value={dashboard?.users?.paid} helper="Non-seeker tiers" />
        <StatCard label="AI Generated Qs" value={dashboard?.questions?.ai_generated} helper="Active & approved" />
        <StatCard label="HF Enriched Qs" value={dashboard?.questions?.hf_enriched} helper="Enriched in bank" />
      </div>

      <div className="mt-10">
        <h3 className="font-[var(--font-syne)] text-lg text-slate-800 mb-3">Broadcast Message</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
            placeholder="Title"
            value={broadcast.title}
            onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
          />
          <input
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
            placeholder="Tier filter (optional)"
            value={broadcast.tier}
            onChange={(e) => setBroadcast({ ...broadcast, tier: e.target.value })}
          />
          <button
            className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold"
            onClick={handleBroadcast}
            disabled={sending}
          >
            {sending ? 'Sending…' : 'Send Broadcast'}
          </button>
        </div>
        <textarea
          className="mt-3 w-full min-h-[120px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
          placeholder="Message body"
          value={broadcast.body}
          onChange={(e) => setBroadcast({ ...broadcast, body: e.target.value })}
        />
      </div>
    </AdminLayout>
  );
}
