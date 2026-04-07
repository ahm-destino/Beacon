import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function JUPEBStrategy() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({ overview: true });

  const toggleSection = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sections = [
    { id: 'overview', title: 'Exam Overview', content: 'JUPEB is an Advanced Level program granting direct entry to 200 level in university. It tests conceptual depth far beyond standard O-level exams. Subjects are grouped into arts, sciences, and social sciences.' },
    { id: 'breakdown', title: 'Section-by-section breakdown', content: 'Multiple Choice: Tricky and conceptual. Theory: Requires essay-style depth, full derivations, and comprehensive arguments.' },
    { id: 'time', title: 'Time Management Plan', content: '3-hour theory papers can be exhausting. Outline your essays or mathematical proofs before writing to avoid getting stuck halfway through.' },
    { id: 'hottopics', title: 'Hot Topics', content: 'Advanced Calculus, University-level Mechanics, Advanced Organic Chemistry synthesis, and intricate macroeconomic theories.' },
    { id: 'traps', title: 'Common Traps', content: 'Giving "O-level" style answers to "A-level" questions. You must demonstrate deep understanding, not just surface memorization.' },
    { id: 'protocol', title: 'Exam Day Protocol', content: 'Ensure you have your JUPEB candidate number readily available. Get plenty of rest, as the cognitive load is very high.' },
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="JUPEB Strategy Guide" />
      <div className="px-5 pt-6 pb-24 space-y-4">
        {sections.map(section => (
          <div key={section.id} className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full text-left p-4 flex justify-between items-center bg-sky-50/50 dark:bg-[#0D1525] hover:bg-sky-50 dark:hover:bg-sky-900/10 transition-colors"
            >
              <span className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9]">{section.title}</span>
              {expanded[section.id] ? <ChevronUp size={18} className="text-sky-500" /> : <ChevronDown size={18} className="text-sky-500" />}
            </button>
            {expanded[section.id] && (
              <div className="p-4 pt-0 border-t border-sky-50 dark:border-sky-900/10 mt-2">
                <p className="font-[var(--font-jakarta)] text-sm text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80 leading-relaxed">
                  {section.content}
                </p>
              </div>
            )}
          </div>
        ))}

        <div className="pt-4">
          <button
            onClick={() => navigate('/practice/setup/exam-type', { state: { mode: 'practice', exam: 'JUPEB' } })}
            className="w-full py-3.5 rounded-xl bg-[#0369A1] dark:bg-[#0EA5E9] text-white font-[var(--font-syne)] font-bold shadow-[0_4px_12px_rgba(3,105,161,0.2)] dark:shadow-none hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] transition-all active:scale-[0.98]"
          >
            Practice JUPEB Questions
          </button>
        </div>
      </div>
    </div>
  );
}

