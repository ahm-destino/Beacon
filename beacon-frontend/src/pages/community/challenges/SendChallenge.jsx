import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import SubScreenHeader from '../../../components/shared/SubScreenHeader';
import BottomNav from '../../../components/shared/BottomNav';
import { Community } from '../../../services/api';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
const QUESTION_COUNTS = [10, 20, 30, 50];

export default function SendChallenge() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillFriend = location.state?.prefillFriend;

  const [selectedFriend, setSelectedFriend] = useState(prefillFriend || null);
  const [subject, setSubject] = useState('');
  const [questionCount, setQuestionCount] = useState(20);
  const [sending, setSending] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await Community.getBuddies();
        const rows = Array.isArray(res?.data) ? res.data : [];
        const mapped = rows
          .map((r) => r.user)
          .filter(Boolean)
          .map((u) => ({
            id: u.id,
            name: u.full_name,
            avatar: ((u.full_name || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('') || 'U').toUpperCase(),
            streak: 0,
            accuracy: 0,
          }));
        if (cancelled) return;
        setFriends(mapped);
      } catch (_) {
        if (cancelled) return;
        setFriends([]);
      } finally {
        if (!cancelled) setLoadingFriends(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSend = async () => {
    if (!selectedFriend || !subject) return;
    setSending(true);
    try {
      const examType = (localStorage.getItem('beacon_exam') || 'JAMB').toUpperCase();
      const res = await Community.createChallenge({
        opponent_id: selectedFriend.id,
        subject,
        question_count: questionCount,
        exam_type: examType,
      });
      const challenge = res?.data;
      setSending(false);
      navigate(`/community/challenges/${challenge.id}`, { state: { challenge } });
    } catch (e) {
      setSending(false);
      toast.error(e?.error || 'Failed to send challenge.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="Send Challenge" />

      <div className="px-5 pt-6 pb-24">
        <p className="font-['Syne'] font-bold text-base text-sky-900 dark:text-sky-100 mb-3">
          Choose your opponent
        </p>
        <div className="flex flex-col gap-3 mb-6">
          {loadingFriends ? (
            <div className="py-6 text-center text-sky-500/70">Loading buddies…</div>
          ) : friends.length === 0 ? (
            <div className="py-6 text-center text-sky-500/70">
              No study buddies yet. Add buddies in Community first.
            </div>
          ) : friends.map(friend => (
            <button
              key={friend.id}
              onClick={() => setSelectedFriend(friend)}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                selectedFriend?.id === friend.id
                  ? 'border-sky-600 bg-sky-50 dark:bg-sky-900/20'
                  : 'border-sky-100 dark:border-sky-900/20 bg-white dark:bg-[#0D1525] hover:border-sky-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-bold font-['Plus_Jakarta_Sans']">
                {friend.avatar}
              </div>
              <div className="flex-1">
                <p className="font-['Syne'] font-bold text-sm text-sky-900 dark:text-sky-100">
                  {friend.name}
                </p>
                <p className="font-['Plus_Jakarta_Sans'] text-xs text-sky-500 mt-0.5">
                  🔥 {friend.streak} days · 🎯 {friend.accuracy}% accuracy
                </p>
              </div>
              {selectedFriend?.id === friend.id && (
                <div className="w-5 h-5 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs">✓</div>
              )}
            </button>
          ))}
        </div>

        <p className="font-['Syne'] font-bold text-base text-sky-900 dark:text-sky-100 mb-3">
          Choose subject
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          {SUBJECTS.map(s => (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold font-['Plus_Jakarta_Sans'] transition-all ${
                subject === s
                  ? 'border-sky-600 bg-sky-600 text-white'
                  : 'border-sky-100 dark:border-sky-900/30 bg-white dark:bg-[#0D1525] text-sky-700 dark:text-sky-300 hover:border-sky-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <p className="font-['Syne'] font-bold text-base text-sky-900 dark:text-sky-100 mb-3">
          Number of questions
        </p>
        <div className="grid grid-cols-4 gap-2 mb-8">
          {QUESTION_COUNTS.map(count => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              className={`py-3 rounded-xl border-2 font-['Plus_Jakarta_Sans'] font-bold text-sm transition-all ${
                questionCount === count
                  ? 'border-sky-600 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400'
                  : 'border-sky-100 dark:border-sky-900/20 bg-white dark:bg-[#0D1525] text-sky-600 dark:text-sky-400 hover:border-sky-300'
              }`}
            >
              {count}
            </button>
          ))}
        </div>

        {selectedFriend && subject && (
          <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700/30 rounded-2xl p-4 mb-6">
            <p className="font-['Syne'] font-bold text-sm text-sky-800 dark:text-sky-200">
              Challenge Summary
            </p>
            <p className="font-['Plus_Jakarta_Sans'] text-sm text-sky-600 dark:text-sky-400 mt-1">
              You vs {selectedFriend.name} · {subject} · {questionCount} questions
            </p>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={!selectedFriend || !subject || sending}
          className="w-full py-4 rounded-xl font-['Syne'] font-black text-lg text-white bg-sky-700 dark:bg-sky-500 hover:bg-sky-800 shadow-[0_12px_32px_rgba(3,105,161,0.35)] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending ? (
            <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Sending Challenge...</>
          ) : '⚔️ Send Challenge →'}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}

