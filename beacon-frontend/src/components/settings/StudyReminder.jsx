import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';
import { Users } from '../../services/api';

const DAYS = [
  { id: 'M', label: 'Mon' },
  { id: 'T', label: 'Tue' },
  { id: 'W', label: 'Wed' },
  { id: 'T2', label: 'Thu' },
  { id: 'F', label: 'Fri' },
  { id: 'S', label: 'Sat' },
  { id: 'S2', label: 'Sun' }
];

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

export default function StudyReminder() {
  const navigate = useNavigate();
  const [reminderOn, setReminderOn] = useState(true);
  const [hour, setHour] = useState('06');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('PM');
  const [repeat, setRepeat] = useState('Every day');
  const [customDays, setCustomDays] = useState(['M', 'T', 'W', 'T2', 'F']);
  const [loading, setLoading] = useState(false);

  // Load current setting on mount
  useEffect(() => {
    const loadSetting = async () => {
      try {
        const res = await Users.getMe();
        if (res?.data?.study_reminder_time) {
          const time = res.data.study_reminder_time;
          const [h, m] = time.split(':');
          setHour(h);
          setMinute(m);
        }
      } catch (err) {
        // Silent fail
      }
    };
    loadSetting();
  }, []);

  const toggleDay = (id) => {
    if (customDays.includes(id)) {
      setCustomDays(customDays.filter(d => d !== id));
    } else {
      setCustomDays([...customDays, id]);
    }
  };

  const getPreviewText = () => {
    let daysText = repeat;
    if (repeat === 'Custom days') {
      daysText = customDays.length === 7 ? 'every day' : `on ${customDays.length} days`;
    }
    return `You'll be reminded at ${hour}:${minute} ${period} ${daysText.toLowerCase()}`;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const timeString = `${hour}:${minute}`;
      await Users.updateMe({ study_reminder_time: timeString });
      toast.success(`Reminder set for ${hour}:${minute} ✓`);
      navigate('/settings', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save reminder');
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
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Study Reminder</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        {/* MAIN TOGGLE */}
        <div className="bg-white dark:bg-[#0D1525] p-6 rounded-[2rem] border border-sky-100 dark:border-sky-900/10 shadow-sm flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${reminderOn ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-400'}`}>
              <Clock size={24} />
            </div>
            <div>
              <p className="font-black text-[#0C4A6E] dark:text-[#F0F9FF]">Daily study reminder</p>
              <p className="text-[10px] font-bold text-sky-600/40 uppercase tracking-widest mt-0.5">{reminderOn ? 'Active' : 'Disabled'}</p>
            </div>
          </div>
          <Toggle on={reminderOn} onChange={() => setReminderOn(!reminderOn)} />
        </div>

        <div className={!reminderOn ? 'opacity-40 pointer-events-none transition-opacity' : 'transition-opacity'}>
          {/* TIME WHEEL (SIMULATED) */}
          <div className="bg-white dark:bg-[#0D1525] rounded-[2rem] border border-sky-100 dark:border-sky-900/10 p-8 shadow-xl shadow-sky-600/5 mb-8 text-center">
             <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-600/30 mb-2">Hour</span>
                  <select 
                    value={hour} 
                    onChange={(e) => setHour(e.target.value)}
                    className="appearance-none bg-sky-50 dark:bg-sky-900/20 w-16 h-20 rounded-2xl text-3xl font-black text-sky-600 outline-none text-center flex items-center justify-center"
                  >
                    {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div className="text-3xl font-black text-sky-200 mt-6">:</div>
                <div className="flex flex-col items-center">
                   <span className="text-[10px] font-black uppercase tracking-widest text-sky-600/30 mb-2">Min</span>
                   <select 
                    value={minute} 
                    onChange={(e) => setMinute(e.target.value)}
                    className="appearance-none bg-sky-50 dark:bg-sky-900/20 w-16 h-20 rounded-2xl text-3xl font-black text-sky-600 outline-none text-center flex items-center justify-center"
                  >
                    {Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0')).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-[10px] font-black uppercase tracking-widest text-sky-600/30 mb-2">Period</span>
                   <div className="flex flex-col gap-2">
                     {['AM', 'PM'].map(p => (
                       <button 
                        key={p} 
                        onClick={() => setPeriod(p)}
                        className={`w-12 py-1 rounded-lg text-xs font-black tracking-widest transition-all ${period === p ? 'bg-sky-600 text-white' : 'bg-sky-50 dark:bg-sky-900/20 text-sky-400'}`}
                       >
                         {p}
                       </button>
                     ))}
                   </div>
                </div>
             </div>
          </div>

          {/* REPEAT OPTIONS */}
          <div className="bg-white dark:bg-[#0D1525] rounded-[2rem] border border-sky-100 dark:border-sky-900/10 p-6 shadow-sm mb-8">
            <h3 className="text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-4 flex items-center gap-2">
              <CalendarDays size={14} /> Repeat Options
            </h3>
            <div className="space-y-4">
              {['Every day', 'Weekdays only (Mon-Fri)', 'Custom days'].map((option) => (
                <button 
                  key={option}
                  onClick={() => setRepeat(option)}
                  className="w-full flex items-center justify-between"
                >
                  <span className={`font-bold text-sm ${repeat === option ? 'text-sky-600' : 'text-[#0C4A6E] dark:text-[#F0F9FF]'}`}>{option}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${repeat === option ? 'border-sky-600 bg-sky-600' : 'border-sky-200'}`}>
                    {repeat === option && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in" />}
                  </div>
                </button>
              ))}
            </div>

            {repeat === 'Custom days' && (
              <div className="flex justify-between mt-8 animate-in slide-in-from-top-2 duration-300">
                {DAYS.map(day => (
                  <button 
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black tracking-widest transition-all ${
                      customDays.includes(day.id) ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'bg-sky-50 dark:bg-sky-900/20 text-sky-400'
                    }`}
                  >
                    {day.id.substring(0, 1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PREVIEW */}
          <div className="text-center px-4 mb-4">
             <p className="text-xs font-black text-sky-600/40 bg-sky-50 dark:bg-sky-900/10 py-3 rounded-2xl flex items-center justify-center gap-2">
               <CheckCircle2 size={14} className="text-sky-400" />
               {getPreviewText()}
             </p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full py-5 bg-sky-600 text-white rounded-[2.5rem] font-[var(--font-syne)] font-black text-base shadow-xl shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Reminder'}
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
