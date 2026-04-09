import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { Admin } from '../../services/api';

export default function AdminSystemHealth() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const res = await Admin.systemHealth();
      if (!active) return;
      setHealth(res?.data);
    };
    load();
    return () => { active = false; };
  }, []);

  return (
    <AdminLayout title="System Health" subtitle="Live service checks for database and cache">
      {!health ? (
        <div className="text-sm text-slate-500">Loading health status…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-slate-100 rounded-xl p-4">
            <p className="text-xs uppercase text-slate-400 font-semibold">Overall</p>
            <div className={`text-lg font-bold mt-2 ${health.status === 'healthy' ? 'text-green-600' : 'text-amber-600'}`}>
              {health.status}
            </div>
          </div>
          <div className="border border-slate-100 rounded-xl p-4">
            <p className="text-xs uppercase text-slate-400 font-semibold">Database</p>
            <div className={`text-lg font-bold mt-2 ${health.database === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
              {health.database}
            </div>
          </div>
          <div className="border border-slate-100 rounded-xl p-4">
            <p className="text-xs uppercase text-slate-400 font-semibold">Redis</p>
            <div className={`text-lg font-bold mt-2 ${health.redis === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
              {health.redis}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
