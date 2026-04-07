import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function DeleteAccountWarning() {
  const navigate = useNavigate();
  const warnings = [
    'Your 22-day streak will be lost forever',
    'Your 1,247 practice history deleted',
    'Your 4,250 points and 12 badges gone',
    'Your study plan and analytics erased',
  ];

  const alternatives = [
    'I have a technical problem → Contact Support',
    "It's too expensive → See affordable options",
    'I passed my exam! 🎉 → Share your success',
    'I need a break → Pause account instead',
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] px-5 pt-10 pb-10">
      <div className="max-w-md mx-auto text-center">
        <div className="w-20 h-20 rounded-3xl mx-auto mb-6 bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-4xl text-red-500">
          ⚠️
        </div>
        <div className="font-['Syne'] font-black text-2xl text-center text-red-600 dark:text-red-400">
          Are you sure?
        </div>

        <div className="mt-5 space-y-3 text-left">
          {warnings.map((w) => (
            <div key={w} className="flex items-start gap-3">
              <span className="text-red-400 mt-0.5">✕</span>
              <div className="font-['Plus_Jakarta_Sans'] text-sm text-red-600 dark:text-red-400">{w}</div>
            </div>
          ))}
          <div className="font-['Syne'] font-bold text-sm text-red-700 dark:text-red-500">
            THIS CANNOT BE UNDONE
          </div>
        </div>

        <div className="mt-6">
          {alternatives.map((a) => (
            <button
              key={a}
              className="w-full mb-2 py-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 text-sm font-['Plus_Jakarta_Sans'] font-semibold hover:bg-sky-100 dark:hover:bg-sky-900/30 active:scale-95 focus:ring-2 focus:ring-sky-400/40 transition-all duration-200"
            >
              {a}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/settings/delete/reason')}
          className="mt-2 text-red-400 text-sm font-['Plus_Jakarta_Sans'] underline hover:text-red-500 active:scale-95 focus:ring-2 focus:ring-red-400/40 transition-all duration-200"
        >
          I still want to delete →
        </button>
      </div>
    </div>
  );
}

export function DeleteAccountReason() {
  const navigate = useNavigate();
  const reasons = [
    "Passed my exam — don't need it anymore",
    'Too expensive',
    'Not helpful enough',
    'Found a better app',
    'Technical problems',
    'Taking a break',
    'Other',
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] px-5 pt-10 pb-10">
      <div className="max-w-md mx-auto">
        <div className="font-['Syne'] font-black text-xl text-center text-[#0C4A6E] dark:text-[#F0F9FF]">
          Why are you leaving?
        </div>
        <div className="font-['Plus_Jakarta_Sans'] text-sm text-center text-[#0369A1] dark:text-[#7DD3FC] mt-2">
          Help us improve
        </div>

        <div className="mt-5 space-y-2">
          {reasons.map((r) => (
            <button
              key={r}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-sky-100 dark:border-sky-900/20 bg-white dark:bg-[#0D1525] hover:border-sky-300 dark:hover:border-sky-700/40 active:scale-[0.99] focus:ring-2 focus:ring-sky-400/40 transition-all duration-200"
            >
              <span className="w-4 h-4 rounded-full border-2 border-sky-300 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-sky-600" />
              </span>
              <span className="font-['Plus_Jakarta_Sans'] text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">{r}</span>
            </button>
          ))}

          <input
            type="text"
            placeholder="Tell us more..."
            className="w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-[#0D1525] border border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] text-[#0C4A6E] dark:text-[#F0F9FF] placeholder:text-[#7DD3FC] dark:placeholder:text-[rgba(125,211,252,0.4)] outline-none transition-all duration-200 hover:border-[#7DD3FC] active:scale-[0.99] focus:border-[#7DD3FC] dark:focus:border-[rgba(14,165,233,0.30)] focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] focus:bg-[#E0F2FE] dark:focus:bg-[#111D2E]"
          />
        </div>

        <button
          onClick={() => navigate('/settings/delete/confirm')}
          className="w-full mt-6 py-3.5 rounded-xl font-['Syne'] font-bold text-base text-white bg-red-500 hover:bg-red-600 active:scale-[0.98] transition-all duration-200 focus:ring-2 focus:ring-red-300/40"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

export function DeleteAccountFinal() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const enabled = value.trim() === 'DELETE';

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] px-5 pt-10 pb-10">
      <div className="max-w-md mx-auto text-center">
        <div className="font-['Syne'] font-black text-xl text-red-600 dark:text-red-400">Last chance</div>
        <div className="font-['Plus_Jakarta_Sans'] text-sm text-[#0369A1] dark:text-[#7DD3FC] mt-4 mb-3">
          Type DELETE to confirm:
        </div>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full text-center font-['Plus_Jakarta_Sans'] text-lg text-red-600 border-2 border-red-400 rounded-xl px-4 py-3 bg-white dark:bg-[#0D1525] outline-none transition-all duration-200 hover:border-red-500 active:scale-[0.99] focus:ring-2 focus:ring-red-300/40"
          placeholder="DELETE"
        />

        <button
          disabled={!enabled}
          className={`w-full mt-5 py-3.5 rounded-xl font-['Syne'] font-bold text-base text-white transition-all duration-200 focus:ring-2 focus:ring-red-300/40 ${
            enabled ? 'bg-red-500 hover:bg-red-600 active:scale-[0.98]' : 'bg-red-300 opacity-40 cursor-not-allowed'
          }`}
        >
          🗑️ Permanently Delete Account
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="w-full mt-3 py-3.5 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-['Syne'] font-bold text-sm hover:bg-green-100 dark:hover:bg-green-900/30 active:scale-95 focus:ring-2 focus:ring-green-300/40 transition-all duration-200"
        >
          ← Cancel — Keep My Account
        </button>

        <div className="mt-4 text-xs font-['Plus_Jakarta_Sans'] text-[#0369A1] dark:text-[#7DD3FC]">
          Your account will be deleted in 24 hours. You can cancel this from the email we send you.
        </div>
      </div>
    </div>
  );
}

