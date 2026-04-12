import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Users, LogOut, XCircle, Share2, MessageCircle, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Community, Users as UsersAPI } from '../../services/api';

export default function ActiveStudyRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [session, setSession] = useState(location.state?.session || null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(!location.state?.session);
  const pollRef = useRef(null);

  const isHost = me && session && str(me.id) === str(session.host_id);

  function str(v) { return v ? String(v) : ''; }

  const loadData = async () => {
    try {
      const [userRes, sessionRes] = await Promise.all([
        UsersAPI.getMe(),
        Community.getStudySessions() // We find our session in the list or get by ID
      ]);
      setMe(userRes.data);
      // Find this specific session
      const current = sessionRes.data.find(s => str(s.id) === str(id));
      if (current) {
        setSession(current);
      } else if (!session) {
        toast.error('Room not found or expired');
        navigate('/community/rooms');
      }
    } catch (e) {
      console.error('Failed to load active room data', e);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    try {
      await Community.joinStudySession(id);
    } catch (e) {
      console.error('Failed to join room', e);
    }
  };

  useEffect(() => {
    loadData();
    joinRoom();

    pollRef.current = setInterval(() => {
      Community.getStudySessions().then(res => {
        const current = res.data.find(s => str(s.id) === str(id));
        if (current) {
          setSession(current);
        } else {
          toast.info('This study room has ended.');
          navigate('/community/rooms');
        }
      }).catch(() => {});
    }, 10000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  const handleLeave = async () => {
    try {
      if (isHost) {
        if (window.confirm('As host, leaving will close the room for everyone. Proceed?')) {
          await Community.closeStudySession(id);
          toast.success('Room closed');
          navigate('/community/rooms');
        }
      } else {
        await Community.leaveStudySession(id);
        toast.success('You left the room');
        navigate('/community/rooms');
      }
    } catch (e) {
      toast.error('Failed to leave room');
    }
  };

  const handleClose = async () => {
    if (!window.confirm('Are you sure you want to close this room?')) return;
    try {
      await Community.closeStudySession(id);
      toast.success('Room closed');
      navigate('/community/rooms');
    } catch (e) {
      toast.error('Failed to close room');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col items-center justify-center p-10 text-center">
        <div className="w-16 h-16 border-4 border-sky-100 border-t-sky-700 rounded-full animate-spin mb-6"></div>
        <p className="text-sky-700 font-bold">Connecting to Study Room...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader 
        title={session?.subject || 'Study Room'} 
        leftAction={
          <button onClick={() => navigate('/community/rooms')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400">
            <ArrowLeft size={20} />
          </button>
        }
        rightAction={
          <button onClick={handleLeave} className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600">
            <LogOut size={20} />
          </button>
        }
      />

      <div className="px-5 pt-6 pb-24 max-w-lg mx-auto space-y-6">
        {/* ROOM BANNER */}
        <div className="bg-gradient-to-br from-sky-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-sky-100 dark:shadow-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12">
            <Users size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{session?.subject}</span>
              <span className="bg-green-400 w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
              <span className="text-[10px] font-bold text-white/80">LIVE SESSION</span>
            </div>
            <h2 className="font-[var(--font-syne)] font-black text-2xl mb-1 tracking-tight">{session?.topic || 'Collaborative Study'}</h2>
            <p className="text-white/70 text-sm font-medium">Started by {session?.host_name || 'Student'}</p>
          </div>
        </div>

        {/* PARTICIPANTS */}
        <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 border border-sky-100 dark:border-sky-900/20 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF] flex items-center gap-2">
              <Users size={18} className="text-sky-500" /> 
              Participants ({ (session?.participant_count || 0) + 1 })
            </h3>
            <button className="text-xs font-bold text-sky-600 bg-sky-50 dark:bg-sky-900/20 px-3 py-1.5 rounded-lg flex items-center gap-2 active:scale-95 transition-all">
              <Share2 size={12} /> Invite
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
             {/* Host Always First */}
             <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white border-4 border-amber-100 dark:border-amber-900/30 shadow-lg shadow-amber-100 relative">
                  {session?.host_photo ? <img src={session.host_photo} alt="" className="w-full h-full object-cover" /> : <span className="font-black text-xl">{session?.host_name[0]}</span>}
                  <div className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full p-1 border-2 border-white dark:border-[#0D1525]">
                    <ShieldCheck size={10} />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#0C4A6E] dark:text-[#F0F9FF] truncate w-full text-center">{session?.host_name.split(' ')[0]}</span>
             </div>
             
             {/* Dynamic Participants */}
             {Array.from({ length: session?.participant_count || 0 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold text-xl border-2 border-sky-50 dark:border-sky-800/20">
                    👤
                  </div>
                  <span className="text-[10px] font-bold text-sky-500/80">Student</span>
                </div>
             ))}

             {/* Empty Slots */}
             {Array.from({ length: Math.max(0, (session?.limit || 5) - (session?.participant_count || 0) - 1) }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 opacity-30">
                  <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-sky-300 dark:border-sky-800 flex items-center justify-center text-sky-300">
                    <Plus size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-sky-300">Waiting</span>
                </div>
             ))}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="grid grid-cols-2 gap-4">
           <button 
              onClick={() => navigate('/practice/session', { state: { mode: 'Collaborative', subject: session?.subject, room_id: id } })}
              className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-3xl p-5 flex flex-col items-center text-center gap-3 hover:border-sky-400 transition-all active:scale-[0.98]"
           >
              <div className="w-12 h-12 bg-sky-50 dark:bg-sky-900/20 rounded-2xl flex items-center justify-center text-sky-600">
                <Zap size={24} fill="currentColor" />
              </div>
              <h4 className="text-xs font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">Start Practice</h4>
           </button>
           <button className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-3xl p-5 flex flex-col items-center text-center gap-3 hover:border-sky-400 transition-all active:scale-[0.98]">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
                <MessageCircle size={24} fill="currentColor" />
              </div>
              <h4 className="text-xs font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">Group Chat</h4>
           </button>
        </div>

        {isHost && (
          <div className="pt-4">
            <button 
              onClick={handleClose}
              className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/20 rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-all active:scale-95"
            >
              <XCircle size={18} /> Close Study Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

