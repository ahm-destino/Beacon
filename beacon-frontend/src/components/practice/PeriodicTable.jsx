import React, { useState } from 'react';
import { X } from 'lucide-react';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function PeriodicTable() {
  const [selectedEl, setSelectedEl] = useState(null);

  // Mocking an abbreviated grid to demonstrate the layout
  const elements = [
    { num: 1, sym: 'H', name: 'Hydrogen', weight: '1.008', gp: 'nonmetal', row: 1, col: 1 },
    { num: 2, sym: 'He', name: 'Helium', weight: '4.002', gp: 'noble', row: 1, col: 18 },
    { num: 3, sym: 'Li', name: 'Lithium', weight: '6.94', gp: 'alkali', row: 2, col: 1 },
    { num: 4, sym: 'Be', name: 'Beryllium', weight: '9.012', gp: 'alkaline', row: 2, col: 2 },
    { num: 5, sym: 'B', name: 'Boron', weight: '10.81', gp: 'metalloid', row: 2, col: 13 },
    { num: 6, sym: 'C', name: 'Carbon', weight: '12.011', gp: 'nonmetal', row: 2, col: 14 },
    { num: 7, sym: 'N', name: 'Nitrogen', weight: '14.007', gp: 'nonmetal', row: 2, col: 15 },
    { num: 8, sym: 'O', name: 'Oxygen', weight: '15.999', gp: 'nonmetal', row: 2, col: 16 },
    { num: 9, sym: 'F', name: 'Fluorine', weight: '18.998', gp: 'halogen', row: 2, col: 17 },
    { num: 10, sym: 'Ne', name: 'Neon', weight: '20.180', gp: 'noble', row: 2, col: 18 },
    { num: 11, sym: 'Na', name: 'Sodium', weight: '22.990', gp: 'alkali', row: 3, col: 1 },
    { num: 12, sym: 'Mg', name: 'Magnesium', weight: '24.305', gp: 'alkaline', row: 3, col: 2 },
  ];

  const getColor = (gp) => {
    switch(gp) {
      case 'nonmetal': return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50';
      case 'noble': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50';
      case 'alkali': return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700/50';
      case 'alkaline': return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700/50';
      case 'metalloid': return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50';
      case 'halogen': return 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700/50';
      default: return 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700/50';
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      <SubScreenHeader title="Periodic Table" />
      
      <div className="flex-1 px-4 pt-4 pb-24">
        {/* Offline Badge */}
        <div className="flex justify-center mb-6">
          <span className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/30 px-3 py-1 rounded-full text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider shadow-sm flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            Available Offline
          </span>
        </div>

        {/* Scrollable Table Container */}
        <div className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 overflow-x-auto shadow-sm hide-scrollbar">
          <div className="min-w-[800px] grid grid-cols-18 gap-1" style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}>
            {/* Render empty spaces and elements based on row/col */}
            {[1,2,3].map(row => (
              Array.from({length: 18}).map((_, colIdx) => {
                const col = colIdx + 1;
                const el = elements.find(e => e.row === row && e.col === col);
                if (el) {
                  return (
                    <button 
                      key={el.num}
                      onClick={() => setSelectedEl(el)}
                      className={`aspect-square flex flex-col items-center justify-center p-1 rounded-md border text-center transition-transform active:scale-95 ${getColor(el.gp)}`}
                      style={{ gridColumn: col }}
                    >
                      <span className="text-[8px] font-bold self-start opacity-70 leading-none">{el.num}</span>
                      <span className="font-[var(--font-syne)] font-bold text-sm leading-none mt-1">{el.sym}</span>
                    </button>
                  );
                }
                return null;
              })
            ))}
            
            {/* Visual filler for demonstration */}
            <div className="col-span-18 mt-4 text-center text-xs text-sky-600/50 dark:text-sky-400/50 font-[var(--font-jakarta)]">
              (Scroll horizontally. Tap any element for details.)
            </div>
          </div>
        </div>
      </div>

      {/* Detail Popup Overlay */}
      {selectedEl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-[#080C14]/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0D1525] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-sky-100 dark:border-sky-900/30 animate-in zoom-in-95">
            <div className={`p-6 flex flex-col items-center text-center ${getColor(selectedEl.gp).split(' ')[0]} dark:${getColor(selectedEl.gp).split(' ')[3]}`}>
              <div className="w-full flex justify-end mb-2">
                <button onClick={() => setSelectedEl(null)} className="p-1 bg-white/50 dark:bg-black/20 rounded-full active:scale-90">
                  <X size={20} className="text-current" />
                </button>
              </div>
              <h2 className="font-[var(--font-syne)] font-bold text-6xl mb-2">{selectedEl.sym}</h2>
              <p className="font-[var(--font-jakarta)] font-bold text-xl">{selectedEl.name}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-sky-50 dark:border-sky-900/20 pb-2">
                <span className="text-xs text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 uppercase font-bold tracking-wider">Atomic Number</span>
                <span className="font-[var(--font-syne)] font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">{selectedEl.num}</span>
              </div>
              <div className="flex justify-between items-center border-b border-sky-50 dark:border-sky-900/20 pb-2">
                <span className="text-xs text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 uppercase font-bold tracking-wider">Atomic Weight</span>
                <span className="font-[var(--font-syne)] font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">{selectedEl.weight}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-xs text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 uppercase font-bold tracking-wider">Group</span>
                <span className="font-[var(--font-syne)] font-bold text-[#0C4A6E] dark:text-[#F0F9FF] capitalize">{selectedEl.gp}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
