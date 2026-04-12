import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Trophy, Clock, Swords, ArrowLeft, RotateCcw, BookOpen } from 'lucide-react';
import SubScreenHeader from '../../../components/shared/SubScreenHeader';
import BottomNav from '../../../components/shared/BottomNav';
import { Community } from '../../../services/api';

const initials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export default function ChallengeResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { challengeId: stateId } = location.state || {};
  const targetId = id || stateId;

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  const loadData = useCallback(async () => {
    if (!targetId) return;
    try {
      const res = await Community.getChallenge(targetId);
      if (res?.data) {
        setChallenge(res.data);
      }
    } catch (err) {
      console.error('Failed to load challenge results', err);
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling if waiting
  useEffect(() => {
    if (!challenge || challenge.status !== 'waiting') return;
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [challenge, loadData]);

  // Expiration countdown
  useEffect(() => {
    if (!challenge?.expires_at || challenge.status !== 'waiting') return;

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(challenge.expires_at);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        loadData();
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [challenge, loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-white font-bold text-xl mb-2">Challenge Not Found</h2>
        <button onClick={() => navigate('/community/challenges')} className="text-sky-400 font-bold">Back to Challenges</button>
      </div>
    );
  }

  const isWaiting = challenge.status === 'waiting';
  const isCompleted = challenge.status === 'completed';
  const myRole = challenge.my_role;
  const myScore = Math.round(myRole === 'challenger' ? (challenge.challenger_score || 0) : (challenge.opponent_score || 0));
  const oppScore = Math.round(myRole === 'challenger' ? (challenge.opponent_score || 0) : (challenge.challenger_score || 0));
  const opponent = myRole === 'challenger' ? challenge.opponent : challenge.challenger;

  const iWon = isCompleted && challenge.winner_id && String(challenge.winner_id) === String(challenge.current_user_id);
  const isDraw = isCompleted && !challenge.winner_id;
  const iLost = isCompleted && challenge.winner_id && String(challenge.winner_id) !== String(challenge.current_user_id);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-24">
      <SubScreenHeader title="Results" />

      <div className="px-5 pt-6 flex flex-col items-center">
        {/* Main Status Card */}
        <div className={`w-full rounded-3xl p-8 text-center mb-6 shadow-xl relative overflow-hidden transition-all duration-500 ${
          iWon ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500' :
          isDraw ? 'bg-gradient-to-br from-sky-400 via-sky-500 to-indigo-500' :
          iLost ? 'bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700' :
          'bg-gradient-to-br from-sky-600 to-indigo-700'
        }`}>
          {/* Decorative Background Icon */}
          <div className="absolute -top-4 -right-4 opacity-10 rotate-12">
             <Trophy size={160} />
          </div>

          <div className="relative z-10">
            <span className="text-6xl mb-4 block animate-bounce">
              {iWon ? '🏆' : isDraw ? '🤝' : iLost ? '💀' : '⏳'}
            </span>
            <h1 className="font-[var(--font-syne)] font-black text-3xl text-white tracking-tight uppercase">
              {isWaiting ? 'Round Submitted!' : iWon ? 'Champion!' : isDraw ? "It's a Draw!" : iLost ? 'Defeat' : 'Ended'}
            </h1>
            <p className="font-[var(--font-jakarta)] text-white/80 mt-2 font-medium">
              {isWaiting 
                ? `Match is still live. Waiting for ${opponent?.name || 'opponent'}...` 
                : iWon ? 'Total dominance! Points added.' : iLost ? 'Better luck next time!' : 'Great match!'}
            </p>
          </div>
        </div>

        {/* Scores Grid */}
        <div className="w-full bg-white dark:bg-[#0D1525] rounded-3xl border border-sky-100 dark:border-sky-900/20 p-6 shadow-sm mb-4">
          <div className="grid grid-cols-3 gap-2 items-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold text-lg mb-2 shadow-inner">
                YOU
              </div>
              <div className="font-['Plus_Jakarta_Sans'] font-black text-3xl text-sky-700 dark:text-sky-400">{myScore}%</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-sky-400 mt-1">Accuracy</div>
            </div>

            <div className="flex flex-col items-center justify-center">
               <div className="h-0.5 w-8 bg-sky-100 dark:bg-sky-800 rounded-full mb-1" />
               <Swords size={20} className="text-sky-200 dark:text-sky-800" />
               <div className="h-0.5 w-8 bg-sky-100 dark:bg-sky-800 rounded-full mt-1" />
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-lg mb-2 shadow-inner">
                 {initials(opponent?.name)}
              </div>
              <div className="font-['Plus_Jakarta_Sans'] font-black text-3xl text-amber-600 dark:text-amber-400">
                {isWaiting ? '??' : `${oppScore}%`}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mt-1">Score</div>
            </div>
          </div>

          {!isWaiting && (
            <div className="mt-6 pt-6 border-t border-sky-50 dark:border-sky-900/10">
              <div className="h-2.5 w-full bg-sky-50 dark:bg-sky-900/20 rounded-full flex overflow-hidden">
                <div className="h-full bg-sky-600 transition-all duration-1000" style={{ width: `${(myScore / (myScore + oppScore + 0.1)) * 100}%` }}></div>
                <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${(oppScore / (myScore + oppScore + 0.1)) * 100}%` }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        {isWaiting ? (
           <div className="w-full bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl p-4 flex items-center gap-4 mb-6">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl">
                 <Clock size={24} className="text-amber-600 dark:text-amber-400 animate-pulse" />
              </div>
              <div>
                 <p className="text-xs font-bold text-amber-800 dark:text-amber-300">OPPONENT IS PLAYING</p>
                 <p className="text-sm font-medium text-amber-700/70 dark:text-amber-400/70">Wait for them or check back later.</p>
              </div>
           </div>
        ) : (
           <div className="w-full bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-4 text-center mb-6">
              <p className="font-[var(--font-syne)] font-bold text-base text-emerald-700 dark:text-emerald-400">
                 {iWon ? '🎉 +25 Points Earned!' : isDraw ? '+10 Points Earned!' : '+5 Consolation Points'}
              </p>
           </div>
        )}

        {/* Actions */}
        <div className="w-full space-y-3">
          <button
            onClick={() => navigate('/community/challenges')}
            className="w-full py-4 rounded-2xl font-[var(--font-syne)] font-bold text-base text-white bg-sky-700 dark:bg-sky-600 hover:bg-sky-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-200 dark:shadow-none"
          >
            <ArrowLeft size={18} /> Back to Challenges
          </button>

          {isCompleted && (
             <button
                onClick={() => navigate('/community/challenges/send', { state: { prefillFriendId: opponent?.id } })}
                className="w-full py-4 rounded-2xl font-[var(--font-syne)] font-bold text-base text-sky-700 dark:text-sky-400 bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 hover:bg-sky-50 transition-all flex items-center justify-center gap-2"
             >
                <RotateCcw size={18} /> Instant Rematch
             </button>
          )}

          <button
            onClick={() => navigate('/practice/review', {
              state: {
                wrongQuestions: challenge.questions?.filter(q => challenge.my_answers?.[q.id] !== q.correctAnswer),
                subject: challenge.subject
              }
            })}
            className="w-full py-3 text-sm font-bold text-sky-500/60 dark:text-sky-400/60 flex items-center justify-center gap-2 hover:text-sky-500 transition-colors"
          >
            <BookOpen size={16} /> Review Missed Questions
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
