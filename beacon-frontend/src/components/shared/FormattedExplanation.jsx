import React, { useMemo } from 'react';

const normalizeText = (value) => {
  if (!value) return '';
  return String(value)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    // Put numbered or bullet items on their own lines so we can detect lists.
    .replace(/([^\n])\s+(\d+[\).]\s+)/g, '$1\n$2')
    .replace(/([^\n])\s+([•-]\s+)/g, '$1\n$2')
    .replace(/([^\n])\s+(Step\s+\d+[:.)-])/gi, '$1\n$2')
    .replace(/([^\n])\s+(Answer\s*:)/gi, '$1\n$2')
    .replace(/\n{3,}/g, '\n\n')
    // Special marker for math-like lines to prevent joining
    .split('\n').map(line => {
      // If line contains symbols like =, ^, +, -, *, /, _, (, ) and is short, mark it as hard-line
      if (line.trim().length < 50 && /[\^=\+\-\*\/\_]/.test(line)) {
        return line.trim() + ' [MATH_BREAK]';
      }
      return line.trim();
    }).join('\n')
    .trim();
};

const renderInline = (text) => {
  if (!text) return null;
  return text.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-[#0369A1] dark:text-[#7DD3FC]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

const parseBlocks = (input) => {
  const text = normalizeText(input);
  if (!text) return [];

  const lines = text.split('\n');
  const blocks = [];

  let paragraph = [];
  let list = null; // { type: 'ol' | 'ul', items: [] }

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const content = paragraph.join(' ').trim();
    if (content) {
      // Remote math break markers and preserve line breaks if they existed
      const cleaned = content.replace(/\s*\[MATH_BREAK\]\s*/g, '\n').trim();
      blocks.push({ 
        type: 'paragraph', 
        content: cleaned,
        isMath: content.includes('[MATH_BREAK]')
      });
    }
    paragraph = [];
  };

  const flushList = () => {
    if (!list || !list.items.length) {
      list = null;
      return;
    }
    blocks.push(list);
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const stepMatch = line.match(/^step\s*(\d+)[:.)-]\s*(.*)$/i);
    if (stepMatch) {
      flushParagraph();
      if (!list || list.type !== 'ol') {
        flushList();
        list = { type: 'ol', items: [] };
      }
      list.items.push(stepMatch[2].trim());
      continue;
    }

    const olMatch = line.match(/^(\d+)[\).]\s+(.*)$/);
    if (olMatch) {
      flushParagraph();
      if (!list || list.type !== 'ol') {
        flushList();
        list = { type: 'ol', items: [] };
      }
      list.items.push(olMatch[2].trim());
      continue;
    }

    const ulMatch = line.match(/^[-•]\s+(.*)$/);
    if (ulMatch) {
      flushParagraph();
      if (!list || list.type !== 'ul') {
        flushList();
        list = { type: 'ul', items: [] };
      }
      list.items.push(ulMatch[1].trim());
      continue;
    }

    const h3Match = line.match(/^##\s+(.*)$/);
    if (h3Match) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h3', content: h3Match[1].trim() });
      continue;
    }

    const h4Match = line.match(/^###\s+(.*)$/);
    if (h4Match) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h4', content: h4Match[1].trim() });
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
};

export const buildCopyText = (input) => {
  const blocks = parseBlocks(input);
  const steps = [];
  let answerLine = '';

  blocks.forEach((block) => {
    if (block.type === 'ol' || block.type === 'ul') {
      block.items.forEach((item) => {
        if (item) steps.push(item);
      });
      return;
    }
    if (block.type === 'paragraph') {
      const answerMatch = block.content.match(/^answer\s*:\s*(.*)$/i);
      if (answerMatch) {
        answerLine = answerMatch[1]?.trim() ? `Answer: ${answerMatch[1].trim()}` : 'Answer:';
      }
    }
  });

  if (steps.length === 0) {
    const normalized = normalizeText(input)
      .replace(/\s*\[MATH_BREAK\]\s*/g, '\n')
      .trim();
    return { text: normalized || '', hasSteps: false };
  }

  const lines = steps.map((step, idx) => `Step ${idx + 1}: ${step}`);
  if (answerLine) lines.push(answerLine);
  return { text: lines.join('\n'), hasSteps: true };
};

export default function FormattedExplanation({ text }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);

  if (!blocks.length) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, idx) => {
        if (block.type === 'h3') {
          return (
            <h3 key={`h3-${idx}`} className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#7DD3FC] mt-6 mb-2 tracking-tight">
              {renderInline(block.content)}
            </h3>
          );
        }
        if (block.type === 'h4') {
          return (
            <h4 key={`h4-${idx}`} className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mt-4 mb-2">
              {renderInline(block.content)}
            </h4>
          );
        }
        if (block.type === 'paragraph') {
          return (
            <p key={`p-${idx}`} className={`leading-relaxed ${block.isMath ? 'whitespace-pre-wrap font-medium bg-sky-50/30 dark:bg-sky-900/10 p-2 rounded-lg' : ''}`}>
              {renderInline(block.content)}
            </p>
          );
        }
        if (block.type === 'ol') {
          return (
            <ol key={`ol-${idx}`} className="list-decimal pl-5 space-y-2">
              {block.items.map((item, i) => (
                <li key={`ol-${idx}-${i}`} className="leading-relaxed">
                  {renderInline(item)}
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === 'ul') {
          return (
            <ul key={`ul-${idx}`} className="list-disc pl-5 space-y-2">
              {block.items.map((item, i) => (
                <li key={`ul-${idx}-${i}`} className="leading-relaxed">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }
        return null;
      })}
    </div>
  );
}
