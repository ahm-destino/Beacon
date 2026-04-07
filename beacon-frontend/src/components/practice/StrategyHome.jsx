import React from 'react';
import { useNavigate } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function StrategyHome() {
  const navigate = useNavigate();
  const strategies = [
    { id: 'jamb', path: '/practice/strategy/jamb', icon: '🎓', name: 'JAMB UTME', sub: 'University entrance exam' },
    { id: 'waec', path: '/practice/strategy/waec', icon: '📝', name: 'WAEC SSCE', sub: "West African O'Level" },
    { id: 'neco', path: '/practice/strategy/neco', icon: '📋', name: 'NECO SSCE', sub: "National O'Level" },
    { id: 'jupeb', path: '/practice/strategy/jupeb', icon: '🏆', name: 'JUPEB', sub: 'Direct entry to 200 level' },
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="Exam Strategy" />
      <div className="px-5 pt-4">
        <p className="font-[var(--font-jakarta)] text-sm text-[#0C4A6E]/70 dark:text-[#F0F9FF]/70">
          Pick your exam to see the full strategy guide
        </p>
      </div>
      <div className="px-5 pt-4 pb-24 grid grid-cols-2 gap-3">
        {strategies.map(strategy => (
          <button
            key={strategy.id}
            onClick={() => navigate(strategy.path)}
            className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 text-left hover:border-sky-300 transition-all"
          >
            <div className="text-2xl mb-3">{strategy.icon}</div>
            <p className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9]">{strategy.name}</p>
            <p className="font-[var(--font-jakarta)] text-xs text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 mt-1 leading-snug">{strategy.sub}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
