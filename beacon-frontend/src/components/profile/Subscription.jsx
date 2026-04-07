import React, { useEffect, useMemo, useState } from 'react';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Subscriptions } from '../../services/api';

export default function Subscription() {
  const [plansMap, setPlansMap] = useState({});
  const [mySub, setMySub] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [isPayingTier, setIsPayingTier] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [notice, setNotice] = useState('');

  const loadSubscriptionData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, mineRes] = await Promise.all([
        Subscriptions.getPlans(),
        Subscriptions.getMine(),
      ]);
      setPlansMap(plansRes?.data || {});
      setMySub(mineRes?.data || null);
    } catch (e) {
      setNotice(e?.error || 'Could not load subscription data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const formatKobo = (value) => {
    const amount = Number(value || 0) / 100;
    return `₦${amount.toLocaleString()}`;
  };

  const plans = useMemo(() => {
    const entries = Object.entries(plansMap || {});
    return entries
      .map(([key, val]) => {
        const cyclePrice = billingCycle === 'annual' ? val.annual : val.monthly;
        return {
          key,
          name: val.name || key,
          price: val.monthly === 0 ? 'Free' : `${formatKobo(cyclePrice)}/${billingCycle === 'annual' ? 'yr' : 'mo'}`,
          current: (mySub?.tier || 'seeker') === key && (mySub?.status === 'active' || mySub?.status === 'free'),
          highlight: key === 'luminary',
          monthly: val.monthly,
          annual: val.annual,
        };
      })
      .filter((p) => p.key !== 'seeker');
  }, [plansMap, billingCycle, mySub]);

  const currentTier = (mySub?.tier || 'seeker').toLowerCase();
  const currentStatus = mySub?.status || 'free';
  const currentAmount = typeof mySub?.amount === 'number' ? mySub.amount : (plansMap[currentTier]?.[billingCycle] || 0);

  const handleUpgrade = async (tier) => {
    setIsPayingTier(tier);
    setNotice('');
    try {
      const res = await Subscriptions.initialize({ tier, billing_cycle: billingCycle });
      const authUrl = res?.data?.authorization_url;
      if (authUrl) {
        window.location.assign(authUrl);
        return;
      }
      setNotice('Payment link was not returned. Please try again.');
    } catch (e) {
      setNotice(e?.error || 'Could not initialize payment.');
    } finally {
      setIsPayingTier('');
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    setNotice('');
    try {
      await Subscriptions.cancel();
      setNotice('Subscription cancelled successfully.');
      await loadSubscriptionData();
    } catch (e) {
      setNotice(e?.error || 'Could not cancel subscription.');
    } finally {
      setIsCancelling(false);
    }
  };

  const invoices = mySub?.created_at
    ? [{
        date: new Date(mySub.created_at).toLocaleDateString(),
        amount: formatKobo(mySub.amount || 0),
        status: mySub.status === 'active' ? 'Paid' : mySub.status,
      }]
    : [];

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-20">
      <SubScreenHeader title="Subscription" />

      <div className="px-5 pt-4">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-sky-600 to-sky-800 dark:from-sky-900 dark:to-[#080C14] border border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-['Plus_Jakarta_Sans'] text-xs text-sky-200">Your Plan</div>
              <div className="font-['Syne'] font-black text-2xl text-white mt-1">🌟 {(currentTier || 'seeker').toUpperCase()}</div>
            </div>
            <div className="text-right">
              <div className="font-['Plus_Jakarta_Sans'] text-base text-sky-100">
                {currentStatus === 'free' ? 'Free Plan' : `${formatKobo(currentAmount)} / ${mySub?.billing_cycle || billingCycle}`}
              </div>
              <div className="font-['Plus_Jakarta_Sans'] text-xs text-sky-300 mt-1">
                {mySub?.current_period_end
                  ? `Renews ${new Date(mySub.current_period_end).toLocaleDateString()}`
                  : 'No renewal date'}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button
              onClick={handleCancel}
              disabled={isCancelling || currentStatus === 'free'}
              className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-xs font-['Plus_Jakarta_Sans'] font-semibold hover:bg-white/20 active:scale-95 focus:ring-2 focus:ring-white/30 transition-all duration-200 disabled:opacity-50"
            >
              {isCancelling ? 'Cancelling…' : 'Cancel Subscription'}
            </button>
            <button
              onClick={loadSubscriptionData}
              className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-xs font-['Plus_Jakarta_Sans'] font-semibold hover:bg-white/20 active:scale-95 focus:ring-2 focus:ring-white/30 transition-all duration-200"
            >
              Manage Billing
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5">
        {notice ? (
          <div className="mb-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300 text-xs font-semibold px-3 py-2">
            {notice}
          </div>
        ) : null}
        <div className="mb-3 flex gap-2">
          {['monthly', 'annual'].map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                billingCycle === cycle
                  ? 'bg-sky-600 text-white'
                  : 'bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-600 dark:text-sky-300'
              }`}
            >
              {cycle === 'monthly' ? 'Monthly' : 'Annual'}
            </button>
          ))}
        </div>
        <div className="font-['Syne'] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF] mb-4">
          Upgrade Your Plan
        </div>
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="text-sm text-sky-600/70 dark:text-sky-300/70">Loading plans…</div>
          ) : plans.map((plan) => (
            <div
              key={plan.name}
              role="button"
              tabIndex={0}
              className={`rounded-2xl p-5 border-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] focus:ring-2 focus:ring-sky-400/40 cursor-pointer ${
                plan.highlight
                  ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-300 dark:border-sky-600/50'
                  : 'bg-white dark:bg-[#0D1525] border-sky-100 dark:border-sky-900/20 hover:border-sky-300 dark:hover:border-sky-700/40'
              } ${plan.current ? 'ring-2 ring-sky-500' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-['Syne'] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">{plan.name}</div>
                  {plan.current && (
                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-['Plus_Jakarta_Sans'] font-semibold">
                      Current Plan
                    </div>
                  )}
                </div>
                <div className="font-['Plus_Jakarta_Sans'] text-xl font-black text-sky-700 dark:text-sky-400">{plan.price}</div>
              </div>

              <div className="mt-4 space-y-2">
                {['Unlimited questions', 'Advanced analytics', 'Priority support', 'AI tutor boosts'].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm font-['Plus_Jakarta_Sans'] text-[#0369A1] dark:text-[#7DD3FC]">
                    <span className="text-green-500 text-xs">✅</span> {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => !plan.current && handleUpgrade(plan.key)}
                disabled={plan.current || isPayingTier === plan.key}
                className={`w-full mt-4 py-3 rounded-xl text-sm font-['Syne'] font-bold transition-all duration-200 hover:scale-[1.01] active:scale-95 focus:ring-2 focus:ring-sky-400/40 ${
                  plan.current
                    ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-300 cursor-not-allowed opacity-60'
                    : 'bg-[#0369A1] dark:bg-[#0EA5E9] text-white hover:bg-[#0284C7] dark:hover:bg-[#38BDF8]'
                }`}
              >
                {plan.current ? 'Current Plan' : isPayingTier === plan.key ? 'Redirecting…' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5 mb-4">
        <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
          <div className="font-['Syne'] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF] mb-4">
            Billing History
          </div>
          {invoices.length === 0 ? (
            <div className="text-sm text-sky-600/70 dark:text-sky-300/70">No billing records yet.</div>
          ) : invoices.map((inv) => (
            <div key={inv.date} className="flex items-center justify-between py-3 border-b border-sky-50 dark:border-sky-900/20 last:border-b-0">
              <div className="font-['Plus_Jakarta_Sans'] text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">{inv.date}</div>
              <div className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">{inv.amount}</div>
              <div className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-xs font-bold font-['Plus_Jakarta_Sans']">
                {inv.status}
              </div>
              <button className="text-xs text-sky-600 dark:text-sky-400 font-['Plus_Jakarta_Sans'] hover:underline active:scale-95 focus:ring-2 focus:ring-sky-400/40 transition-all duration-200">
                ↓ Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

