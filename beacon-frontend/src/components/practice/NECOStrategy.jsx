import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function NECOStrategy() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({ overview: true });

  const toggleSection = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sections = [
    { id: 'overview', title: 'Exam Overview', content: 'NECO SSCE is the Nigerian national equivalent to WAEC. It consists of Objective, Essay/Theory, and Practical papers. It tests adherence to the national curriculum.' },
    { id: 'breakdown', title: 'Section-by-section breakdown', content: 'Objective: Fast-paced elimination. Theory: Detailed, step-by-step answers. Practicals: Strict observation recording.' },
    { id: 'time', title: 'Time Management Plan', content: 'Divide your theory time strictly by the marks awarded. If a question is worth 10 marks out of 100 on a 2-hour paper, spend roughly 12 minutes on it.' },
    { id: 'hottopics', title: 'Hot Topics', content: 'Across sciences, expect standard indigenous examples to be used in biology and agricultural science. Mathematics relies heavily on algebra and geometry.' },
    { id: 'traps', title: 'Common Traps', content: 'Answering more questions than required in the "Answer Any 4" sections, wasting precious time. Not showing full workings in Math.' },
    { id: 'protocol', title: 'Exam Day Protocol', content: 'Be punctual. Bring authorized calculators, mathematical sets, and writing materials. Adhere strictly to invigilator instructions.' },
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="NECO Strategy Guide" />
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
            onClick={() => navigate('/practice/setup/exam-type', { state: { mode: 'practice', exam: 'NECO' } })}
            className="w-full py-3.5 rounded-xl bg-[#0369A1] dark:bg-[#0EA5E9] text-white font-[var(--font-syne)] font-bold shadow-[0_4px_12px_rgba(3,105,161,0.2)] dark:shadow-none hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] transition-all active:scale-[0.98]"
          >
            Practice NECO Questions
          </button>
        </div>
      </div>
    </div>
  );
}
