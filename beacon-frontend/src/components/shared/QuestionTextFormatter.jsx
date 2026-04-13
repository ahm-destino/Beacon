import React, { useState } from 'react';
import { ChevronDown, BookOpen, AlertCircle } from 'lucide-react';

const normalizeText = (value) => {
  if (!value) return '';
  return String(value)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/(sentence|statement|passage)([A-Z])/gi, '$1 $2')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .trim();
};

const dedupeTrailingRepeat = (value) => {
  if (!value) return value;
  const trimmed = String(value).trim();
  if (!trimmed) return value;

  // Sentence-level dedupe when no multi-line blocks exist
  if (!trimmed.includes('\n\n')) {
    const sentences = trimmed.split(/(?<=[.!?])\s+/);
    if (sentences.length >= 2) {
      const last = sentences[sentences.length - 1].trim();
      const prev = sentences[sentences.length - 2].trim();
      if (last && prev && last.toLowerCase() === prev.toLowerCase()) {
        sentences.pop();
        return sentences.join(' ').trim();
      }
    }
  }

  // Character-based tail dedupe (catches repeated blocks without punctuation)
  const maxLen = Math.min(200, Math.floor(trimmed.length / 2));
  for (let len = maxLen; len >= 30; len -= 1) {
    const tail = trimmed.slice(-len);
    const beforeTail = trimmed.slice(-2 * len, -len);
    if (tail && beforeTail && tail === beforeTail) {
      return trimmed.slice(0, -len).trim();
    }
  }

  return trimmed;
};

const splitInstructionBlock = (block) => {
  const trimmed = String(block || '').trim();
  if (!trimmed) return { instructionText: null, remainder: '' };

  const firstDoubleNewline = trimmed.indexOf('\n\n');
  if (firstDoubleNewline !== -1) {
    return {
      instructionText: trimmed.substring(0, firstDoubleNewline).trim(),
      remainder: trimmed.substring(firstDoubleNewline).trim(),
    };
  }

  const firstSingleNewline = trimmed.indexOf('\n');
  if (firstSingleNewline !== -1) {
    return {
      instructionText: trimmed.substring(0, firstSingleNewline).trim(),
      remainder: trimmed.substring(firstSingleNewline).trim(),
    };
  }

  const sentenceBreak = trimmed.search(/[.!?]\s+/);
  if (sentenceBreak !== -1) {
    const splitAt = sentenceBreak + 1;
    const instructionText = trimmed.substring(0, splitAt).trim();
    const remainder = trimmed.substring(splitAt).trim();
    if (remainder) {
      return { instructionText, remainder };
    }
  }

  return { instructionText: null, remainder: trimmed };
};

function renderTextWithBold(text) {
  if (!text) return null;
  return text.split('\n').map((paragraph, i) => {
    if (!paragraph.trim()) return <div key={i} className="h-2" />;
    return (
      <p key={i} className="mb-2 last:mb-0">
        {paragraph.split(/(\*\*.*?\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={j} className="font-bold text-[#0369A1] dark:text-[#38BDF8]">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });
}

const CollapsibleSection = ({ title, icon: Icon, content, defaultOpen = false, colorClass }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  if (!content) return null;
  
  return (
    <div className={`mb-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${colorClass.border} ${isOpen ? colorClass.bgOpen : colorClass.bgClosed}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3.5 transition-colors ${isOpen ? colorClass.headerOpen : colorClass.headerClosed}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${colorClass.iconBg}`}>
            <Icon size={18} className={colorClass.icon} />
          </div>
          <span className={`font-[var(--font-syne)] font-bold text-sm tracking-widest uppercase ${colorClass.title}`}>{title}</span>
        </div>
        <ChevronDown size={20} className={`transition-transform duration-300 ${colorClass.icon} ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <div 
        className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className={`p-5 pt-3 font-[var(--font-jakarta)] text-[15px] leading-relaxed ${colorClass.text}`}>
          {renderTextWithBold(content)}
        </div>
      </div>
    </div>
  );
};

export default function QuestionTextFormatter({ text, imageUrl }) {
  if (!text) return null;

  let instruction = null;
  let passage = null;
  let pureQuestionStr = normalizeText(text);

  // Extract Instruction
  if (pureQuestionStr.includes('**Instruction:**')) {
    const parts = pureQuestionStr.split('**Instruction:**');
    const afterInstruction = (parts[1] || '').trim();
    
    if (afterInstruction.includes('**Passage:**')) {
      const pParts = afterInstruction.split('**Passage:**');
      instruction = pParts[0].trim();
      pureQuestionStr = '**Passage:**' + pParts[1];
    } else {
      // No passage. Instruction is everything up to the first double newline
      const split = splitInstructionBlock(afterInstruction);
      if (split.instructionText) {
        instruction = split.instructionText;
        pureQuestionStr = split.remainder;
      } else {
        // If we can't confidently split, keep the full text visible
        instruction = null;
        pureQuestionStr = afterInstruction;
      }
    }
  }

  // Extract Passage
  if (pureQuestionStr.includes('**Passage:**')) {
    const parts = pureQuestionStr.split('**Passage:**');
    const afterPassage = parts[1].trim();
    
    // Find the last \n\n to isolate the final question paragraph.
    // If no \n\n exists, the entire thing is just passage, though unlikely.
    const lastDoubleNewline = afterPassage.lastIndexOf('\n\n');
    if (lastDoubleNewline !== -1) {
      passage = afterPassage.substring(0, lastDoubleNewline).trim();
      pureQuestionStr = afterPassage.substring(lastDoubleNewline).trim();
    } else {
      passage = afterPassage;
      pureQuestionStr = '';
    }
  }

  instruction = dedupeTrailingRepeat(instruction);
  passage = dedupeTrailingRepeat(passage);
  pureQuestionStr = dedupeTrailingRepeat(pureQuestionStr);

  const instructionColors = {
    border: 'border-amber-200 dark:border-amber-900/30',
    bgOpen: 'bg-amber-50/20 dark:bg-[#0D1525]',
    bgClosed: 'bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100/50 dark:hover:bg-amber-900/20',
    headerOpen: 'bg-amber-100/80 dark:bg-amber-900/20',
    headerClosed: '',
    iconBg: 'bg-amber-200/80 dark:bg-amber-900/50',
    icon: 'text-amber-700 dark:text-amber-400',
    title: 'text-amber-800 dark:text-amber-500',
    text: 'text-amber-950 dark:text-amber-100/80'
  };

  const passageColors = {
    border: 'border-indigo-200 dark:border-indigo-900/30',
    bgOpen: 'bg-indigo-50/20 dark:bg-[#0D1525]',
    bgClosed: 'bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20',
    headerOpen: 'bg-indigo-100/80 dark:bg-indigo-900/20',
    headerClosed: '',
    iconBg: 'bg-indigo-200/80 dark:bg-indigo-900/50',
    icon: 'text-indigo-700 dark:text-indigo-400',
    title: 'text-indigo-800 dark:text-indigo-500',
    text: 'text-indigo-950 dark:text-indigo-100/80'
  };

  return (
    <div className="w-full">
      {imageUrl && (
        <div className="w-full mb-6 rounded-2xl overflow-hidden border-2 border-sky-100 dark:border-sky-900/40 shadow-sm relative bg-white flex justify-center p-2">
          <img 
            src={imageUrl} 
            alt="Question figure" 
            className="w-full h-auto object-contain max-h-64" 
            onError={(e) => {
              e.target.style.display = 'none';
              console.warn('Question image failed to load');
            }}
          />
        </div>
      )}
      <CollapsibleSection 
        title="Instruction" 
        icon={AlertCircle} 
        content={instruction} 
        defaultOpen={false} 
        colorClass={instructionColors} 
      />
      <CollapsibleSection 
        title="Passage / Scenario" 
        icon={BookOpen} 
        content={passage} 
        defaultOpen={true} 
        colorClass={passageColors} 
      />
      
      <div className="font-[var(--font-jakarta)] text-lg font-bold leading-relaxed text-[#0C4A6E] dark:text-[#F0F9FF] mt-2">
         {renderTextWithBold(pureQuestionStr)}
      </div>
    </div>
  );
}
