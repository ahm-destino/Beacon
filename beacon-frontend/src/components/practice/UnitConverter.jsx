import React, { useState } from 'react';
import { ArrowRightLeft, Layers } from 'lucide-react';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function UnitConverter() {
  const [activeCategory, setActiveCategory] = useState('Length');
  const [inputValue, setInputValue] = useState('');
  
  const categories = ['Length', 'Mass', 'Temperature', 'Time'];
  
  // Mock simple conversions for UI demo
  const units = {
    Length: ['Meters (m)', 'Centimeters (cm)', 'Kilometers (km)'],
    Mass: ['Kilograms (kg)', 'Grams (g)', 'Milligrams (mg)'],
    Temperature: ['Celsius (°C)', 'Fahrenheit (°F)', 'Kelvin (K)'],
    Time: ['Seconds (s)', 'Minutes (min)', 'Hours (hr)']
  };

  const [fromUnit, setFromUnit] = useState(units['Length'][0]);
  const [toUnit, setToUnit] = useState(units['Length'][1]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setFromUnit(units[cat][0]);
    setToUnit(units[cat][1]);
    setInputValue('');
  };

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      <SubScreenHeader title="Unit Converter" />
      
      <div className="bg-white dark:bg-[#0D1525] border-b border-sky-100 dark:border-sky-900/20 pt-4 pb-4 px-5 space-y-4">
        <div className="flex justify-center">
          <span className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-900/40 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider shadow-sm flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            Offline Enabled
          </span>
        </div>

        {/* Categories (Horizontal Scroll) */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-xl font-[var(--font-syne)] font-bold text-sm whitespace-nowrap transition-colors border ${
                activeCategory === cat 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-white dark:bg-[#0D1525] text-sky-600/60 dark:text-sky-400/60 border-sky-100 dark:border-sky-900/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pt-8 pb-24">
        <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 border border-sky-100 dark:border-sky-900/20 shadow-md relative">
          
          <div className="flex justify-center absolute left-1/2 -ml-6 top-[42%] z-10">
            <button 
              onClick={handleSwap}
              className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 active:scale-95 transition-all"
            >
              <ArrowRightLeft size={20} className="rotate-90 md:rotate-0" />
            </button>
          </div>

          <div className="space-y-6">
            {/* FROM */}
            <div className="bg-sky-50/50 dark:bg-[#080C14] rounded-2xl p-4 border border-sky-100/50 dark:border-sky-900/20">
              <label className="block font-[var(--font-syne)] font-bold text-xs text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-2">From</label>
              <select 
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full bg-transparent font-[var(--font-jakarta)] text-[#0C4A6E] dark:text-[#F0F9FF] font-semibold text-lg focus:outline-none mb-3"
              >
                {units[activeCategory].map(u => <option key={u}>{u}</option>)}
              </select>
              <input 
                type="number"
                placeholder="0.0"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full bg-transparent font-[var(--font-jakarta)] font-bold text-4xl text-[#0369A1] dark:text-[#0EA5E9] focus:outline-none placeholder-sky-200 dark:placeholder-sky-900"
              />
            </div>

            {/* TO */}
            <div className="bg-emerald-50/30 dark:bg-emerald-900/5 rounded-2xl p-4 border border-emerald-100/50 dark:border-emerald-900/20">
              <label className="block font-[var(--font-syne)] font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">To</label>
              <select 
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full bg-transparent font-[var(--font-jakarta)] text-[#0C4A6E] dark:text-[#F0F9FF] font-semibold text-lg focus:outline-none mb-3"
              >
                {units[activeCategory].map(u => <option key={u}>{u}</option>)}
              </select>
              <div className="font-[var(--font-jakarta)] font-bold text-4xl text-emerald-600 dark:text-emerald-400 overflow-x-auto hide-scrollbar">
                {inputValue ? (parseFloat(inputValue) * 1.5).toFixed(2) : '0.0'} {/* Fake conversion multiplier */}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-sky-50 dark:border-sky-900/20 flex gap-2 items-start text-xs text-sky-600/70 dark:text-sky-400/70 font-[var(--font-jakarta)]">
            <Layers size={14} className="shrink-0 mt-0.5" />
            <p>Formula: Multiply by 1.5 (Demo mock logic)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
