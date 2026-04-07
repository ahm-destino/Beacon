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
        <div className="px-5 space-y-6">
          <div className="flex items-center gap-2 bg-white dark:bg-[#0D1525] border border-sky-200 dark:border-sky-800 rounded-xl p-3 shadow-sm hover:border-sky-300 dark:hover:border-sky-700 transition-colors">
            <Search size={20} className="text-sky-400 dark:text-sky-600" />
            <input 
              type="text" 
              placeholder="Search rooms by topic..." 
              className="flex-1 bg-transparent outline-none font-[var(--font-jakarta)] text-sm text-[#0C4A6E] dark:text-[#F0F9FF] placeholder-sky-300 dark:placeholder-sky-700"
            />
          </div>

          <div className="space-y-4">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-5 hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700/50 transition-all duration-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${room.color} flex items-center justify-center text-white shadow-sm`}>
                      {room.type === 'video' && <Video size={16} />}
                      {room.type === 'audio' && <Mic size={16} />}
                      {room.type === 'silent' && <MessageSquare size={16} />}
                    </div>
                    <div>
                      <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] flex items-center gap-2">
                        {room.title}
                        {room.locked && <Lock size={12} className="text-gray-400" />}
                      </h3>
                      <p className="text-[10px] text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 font-medium">Hosted by {room.host}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-1 rounded-lg">
                    <Users size={12} /> {room.participants}/{room.max}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                    {room.topic}
                  </span>
                  {room.tags.map(tag => (
                    <span key={tag} className="bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-[10px] font-bold px-2 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <button
                  onClick={() => navigate(`/community/rooms/${room.id}`, { state: { room, joining: true } })}
                  className="w-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-xl py-2.5 font-[var(--font-syne)] font-bold text-sm hover:bg-sky-200 dark:hover:bg-sky-900/50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Join Room
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
