import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const SUBJECT_ICONS = {
  Math: '➗',
  Mathematics: '➗',
  Physics: '⚡',
  Chemistry: '🧪',
  Biology: '🧬',
  English: '📘',
  General: '📚',
};

const getSubjectIcon = (subject) => {
  return SUBJECT_ICONS[subject] || '📘';
};

export default function ConceptCard({ concept, variant = 'grid' }) {
  const navigate = useNavigate();
  const conceptId = concept?.id || concept?.name || 'concept';
  const subject = concept?.subject || 'General';
  const topic = concept?.topic || subject;
  const name = concept?.name || concept?.title || conceptId;

  const cardClass =
    variant === 'compact'
      ? 'shrink-0 w-56 bg-white dark:bg-[#0D1525] border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 text-left shadow-sm'
      : 'bg-white dark:bg-[#0D1525] border-2 border-sky-50 dark:border-sky-900/10 rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all';

  return (
    <div className={cardClass}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 flex items-center justify-center text-lg">
          {getSubjectIcon(subject)}
        </div>
        <div className="flex-1">
          <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">
            {name}
          </h3>
          <p className="text-[10px] font-bold text-sky-500/70 uppercase tracking-widest mt-1">
            {topic}
          </p>
        </div>
      </div>

      <button
        className="w-full bg-sky-700 text-white rounded-xl py-2.5 text-xs font-[var(--font-syne)] font-bold flex items-center justify-center gap-2 hover:bg-sky-600 transition-all"
        onClick={() =>
          navigate(`/ai-tutor/concepts/${conceptId}`, { state: { concept } })
        }
      >
        🧠 Deep Breakdown <ChevronRight size={14} />
      </button>

      <button
        className="w-full mt-2 bg-white dark:bg-[#0D1525] border border-sky-200 dark:border-sky-800/30 text-sky-700 dark:text-sky-400 rounded-xl py-2 text-xs font-[var(--font-syne)] font-bold hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all"
        onClick={() =>
          navigate(`/ai-tutor/concepts/${conceptId}?level=basic`, { state: { concept } })
        }
      >
        ⚡ Quick Explain
      </button>
    </div>
  );
}
