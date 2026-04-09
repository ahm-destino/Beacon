import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { Admin } from '../../services/api';

const Badge = ({ label }) => (
  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
    {label}
  </span>
);

export default function AdminUserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');
  const [subscription, setSubscription] = useState({
    tier: 'seeker',
    status: 'active',
    billing_cycle: 'monthly',
    duration_days: '',
    amount: '',
    currency: 'NGN',
  });
  const [pointsDelta, setPointsDelta] = useState('');

  const load = async () => {
    try {
      const [userRes, statsRes] = await Promise.all([
        Admin.getUser(id),
        Admin.getUserStats(id),
      ]);
      const u = userRes?.data;
      setUser(u);
      setStats(statsRes?.data);
      setSubscription((prev) => ({
        ...prev,
        tier: u?.subscription_tier || 'seeker',
        status: u?.subscription_status || 'active',
      }));
    } catch (e) {
      setMessage(e?.error || e?.message || 'Failed to load user.');
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleSubscription = async () => {
    try {
      await Admin.updateSubscription(id, {
        ...subscription,
        duration_days: subscription.duration_days ? Number(subscription.duration_days) : 0,
        amount: subscription.amount ? Number(subscription.amount) : 0,
      });
      setMessage('Subscription updated.');
      load();
    } catch (e) {
      setMessage(e?.error || e?.message || 'Failed to update subscription.');
    }
  };

  const handlePoints = async () => {
    if (!pointsDelta) return;
    try {
      await Admin.adjustPoints(id, { amount: Number(pointsDelta) });
      setPointsDelta('');
      setMessage('Points updated.');
      load();
    } catch (e) {
      setMessage(e?.error || e?.message || 'Failed to update points.');
    }
  };

  const handleBanToggle = async () => {
    try {
      if (user?.is_banned) {
        await Admin.unbanUser(id);
        setMessage('User unbanned.');
      } else {
        await Admin.banUser(id);
        setMessage('User banned.');
      }
      load();
    } catch (e) {
      setMessage(e?.error || e?.message || 'Failed to update user status.');
    }
  };

  return (
    <AdminLayout title="User Detail" subtitle={user?.email || 'Loading…'}>
      {message ? (
        <div className="mb-4 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          {message}
        </div>
      ) : null}

      {!user ? (
        <div className="text-sm text-slate-500">Loading user…</div>
      ) : (
        <div className="space-y-6">
          <div className="border border-slate-100 rounded-xl p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="font-[var(--font-syne)] text-lg text-slate-800">{user.full_name}</h3>
                <p className="text-xs text-slate-500">{user.email}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge label={`Tier: ${user.subscription_tier || 'seeker'}`} />
                  <Badge label={`Status: ${user.subscription_status || 'active'}`} />
                  {user.is_banned ? <Badge label="Banned" /> : null}
                  {user.is_admin ? <Badge label="Admin" /> : null}
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold"
                onClick={handleBanToggle}
              >
                {user.is_banned ? 'Unban User' : 'Ban User'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-xs uppercase text-slate-400 font-semibold">Total Answers</p>
              <div className="text-2xl font-black text-slate-800 mt-2">{stats?.total_questions_answered ?? '--'}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-xs uppercase text-slate-400 font-semibold">Accuracy</p>
              <div className="text-2xl font-black text-slate-800 mt-2">{stats?.overall_accuracy ?? '--'}%</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-xs uppercase text-slate-400 font-semibold">Points Balance</p>
              <div className="text-2xl font-black text-slate-800 mt-2">{stats?.points_balance ?? user?.points_balance ?? 0}</div>
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl p-4 space-y-4">
            <h4 className="font-[var(--font-syne)] text-base text-slate-800">Update Subscription</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                value={subscription.tier}
                onChange={(e) => setSubscription({ ...subscription, tier: e.target.value })}
              >
                <option value="seeker">Seeker</option>
                <option value="beacon">Beacon</option>
                <option value="luminary">Luminary</option>
                <option value="north_star">North Star</option>
              </select>
              <select
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                value={subscription.status}
                onChange={(e) => setSubscription({ ...subscription, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
              <select
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                value={subscription.billing_cycle}
                onChange={(e) => setSubscription({ ...subscription, billing_cycle: e.target.value })}
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
              <input
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                placeholder="Duration days (optional)"
                value={subscription.duration_days}
                onChange={(e) => setSubscription({ ...subscription, duration_days: e.target.value })}
              />
              <input
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                placeholder="Amount (kobo)"
                value={subscription.amount}
                onChange={(e) => setSubscription({ ...subscription, amount: e.target.value })}
              />
              <input
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                placeholder="Currency"
                value={subscription.currency}
                onChange={(e) => setSubscription({ ...subscription, currency: e.target.value })}
              />
            </div>
            <button
              className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold"
              onClick={handleSubscription}
            >
              Save Subscription
            </button>
          </div>

          <div className="border border-slate-100 rounded-xl p-4">
            <h4 className="font-[var(--font-syne)] text-base text-slate-800 mb-3">Adjust Points</h4>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                placeholder="Positive or negative amount"
                value={pointsDelta}
                onChange={(e) => setPointsDelta(e.target.value)}
              />
              <button
                className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold"
                onClick={handlePoints}
              >
                Update Points
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
