import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from '../../services/api';

export default function AdminGuard({ children }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const res = await Users.getMe();
        const isAdmin = !!res?.data?.is_admin;
        if (!active) return;
        if (!isAdmin) {
          setStatus('denied');
          return;
        }
        setStatus('ok');
      } catch (e) {
        if (!active) return;
        setStatus('denied');
      }
    };
    check();
    return () => { active = false; };
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#F7FAFF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
          <p className="text-sm text-sky-700">Checking admin access…</p>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen bg-[#F7FAFF] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-sky-100 p-6 text-center">
          <h2 className="font-[var(--font-syne)] text-xl text-[#0C4A6E] mb-2">Admin Access Required</h2>
          <p className="text-sm text-sky-700 mb-4">You do not have permission to view this page.</p>
          <button
            className="w-full py-3 rounded-xl bg-[#0369A1] text-white font-bold text-sm"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
}
