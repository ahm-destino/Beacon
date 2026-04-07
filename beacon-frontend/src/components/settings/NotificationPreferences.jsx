import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Flame, BookOpen, BarChart3, Users, Lightbulb, Sparkles, Save } from 'lucide-react';
import { Users as UsersAPI } from '../../services/api';

function Toggle({ on, disabled, onChange }) {
  return (
    <button
      disabled={disabled}
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
        disabled ? 'bg-sky-100 dark:bg-sky-900/10' : on ? 'bg-sky-600' : 'bg-sky-200 dark:bg-sky-900/30'
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

export default function NotificationPreferences() {
  const navigate = useNavigate();
  const [masterOn, setMasterOn] = useState(true);
  const [preferences, setPreferences] = useState({
    streak_risk: true, streak_milestone: true, streak_broken: true,
    study_daily: true, study_behind: true, study_reviews: true,
    perf_prediction: true, perf_weak: true, perf_badge: true, perf_exam: true,
    social_challenge: true, social_rank: true, social_community: true, social_buddy: true,
    moti_inactive: true, moti_summary: true, moti_monday: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const res = await UsersAPI.getMe();
        if (res?.data) {
          setMasterOn(res.data.notifications_enabled !== false);
          // Load any saved notification preferences if available
          if (res.data.notification_preferences) {
            setPreferences(prev => ({ ...prev, ...res.data.notification_preferences }));
          }
        }
      } catch (err) {
        console.error('Failed to load notification settings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const togglePref = (key) => {
    if (!masterOn) return;
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await UsersAPI.updateMe({ 
        notifications_enabled: masterOn,
        notification_preferences: preferences 
      });
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error('Failed to save notifications');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const sections = [
    {
      title: 'Streak Group',
      icon: Flame,
      items: [
        { key: 'streak_risk', label: 'Streak at risk reminder', sub: '2hrs before midnight' },
        { key: 'streak_milestone', label: 'Streak milestone achieved', sub: '7, 14, 30... days' },
        { key: 'streak_broken', label: 'Streak broken', sub: 'Next morning alert' },
      ]
    },
    {
      title: 'Study Plan Group',
      icon: BookOpen,
      items: [
        { key: 'study_daily', label: 'Daily study reminder', sub: 'At your set time' },
        { key: 'study_behind', label: 'Falling behind schedule', sub: '2+ days behind' },
        { key: 'study_reviews', label: 'Reviews due today', sub: 'Spaced repetition alerts' },
      ]
    },
    {
      title: 'Performance Group',
      icon: BarChart3,
      items: [
        { key: 'perf_prediction', label: 'Score prediction update', sub: 'Significant changes' },
        { key: 'perf_weak', label: 'Weak area mastered', sub: 'When topic hits 80%+' },
        { key: 'perf_badge', label: 'Badge unlocked', sub: 'Immediate notification' },
        { key: 'perf_exam', label: 'Exam countdown', sub: '30, 14, 7... days' },
      ]
    },
    {
      title: 'Social Group',
      icon: Users,
      items: [
        { key: 'social_challenge', label: 'Friend challenge received', sub: 'New challenge alerts' },
        { key: 'social_rank', label: 'Leaderboard rank change', sub: 'When overtaken' },
        { key: 'social_community', label: 'Community answer received', sub: 'Q&A updates' },
        { key: 'social_buddy', label: 'Study buddy activity', sub: 'Buddy session alerts' },
      ]
    },
    {
      title: 'Motivational Group',
      icon: Sparkles,
      items: [
        { key: 'moti_inactive', label: 'Inactive reminders', sub: 'After 2+ days away' },
        { key: 'moti_summary', label: 'Weekly summary', sub: 'Sunday performance' },
        { key: 'moti_monday', label: 'Monday motivation', sub: 'Weekly kick-off' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-20">
      <div className="px-5 pt-6 flex items-center justify-between mb-8">
        <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Notifications</h1>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-10 h-10 flex items-center justify-center bg-sky-600 rounded-xl shadow-sm text-white disabled:opacity-50"
        >
          <Save size={18} />
        </button>
      </div>

      <div className="px-5">
        {/* MASTER TOGGLE */}
        <div className="bg-white dark:bg-[#0D1525] p-6 rounded-[2rem] border-2 border-sky-600/10 shadow-xl shadow-sky-600/5 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${masterOn ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-400'}`}>
              <Bell size={24} />
            </div>
            <div>
              <p className="font-black text-[#0C4A6E] dark:text-[#F0F9FF]">All Notifications</p>
              <p className="text-[10px] font-bold text-sky-600/40 uppercase tracking-widest mt-0.5">Master Switch</p>
            </div>
          </div>
          <Toggle on={masterOn} onChange={() => setMasterOn(!masterOn)} />
        </div>

        {/* GROUPS */}
        <div className="space-y-8">
          {sections.map(section => (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-4 ml-2">
                <section.icon size={14} className="text-sky-400" />
                <h2 className="text-[10px] font-black text-sky-600/40 uppercase tracking-widest">{section.title}</h2>
              </div>
              <div className="bg-white dark:bg-[#0D1525] rounded-[2rem] border border-sky-100 dark:border-sky-900/10 overflow-hidden shadow-sm">
                {section.items.map((item, idx) => (
                  <div 
                    key={item.key}
                    className={`flex items-center justify-between px-6 py-4 border-b border-sky-50 dark:border-sky-900/5 last:border-b-0 ${!masterOn ? 'opacity-40' : ''}`}
                  >
                    <div>
                      <p className="text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">{item.label}</p>
                      <p className="text-[10px] text-sky-600/40 dark:text-sky-400/40 font-bold">{item.sub}</p>
                    </div>
                    <Toggle 
                      on={preferences[item.key]} 
                      disabled={!masterOn}
                      onChange={() => togglePref(item.key)} 
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
