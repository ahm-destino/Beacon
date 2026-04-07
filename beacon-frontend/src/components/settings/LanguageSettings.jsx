import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Globe } from 'lucide-react';
import { Users } from '../../services/api';

const LANGUAGES = [
  'English',
  'Pidgin English',
  'Yoruba',
  'Igbo',
  'Hausa'
];

export default function LanguageSettings() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('English');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load current setting on mount
  useEffect(() => {
    const loadSetting = async () => {
      try {
        const res = await Users.getMe();
        if (res?.data?.language_preference) {
          setSelected(res.data.language_preference);
        }
      } catch (err) {
        console.error('Failed to load language:', err);
      }
    };
    loadSetting();
  }, []);

  const handleSelect = async (lang) => {
    if (lang === selected || saving) return;
    
    setSaving(true);
    try {
      await Users.updateMe({ language_preference: lang });
      setSelected(lang);
      toast.success(`Language set to ${lang}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save language');
    } finally {
      setSaving(false);
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
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Language</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-[2rem] bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center mx-auto mb-4 text-sky-600">
            <Globe size={32} />
          </div>
          <p className="text-sm text-sky-600/60 dark:text-sky-400/60 leading-relaxed font-bold">
            Choose your preferred language for AI Tutor explanations.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0D1525] rounded-[2.5rem] border border-sky-100 dark:border-sky-900/10 overflow-hidden shadow-xl shadow-sky-600/5 mb-8">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => handleSelect(lang)}
              disabled={saving}
              className={`w-full flex items-center justify-between px-8 py-6 border-b border-sky-50 dark:border-sky-900/5 last:border-b-0 transition-all ${
                selected === lang ? 'bg-sky-50/50 dark:bg-sky-900/10 text-sky-600' : 'text-[#0C4A6E] dark:text-[#F0F9FF]'
              } ${saving ? 'opacity-50' : ''}`}
            >
              <span className="text-sm font-black tracking-wide">{lang}</span>
              {selected === lang && (
                <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/20">
                  <Check size={14} />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="p-6 bg-sky-50 dark:bg-sky-900/10 rounded-2xl">
          <p className="text-[10px] text-sky-600/60 font-bold text-center leading-relaxed">
            Note: This changes the AI Tutor response language. The app interface stays in English.
          </p>
        </div>
      </div>
    </div>
  );
}
