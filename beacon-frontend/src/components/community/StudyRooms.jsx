import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Search, Plus, Users, Video, Mic, MessageSquare, Lock } from 'lucide-react';

export default function StudyRooms() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Live Now');

  const rooms = [
    { id: 'room-1', title: 'Calculus Study Group', topic: 'Math', host: 'Emma W.', participants: 12, max: 20, type: 'video', tags: ['Derivatives', 'Integrals'], color: 'from-blue-400 to-indigo-500' },
    { id: 'room-2', title: 'Silent Library (2hr)', topic: 'General', host: 'Sarah J.', participants: 45, max: 50, type: 'silent', tags: ['Focus', 'Pomodoro'], color: 'from-emerald-400 to-teal-500' },
    { id: 'room-3', title: 'Physics Mechanics Q&A', topic: 'Physics', host: 'Dr. Chen', participants: 8, max: 10, type: 'audio', tags: ['Kinematics', 'Forces'], color: 'from-purple-400 to-fuchsia-500', locked: true }
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader 
        title="Study Rooms" 
        rightAction={
          <button onClick={() => navigate('/community/rooms/create')}>
            <Plus size={24} className="text-sky-600 dark:text-sky-400" />
          </button>
        } 
      />

      <div className="px-5 pt-4 mb-6">
        <div className="flex bg-white dark:bg-[#0D1525] p-1 rounded-xl shadow-sm border border-sky-100 dark:border-sky-900/20">
          {['Live Now', 'Scheduled', 'My Rooms'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-[var(--font-syne)] font-bold rounded-lg transition-all duration-200 ${
                activeTab === tab 
                  ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 shadow-sm' 
                  : 'text-sky-400 dark:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Live Now' && (
        <div className="px-5 relative">
          {/* Coming Soon Overlay */}
          <div className="absolute inset-x-5 inset-y-0 z-10 bg-white/60 dark:bg-[#080C14]/60 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center text-center p-6 mt-4 border border-sky-100 dark:border-sky-900/30 shadow-xl">
             <div className="w-16 h-16 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center mb-4 animate-bounce">
                <Users size={32} className="text-sky-600 dark:text-sky-400" />
             </div>
             <h2 className="font-[var(--font-syne)] font-bold text-xl text-[#0C4A6E] dark:text-[#F0F9FF] mb-2">Study Rooms are Coming Soon!</h2>
             <p className="text-sm text-[#0C4A6E]/70 dark:text-[#F0F9FF]/70 max-w-[280px]">We're building a space for you to study together in real-time. Stay tuned! 🚀</p>
             <button 
                onClick={() => navigate('/community/challenges')}
                className="mt-6 px-6 py-2.5 bg-sky-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-200 dark:shadow-none transition-all active:scale-95"
             >
                Try Challenges Instead
             </button>
          </div>

          <div className="space-y-6 opacity-30 grayscale pointer-events-none mt-4">
            <div className="flex items-center gap-2 bg-white dark:bg-[#0D1525] border border-sky-200 dark:border-sky-800 rounded-xl p-3 shadow-sm">
              <Search size={20} className="text-sky-400 dark:text-sky-600" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>

            <div className="space-y-4">
              {rooms.map((room) => (
                <div key={room.id} className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800"></div>
                       <div className="space-y-1">
                          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                          <div className="h-2 w-16 bg-gray-100 dark:bg-gray-900 rounded"></div>
                       </div>
                    </div>
                  </div>
                  <div className="h-24 bg-sky-50 dark:bg-sky-900/10 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

