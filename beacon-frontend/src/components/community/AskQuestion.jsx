import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function AskQuestion() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');

  const submit = () => {
    if (!question.trim()) return;
    navigate('/community/qa');
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="Ask a Question" />
      <div className="px-5 pt-6 pb-24">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question..."
          className="w-full min-h-[180px] bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 text-sm"
        />
        <button
          onClick={submit}
          className="w-full mt-4 py-3 rounded-xl bg-sky-700 text-white font-[var(--font-syne)] font-bold"
        >
          Post Question
        </button>
      </div>
    </div>
  );
}
