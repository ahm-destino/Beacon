import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function CreateStudyRoom() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');

  const createRoom = () => {
    navigate('/community/rooms');
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="Create Room" />
      <div className="px-5 pt-6 pb-24">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Room title"
          className="w-full bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-xl px-4 py-3 text-sm"
        />
        <button
          onClick={createRoom}
          className="w-full mt-4 py-3 rounded-xl bg-sky-700 text-white font-[var(--font-syne)] font-bold"
        >
          Create Room
        </button>
      </div>
    </div>
  );
}
