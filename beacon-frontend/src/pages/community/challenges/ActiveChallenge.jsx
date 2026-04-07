import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Community } from '../../../services/api';

export default function ActiveChallenge() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { challenge: challengeFromState } = location.state || {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [myAnswers, setMyAnswers] = useState({});
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [opponentAccuracy, setOpponentAccuracy] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [challenge, setChallenge] = useState(challengeFromState || null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadChallenge = async () => {
    const res = await Community.getChallenge(id);
    const data = res?.data || {};
    setChallenge(data);
    setQuestions(Array.isArray(data.questions) ? data.questions : []);
    setMyAnswers(data.my_answers || {});
    setOpponentProgress((data.my_role === 'challenger' ? data.opponent_progress : data.challenger_progress) || 0);

    const oppScore = data.my_role === 'challenger' ? data.opponent_score : data.challenger_score;
    if (typeof oppScore === 'number') setOpponentAccuracy(Math.round(oppScore));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadChallenge();
      } catch (e) {
        if (!cancelled) toast.error(e?.error || 'Failed to load challenge.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    const interval = setInterval(async () => {
      if (cancelled) return;
      try {
        await loadChallenge();
      } catch (_) {}
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAnswer = async (option) => {
    const q = questions[currentIndex];
    if (!q) return;
    const updatedAnswers = { ...myAnswers, [q.id]: option };
    setMyAnswers(updatedAnswers);

    try {
      await Community.submitChallengeAnswer(id, {
        question_id: q.id,
        selected_option: option,
      });
    } catch (_) {}

    setTimeout(async () => {
      if (currentIndex >= questions.length - 1) {
        try {
          const res = await Community.completeChallenge(id);
          const result = res?.data || {};
          navigate(`/community/challenges/${id}/results`, {
            state: {
              challengeId: id,
              challenge,
              myAnswers: updatedAnswers,
              questions,
              myAccuracy: typeof result.my_score === 'number' ? Math.round(result.my_score) : 0,
              opponentAccuracy: typeof result.opponent_score === 'number' ? Math.round(result.opponent_score) : 0,
              winnerId: result?.winner_id || null,
            },
          });
        } catch (e) {
          toast.error(e?.error || 'Failed to complete challenge.');
        }
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 300);
  };

  const totalQuestions = questions.length || 1;
  const myProgress = Object.keys(myAnswers).length / totalQuestions;
  const currentQuestion = questions?.[currentIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center">
        <p className="font-['Syne'] font-bold text-sky-700 dark:text-sky-300">Loading challenge...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <div className="sticky top-0 z-40 bg-gradient-to-r from-sky-700 to-sky-800 px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <span className="font-['Syne'] font-bold text-xs text-sky-200 uppercase tracking-widest">
            ⚔️ LIVE CHALLENGE
          </span>
          <span className="font-['Plus_Jakarta_Sans'] text-xs text-sky-200">
            Q{currentIndex + 1}/{questions?.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 text-center">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold mx-auto mb-1">
              YOU
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${myProgress * 100}%` }}
              />
            </div>
            <p className="font-['Plus_Jakarta_Sans'] text-xs text-sky-200 mt-1">
              {Math.round(myProgress * 100)}%
            </p>
          </div>

          <span className="text-white text-2xl font-bold">⚔️</span>

          <div className="flex-1 text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-400/30 flex items-center justify-center text-white font-bold mx-auto mb-1">
              {(challenge?.my_role === 'challenger' ? challenge?.opponent?.avatar : challenge?.challenger?.avatar) || 'OP'}
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${opponentProgress}%` }}
              />
            </div>
            <p className="font-['Plus_Jakarta_Sans'] text-xs text-sky-200 mt-1">
              {Math.round(opponentProgress)}%
            </p>
          </div>
        </div>
      </div>

      {currentQuestion && (
        <div className="px-5 pt-6 pb-24">
          <p className="font-['Syne'] font-bold text-lg text-sky-900 dark:text-sky-50 leading-relaxed mb-6">
            {currentQuestion.text}
          </p>

          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((option, i) => {
              const letter = ['A', 'B', 'C', 'D'][i];
              const isSelected = myAnswers[currentQuestion.id] === letter;
              return (
                <button
                  key={letter}
                  onClick={() => handleAnswer(letter)}
                  disabled={!!myAnswers[currentQuestion.id]}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.99] ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-900/20'
                      : 'border-sky-100 dark:border-sky-900/20 bg-white dark:bg-[#0D1525] hover:border-sky-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-['Plus_Jakarta_Sans'] text-sm shrink-0 ${
                    isSelected
                      ? 'bg-sky-600 text-white'
                      : 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
                  }`}>
                    {letter}
                  </div>
                  <span className="font-['Plus_Jakarta_Sans'] text-sm font-medium text-sky-800 dark:text-sky-200">
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
