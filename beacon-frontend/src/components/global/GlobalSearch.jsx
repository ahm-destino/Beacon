import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const recent = ['Quadratic formula', 'Photosynthesis', 'WAEC past papers'];
  const quick = ['Subjects', 'Topics', 'Past Papers'];

  const results = {
    questions: [
      'Find the roots of x² - 5x + 6',
      'Explain the process of photosynthesis',
    ],
    concepts: ['Trigonometric Ratios', 'Mole Concept'],
    documents: ['JAMB 2023 Chemistry PDF', 'SS3 Revision Guide'],
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F0F9FF] dark:bg-[#080C14]">
      <div className="bg-white dark:bg-[#0D1525] border-b border-sky-100 dark:border-sky-900/20">
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500">🔎</span>
            <input
              autoFocus
              placeholder="Search questions, concepts, subjects..."
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm font-['Plus_Jakarta_Sans'] bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/30 text-[#0C4A6E] dark:text-[#F0F9FF] placeholder:text-[#7DD3FC] dark:placeholder:text-[rgba(125,211,252,0.4)] outline-none transition-all duration-200 hover:border-sky-300 active:scale-[0.99] focus:ring-2 focus:ring-sky-400/40"
            />
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-['Plus_Jakarta_Sans'] text-sky-600 dark:text-sky-400 font-semibold hover:underline active:scale-95 focus:ring-2 focus:ring-sky-400/40 transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="px-5 pt-4 pb-10 space-y-6">
        <div>
          <div className="font-['Syne'] font-bold text-xs text-[#0369A1] dark:text-[#7DD3FC] uppercase tracking-wide mb-2">
            Recent
          </div>
          <div className="space-y-2">
            {recent.map((r) => (
              <button
                key={r}
                className="w-full flex items-center gap-3 py-3 border-b border-sky-50 dark:border-sky-900/20 text-left hover:bg-sky-50 dark:hover:bg-sky-900/20 active:scale-[0.99] focus:ring-2 focus:ring-sky-400/40 transition-all duration-200"
              >
                <span className="text-sky-400">🕒</span>
                <span className="font-['Plus_Jakarta_Sans'] text-sm text-[#0C4A6E] dark:text-[#F0F9FF] flex-1">{r}</span>
                <span className="text-sky-300">×</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="font-['Syne'] font-bold text-xs text-[#0369A1] dark:text-[#7DD3FC] uppercase tracking-wide mb-2">
            Quick Access
          </div>
          <div className="grid grid-cols-3 gap-3">
            {quick.map((q) => (
              <button
                key={q}
                className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-4 text-center hover:shadow-md active:scale-95 focus:ring-2 focus:ring-sky-400/40 transition-all duration-200"
              >
                <div className="text-2xl mb-2">📚</div>
                <div className="font-['Syne'] font-bold text-xs text-[#0C4A6E] dark:text-[#F0F9FF]">{q}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="font-['Syne'] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mb-2">
            Questions (24)
          </div>
          {results.questions.map((q) => (
            <button
              key={q}
              className="w-full flex items-start gap-3 py-3 border-b border-sky-50 dark:border-sky-900/20 text-left hover:bg-sky-50 dark:hover:bg-sky-900/20 active:scale-[0.99] focus:ring-2 focus:ring-sky-400/40 transition-all duration-200"
            >
              <span className="text-sky-500">❓</span>
              <div className="flex-1">
                <div className="font-['Plus_Jakarta_Sans'] text-sm text-[#0C4A6E] dark:text-[#F0F9FF] line-clamp-2">{q}</div>
                <div className="mt-1 flex gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-['Plus_Jakarta_Sans'] bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
                    JAMB
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-['Plus_Jakarta_Sans'] bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
                    Math
                  </span>
                </div>
              </div>
              <span className="text-sky-300">→</span>
            </button>
          ))}
        </div>

        <div>
          <div className="font-['Syne'] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mb-2">
            Concepts (8)
          </div>
          {results.concepts.map((c) => (
            <button
              key={c}
              className="w-full flex items-start gap-3 py-3 border-b border-sky-50 dark:border-sky-900/20 text-left hover:bg-sky-50 dark:hover:bg-sky-900/20 active:scale-[0.99] focus:ring-2 focus:ring-sky-400/40 transition-all duration-200"
            >
              <span className="text-sky-500">💡</span>
              <div className="flex-1">
                <div className="font-['Plus_Jakarta_Sans'] text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">{c}</div>
                <div className="font-['Plus_Jakarta_Sans'] text-xs text-[#0369A1] dark:text-[#7DD3FC] mt-0.5">
                  Short definition of the concept goes here.
                </div>
              </div>
            </button>
          ))}
        </div>

        <div>
          <div className="font-['Syne'] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mb-2">
            Documents (3)
          </div>
          {results.documents.map((d) => (
            <button
              key={d}
              className="w-full flex items-center gap-3 py-3 border-b border-sky-50 dark:border-sky-900/20 text-left hover:bg-sky-50 dark:hover:bg-sky-900/20 active:scale-[0.99] focus:ring-2 focus:ring-sky-400/40 transition-all duration-200"
            >
              <span className="text-sky-500">📄</span>
              <div className="flex-1">
                <div className="font-['Plus_Jakarta_Sans'] text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">{d}</div>
                <div className="font-['Plus_Jakarta_Sans'] text-xs text-[#0369A1] dark:text-[#7DD3FC] mt-0.5">Updated Jan 2025</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
