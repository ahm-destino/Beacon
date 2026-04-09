import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { Admin } from '../../services/api';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ pages: 1 });
  const [message, setMessage] = useState('');

  const load = async (nextPage = page, nextStatus = status) => {
    const res = await Admin.listReports({ page: nextPage, status: nextStatus });
    const payload = res?.data || {};
    setReports(payload.items || []);
    setMeta(payload);
    setPage(nextPage);
  };

  useEffect(() => {
    load(1, status);
  }, [status]);

  const resolveReport = async (id) => {
    const note = window.prompt('Resolution note (optional)') || '';
    await Admin.resolveReport(id, { note });
    setMessage('Report resolved.');
    load(page, status);
  };

  return (
    <AdminLayout title="Question Reports" subtitle="Handle flagged questions and student feedback">
      {message ? (
        <div className="mb-4 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          {message}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-4">
        {['pending', 'resolved', 'all'].map((s) => (
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

      <div className="space-y-3">
        {reports.map((report) => (
          <div key={report.id} className="border border-slate-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{report.reason}</p>
                <p className="text-xs text-slate-500 mt-1">{report.description || 'No description provided.'}</p>
                {report.question ? (
                  <div className="mt-3 text-xs text-slate-600">
                    <div className="font-semibold">{report.question.subject} • {report.question.exam_type}</div>
                    <div className="line-clamp-2">{report.question.question_text}</div>
                  </div>
                ) : null}
                {report.reporter ? (
                  <div className="text-xs text-slate-500 mt-2">Reported by {report.reporter.name}</div>
                ) : null}
              </div>
              {!report.is_resolved ? (
                <button
                  className="px-3 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold"
                  onClick={() => resolveReport(report.id)}
                >
                  Resolve
                </button>
              ) : (
                <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Resolved</span>
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
