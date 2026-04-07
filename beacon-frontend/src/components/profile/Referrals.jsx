import React, { useEffect, useState } from 'react';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Users } from '../../services/api';
import { toast } from 'sonner';

export default function Referrals() {
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Users.getReferral()
      .then((res) => {
        if (!alive) return;
        setReferral(res?.data || {});
      })
      .catch(() => {
        if (!alive) return;
        setReferral({});
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const referralCode = referral?.referral_code || '?';
  const referralUrl = referral?.referral_link || referral?.referral_url || '';
  const totalReferrals = referral?.total_referrals ?? 0;
  const activeReferrals = referral?.active_referrals ?? 0;
  const subscribedReferrals = referral?.subscribed_referrals ?? 0;
  const pointsEarned = referral?.points_earned ?? 0;
  const referredUsers = referral?.referred_users || [];

  const steps = [
    'Share your code with friends',
    'Friend signs up with your code',
    'You earn +200 points instantly',
    'Earn +500 more when they subscribe',
  ];

  const handleCopy = async () => {
    if (!referralCode || referralCode === '?') return;
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success('Referral code copied');
    } catch (_) {
      toast.error('Could not copy code');
    }
  };

  const handleCopyLink = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast.success('Referral link copied');
    } catch (_) {
      toast.error('Could not copy link');
    }
  };

  const handleShare = async () => {
    if (!referralUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join Beacon',
          text: `Use my code ${referralCode} to join Beacon`,
          url: referralUrl,
        });
      } else {
        await navigator.clipboard.writeText(referralUrl);
        toast.success('Referral link copied');
      }
    } catch (_) {
      toast.error('Could not share');
    }
  };

  const formatDate = (value) => {
    if (!value) return '?';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-20">
      <SubScreenHeader title="Referrals" />

      <div className="px-5 pt-4">
        <div className="rounded-2xl p-6 text-center bg-gradient-to-br from-sky-600 to-sky-700 dark:from-sky-800 dark:to-sky-900 border border-white/10">
          <div className="font-['Plus_Jakarta_Sans'] text-xs text-sky-200 mb-3">Your Referral Code</div>
          <div className="bg-white/20 dark:bg-black/20 backdrop-blur rounded-xl px-6 py-3 border border-white/20">
            <div className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-white tracking-widest">{referralCode}</div>
          </div>
          <button
            onClick={handleCopy}
            className="mt-4 bg-white text-sky-700 rounded-xl px-6 py-2.5 font-['Syne'] font-bold text-sm shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.25)] active:scale-95 focus:ring-2 focus:ring-white/40 transition-all duration-200"
          >
            Copy Code
          </button>

          <div className="mt-4 flex gap-3 justify-center">
            {[
              { label: 'Share', color: 'bg-sky-500', icon: 'S' },
              { label: 'Copy Link', color: 'bg-sky-100 dark:bg-sky-900/30', icon: 'C', text: 'text-sky-600 dark:text-sky-300' },
            ].map((s) => (
              <button
                key={s.label}
                onClick={s.label === 'Copy Link' ? handleCopyLink : handleShare}
                className="flex-1 max-w-[80px] flex flex-col items-center gap-2 transition-all duration-200 hover:scale-[1.03] active:scale-95 focus:ring-2 focus:ring-sky-400/40"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${s.color} ${s.text || 'text-white'}`}>
                  {s.icon}
                </div>
                <div className="text-xs font-['Plus_Jakarta_Sans'] text-sky-200">{s.label}</div>
              </button>
            ))}
          </div>

          {referralUrl ? (
            <div className="mt-3 text-[10px] font-['Plus_Jakarta_Sans'] text-sky-200 break-all">{referralUrl}</div>
          ) : null}
        </div>
      </div>

      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        {[
          { value: String(totalReferrals), label: 'Invited' },
          { value: String(activeReferrals), label: 'Active' },
          { value: String(subscribedReferrals), label: 'Subscribed' },
          { value: String(pointsEarned), label: 'Points earned' },
        ].map((s) => (
          <div key={s.label} className="text-center bg-white dark:bg-[#0D1525] rounded-xl border border-sky-100 dark:border-sky-900/20 p-4">
            <div className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-[#0C4A6E] dark:text-[#F0F9FF]">{s.value}</div>
            <div className="font-['Plus_Jakarta_Sans'] text-xs text-[#0369A1] dark:text-[#7DD3FC] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="px-5 mt-4">
        <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
          <div className="font-['Syne'] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF] mb-4">How Referrals Work</div>
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-['Plus_Jakarta_Sans'] text-sm font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div className="font-['Plus_Jakarta_Sans'] text-sm text-[#0369A1] dark:text-[#7DD3FC] leading-relaxed">
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 mb-4">
        <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
          <div className="font-['Syne'] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF] mb-2">Friends List</div>
          {loading ? (
            <div className="text-xs font-['Plus_Jakarta_Sans'] text-[#0369A1] dark:text-[#7DD3FC]">
              Loading referrals?
            </div>
          ) : referredUsers.length === 0 ? (
            <div className="text-xs font-['Plus_Jakarta_Sans'] text-[#0369A1] dark:text-[#7DD3FC]">
              Your referrals will appear here once they sign up.
            </div>
          ) : (
            <div className="space-y-3">
              {referredUsers.map((u, idx) => (
                <div
                  key={`${u.name}-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-sky-100 dark:border-sky-900/20 px-3 py-2"
                >
                  <div>
                    <div className="font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF]">
                      {u.name}
                    </div>
                    <div className="text-[11px] font-['Plus_Jakarta_Sans'] text-[#0369A1] dark:text-[#7DD3FC]">
                      Joined {formatDate(u.joined)}
                    </div>
                  </div>
                  <div className="text-[11px] font-['Syne'] font-bold uppercase tracking-wide text-sky-600 dark:text-sky-300">
                    {u.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
