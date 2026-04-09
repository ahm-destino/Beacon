import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { Admin } from '../../services/api';

const OptionRow = ({ label, text, isCorrect }) => (
  <div className={`text-xs px-3 py-2 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200 text-green-700' : 'border-slate-200 text-slate-600'}`}>
    <span className="font-semibold mr-2">{label}.</span>
    <span>{text}</span>
  </div>
);

export default function AdminAICorrections() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ pages: 1 });
  const [message, setMessage] = useState('');

  const load = async (nextPage = page, nextStatus = status) => {
    const res = await Admin.listAICorrections({ page: nextPage, status: nextStatus });
    const payload = res?.data || {};
    setItems(payload.items || []);
    setMeta(payload);
    setPage(nextPage);
  };

  useEffect(() => {
    load(1, status);
  }, [status]);

  const handleApprove = async (id) => {
    const note = window.prompt('Approval note (optional)') || '';
    await Admin.approveAICorrection(id, { note });
    setMessage('AI correction approved.');
    load(page, status);
  };

  const handleReject = async (id) => {
    const note = window.prompt('Rejection note (optional)') || '';
    await Admin.rejectAICorrection(id, { note });
    setMessage('AI correction rejected.');
    load(page, status);
  };

  return (
    <AdminLayout title="AI Corrections" subtitle="Review AI-selected answers before they go live">
      {message ? (
        <div className="mb-4 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          {message}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-4">
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
          <button
            key={s}
            className={[
              'px-3 py-2 rounded-lg text-sm font-semibold border',
              status === s ? 'bg-sky-600 text-white border-sky-600' : 'border-slate-200 text-slate-600',
            ].join(' ')}
            onClick={() => setStatus(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="border border-slate-100 rounded-xl p-4">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{item.question?.subject || 'Question'}</p>
                <p className="text-xs text-slate-500 mt-1">{item.question?.question_text}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  <OptionRow label="A" text={item.question?.option_a} isCorrect={item.ai_correct_answer === 'A'} />
                  <OptionRow label="B" text={item.question?.option_b} isCorrect={item.ai_correct_answer === 'B'} />
                  <OptionRow label="C" text={item.question?.option_c} isCorrect={item.ai_correct_answer === 'C'} />
                  <OptionRow label="D" text={item.question?.option_d} isCorrect={item.ai_correct_answer === 'D'} />
                </div>
                <div className="text-xs text-slate-500 mt-3">
                  DB answer: <span className="font-semibold text-slate-700">{item.question?.db_correct_answer || '-'}</span>
                  {' '}• AI answer: <span className="font-semibold text-slate-700">{item.ai_correct_answer}</span>
                </div>
              </div>
              {item.review_status === 'pending' ? (
                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 rounded-lg bg-green-500 text-white text-xs font-semibold"
                    onClick={() => handleApprove(item.id)}
                  >
                    Approve
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold"
                    onClick={() => handleReject(item.id)}
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  {item.review_status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6 text-sm">
        <button
          className="px-3 py-2 rounded-lg border border-slate-200 disabled:opacity-50"
          onClick={() => load(page - 1, status)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span className="text-slate-500">Page {page} of {meta.pages || 1}</span>
        <button
          className="px-3 py-2 rounded-lg border border-slate-200 disabled:opacity-50"
          onClick={() => load(page + 1, status)}
          disabled={page >= (meta.pages || 1)}
        >
          Next
        </button>
      </div>
    </AdminLayout>
  );
}
