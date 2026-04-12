import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, MessageCircle, UserPlus, MapPin, TrendingUp, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { Community } from '../../services/api';
import { toast } from 'sonner';

const initials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export default function BuddyProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [buddy, setBuddy] = useState(location.state?.buddy || null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProfile = async () => {
    try {
      const res = await Community.getStudent(id);
      setBuddy(res.data);
    } catch (err) {
      toast.error('Failed to load student profile');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const handleRequest = async () => {
    setActionLoading(true);
    try {
      await Community.requestBuddy(id);
      toast.success('Request sent');
      loadProfile();
    } catch (err) {
      toast.error(err?.error || 'Failed to send');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!buddy?.relationship?.id) return;
    setActionLoading(true);
    try {
      await Community.acceptBuddy(buddy.relationship.id);
      toast.success('Request accepted');
      loadProfile();
    } catch (err) {
      toast.error(err?.error || 'Failed to accept');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-sky-600 dark:text-sky-400 font-[var(--font-syne)] uppercase tracking-widest">Loading Profile</p>
      </div>
    );
  }

  const rel = buddy?.relationship || { status: 'none' };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] text-[#0C4A6E] dark:text-[#F0F9FF]">
      {/* HEADER */}
      <div className="relative h-48 bg-gradient-to-br from-sky-600 to-indigo-700">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-5 w-9 h-9 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all z-10"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]"></div>
      </div>

      <div className="px-5 max-w-md mx-auto -mt-16 relative z-10 pb-24">
        {/* PROFILE CARD */}
        <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 border border-sky-100 dark:border-sky-900/20 shadow-xl mb-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-[2rem] border-4 border-white dark:border-[#0D1525] bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-4 overflow-hidden relative">
            {buddy.profile_photo_url ? (
              <img src={buddy.profile_photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(buddy.full_name)
            )}
            {rel.status === 'active' && (
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-[#0D1525] rounded-full" />
            )}
          </div>

          <h1 className="font-[var(--font-syne)] font-black text-2xl text-[#0369A1] dark:text-[#0EA5E9] text-center">{buddy.full_name}</h1>
          <div className="flex items-center gap-1 text-xs text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 font-bold uppercase tracking-widest mb-6">
            <MapPin size={12} /> {buddy.school_name || 'Individual Student'}
          </div>

          <div className="w-full">
            {rel.status === 'active' ? (
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/community/buddies/chat', { state: { buddy, relationship_id: rel.id } })}
                  className="flex-1 bg-sky-700 dark:bg-sky-600 text-white rounded-2xl py-3.5 font-black text-xs shadow-lg shadow-sky-400/20 flex items-center justify-center gap-2 hover:bg-sky-600 transition-all active:scale-95 uppercase tracking-widest"
                >
                  <MessageCircle size={18} /> Chat
                </button>
                <div className="px-5 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/40">
                  Friends
                </div>
              </div>
            ) : rel.status === 'pending_sent' ? (
              <button
                disabled
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl py-3.5 font-black text-xs flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <Clock size={18} /> Request Sent
              </button>
            ) : rel.status === 'pending_received' ? (
              <button
                onClick={handleAccept}
                disabled={actionLoading}
                className="w-full bg-emerald-600 text-white rounded-2xl py-3.5 font-black text-xs shadow-lg shadow-emerald-400/20 flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all active:scale-95 uppercase tracking-widest"
              >
                <CheckCircle2 size={18} /> {actionLoading ? '...' : 'Accept Request'}
              </button>
            ) : (
              <button
                onClick={handleRequest}
                disabled={actionLoading}
                className="w-full bg-sky-700 text-white rounded-2xl py-3.5 font-black text-xs shadow-lg shadow-sky-400/20 flex items-center justify-center gap-2 hover:bg-sky-600 transition-all active:scale-95 uppercase tracking-widest"
              >
                <UserPlus size={18} /> {actionLoading ? '...' : 'Add Buddy'}
              </button>
            )}
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-[#0D1525] p-5 rounded-3xl border border-sky-100 dark:border-sky-900/20 shadow-sm relative overflow-hidden">
             <div className="text-amber-500 mb-2 opacity-10 absolute -right-4 -top-4 scale-[250%] rotate-12"><TrendingUp size={24} /></div>
             <div className="font-['Plus_Jakarta_Sans'] text-2xl font-black">{buddy.accuracy || 0}%</div>
             <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Accuracy</div>
          </div>
          <div className="bg-white dark:bg-[#0D1525] p-5 rounded-3xl border border-sky-100 dark:border-sky-900/20 shadow-sm relative overflow-hidden">
             <div className="text-orange-500 mb-2 opacity-10 absolute -right-4 -top-4 scale-[250%] rotate-12"><Zap size={24} /></div>
             <div className="font-['Plus_Jakarta_Sans'] text-2xl font-black">{buddy.streak || 0}</div>
             <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Day Streak</div>
          </div>
        </div>

        {/* BIO */}
        {buddy.bio && (
          <div className="bg-white dark:bg-[#0D1525] p-6 rounded-3xl border border-sky-100 dark:border-sky-900/20 shadow-sm mb-6">
             <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-sky-400 mb-3">About Student</h3>
             <p className="text-sm font-medium leading-relaxed opacity-80">{buddy.bio}</p>
          </div>
        )}

        {/* SUBJECTS */}
        <div className="mb-6">
          <h3 className="font-[var(--font-syne)] font-black text-sm text-sky-700 dark:text-[#0EA5E9] mb-4 uppercase tracking-widest flex items-center gap-2">
            <div className="w-6 h-1 bg-sky-400 rounded-full" /> Favorite Subjects
          </h3>
          <div className="flex flex-wrap gap-2">
            {(buddy.subjects || []).length ? (buddy.subjects || []).map(sub => (
              <span key={sub} className="bg-white dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-sky-100 dark:border-sky-800/20 shadow-sm">
                {sub}
              </span>
            )) : (
              <span className="text-xs text-sky-500 font-medium italic">No subjects configured yet.</span>
            )}
          </div>
        </div>

        {/* BADGES */}
        <div>
          <h3 className="font-[var(--font-syne)] font-black text-sm text-sky-700 dark:text-[#0EA5E9] mb-4 uppercase tracking-widest flex items-center gap-2">
            <div className="w-6 h-1 bg-sky-400 rounded-full" /> Achievements
          </h3>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {(buddy.badges || ['🏆', '🔥', '⚡', '🎯']).map((badge, i) => (
              <div key={i} className="shrink-0 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-3xl bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 shadow-sm flex items-center justify-center text-3xl hover:scale-110 transition-transform cursor-default">
                  {badge}
                </div>
                <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.2em]">Badge</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
