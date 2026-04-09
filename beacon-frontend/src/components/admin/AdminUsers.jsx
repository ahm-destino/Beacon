import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { Admin } from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '', tier: '', status: '' });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ pages: 1 });
  const [loading, setLoading] = useState(true);

  const load = async (nextPage = page, nextFilters = filters) => {
    setLoading(true);
    try {
      const res = await Admin.listUsers({ ...nextFilters, page: nextPage });
      const payload = res?.data || {};
      setUsers(payload.items || []);
      setMeta(payload);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, filters);
  }, []);

  return (
    <AdminLayout title="Users" subtitle="Manage student accounts, access, and subscriptions">
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <input
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
          placeholder="Search name or email"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
          value={filters.tier}
          onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
        >
          <option value="">All Tiers</option>
          <option value="seeker">Seeker</option>
          <option value="beacon">Beacon</option>
          <option value="luminary">Luminary</option>
          <option value="north_star">North Star</option>
        </select>
        <select
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
        <button
          className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold"
          onClick={() => load(1, filters)}
        >
          Apply
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading users…</div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">{user.full_name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">{user.subscription_tier || 'seeker'}</span>
                <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">{user.subscription_status || 'active'}</span>
                {user.is_banned ? (
                  <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">Banned</span>
                ) : null}
              </div>
              <Link
                className="px-3 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold text-center"
                to={`/admin/users/${user.id}`}
              >
                Manage
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-6 text-sm">
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
    </AdminLayout>
  );
}
