import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';
import { PlayCircle, Target, MessageSquare } from 'lucide-react';

export default function CameraSolution() {
  const navigate = useNavigate();
  const location = useLocation();
  const { photo, detectedText, subject, topic, solution, solutionText, conversationId } = location.state || {};
  const finalAnswer = solution?.final_answer || solutionText || '';
  const steps = solution?.steps || [];

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="Solution" />

      <div className="px-5 pt-6 pb-24">
        <div className="w-full h-48 bg-gray-300 dark:bg-[#0D1525] rounded-2xl relative overflow-hidden mb-6 shadow-md border border-sky-100 dark:border-sky-900/20">
          {photo ? (
            <img src={photo} alt="Captured problem" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-sky-500">
              No photo provided
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20 shadow-sm mb-6">
          <p className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-2">Detected Problem</p>
          <p className="text-sm text-[#0C4A6E] dark:text-[#F0F9FF] leading-relaxed">{detectedText || 'No text detected.'}</p>
          <div className="flex gap-2 mt-3">
            {subject && (
              <span className="text-[10px] bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full font-bold">{subject}</span>
            )}
            {topic && (
              <span className="text-[10px] bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full font-bold">{topic}</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20 shadow-sm mb-6">
          <p className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-2">Solution (Preview)</p>
          <p className="text-sm text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80 leading-relaxed">
            {finalAnswer || 'Solution will appear here once generated.'}
          </p>
          {steps.length > 0 && (
            <ol className="mt-3 space-y-1 list-decimal pl-5 text-sm text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80">
              {steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              if (conversationId) {
                navigate(`/ai-tutor/chat/${conversationId}`);
                return;
              }
              navigate('/ai-tutor/chat', {
                state: {
                  initialMessage: `Explain this solution in more detail: ${detectedText || ''}`,
                  autoSend: true,
                },
              });
            }}
            className="w-full bg-sky-700 dark:bg-sky-600 text-white rounded-xl py-3.5 font-[var(--font-syne)] font-bold text-sm shadow-[0_4px_16px_rgba(3,105,161,0.3)] flex items-center justify-center gap-2 hover:bg-sky-600 transition-all active:scale-95"
          >
            <MessageSquare size={18} /> Ask AI about this
          </button>

          <button
            onClick={() => navigate('/practice/setup/topic', {
              state: {
                prefilledSubject: subject,
                prefilledTopic: topic,
              },
            })}
            className="w-full bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 rounded-xl py-3.5 font-[var(--font-syne)] font-bold text-sm flex items-center justify-center gap-2 hover:bg-sky-50 transition-all active:scale-95"
          >
            <Target size={18} /> Practice Similar (10)
          </button>

          <button
            onClick={() => navigate('/ai-tutor/concepts', { state: { searchQuery: topic || subject } })}
            className="w-full bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 rounded-xl py-3.5 font-[var(--font-syne)] font-bold text-sm flex items-center justify-center gap-2 hover:bg-sky-50 transition-all active:scale-95"
          >
            <PlayCircle size={18} /> Watch Video
          </button>

          <button
            onClick={() => navigate('/ai-tutor/camera')}
            className="w-full text-center text-sky-600 dark:text-sky-400 text-sm font-bold hover:underline"
          >
            Back to Camera
          </button>
        </div>
      </div>
    </div>
  );
}
