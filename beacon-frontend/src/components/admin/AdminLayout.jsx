import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Flag,
  Brain,
  BarChart3,
  Activity,
  ClipboardList,
} from 'lucide-react';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/questions', label: 'Questions', icon: FileText },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/ai-corrections', label: 'AI Corrections', icon: Brain },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/health', label: 'System Health', icon: Activity },
  { to: '/admin/audit', label: 'Audit Log', icon: ClipboardList },
];

const NavButton = ({ to, label, icon: Icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all',
        isActive
          ? 'bg-sky-100 text-sky-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
      ].join(' ')
    }
  >
    <Icon size={16} />
    <span>{label}</span>
  </NavLink>
);

export default function AdminLayout({ title, subtitle, actions, children }) {
  return (
    <div className="min-h-screen bg-[#F7FAFF]">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 lg:sticky lg:top-6 self-start">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Beacon Admin</p>
                <h1 className="font-[var(--font-syne)] text-lg text-slate-800">Control Center</h1>
              </div>
              <div className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavButton key={item.to} {...item} />
                ))}
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 lg:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-[var(--font-syne)] text-2xl text-slate-800">{title}</h2>
                  {subtitle ? (
                    <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                  ) : null}
                </div>
                {actions ? <div className="flex gap-2 flex-wrap">{actions}</div> : null}
              </div>
              {children}
            </div>
          </main>
        </div>

        <div className="lg:hidden mt-6 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                      isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-50 text-slate-600',
                    ].join(' ')
                  }
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
