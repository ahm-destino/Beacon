import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, BookA } from 'lucide-react';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function LiteraryTerms() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState({});

  const terms = [
    { name: 'Alliteration', def: 'The occurrence of the same letter or sound at the beginning of adjacent or closely connected words.', ex: 'Peter Piper picked a peck of pickled peppers.', pq: 'JAMB 2018: "The sun sank slowly seating itself in the sea." This illustrates...' },
    { name: 'Hyperbole', def: 'Exaggerated statements or claims not meant to be taken literally.', ex: 'I am so hungry I could eat a horse.', pq: 'WAEC 2021: Identify the figure of speech in "He cried a river of tears."' },
    { name: 'Metaphor', def: 'A figure of speech in which a word or phrase is applied to an object or action to which it is not literally applicable.', ex: 'The snow is a white blanket.', pq: 'NECO 2020: Differentiate between simile and metaphor using examples.' },
    { name: 'Onomatopoeia', def: 'The formation of a word from a sound associated with what is named.', ex: 'The bees buzzed and the brook babbled.', pq: 'JAMB 2015: The word "hiss" is an example of what figure of speech?' },
    { name: 'Oxymoron', def: 'A figure of speech in which apparently contradictory terms appear in conjunction.', ex: 'Deafening silence.', pq: 'WAEC 2019: Explain the use of oxymoron in Shakespeare\'s Romeo and Juliet.' },
  ];

  const filtered = terms.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleExpand = (name) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }));

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      <SubScreenHeader title="Literary Terms" />
      
      <div className="bg-white dark:bg-[#0D1525] border-b border-sky-100 dark:border-sky-900/20 pt-4 pb-4 px-5 space-y-4 shadow-sm z-10 sticky top-[60px]">
        <div className="flex justify-center">
          <span className="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-900/40 px-3 py-1 rounded-full text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider shadow-sm flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            Offline Glossary
          </span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400" size={18} />
          <input
            type="text"
            placeholder="Search terms (e.g., Metaphor)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-rose-50 dark:bg-[#080C14] border border-rose-100 dark:border-rose-900/30 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-[#0C4A6E] dark:text-[#F0F9FF] placeholder-rose-600/50 dark:placeholder-rose-400/50 transition-all font-[var(--font-jakarta)]"
          />
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-24 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center text-sky-600/50 dark:text-sky-400/50 mt-10 font-[var(--font-jakarta)] text-sm">
            No terms found.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.sort((a,b)=>a.name.localeCompare(b.name)).map(term => (
              <div key={term.name} className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => toggleExpand(term.name)}
                  className="w-full p-4 flex gap-4 text-left hover:bg-sky-50/50 dark:hover:bg-sky-900/10 transition-colors items-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center shrink-0">
                    <BookA size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-[var(--font-syne)] font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">{term.name}</h3>
                  </div>
                  <div className="shrink-0 pt-1 text-sky-400">
                    {expanded[term.name] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>
                
                {expanded[term.name] && (
                  <div className="p-4 pt-2 border-t border-sky-50 dark:border-sky-900/10">
                    <p className="font-[var(--font-jakarta)] text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80 text-sm leading-relaxed mb-4">
                      {term.def}
                    </p>
                    <div className="space-y-3">
                      <div className="bg-sky-50 dark:bg-[#080C14] rounded-xl p-3 border border-sky-100/50 dark:border-sky-900/20">
                        <span className="font-[var(--font-syne)] font-bold text-[10px] text-sky-500 dark:text-sky-400 uppercase tracking-wider block mb-1">Example</span>
                        <p className="font-[var(--font-jakarta)] italic text-sm text-[#0369A1] dark:text-[#0EA5E9]">"{term.ex}"</p>
                      </div>
                      <div className="bg-rose-50 dark:bg-rose-900/10 rounded-xl p-3 border border-rose-100/50 dark:border-rose-900/20">
                        <span className="font-[var(--font-syne)] font-bold text-[10px] text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">Past Question Application</span>
                        <p className="font-[var(--font-jakarta)] text-sm text-rose-900 dark:text-rose-200">{term.pq}</p>
                      </div>
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
