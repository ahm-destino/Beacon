import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Check, Sparkles, Zap, Sprout } from 'lucide-react';
import { Users } from '../../services/api';

const LEVELS = [
  {
    id: 'Basic',
    icon: Sprout,
    title: '🌱 Basic',
    desc: 'Short, simple answers. Just the core idea. No jargon.',
    bestFor: 'Quick revision, simple recall',
    color: 'sky'
  },
  {
    id: 'Normal',
    icon: Zap,
    title: '⚡ Normal',
    desc: 'Step-by-step with examples. Clear and structured.',
    bestFor: 'Learning new concepts',
    recommended: true,
    color: 'sky'
  },
  {
    id: 'Deep',
    icon: Sparkles,
    title: '🔥 Deep',
    desc: 'Full breakdown with Nigerian examples, exam tips, common mistakes.',
    bestFor: 'Complex topics, deep understanding',
    color: 'sky'
  }
];

export default function ExplanationLevel() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('Normal');
  const [loading, setLoading] = useState(false);

  // Load current setting on mount
  useEffect(() => {
    const loadSetting = async () => {
      try {
        const res = await Users.getMe();
        if (res?.data?.explanation_level) {
          setSelected(res.data.explanation_level);
        }
      } catch (err) {
        // Silent fail
      }
    };
    loadSetting();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await Users.updateMe({ explanation_level: selected.toLowerCase() });
      toast.success("Explanation level saved!");
      navigate('/settings', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save');
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
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Explanation Level</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        <p className="text-sm font-bold text-sky-600/60 dark:text-sky-400/60 mb-8 text-center leading-relaxed">
          How detailed would you like the AI Tutor's explanations to be by default?
        </p>

        <div className="space-y-4 mb-12">
          {LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelected(level.id)}
              className={`relative w-full text-left p-6 rounded-[2.5rem] border-2 transition-all duration-300 ${
                selected === level.id 
                  ? 'border-sky-600 bg-white dark:bg-[#0D1525] shadow-xl shadow-sky-600/10 scale-[1.02]' 
                  : 'border-transparent bg-white dark:bg-[#0D1525] opacity-60'
              }`}
            >
              {level.recommended && (
                <div className="absolute -top-3 left-6 bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                  Recommended
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selected === level.id ? 'bg-sky-600 text-white' : 'bg-sky-50 dark:bg-sky-900/20 text-sky-400'}`}>
                    <level.icon size={24} />
                 </div>
                 {selected === level.id && (
                   <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center">
                     <Check size={14} />
                   </div>
                 )}
              </div>

              <h3 className="font-['Syne'] font-black text-lg text-[#0C4A6E] dark:text-[#F0F9FF] mb-2">{level.title}</h3>
              <p className="text-xs font-bold text-sky-600/80 dark:text-sky-400/80 mb-3 leading-relaxed">{level.desc}</p>
              
              <div className="pt-3 border-t border-sky-50 dark:border-sky-900/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-600/30">Best for</p>
                <p className="text-[10px] font-bold text-[#0C4A6E] dark:text-[#F0F9FF] mt-1">{level.bestFor}</p>
              </div>
            </button>
          ))}
        </div>

        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full py-5 bg-sky-600 text-white rounded-[2.5rem] font-[var(--font-syne)] font-black text-base shadow-xl shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Preference'}
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
