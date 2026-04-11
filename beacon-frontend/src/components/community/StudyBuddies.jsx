import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { RefreshCw, MessageCircle, UserPlus, MapPin, X } from 'lucide-react';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Community } from '../../services/api';

const initials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const formatSubjects = (subjects = [], max = 3) => {
  if (!Array.isArray(subjects)) return [];
  return subjects.slice(0, max);
};

export default function StudyBuddies() {
  const navigate = useNavigate();
  const [buddies, setBuddies] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');

  const loadBuddyData = async () => {
    setLoading(true);
    setError('');
    const [buddyRes, pendingRes, suggestionsRes] = await Promise.allSettled([
      Community.getBuddies(),
      Community.getBuddyRequests(),
      Community.findBuddies(),
    ]);

    if (buddyRes.status === 'fulfilled') {
      setBuddies(buddyRes.value?.data || []);
    } else {
      setError('Could not load active buddies.');
    }

    if (pendingRes.status === 'fulfilled') {
      setPendingRequests(pendingRes.value?.data || []);
    }

    if (suggestionsRes.status === 'fulfilled') {
      setSuggestions(suggestionsRes.value?.data?.suggestions || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadBuddyData();
  }, []);

  const handleSendRequest = async (userId) => {
    setActionId(userId);
    try {
      await Community.requestBuddy(userId);
      toast.success('Buddy request sent');
      setSuggestions((prev) => prev.filter((s) => s.id !== userId));
    } catch (err) {
      toast.error(err?.error || 'Failed to send request');
    } finally {
      setActionId(null);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setActionId(requestId);
    try {
      await Community.acceptBuddy(requestId);
      toast.success('Buddy accepted');
      loadBuddyData();
    } catch (err) {
      toast.error(err?.error || 'Failed to accept');
    } finally {
      setActionId(null);
    }
  };

  const handleEndBuddy = async (relationshipId) => {
    if (!window.confirm('Are you sure you want to end this buddy relationship?')) return;
    setActionId(relationshipId);
    try {
      await Community.endBuddy(relationshipId);
      toast.success('Buddy relationship ended');
      loadBuddyData();
    } catch (err) {
      toast.error(err?.error || 'Failed to end buddy');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-24">
      <SubScreenHeader
        title="Study Buddies"
        rightAction={
          <button
            type="button"
            onClick={loadBuddyData}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      <div className="px-5 pt-6 space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Active Buddies Section */}
        <section>
          <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">Your Study Buddies</h2>
          {loading ? (
             <div className="space-y-4">
                {[1,2].map(i => <div key={i} className="h-32 bg-white/50 dark:bg-[#0D1525]/50 animate-pulse rounded-2xl" />)}
             </div>
          ) : buddies.length === 0 ? (
            <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-8 text-center">
              <div className="w-12 h-12 bg-sky-50 dark:bg-sky-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <UserPlus size={24} className="text-sky-400" />
              </div>
              <p className="text-sm text-sky-600 dark:text-sky-400 font-medium">No active study buddies yet.</p>
              <p className="text-xs text-sky-400 mt-1">Request a buddy below to start collaborating!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {buddies.map((rel) => {
                const b = rel.buddy;
                return (
                  <div key={rel.id} className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base overflow-hidden shadow-inner">
                        {b.profile_photo_url ? (
                          <img src={b.profile_photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          initials(b.full_name)
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                           <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF]">
                            {b.full_name}
                          </h3>
                          <button 
                            onClick={() => handleEndBuddy(rel.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                             <X size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-sky-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} /> {b.school_name || 'School'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                       <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                         {b.accuracy || 0}% Accuracy
                       </span>
                       <span className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                         🔥 {b.streak || 0} Day Streak
                       </span>
                    </div>

                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={() => navigate('/community/buddies/chat', { state: { buddy: b, relationship_id: rel.id } })}
                        className="flex-1 py-2.5 rounded-xl bg-sky-700 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-sky-600 transition-colors shadow-lg shadow-sky-100 dark:shadow-none"
                      >
                        <MessageCircle size={16} /> Chat
                      </button>
                      <button
                         onClick={() => navigate(`/community/students/${b.id}`, { state: { student: b } })}
                        className="flex-1 py-2.5 rounded-xl bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 font-bold text-sm hover:bg-sky-50 transition-colors"
                      >
                        Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pending Requests Section */}
        {!loading && pendingRequests.length > 0 && (
          <section>
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">Pending Requests</h2>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 bg-white dark:bg-[#0D1525] border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold text-xs">
                    {initials(req.from_user?.full_name)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-sky-800 dark:text-sky-100 truncate">
                      {req.from_user?.full_name}
                    </p>
                    <p className="text-[10px] text-sky-500 truncate">
                      {req.from_user?.school_name || 'Student'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAcceptRequest(req.id)}
                    disabled={actionId === req.id}
                    className="shrink-0 px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-100 dark:shadow-none disabled:opacity-50"
                  >
                    {actionId === req.id ? '...' : 'Accept'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Suggestions Section */}
        <section>
           <div className="flex items-center justify-between mb-4">
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9]">Find New Buddies</h2>
            <button
              onClick={() => navigate('/community/buddies/find')}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
            >
              View More
            </button>
          </div>

          {!loading && suggestions.length === 0 ? (
            <div className="py-10 text-center text-sky-500/70 text-sm italic">
              Check back later for more suggestions!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {suggestions.map((s) => (
                <div key={s.id} className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 flex flex-col items-center text-center relative shadow-sm hover:border-sky-300 transition-colors">
                  <div className="absolute top-2 right-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                    {s.match_score || 0}% Match
                  </div>

                  <div 
                    onClick={() => navigate(`/community/students/${s.id}`, { state: { student: s } })}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-sky-500 flex items-center justify-center text-white font-bold text-lg shadow-md mb-3 mt-2 overflow-hidden cursor-pointer"
                  >
                    {s.profile_photo_url ? (
                      <img src={s.profile_photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials(s.full_name)
                    )}
                  </div>

                  <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] line-clamp-1">
                    {s.full_name}
                  </h3>
                  <p className="text-[10px] text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 line-clamp-1 mb-3">
                    {s.school_name || 'Student'}
                  </p>

                  <button
                    onClick={() => handleSendRequest(s.id)}
                    disabled={actionId === s.id}
                    className="w-full bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 rounded-xl py-2 flex items-center justify-center hover:bg-sky-700 hover:text-white transition-all text-xs font-bold gap-2 disabled:opacity-50"
                  >
                    <UserPlus size={14} /> {actionId === s.id ? 'Sending...' : 'Request'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

