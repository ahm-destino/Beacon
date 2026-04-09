import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { Admin } from '../../services/api';

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ pages: 1 });

  const load = async (nextPage = page) => {
    const res = await Admin.listAudit({ page: nextPage });
    const payload = res?.data || {};
    setLogs(payload.items || []);
    setMeta(payload);
    setPage(nextPage);
  };

  useEffect(() => {
    load(1);
  }, []);

  return (
    <AdminLayout title="Audit Log" subtitle="Trace every admin action and change">
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="border border-slate-100 rounded-xl p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">{log.action}</p>
                <p className="text-xs text-slate-500">
                  {log.target_type ? `${log.target_type} • ${log.target_id || ''}` : 'General'}
                </p>
              </div>
              <span className="text-xs text-slate-500">{log.created_at}</span>
            </div>
            {log.metadata ? (
              <pre className="mt-2 text-xs bg-slate-50 border border-slate-100 rounded-lg p-2 overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6 text-sm">
        <button
          className="px-3 py-2 rounded-lg border border-slate-200 disabled:opacity-50"
          onClick={() => load(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span className="text-slate-500">Page {page} of {meta.pages || 1}</span>
        <button
          className="px-3 py-2 rounded-lg border border-slate-200 disabled:opacity-50"
          onClick={() => load(page + 1)}
          disabled={page >= (meta.pages || 1)}
        >
          Next
        </button>
      </div>
    </AdminLayout>
  );
}
