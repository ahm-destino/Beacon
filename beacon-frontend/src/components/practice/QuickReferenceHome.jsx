import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Calculator, Scale, Beaker, BookA } from 'lucide-react';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function QuickReferenceHome() {
  const navigate = useNavigate();
  const items = [
    { id: 'periodic', label: 'Periodic Table', sub: 'Interactive elemental mapping', icon: Grid, path: '/practice/reference/periodic', color: 'text-sky-500', bg: 'bg-sky-100 dark:bg-sky-900/30' },
    { id: 'formulas', label: 'Formula Sheet', sub: 'Math, physics, & chemistry', icon: Calculator, path: '/practice/reference/formulas', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { id: 'converter', label: 'Unit Converter', sub: 'SI units, derived units', icon: Scale, path: '/practice/reference/converter', color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { id: 'lab', label: 'Lab Equipment', sub: 'Names, functions, & tips', icon: Beaker, path: '/practice/reference/lab', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { id: 'literary', label: 'Literary Terms', sub: 'Glossary with examples', icon: BookA, path: '/practice/reference/literary', color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30' },
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      <SubScreenHeader title="Quick Reference" />
      
      <div className="flex-1 px-5 pt-6 pb-24 space-y-3">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="w-full bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 flex items-center gap-4 text-left shadow-sm hover:border-sky-300 dark:hover:border-sky-700/50 transition-colors active:scale-[0.98]"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
              <item.icon size={24} />
            </div>
            <div className="flex-1">
              <p className="font-[var(--font-syne)] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF]">{item.label}</p>
              <p className="font-[var(--font-jakarta)] text-xs text-sky-600/70 dark:text-sky-400/70 mt-0.5">{item.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

