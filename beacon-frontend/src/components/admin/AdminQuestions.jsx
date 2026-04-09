import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { Admin } from '../../services/api';

const QuestionRow = ({ question, onSelect }) => (
  <button
    className="w-full text-left border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-all"
    onClick={() => onSelect(question)}
  >
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">{question.subject || 'General'} • {question.exam_type || 'Exam'}</p>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{question.question_text}</p>
      </div>
      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
        {question.correct_answer || '-'}
      </span>
    </div>
  </button>
);

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [filters, setFilters] = useState({ source: '', subject: '', is_approved: '' });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ pages: 1 });
  const [edit, setEdit] = useState(null);
  const [message, setMessage] = useState('');

  const load = async (nextPage = page, nextFilters = filters) => {
    const res = await Admin.listQuestions({ ...nextFilters, page: nextPage });
    const payload = res?.data || {};
    setQuestions(payload.items || []);
    setMeta(payload);
    setPage(nextPage);
  };

  useEffect(() => {
    load(1, filters);
  }, []);

  const startEdit = (q) => {
    setEdit({ ...q });
  };

  const saveEdit = async () => {
    if (!edit?.id) return;
    try {
      await Admin.updateQuestion(edit.id, {
        question_text: edit.question_text,
        option_a: edit.option_a,
        option_b: edit.option_b,
        option_c: edit.option_c,
        option_d: edit.option_d,
        correct_answer: edit.correct_answer,
        explanation: edit.explanation,
        difficulty: edit.difficulty,
      });
      setMessage('Question updated.');
      await load(page, filters);
    } catch (e) {
      setMessage(e?.error || e?.message || 'Failed to update question.');
    }
  };

  const handleApprove = async (qid) => {
    await Admin.approveQuestion(qid);
    load(page, filters);
  };

  const handleReject = async (qid) => {
    await Admin.rejectQuestion(qid);
    load(page, filters);
  };

  return (
    <AdminLayout title="Questions" subtitle="Review, edit, and approve the question bank">
      {message ? (
        <div className="mb-4 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          {message}
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <input
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
          placeholder="Filter by subject"
          value={filters.subject}
          onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
        />
        <select
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
          value={filters.source}
          onChange={(e) => setFilters({ ...filters, source: e.target.value })}
        >
          <option value="">All Sources</option>
          <option value="PAST_PAPER">Past Paper</option>
          <option value="AI_GENERATED">AI Generated</option>
        </select>
        <select
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
          value={filters.is_approved}
          onChange={(e) => setFilters({ ...filters, is_approved: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="true">Approved</option>
          <option value="false">Pending</option>
        </select>
        <button
          className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold"
          onClick={() => load(1, filters)}
        >
          Apply
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionRow key={q.id} question={q} onSelect={startEdit} />
          ))}

          <div className="flex items-center justify-between mt-4 text-sm">
            <button
              className="px-3 py-2 rounded-lg border border-slate-200 disabled:opacity-50"
              onClick={() => load(page - 1, filters)}
              disabled={page <= 1}
            >
              Previous
            </button>
            <span className="text-slate-500">Page {page} of {meta.pages || 1}</span>
            <button
              className="px-3 py-2 rounded-lg border border-slate-200 disabled:opacity-50"
              onClick={() => load(page + 1, filters)}
              disabled={page >= (meta.pages || 1)}
            >
              Next
            </button>
          </div>
        </div>

        <div className="border border-slate-100 rounded-xl p-4">
          {edit ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-[var(--font-syne)] text-base text-slate-800">Edit Question</h4>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 rounded-lg bg-green-500 text-white text-xs font-semibold"
                    onClick={() => handleApprove(edit.id)}
                  >
                    Approve
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold"
                    onClick={() => handleReject(edit.id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
              <textarea
                className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                value={edit.question_text || ''}
                onChange={(e) => setEdit({ ...edit, question_text: e.target.value })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={edit.option_a || ''}
                  onChange={(e) => setEdit({ ...edit, option_a: e.target.value })}
                  placeholder="Option A"
                />
                <input
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={edit.option_b || ''}
                  onChange={(e) => setEdit({ ...edit, option_b: e.target.value })}
                  placeholder="Option B"
                />
                <input
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={edit.option_c || ''}
                  onChange={(e) => setEdit({ ...edit, option_c: e.target.value })}
                  placeholder="Option C"
                />
                <input
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={edit.option_d || ''}
                  onChange={(e) => setEdit({ ...edit, option_d: e.target.value })}
                  placeholder="Option D"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={edit.correct_answer || ''}
                  onChange={(e) => setEdit({ ...edit, correct_answer: e.target.value })}
                  placeholder="Correct Answer (A-D)"
                />
                <input
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={edit.difficulty || ''}
                  onChange={(e) => setEdit({ ...edit, difficulty: e.target.value })}
                  placeholder="Difficulty"
                />
              </div>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                value={edit.explanation || ''}
                onChange={(e) => setEdit({ ...edit, explanation: e.target.value })}
                placeholder="Explanation"
              />
              <button
                className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold"
                onClick={saveEdit}
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Select a question to edit.</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
