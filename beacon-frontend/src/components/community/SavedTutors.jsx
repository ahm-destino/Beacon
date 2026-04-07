import React from 'react';
import { useNavigate } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function SavedTutors() {
  const navigate = useNavigate();
  const saved = JSON.parse(localStorage.getItem('savedTutors') || '[]');

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="Saved Tutors" />
      <div className="px-5 pt-6 pb-24 space-y-3">
        {saved.length === 0 && (
          <p className="text-sm text-sky-500">No saved tutors yet.</p>
        )}
        {saved.map(tutor => (
          <button
            key={tutor.id}
            onClick={() => navigate(`/community/tutor/${tutor.id}`, { state: { tutor } })}
            className="w-full bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 text-left"
          >
            <p className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9]">{tutor.full_name || tutor.name}</p>
            <p className="text-xs text-sky-500 mt-1">{tutor.bio || tutor.title || 'Tutor'}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
