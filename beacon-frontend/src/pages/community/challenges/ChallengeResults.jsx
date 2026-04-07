import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SubScreenHeader from '../../../components/shared/SubScreenHeader';
import BottomNav from '../../../components/shared/BottomNav';
import { Community } from '../../../services/api';

export default function ChallengeResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    challenge: stateChallenge, challengeId, myAnswers, questions,
    myAccuracy, opponentAccuracy, winner
  } = location.state || {};

  const [challenge, setChallenge] = useState(stateChallenge || null);
  const [resolvedMyAccuracy, setResolvedMyAccuracy] = useState(myAccuracy);
  const [resolvedOpponentAccuracy, setResolvedOpponentAccuracy] = useState(opponentAccuracy);
  const [winnerId, setWinnerId] = useState(location.state?.winnerId || null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (challenge && typeof resolvedMyAccuracy === 'number' && typeof resolvedOpponentAccuracy === 'number') return;
      if (!challengeId) return;
      try {
        const res = await Community.getChallenge(challengeId);
        const data = res?.data || {};
        if (cancelled) return;
        setChallenge(data);
        setWinnerId(data.winner_id || null);
        const mine = data.my_role === 'challenger' ? data.challenger_score : data.opponent_score;
        const opp = data.my_role === 'challenger' ? data.opponent_score : data.challenger_score;
        setResolvedMyAccuracy(typeof mine === 'number' ? Math.round(mine) : 0);
        setResolvedOpponentAccuracy(typeof opp === 'number' ? Math.round(opp) : 0);
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [challengeId]);

  const iWon = winner === 'you' || (!!winnerId && (winnerId === challenge?.challenger?.id || winnerId === challenge?.opponent?.id) && (
    (challenge?.my_role === 'challenger' && winnerId === challenge?.challenger?.id) ||
    (challenge?.my_role === 'opponent' && winnerId === challenge?.opponent?.id)
  ));

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="Challenge Results" />

      <div className="px-5 pt-6 pb-24">
        <div className={`rounded-3xl p-8 text-center mb-6 ${
          iWon
            ? 'bg-gradient-to-br from-amber-400 to-amber-500'
            : 'bg-gradient-to-br from-sky-600 to-sky-700'
        }`}>
          <p className="text-6xl mb-3">{iWon ? '🏆' : '💪'}</p>
          <h1 className="font-['Syne'] font-black text-3xl text-white">
            {iWon ? 'YOU WON!' : 'WELL PLAYED!'}
          </h1>
          <p className="font-['Plus_Jakarta_Sans'] text-base text-white/80 mt-2">
            {iWon
              ? `You beat ${challenge?.opponent?.name}!`
              : `${challenge?.opponent?.name} won this one.`
            }
          </p>
        </div>

        <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-14 h-14 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center font-bold text-sky-700 text-sm mx-auto mb-2">
                YOU
              </div>
              <p className="font-['Plus_Jakarta_Sans'] font-black text-2xl text-sky-700 dark:text-sky-400">
                {resolvedMyAccuracy ?? 0}%
              </p>
              <p className="font-['Plus_Jakarta_Sans'] text-xs text-sky-400">accuracy</p>
            </div>

            <div className="flex items-center justify-center text-2xl text-sky-400">vs</div>

            <div>
              <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center font-bold text-amber-700 text-sm mx-auto mb-2">
                {(challenge?.my_role === 'challenger' ? challenge?.opponent?.avatar : challenge?.challenger?.avatar) || 'OP'}
              </div>
              <p className="font-['Plus_Jakarta_Sans'] font-black text-2xl text-amber-600 dark:text-amber-400">
                {resolvedOpponentAccuracy ?? 0}%
              </p>
              <p className="font-['Plus_Jakarta_Sans'] text-xs text-sky-400">accuracy</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 rounded-2xl p-4 mb-6">
          <p className="font-['Syne'] font-bold text-base text-amber-800 dark:text-amber-300 text-center">
            {iWon ? '🎉 +25 points earned!' : '+5 consolation points'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/community/challenges/send', {
              state: { prefillFriend: challenge?.opponent }
            })}
            className="w-full py-3.5 rounded-xl font-['Syne'] font-bold text-base text-white bg-sky-700 dark:bg-sky-500 hover:bg-sky-800 active:scale-[0.98] transition-all duration-200"
          >
            ⚔️ Rematch
          </button>

          <button
            onClick={() => navigate('/community/challenges')}
            className="w-full py-3.5 rounded-xl font-['Syne'] font-bold text-base text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/30 hover:bg-sky-100 active:scale-[0.98] transition-all duration-200"
          >
            Back to Challenges
          </button>

          <button
            onClick={() => navigate('/practice/review', {
              state: {
                wrongQuestions: questions?.filter(q => myAnswers[q.id] !== q.correctAnswer),
                subject: challenge?.subject
              }
            })}
            className="w-full py-3.5 rounded-xl font-['Plus_Jakarta_Sans'] font-semibold text-sm text-sky-600 dark:text-sky-400 hover:underline"
          >
            Review wrong answers
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
