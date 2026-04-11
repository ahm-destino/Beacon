import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Community } from '../../services/api';

export default function AskQuestion() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('Biology');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subjects = ['Biology', 'Chemistry', 'Physics', 'Math', 'English', 'Government', 'Economics'];

  const submit = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Please provide a title and details.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await Community.postQuestion({
        subject,
        title,
        body,
        exam_type: 'JAMB' // Default for now
      });
      navigate('/community/qa');
    } catch (err) {
      setError(err?.message || 'Failed to post question. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="Ask a Question" />
      <div className="px-5 pt-6 pb-24 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
           <label className="block text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider mb-2">Subject</label>
           <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
             {subjects.map(s => (
               <button
                 key={s}
                 onClick={() => setSubject(s)}
                 className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                   subject === s 
                    ? 'bg-sky-600 text-white' 
                    : 'bg-white dark:bg-[#0D1525] text-sky-600 border border-sky-100 dark:border-sky-900/20'
                 }`}
               >
                 {s}
               </button>
             ))}
           </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider mb-2">Question Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Help with cell division"
            className="w-full bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider mb-2">Details</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Explain what you're stuck on..."
            className="w-full min-h-[180px] bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 text-sm"
          />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-sky-700 hover:bg-sky-600 text-white font-[var(--font-syne)] font-bold shadow-lg shadow-sky-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post Question'}
        </button>
      </div>
    </div>
  );
}

