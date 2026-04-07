import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, BookOpen, GraduationCap, Microscope, Zap } from 'lucide-react';
import { Users } from '../../services/api';

const STYLES = [
  {
    id: 'Standard',
    icon: GraduationCap,
    title: 'Standard',
    desc: 'AI gives you the full explanation straight away.',
    bestFor: 'Students who want direct answers fast.'
  },
  {
    id: 'Guided',
    icon: Zap,
    title: 'Guided',
    desc: 'AI explains step by step and checks understanding at each stage.',
    bestFor: 'Deep learning and retention.',
    recommended: true
  },
  {
    id: 'Socratic',
    icon: Microscope,
    title: 'Socratic',
    desc: 'AI asks you questions to help you discover the answer yourself.',
    bestFor: 'Building critical thinking skills.'
  },
  {
    id: 'Direct',
    icon: BookOpen,
    title: 'Direct',
    desc: 'Just the answer, minimal explanation.',
    bestFor: 'Quick last-minute revision.'
  }
];

export default function TeachingStyle() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('Guided');
  const [loading, setLoading] = useState(false);

  // Load current setting on mount
  useEffect(() => {
    const loadSetting = async () => {
      try {
        const res = await Users.getMe();
        if (res?.data?.teaching_style) {
          setSelected(res.data.teaching_style);
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
      await Users.updateMe({ teaching_style: selected });
      toast.success("Teaching style saved!");
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
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Teaching Style</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        <p className="text-sm font-bold text-sky-600/60 dark:text-sky-400/60 mb-8 text-center leading-relaxed">
          How would you like the AI to help you learn?
        </p>

        <div className="space-y-4 mb-12">
          {STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelected(style.id)}
              className={`relative w-full text-left p-6 rounded-[2.5rem] border-2 transition-all duration-300 ${
                selected === style.id 
                  ? 'border-sky-600 bg-white dark:bg-[#0D1525] shadow-xl shadow-sky-600/10 scale-[1.02]' 
                  : 'border-transparent bg-white dark:bg-[#0D1525] opacity-60'
              }`}
            >
              {style.recommended && (
                <div className="absolute -top-3 left-6 bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                  Recommended
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selected === style.id ? 'bg-sky-600 text-white' : 'bg-sky-50 dark:bg-sky-900/20 text-sky-400'}`}>
                    <style.icon size={24} />
                 </div>
                 {selected === style.id && (
                   <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center">
                     <Check size={14} />
                   </div>
                 )}
              </div>

              <h3 className="font-['Syne'] font-black text-lg text-[#0C4A6E] dark:text-[#F0F9FF] mb-2">{style.title}</h3>
              <p className="text-xs font-bold text-sky-600/80 dark:text-sky-400/80 mb-3 leading-relaxed">{style.desc}</p>
              
              <div className="pt-3 border-t border-sky-50 dark:border-sky-900/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-600/30">Best for</p>
                <p className="text-[10px] font-bold text-[#0C4A6E] dark:text-[#F0F9FF] mt-1">{style.bestFor}</p>
              </div>
            </button>
          ))}
        </div>

        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full py-5 bg-sky-600 text-white rounded-[2.5rem] font-[var(--font-syne)] font-black text-base shadow-xl shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Style'}
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
