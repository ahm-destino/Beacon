import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { RefreshCw, MessageCircle, UserPlus, MapPin } from 'lucide-react';
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
  const [buddyData, setBuddyData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');

  const pendingRequests = useMemo(() => buddyData?.pending_requests || [], [buddyData]);

  const loadBuddyData = async () => {
    setLoading(true);
    setError('');
    const [buddyRes, suggestionsRes] = await Promise.allSettled([
      Community.getBuddy(),
      Community.findBuddies(),
    ]);

    if (buddyRes.status === 'fulfilled') {
      setBuddyData(buddyRes.value?.data || null);
    } else {
      setError('Could not load buddy data.');
      setBuddyData(null);
    }

    if (suggestionsRes.status === 'fulfilled') {
      setSuggestions(suggestionsRes.value?.data?.suggestions || []);
    } else {
      setSuggestions([]);
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
      await loadBuddyData();
    } catch (err) {
      toast.error(err?.error || 'Failed to accept');
    } finally {
      setActionId(null);
    }
  };

  const handleEndBuddy = async (relationshipId) => {
    setActionId(relationshipId);
    try {
      await Community.endBuddy(relationshipId);
      toast.success('Buddy relationship ended');
      await loadBuddyData();
    } catch (err) {
      toast.error(err?.error || 'Failed to end buddy');
    } finally {
      setActionId(null);
    }
  };

  const buddy = buddyData?.buddy || null;

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader
        title="Study Buddies"
        rightAction={
          <button
            type="button"
            onClick={loadBuddyData}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400"
            aria-label="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        }
      />

      <div className="px-5 pt-6 pb-24">
        {loading ? (
          <div className="py-16 text-center text-sky-600 dark:text-sky-400 text-sm">
            Loading study buddy data...
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {buddyData?.has_buddy && buddy ? (
              <div className="space-y-5">
                <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-bold text-base overflow-hidden">
                      {buddy.profile_photo_url ? (
                        <img src={buddy.profile_photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initials(buddy.full_name)
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9]">
                        {buddy.full_name}
                      </p>
                      <p className="text-xs text-sky-500 flex items-center gap-1">
                        <MapPin size={12} /> {buddy.school_name || 'School'} {buddy.state ? `, ${buddy.state}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                      { label: 'Accuracy', value: `${buddy.accuracy || 0}%` },
                      { label: 'Streak', value: `${buddy.streak || 0}` },
                      { label: 'Exam', value: buddy.primary_exam || 'Exam' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 text-center">
                        <p className="font-[var(--font-jakarta)] font-bold text-sm text-sky-700 dark:text-sky-400">
                          {stat.value}
                        </p>
                        <p className="text-[10px] text-sky-400 mt-0.5 uppercase tracking-wider">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {formatSubjects(buddy.subjects).map((subj) => (
                      <span key={subj} className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 px-3 py-1 rounded-full text-[10px] font-bold">
                        {subj}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <button
                      onClick={() => navigate('/community/buddies/chat', { state: { name: buddy.full_name, img: initials(buddy.full_name) } })}
                      className="w-full py-3 rounded-xl bg-sky-700 text-white font-[var(--font-syne)] font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={16} /> Message
                    </button>
                    <button
                      onClick={() => navigate(`/community/students/${buddy.id}`, { state: { student: {
                        id: buddy.id,
                        name: buddy.full_name,
                        school: buddy.school_name,
                        state: buddy.state,
                        streak: buddy.streak,
                        accuracy: buddy.accuracy,
                        subjects: buddy.subjects,
                        exam: buddy.primary_exam,
                      } } })}
                      className="w-full py-3 rounded-xl bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 font-[var(--font-syne)] font-bold text-sm"
                    >
                      View Profile
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleEndBuddy(buddyData.relationship_id)}
                  disabled={actionId === buddyData.relationship_id}
                  className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-[var(--font-syne)] font-bold text-sm border border-red-100 dark:border-red-900/40"
                >
                  {actionId === buddyData.relationship_id ? 'Ending...' : 'End Buddy Relationship'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingRequests.length > 0 && (
                  <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
                    <div className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-4">
                      Pending Requests
                    </div>
                    <div className="space-y-3">
                      {pendingRequests.map((req) => (
                        <div key={req.id} className="flex items-center gap-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-bold text-xs">
                            {initials(req.from_user?.full_name)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-sky-800 dark:text-sky-100">
                              {req.from_user?.full_name}
                            </p>
                            <p className="text-[10px] text-sky-500">
                              {req.from_user?.school_name || 'School'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            disabled={actionId === req.id}
                            className="px-3 py-1.5 rounded-lg bg-sky-700 text-white text-xs font-bold"
                          >
                            {actionId === req.id ? 'Accepting...' : 'Accept'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9]">
                      Suggested Buddies
                    </h2>
                    <button
                      onClick={() => navigate('/community/buddies/find')}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400"
                    >
                      View All
                    </button>
                  </div>

                  {suggestions.length === 0 ? (
                    <div className="py-10 text-center text-sky-500/70 text-sm">
                      No suggestions right now. Check back later.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {suggestions.map((s) => (
                        <div key={s.id} className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 flex flex-col items-center text-center relative">
                          <div className="absolute top-2 right-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">
                            {s.match_score || 0}%
                          </div>

                          <button
                            onClick={() => navigate(`/community/students/${s.id}`, { state: { student: {
                              id: s.id,
                              name: s.full_name,
                              school: s.school_name,
                              state: s.state,
                              streak: s.streak,
                              accuracy: s.accuracy,
                              subjects: s.subjects,
                              exam: s.primary_exam,
                            } } })}
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md mb-3 mt-2 overflow-hidden"
                          >
                            {s.profile_photo_url ? (
                              <img src={s.profile_photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              initials(s.full_name)
                            )}
                          </button>

                          <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">
                            {s.full_name}
                          </h3>
                          <div className="flex items-center gap-1 text-[10px] text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 mb-2">
                            <MapPin size={10} /> {s.school_name || 'School'}
                          </div>

                          <div className="flex flex-wrap justify-center gap-1 mb-3">
                            {formatSubjects(s.subjects, 2).map((sub) => (
                              <span key={sub} className="bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                {sub}
                              </span>
                            ))}
                          </div>

                          <div className="flex gap-2 w-full mt-auto">
                            <button
                              onClick={() => handleSendRequest(s.id)}
                              disabled={actionId === s.id}
                              className="flex-1 bg-[#0369A1] dark:bg-[#0EA5E9] text-white rounded-lg py-1.5 flex items-center justify-center hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] transition-colors text-xs font-bold"
                            >
                              <UserPlus size={14} /> {actionId === s.id ? 'Sending' : 'Request'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
