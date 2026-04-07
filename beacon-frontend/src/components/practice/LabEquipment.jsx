import React, { useState } from 'react';
import { Search, X, FlaskConical } from 'lucide-react';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function LabEquipment() {
  const [selectedEq, setSelectedEq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const equipment = [
    { name: 'Bunsen Burner', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=200&h=200', func: 'Used for heating, sterilization, and combustion.', tips: 'Always close the air hole before lighting. A roaring blue flame is best for heating.' },
    { name: 'Volumetric Flask', img: 'https://images.unsplash.com/photo-1632515869971-55db5eba96f8?auto=format&fit=crop&q=80&w=200&h=200', func: 'Used to prepare standard solutions accurately.', tips: 'Read from the bottom of the meniscus at eye level. Never heat it.' },
    { name: 'Microscope', img: 'https://images.unsplash.com/photo-1549646401-4be3701da526?auto=format&fit=crop&q=80&w=200&h=200', func: 'Used to observe small objects, even cells.', tips: 'Always carry with two hands (arm and base). Start with the lowest power objective.' },
    { name: 'Burette', img: 'https://images.unsplash.com/photo-1581093588401-fbbadb98b3c6?auto=format&fit=crop&q=80&w=200&h=200', func: 'Used for extremely accurate dispensing of liquids in titrations.', tips: 'Ensure no air bubbles are trapped below the tap before starting.' }
  ];

  const filtered = equipment.filter(eq => eq.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      <SubScreenHeader title="Lab Equipment" />
      
      <div className="bg-white dark:bg-[#0D1525] border-b border-sky-100 dark:border-sky-900/20 pt-4 pb-4 px-5 space-y-4 shadow-sm z-10">
        <div className="flex justify-center">
          <span className="bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-900/40 px-3 py-1 rounded-full text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider shadow-sm flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            Offline Library
          </span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={18} />
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-purple-50 dark:bg-[#080C14] border border-purple-100 dark:border-purple-900/30 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-[#0C4A6E] dark:text-[#F0F9FF] placeholder-purple-600/50 dark:placeholder-purple-400/50 transition-all font-[var(--font-jakarta)]"
          />
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-24 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((eq, i) => (
            <button
              key={i}
              onClick={() => setSelectedEq(eq)}
              className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform flex flex-col items-center p-3"
            >
              <div className="w-full aspect-square bg-sky-50 dark:bg-sky-900/20 rounded-xl overflow-hidden mb-3">
                <img src={eq.img} alt={eq.name} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-screen opacity-90" />
              </div>
              <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] text-center leading-snug">{eq.name}</h3>
            </button>
          ))}
        </div>
      </div>

      {selectedEq && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#080C14]/60 backdrop-blur-sm animate-in fade-in pb-0 sm:pb-5">
          <div className="bg-white dark:bg-[#0D1525] w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border-t border-sky-100 dark:border-sky-900/30 animate-in slide-in-from-bottom-5">
            <div className="p-4 flex justify-between items-center border-b border-sky-50 dark:border-sky-900/20">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <FlaskConical size={20} />
                <h2 className="font-[var(--font-syne)] font-bold text-lg">{selectedEq.name}</h2>
              </div>
              <button onClick={() => setSelectedEq(null)} className="p-2 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full active:scale-90">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="w-full h-48 bg-sky-50 dark:bg-sky-900/20 rounded-2xl overflow-hidden mb-5">
                <img src={selectedEq.img} alt={selectedEq.name} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-screen" />
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-[var(--font-syne)] font-bold text-xs text-sky-500 dark:text-sky-400 uppercase tracking-wider mb-1">Primary Function</h4>
                  <p className="font-[var(--font-jakarta)] text-[#0C4A6E] dark:text-[#F0F9FF] text-sm leading-relaxed">{selectedEq.func}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
                  <h4 className="font-[var(--font-syne)] font-bold text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">Exam Tips / Precautions</h4>
                  <p className="font-[var(--font-jakarta)] text-purple-900 dark:text-purple-200 text-sm leading-relaxed">{selectedEq.tips}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
