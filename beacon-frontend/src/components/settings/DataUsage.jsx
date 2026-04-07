import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wifi, Zap, Plane, CheckCircle2 } from 'lucide-react';

const MODES = [
  {
    id: 'Standard',
    icon: Wifi,
    title: 'Standard',
    desc: 'HD video quality. Full resolution images.',
    usage: '~50MB per hour of use.'
  },
  {
    id: 'Data Saver',
    icon: Zap,
    title: 'Data Saver',
    desc: 'SD video quality. Compressed images.',
    usage: '~15MB per hour. Good for limited data bundles.'
  },
  {
    id: 'Offline Mode',
    icon: Plane,
    title: 'Offline Mode',
    desc: 'Download content on WiFi, use without internet later.',
    usage: '~0MB when studying offline.'
  }
];

export default function DataUsage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('Standard');

  const handleSelect = (id) => {
    setSelected(id);
    alert(`Data usage set to ${id} ✓`);
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <div className="px-5 pt-6 flex items-center justify-between mb-8">
        <button onClick={() => navigate('/settings')} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Data Usage</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        <div className="space-y-4 mb-12">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleSelect(mode.id)}
              className={`w-full text-left p-6 rounded-[2.5rem] border-2 transition-all duration-300 flex items-start gap-4 ${
                selected === mode.id 
                  ? 'border-sky-600 bg-white dark:bg-[#0D1525] shadow-xl shadow-sky-600/10 scale-[1.02]' 
                  : 'border-transparent bg-white dark:bg-[#0D1525] opacity-60'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${selected === mode.id ? 'bg-sky-600 text-white' : 'bg-sky-50 dark:bg-sky-900/20 text-sky-400'}`}>
                <mode.icon size={24} />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-['Syne'] font-black text-base text-[#0C4A6E] dark:text-[#F0F9FF]">{mode.title}</h3>
                  {selected === mode.id && <CheckCircle2 size={18} className="text-sky-600" />}
                </div>
                <p className="text-[11px] font-bold text-sky-600/80 dark:text-sky-400/80 mb-3 leading-relaxed">{mode.desc}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#0C4A6E] dark:text-[#F0F9FF]">{mode.usage}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-[10px] font-black uppercase text-sky-600/30 tracking-widest">
           Settings are saved automatically
        </p>
      </div>
    </div>
  );
}
