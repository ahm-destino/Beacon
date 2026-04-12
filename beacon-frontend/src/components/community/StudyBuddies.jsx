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
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'incoming', 'sent'
  const [buddies, setBuddies] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');

  const loadBuddyData = async () => {
    setLoading(true);
    setError('');
    try {
      const [buddyRes, requestsRes, suggestionsRes] = await Promise.all([
        Community.getBuddies(),
        Community.getBuddyRequests(),
        Community.findBuddies(),
      ]);

      setBuddies(Array.isArray(buddyRes?.data) ? buddyRes.data : []);
      setIncomingRequests(Array.isArray(requestsRes?.data?.incoming) ? requestsRes.data.incoming : []);
      setOutgoingRequests(Array.isArray(requestsRes?.data?.outgoing) ? requestsRes.data.outgoing : []);
      setSuggestions(Array.isArray(suggestionsRes?.data?.suggestions) ? suggestionsRes.data.suggestions : []);
    } catch (err) {
      setError('Could not sync buddy data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuddyData();
  }, []);

  const handleSendRequest = async (userId) => {
    setActionId(userId);
    try {
      await Community.requestBuddy(userId);
      toast.success('Buddy request sent');
      loadBuddyData();
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
      toast.success('Relationship updated');
      loadBuddyData();
    } catch (err) {
      toast.error(err?.error || 'Failed to update');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-24">
      <SubScreenHeader
        title="Community"
        rightAction={
          <button
            type="button"
            onClick={loadBuddyData}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 font-bold"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      {/* TABS HEADER */}
      <div className="px-5 pt-4">
        <div className="flex bg-white dark:bg-[#0D1525] p-1 rounded-2xl border border-sky-100 dark:border-sky-900/20 shadow-sm">
          {[
            { id: 'active', label: 'Buddies', count: buddies.length },
            { id: 'incoming', label: 'Received', count: incomingRequests.length },
            { id: 'sent', label: 'Sent', count: outgoingRequests.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2
                ${activeTab === tab.id 
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' 
                  : 'text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/10'}`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab.id ? 'bg-white text-sky-600' : 'bg-sky-100 dark:bg-sky-900/30 text-sky-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-6 space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ACTIVE BUDDIES */}
        {activeTab === 'active' && (
          <section>
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">Your Active Connections</h2>
            {loading ? (
               <div className="space-y-4">
                  {[1,2].map(i => <div key={i} className="h-32 bg-white/50 dark:bg-[#0D1525]/50 animate-pulse rounded-2xl" />)}
               </div>
            ) : buddies.length === 0 ? (
              <div className="bg-white dark:bg-[#0D1525] rounded-3xl border border-sky-100 dark:border-sky-900/20 p-8 text-center">
                <div className="w-12 h-12 bg-sky-50 dark:bg-sky-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <UserPlus size={24} className="text-sky-400" />
                </div>
                <p className="text-sm text-sky-600 dark:text-sky-400 font-medium">No active buddies yet.</p>
                <p className="text-xs text-sky-400 mt-1">Request a buddy from suggestions below!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {buddies.map((rel) => {
                  const u = rel.user;
                  if (!u) return null;
                  return (
                    <div key={rel.relationship_id || rel.id} className="bg-white dark:bg-[#0D1525] rounded-3xl border border-sky-100 dark:border-sky-900/20 p-5 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div 
                          onClick={() => u?.id && navigate(`/community/students/${u.id}`, { state: { student: u } })}
                          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base overflow-hidden shadow-inner cursor-pointer"
                        >
                          {u?.profile_photo_url ? (
                            <img src={u.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            initials(u?.full_name)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                             <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF] truncate">
                              {u.full_name}
                            </h3>
                            <button 
                              onClick={() => handleEndBuddy(rel.relationship_id || rel.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                               <X size={16} />
                            </button>
                          </div>
                          <p className="text-xs text-sky-500 flex items-center gap-1 mt-0.5 truncate">
                            {u.school_name || 'Individual Student'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                         <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                           {u.accuracy || 0}% Accuracy
                         </span>
                         <span className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                           🔥 {u.streak || 0} Streak
                         </span>
                      </div>

                      <div className="flex gap-3 mt-5">
                        <button
                          onClick={() => navigate('/community/buddies/chat', { state: { buddy: u, relationship_id: rel.relationship_id || rel.id } })}
                          className="flex-1 py-3 rounded-2xl bg-sky-700 text-white font-black text-xs flex items-center justify-center gap-2 hover:bg-sky-600 transition-all shadow-lg shadow-sky-100 dark:shadow-none active:scale-95"
                        >
                          <MessageCircle size={16} /> Chat Now
                        </button>
                        <button
                           onClick={() => navigate(`/community/students/${u.id}`, { state: { student: u } })}
                          className="flex-1 py-3 rounded-2xl bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 font-black text-xs hover:bg-sky-50 transition-all active:scale-95"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* INCOMING REQUESTS */}
        {activeTab === 'incoming' && (
          <section>
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">Received Requests</h2>
            {incomingRequests.length === 0 ? (
              <div className="text-center py-12 px-6 bg-white dark:bg-[#0D1525] rounded-3xl border border-dashed border-sky-200 dark:border-sky-900/40 opacity-60">
                <p className="text-sm font-medium">No pending requests received.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div key={req.id} className="flex items-center gap-3 bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-3xl p-4 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 font-black text-sm overflow-hidden">
                      {req.from_user?.profile_photo_url ? (
                        <img src={req.from_user.profile_photo_url} className="w-full h-full object-cover" />
                      ) : (
                        initials(req.from_user?.full_name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-sky-800 dark:text-sky-100 truncate">
                        {req.from_user?.full_name}
                      </p>
                      <p className="text-[10px] text-sky-500 truncate font-semibold">
                        {req.from_user?.school_name || 'Individual Student'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                       <button
                        onClick={() => handleAcceptRequest(req.id)}
                        disabled={actionId === req.id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md shadow-emerald-100 dark:shadow-none disabled:opacity-50 active:scale-95"
                      >
                        {actionId === req.id ? '...' : 'Accept'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SENT REQUESTS */}
        {activeTab === 'sent' && (
          <section>
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">Requests Sent</h2>
            {outgoingRequests.length === 0 ? (
              <div className="text-center py-12 px-6 bg-white dark:bg-[#0D1525] rounded-3xl border border-dashed border-sky-200 dark:border-sky-900/40 opacity-60">
                <p className="text-sm font-medium">You haven't sent any requests lately.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {outgoingRequests.map((req) => (
                  <div key={req.id} className="flex items-center gap-3 bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-3xl p-4 shadow-sm opacity-80">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-sm overflow-hidden">
                      {req.to_user?.profile_photo_url ? (
                        <img src={req.to_user.profile_photo_url} className="w-full h-full object-cover grayscale" />
                      ) : (
                        initials(req.to_user?.full_name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                        {req.to_user?.full_name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <p className="text-[10px] text-amber-600 font-black uppercase tracking-wider">Pending</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEndBuddy(req.id)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* FIND NEW BUDDIES - Keep at bottom for all tabs? */}
        <section className="pt-4">
           <div className="flex items-center justify-between mb-4">
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9]">Suggestions</h2>
            <button
              onClick={() => navigate('/community/buddies/find')}
              className="text-xs font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest hover:underline"
            >
              View All
            </button>
          </div>

          {loading ? (
             <div className="grid grid-cols-2 gap-4">
                {[1,2].map(i => <div key={i} className="h-40 bg-white/50 dark:bg-[#0D1525]/50 animate-pulse rounded-3xl" />)}
             </div>
          ) : suggestions.length === 0 ? (
            <div className="py-10 text-center text-sky-500/70 text-sm italic">
               No new suggestions right now.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {suggestions.slice(0, 4).map((s) => (
                <div key={s.id} className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-3xl p-5 flex flex-col items-center text-center relative shadow-sm hover:border-sky-300 transition-all hover:shadow-md">
                  <div 
                    onClick={() => navigate(`/community/students/${s.id}`, { state: { student: s } })}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-sky-500 flex items-center justify-center text-white font-bold text-lg shadow-md mb-3 overflow-hidden cursor-pointer"
                  >
                    {s.profile_photo_url ? (
                      <img src={s.profile_photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials(s.full_name)
                    )}
                  </div>

                  <h3 className="font-[var(--font-syne)] font-bold text-xs text-[#0C4A6E] dark:text-[#F0F9FF] line-clamp-1">
                    {s.full_name}
                  </h3>
                  <p className="text-[9px] text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 line-clamp-1 mb-4 font-semibold uppercase tracking-wider">
                    {s.school_name || 'Student'}
                  </p>

                  <button
                    onClick={() => handleSendRequest(s.id)}
                    disabled={actionId === s.id}
                    className="w-full bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 rounded-2xl py-2.5 flex items-center justify-center hover:bg-sky-700 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest gap-2 disabled:opacity-50"
                  >
                    {actionId === s.id ? '...' : 'Request'}
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

