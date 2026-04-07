import React, { useState } from 'react';
import { Search, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function FormulaSheet() {
  const [activeTab, setActiveTab] = useState('Mathematics');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState({});

  const tabs = ['Mathematics', 'Physics', 'Chemistry'];

  const formulas = [
    { id: 'math1', subject: 'Mathematics', name: 'Quadratic Equation', formula: 'x = (-b ± √(b² - 4ac)) / 2a', example: 'Solve x² - 5x + 6 = 0.\na=1, b=-5, c=6.\nx = (5 ± √(25 - 24)) / 2\nx = (5 ± 1) / 2\nx = 3 or 2' },
    { id: 'math2', subject: 'Mathematics', name: 'Area of a Circle', formula: 'A = πr²', example: 'r = 7cm. A = (22/7) * 49 = 154 cm²' },
    { id: 'phys1', subject: 'Physics', name: 'Newton\'s Second Law', formula: 'F = ma', example: 'm = 10kg, a = 2m/s²\nF = 10 * 2 = 20N' },
    { id: 'phys2', subject: 'Physics', name: 'Kinetic Energy', formula: 'KE = ½mv²', example: 'm = 2kg, v = 3m/s\nKE = 0.5 * 2 * 9 = 9J' },
    { id: 'chem1', subject: 'Chemistry', name: 'Ideal Gas Law', formula: 'PV = nRT', example: 'P=1atm, V=22.4L, n=1mol, R=0.0821\nT = PV/nR = 273K' }
  ];

  const filtered = formulas.filter(f => 
    f.subject === activeTab && 
    (f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.formula.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      <SubScreenHeader title="Formula Sheet" />
      
      {/* Search & Offline Badge */}
      <div className="bg-white dark:bg-[#0D1525] border-b border-sky-100 dark:border-sky-900/20 pt-4 pb-2 sticky top-[60px] z-10 px-5 space-y-4">
        <div className="flex justify-center">
          <span className="bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-900/40 px-3 py-1 rounded-full text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider shadow-sm flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            Offline Access
          </span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" size={18} />
          <input
            type="text"
            placeholder="Search formulas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-sky-50 dark:bg-[#080C14] border border-sky-100 dark:border-sky-900/30 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-[#0C4A6E] dark:text-[#F0F9FF] placeholder-sky-600/50 dark:placeholder-sky-400/50 transition-all font-[var(--font-jakarta)]"
          />
        </div>

        {/* Math/Phys/Chem Tabs */}
        <div className="flex bg-sky-50 dark:bg-[#080C14] rounded-xl p-1 border border-sky-100 dark:border-sky-900/30">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg transition-all font-[var(--font-syne)] font-bold text-xs ${
                activeTab === tab 
                  ? 'bg-white dark:bg-[#0D1525] text-sky-700 dark:text-sky-400 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-sky-100 dark:border-sky-800' 
                  : 'text-sky-600/60 dark:text-sky-400/60 hover:text-sky-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-24 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center text-sky-600/50 dark:text-sky-400/50 mt-10 font-[var(--font-jakarta)] text-sm">
            No formulas found.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(f => (
              <div key={f.id} className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => toggleExpand(f.id)}
                  className="w-full p-4 flex gap-4 text-left hover:bg-sky-50/50 dark:hover:bg-sky-900/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Calculator size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-[var(--font-syne)] font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">{f.name}</h3>
                    <p className="font-[var(--font-jakarta)] font-bold text-lg text-[#0369A1] dark:text-[#0EA5E9] tracking-wider mt-1">{f.formula}</p>
                  </div>
                  <div className="shrink-0 pt-1 text-sky-400">
                    {expanded[f.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>
                
                {expanded[f.id] && (
                  <div className="p-4 pt-0 border-t border-sky-50 dark:border-sky-900/20 mt-2">
                    <div className="bg-amber-50 dark:bg-[#080C14] rounded-xl p-4 border border-amber-100/50 dark:border-amber-900/20">
                      <h4 className="font-[var(--font-syne)] font-bold text-xs text-amber-700 dark:text-amber-500 uppercase tracking-wider mb-2">Worked Example</h4>
                      <pre className="font-['Fira_Code',monospace] text-xs text-amber-900/80 dark:text-amber-200/80 whitespace-pre-wrap leading-relaxed">
                        {f.example}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
