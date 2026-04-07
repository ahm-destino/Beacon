import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Subscriptions } from '../../services/api';

export default function SubscriptionVerify() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState('Verifying payment…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const reference = params.get('reference');
      if (!reference) {
        setStatus('Missing payment reference.');
        return;
      }

      try {
        const res = await Subscriptions.verify(reference);
        if (cancelled) return;
        setStatus(res?.data?.message || 'Payment verified successfully.');
        setTimeout(() => {
          navigate('/profile/subscription', { replace: true });
        }, 1200);
      } catch (e) {
        if (cancelled) return;
        setStatus(e?.error || 'Payment verification failed.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, params]);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center px-6">
      <div className="max-w-sm w-full bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-6 text-center">
        <h1 className="font-[var(--font-syne)] font-bold text-xl text-[#0C4A6E] dark:text-[#F0F9FF] mb-3">
          Subscription Verification
        </h1>
        <p className="text-sm text-sky-700/80 dark:text-sky-300/80">{status}</p>
      </div>
    </div>
  );
}
