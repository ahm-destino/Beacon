import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function DiagramLibrary() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Biology', 'Chemistry', 'Physics'];

  const diagrams = [
    { id: 'cell', name: 'Plant Cell Structure', subject: 'Biology', img: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'heart', name: 'Human Heart Internal', subject: 'Biology', img: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'atom', name: 'Bohr Model of Atom', subject: 'Chemistry', img: 'https://images.unsplash.com/photo-1614935151651-0bea6508abb0?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'eye', name: 'The Human Eye', subject: 'Physics', img: 'https://images.unsplash.com/photo-1628126235206-5260b9ea6441?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'kidney', name: 'Kidney Nephron', subject: 'Biology', img: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'motor', name: 'DC Motor Layout', subject: 'Physics', img: 'https://images.unsplash.com/photo-1628126235206-5260b9ea6441?auto=format&fit=crop&q=80&w=200&h=200' },
  ];

  const filteredDiagrams = activeFilter === 'All' 
    ? diagrams 
    : diagrams.filter(d => d.subject === activeFilter);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      <SubScreenHeader title="Interactive Diagrams" />
      
      {/* FILTERS */}
      <div className="bg-white dark:bg-[#0D1525] border-b border-sky-100 dark:border-sky-900/20 pt-2 sticky top-[60px] z-10 px-2 overflow-x-auto hide-scrollbar">
        <div className="flex min-w-max gap-2 pb-2">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl font-[var(--font-syne)] font-bold text-sm whitespace-nowrap transition-colors ${
                activeFilter === filter 
                  ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300' 
                  : 'text-sky-600/60 dark:text-sky-400/60 hover:bg-sky-50 dark:hover:bg-[#080C14]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-24">
        {filteredDiagrams.length === 0 ? (
          <div className="text-center text-sky-600/50 dark:text-sky-400/50 mt-10 font-[var(--font-jakarta)] text-sm">
            No diagrams found for this subject.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredDiagrams.map(diagram => (
              <button
                key={diagram.id}
                onClick={() => navigate(`/practice/diagrams/${diagram.id}`, { state: { diagram } })}
                className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl overflow-hidden flex flex-col text-left active:scale-[0.98] transition-transform shadow-sm"
              >
                <div className="w-full aspect-square bg-sky-50 dark:bg-sky-900/20 relative">
                  <img 
                    src={diagram.img} 
                    alt={diagram.name}
                    className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-screen opacity-80"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
                    {diagram.subject}
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] leading-snug line-clamp-2">
                    {diagram.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
