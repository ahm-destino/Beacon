import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, BarChart2, BrainCircuit, Sparkles } from 'lucide-react';

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
        on ? 'bg-sky-600' : 'bg-sky-200 dark:bg-sky-900/30'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
          on ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function DataSharing() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState({
    usage: true,
    personalized: true,
    ai_training: false
  });

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <div className="px-5 pt-6 flex items-center justify-between mb-8">
        <button onClick={() => navigate('/settings')} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Data & Privacy</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-[2rem] bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center mx-auto mb-4 text-sky-600">
            <ShieldCheck size={32} />
          </div>
          <p className="text-sm text-sky-600/60 dark:text-sky-400/60 leading-relaxed font-bold">
            We value your privacy. Choose how your data is used to improve Beacon.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0D1525] rounded-[2.5rem] border border-sky-100 dark:border-sky-900/10 overflow-hidden shadow-sm mb-12">
            <div className="flex items-center justify-between px-6 py-6 border-b border-sky-50 dark:border-sky-900/5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 flex items-center justify-center shrink-0">
                  <BarChart2 size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">Usage Analytics</h4>
                  <p className="text-[10px] font-bold text-sky-600/40 mt-1 leading-relaxed">Help us improve the app by sharing anonymous usage data.</p>
                </div>
              </div>
              <Toggle on={prefs.usage} onChange={() => setPrefs(p => ({ ...p, usage: !p.usage }))} />
            </div>

            <div className="flex items-center justify-between px-6 py-6 border-b border-sky-50 dark:border-sky-900/5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">Personalization</h4>
                  <p className="text-[10px] font-bold text-sky-600/40 mt-1 leading-relaxed">Allow us to suggest topics based on your study habits.</p>
                </div>
              </div>
              <Toggle on={prefs.personalized} onChange={() => setPrefs(p => ({ ...p, personalized: !p.personalized }))} />
            </div>

            <div className="flex items-center justify-between px-6 py-6 border-b border-sky-50 dark:border-sky-900/5 last:border-b-0">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 flex items-center justify-center shrink-0">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">AI Training</h4>
                  <p className="text-[10px] font-bold text-sky-600/40 mt-1 leading-relaxed">Let our AI learn from your chat history to improve accuracy.</p>
                </div>
              </div>
              <Toggle on={prefs.ai_training} onChange={() => setPrefs(p => ({ ...p, ai_training: !p.ai_training }))} />
            </div>
        </div>

        <p className="text-center text-[10px] font-black uppercase text-sky-600/30 tracking-widest">
           Settings are saved automatically
        </p>
      </div>
    </div>
  );
}
