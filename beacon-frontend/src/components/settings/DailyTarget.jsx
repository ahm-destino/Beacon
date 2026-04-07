import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Minus, Timer, CheckCircle2 } from 'lucide-react';
import { Users } from '../../services/api';

const PRESETS = [
  { val: 10, time: '10 minutes' },
  { val: 25, time: '25 minutes' },
  { val: 45, time: '45 minutes', default: true },
  { val: 100, time: '1.5 hours' },
  { val: 200, time: '3 hours' }
];

export default function DailyTarget() {
  const navigate = useNavigate();
  const [target, setTarget] = useState(45);
  const [loading, setLoading] = useState(false);

  // Load current target on mount
  useEffect(() => {
    const loadTarget = async () => {
      try {
        const res = await Users.getMe();
        if (res?.data?.daily_question_goal) {
          setTarget(res.data.daily_question_goal);
        }
      } catch (err) {
        // Silent fail
      }
    };
    loadTarget();
  }, []);

  const adjustTarget = (delta) => {
    setTarget(prev => Math.min(200, Math.max(10, prev + delta)));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await Users.updateMe({ daily_question_goal: target });
      toast.success(`Daily target set to ${target} questions ✓`);
      navigate('/settings', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save target');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <div className="px-5 pt-6 flex items-center justify-between mb-8">
        <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Daily Target</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        <p className="text-sm font-bold text-sky-600/60 dark:text-sky-400/60 mb-12 text-center leading-relaxed">
          How many questions would you like to answer each day?
        </p>

        {/* COUNTER */}
        <div className="bg-white dark:bg-[#0D1525] rounded-[2.5rem] border border-sky-100 dark:border-sky-900/10 p-10 shadow-xl shadow-sky-600/5 mb-8 text-center">
          <div className="flex items-center justify-between max-w-[240px] mx-auto">
            <button 
              onClick={() => adjustTarget(-5)}
              className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 flex items-center justify-center active:scale-90 transition-all"
            >
              <Minus size={24} />
            </button>
            <div className="flex flex-col items-center">
              <span 
                onClick={() => {
                  const val = prompt("Enter daily question target (10-200):", target);
                  if (val && !isNaN(val)) setTarget(Math.min(200, Math.max(10, parseInt(val))));
                }}
                className="text-6xl font-[var(--font-syne)] font-black text-[#0C4A6E] dark:text-[#F0F9FF] cursor-pointer"
              >
                {target}
              </span>
              <span className="text-[10px] font-black uppercase text-sky-600/40 tracking-widest mt-2">Questions</span>
            </div>
            <button 
              onClick={() => adjustTarget(5)}
              className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 flex items-center justify-center active:scale-90 transition-all"
            >
              <Plus size={24} />
            </button>
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-sky-600/60 font-bold bg-sky-50 dark:bg-sky-900/10 py-3 rounded-2xl">
            <Timer size={16} />
            <span className="text-xs">Estimated study time: ~{target} minutes</span>
          </div>
        </div>

        {/* PRESETS */}
        <div className="bg-white dark:bg-[#0D1525] rounded-[2rem] border border-sky-100 dark:border-sky-900/10 overflow-hidden shadow-sm mb-12">
          {PRESETS.map((preset) => (
            <button
              key={preset.val}
              onClick={() => setTarget(preset.val)}
              className={`w-full flex items-center justify-between px-6 py-4 border-b border-sky-50 dark:border-sky-900/5 last:border-b-0 transition-all ${
                target === preset.val ? 'bg-sky-600 text-white' : 'hover:bg-sky-50'
              }`}
            >
              <div className="flex flex-col text-left">
                <span className={`text-sm font-black ${target === preset.val ? 'text-white' : 'text-[#0C4A6E] dark:text-[#F0F9FF]'}`}>
                  {preset.val} questions
                </span>
                <span className={`text-[10px] font-bold ${target === preset.val ? 'text-white/60' : 'text-sky-600/40'}`}>
                   ~{preset.time}
                </span>
              </div>
              {target === preset.val && <CheckCircle2 size={18} />}
            </button>
          ))}
        </div>

        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full py-5 bg-sky-600 text-white rounded-[2.5rem] font-[var(--font-syne)] font-black text-base shadow-xl shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Target'}
        </button>
        <button 
          onClick={handleBack}
          className="w-full mt-4 py-4 bg-sky-50 dark:bg-sky-900/20 text-sky-600 rounded-2xl font-black text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
