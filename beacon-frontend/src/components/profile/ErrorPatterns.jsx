import React from 'react';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function ErrorPatterns() {
  const heatRows = [
    { label: 'Algebra', cells: ['high', 'med', 'low', 'high', 'crit'] },
    { label: 'Calculus', cells: ['none', 'low', 'med', 'high', 'high'] },
    { label: 'Geometry', cells: ['low', 'low', 'med', 'low', 'none'] },
    { label: 'Chemistry', cells: ['med', 'high', 'med', 'low', 'none'] },
    { label: 'Physics', cells: ['crit', 'high', 'med', 'med', 'low'] },
  ];

  const colorMap = {
    crit: 'bg-red-500',
    high: 'bg-orange-400',
    med: 'bg-amber-300',
    low: 'bg-green-200',
    none: 'bg-sky-50 dark:bg-sky-900/20',
  };

  const patterns = [
    {
      title: '#1 Sign Errors',
      frequency: '34× this month',
      impact: 'Costing ~15 marks per mock exam',
      exampleA: 'You wrote: 3x = 14 + 5 ✗',
      exampleB: 'Correct: 3x = 14 - 5 ✓',
    },
    {
      title: '#2 Units Mismatch',
      frequency: '21× this month',
      impact: 'Costing ~9 marks per mock exam',
      exampleA: 'You wrote: 20m/s² + 5m',
      exampleB: 'Correct: Convert to same units',
    },
    {
      title: '#3 Poor Diagram',
      frequency: '17× this month',
      impact: 'Costing ~6 marks per mock exam',
      exampleA: 'You wrote: Triangle not labeled',
      exampleB: 'Correct: Label all sides',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-20">
      <SubScreenHeader title="Error Patterns" />

      <div className="px-5 pt-4">
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/20 rounded-2xl p-5">
          <div className="font-['Syne'] font-bold text-base text-red-700 dark:text-red-400 mb-2">
            Your Top Error Patterns
          </div>
          <div className="font-['Plus_Jakarta_Sans'] text-sm text-red-600 dark:text-red-500 leading-relaxed">
            These 5 patterns account for 74% of all your wrong answers. Fix them to jump from 78% to 91%.
          </div>
        </div>
      </div>

      <div className="px-5 mt-4">
        <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
          <div className="font-['Syne'] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF] mb-1">
            Topic Heat Map
          </div>
          <div className="font-['Plus_Jakarta_Sans'] text-xs text-[#0369A1] dark:text-[#7DD3FC] mb-3">
            Darker = more errors
          </div>
          <div className="space-y-2">
            {heatRows.map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <div className="w-24 text-xs font-['Plus_Jakarta_Sans'] text-[#0369A1] dark:text-[#7DD3FC] truncate">
                  {row.label}
                </div>
                <div className="flex gap-1.5">
                  {row.cells.map((cell, idx) => (
                    <div key={idx} className={`w-8 h-8 rounded-md ${colorMap[cell]}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 space-y-3">
        {patterns.map((p) => (
          <div
            key={p.title}
            className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5 border-l-4 border-l-red-400 dark:border-l-red-500/60"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-['Syne'] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF]">{p.title}</div>
                <div className="font-['Plus_Jakarta_Sans'] text-xs text-red-500 mt-1">{p.impact}</div>
              </div>
              <div className="font-['Plus_Jakarta_Sans'] text-xs font-bold bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full px-2 py-0.5">
                {p.frequency}
              </div>
            </div>

            <div className="mt-3 bg-red-50 dark:bg-red-900/10 rounded-xl p-3 font-['Plus_Jakarta_Sans'] text-xs text-red-600 dark:text-red-400">
              <div>{p.exampleA}</div>
              <div>{p.exampleB}</div>
            </div>

            <div className="mt-3 flex gap-2">
              <button className="flex-1 py-2.5 rounded-xl bg-[#0369A1] dark:bg-[#0EA5E9] text-white text-xs font-['Syne'] font-bold hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] active:scale-95 focus:ring-2 focus:ring-sky-400/40 transition-all duration-200">
                🔧 Fix This Pattern
              </button>
              <button className="flex-1 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 text-xs font-['Plus_Jakarta_Sans'] font-semibold hover:bg-sky-100 dark:hover:bg-sky-900/30 active:scale-95 focus:ring-2 focus:ring-sky-400/40 transition-all duration-200">
                See All 34 Instances
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

