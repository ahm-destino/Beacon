import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Search, Plus, Users, ArrowRight, Play } from 'lucide-react';
import { Community } from '../../services/api';
import { formatTimeAgo } from '../../utils/time';

export default function StudyRooms() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Live Now');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadSessions = async () => {
      setLoading(true);
      try {
        const res = await Community.getStudySessions();
        if (mounted) {
          setSessions(Array.isArray(res?.data) ? res.data : []);
        }
      } catch (e) {
        console.error('Failed to load study sessions', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadSessions();
    return () => { mounted = false; };
  }, []);

  const handleJoin = (session) => {
    navigate(`/community/rooms/${session.id}`, { state: { session } });
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-24">
      <SubScreenHeader 
        title="Study Rooms" 
        rightAction={
          <button 
            onClick={() => navigate('/community/rooms/create')}
            className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-sky-600 dark:text-sky-400 active:scale-95 transition-all"
          >
            <Plus size={22} />
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

      <div className="px-5">
        {loading ? (
          <div className="py-12 text-center text-sky-500 animate-pulse">
            <Users size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Finding live rooms...</p>
          </div>
        ) : activeTab !== 'Live Now' ? (
           <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-8 text-center border border-sky-100 dark:border-sky-900/20">
              <div className="w-16 h-16 bg-sky-50 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-sky-400" />
              </div>
              <h3 className="font-[var(--font-syne)] font-bold text-[#0C4A6E] dark:text-[#F0F9FF] mb-2">Coming Soon</h3>
              <p className="text-sm text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60">{activeTab} feature is under development.</p>
           </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-10 text-center border border-sky-100 dark:border-sky-900/20 shadow-sm">
             <div className="w-20 h-20 bg-sky-50 dark:bg-sky-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <Users size={40} className="text-sky-300" />
             </div>
             <h3 className="font-[var(--font-syne)] font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF] mb-2">No Live Rooms</h3>
             <p className="text-sm text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 mb-6">Be the first to start a study session for your favorite subject!</p>
             <button 
                onClick={() => navigate('/community/rooms/create')}
                className="px-6 py-3 bg-sky-700 text-white rounded-2xl font-bold text-sm flex items-center gap-2 mx-auto active:scale-95 transition-all shadow-lg shadow-sky-100 dark:shadow-none"
             >
                Start Session <ArrowRight size={16} />
             </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map((room) => (
              <div 
                key={room.id} 
                onClick={() => handleJoin(room)}
                className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-5 hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden shadow-inner">
                      {room.host_photo ? <img src={room.host_photo} alt="" className="w-full h-full object-cover" /> : room.host_name[0]}
                    </div>
                    <div>
                      <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF]">{room.subject}</h3>
                      <p className="text-xs text-sky-500 font-medium">Host: {room.host_name}</p>
                    </div>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> LIVE
                  </div>
                </div>

                <div className="mb-4">
                   <p className="text-sm text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80 font-medium line-clamp-1">Topic: {room.topic || 'General Practice'}</p>
                   <p className="text-[10px] text-sky-400 mt-1 uppercase font-bold tracking-wider">{formatTimeAgo(room.created_at)}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-sky-50 dark:border-sky-900/20">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#0D1525] bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-[8px] font-bold text-sky-600">👤</div>)}
                    </div>
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400">{room.participant_count || 0}/{room.limit || 5}</span>
                  </div>
                  <button className="w-9 h-9 rounded-xl bg-sky-700 text-white flex items-center justify-center group-hover:bg-sky-600 transition-colors shadow-lg shadow-sky-100 dark:shadow-none">
                    <Play size={16} fill="currentColor" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
    </div>
  );
}

