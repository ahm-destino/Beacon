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
      blocks.push({ type: 'paragraph', content });
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
    const normalized = normalizeText(input);
    return { text: normalized || '', hasSteps: false };
  }

  const lines = steps.map((step, idx) => `Step ${idx + 1}: ${step}`);
  if (answerLine) lines.push(answerLine);
  return { text: lines.join('\n'), hasSteps: true };
};

export default function FormattedExplanation({ text }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);

  if (!blocks.length) {
    return <span>{text}</span>;
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, idx) => {
        if (block.type === 'paragraph') {
          return (
            <p key={`p-${idx}`} className="leading-relaxed">
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
