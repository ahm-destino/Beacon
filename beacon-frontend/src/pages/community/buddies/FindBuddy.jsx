import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MapPin, UserPlus } from 'lucide-react';
import SubScreenHeader from '../../../components/shared/SubScreenHeader';
import BottomNav from '../../../components/shared/BottomNav';
import { Community } from '../../../services/api';

const initials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export default function FindBuddy() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [suggestionsRes, requestsRes] = await Promise.allSettled([
      Community.findBuddies(),
      Community.getBuddyRequests(),
    ]);

    if (suggestionsRes.status === 'fulfilled') {
      setSuggestions(suggestionsRes.value?.data?.suggestions || []);
    } else {
      setSuggestions([]);
    }

    if (requestsRes.status === 'fulfilled') {
      setPendingRequests(requestsRes.value?.data?.requests || []);
    } else {
      setPendingRequests([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
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
      await loadData();
    } catch (err) {
      toast.error(err?.error || 'Failed to accept');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="Find a Buddy" />

      <div className="px-5 pt-6 pb-24">
        <p className="font-['Plus_Jakarta_Sans'] text-sm text-sky-600 dark:text-sky-400 mb-6 leading-relaxed">
          These students match your exam profile and study level.
        </p>

        {loading ? (
          <div className="py-16 text-center text-sky-600 dark:text-sky-400 text-sm">
            Loading suggestions...
          </div>
        ) : (
          <>
            {pendingRequests.length > 0 && (
              <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5 mb-6">
                <div className="font-['Syne'] font-bold text-sm text-sky-900 dark:text-sky-100 mb-4">
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

            <div className="flex flex-col gap-4">
              {suggestions.length === 0 ? (
                <div className="py-10 text-center text-sky-500/70 text-sm">
                  No matches right now. Try again later.
                </div>
              ) : (
                suggestions.map((match) => (
                  <div key={match.id} className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-bold font-['Plus_Jakarta_Sans'] text-base overflow-hidden">
                          {match.profile_photo_url ? (
                            <img src={match.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            initials(match.full_name)
                          )}
                        </div>
                        <div>
                          <p className="font-['Syne'] font-bold text-base text-sky-900 dark:text-sky-100">
                            {match.full_name}
                          </p>
                          <p className="font-['Plus_Jakarta_Sans'] text-xs text-sky-500 mt-0.5">
                            {match.primary_exam || 'Exam'}
                          </p>
                        </div>
                      </div>
                      <div className="bg-sky-100 dark:bg-sky-900/30 rounded-xl px-3 py-1.5 text-center">
                        <p className="font-['Plus_Jakarta_Sans'] font-black text-base text-sky-700 dark:text-sky-400">
                          {match.match_score || 0}%
                        </p>
                        <p className="font-['Plus_Jakarta_Sans'] text-[10px] text-sky-500">match</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: 'Accuracy', value: `${match.accuracy || 0}%` },
                        { label: 'Streak', value: `${match.streak || 0}` },
                        { label: 'State', value: match.state || 'N/A' },
                      ].map((stat) => (
                        <div key={stat.label} className="text-center bg-sky-50 dark:bg-sky-900/20 rounded-xl p-2.5">
                          <p className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-sky-700 dark:text-sky-400">
                            {stat.value}
                          </p>
                          <p className="font-['Plus_Jakarta_Sans'] text-[10px] text-sky-400 mt-0.5">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 mb-4">
                      <MapPin size={10} /> {match.school_name || 'School'}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/community/students/${match.id}`, { state: { student: {
                          id: match.id,
                          name: match.full_name,
                          school: match.school_name,
                          state: match.state,
                          streak: match.streak,
                          accuracy: match.accuracy,
                          subjects: match.subjects,
                          exam: match.primary_exam,
                        } } })}
                        className="flex-1 py-2.5 rounded-xl border border-sky-200 dark:border-sky-800/30 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-50 transition-all"
                      >
                        View Profile
                      </button>

                      <button
                        onClick={() => handleSendRequest(match.id)}
                        disabled={actionId === match.id}
                        className="flex-1 py-2.5 rounded-xl bg-sky-600 dark:bg-sky-500 font-['Syne'] text-sm font-bold text-white hover:bg-sky-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        <UserPlus size={14} /> {actionId === match.id ? 'Sending...' : 'Send Request'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
