import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Zap, Clock, ArrowRight, User, Swords, Bell } from 'lucide-react';
import { Community } from '../../services/api';

export default function ChallengeLive() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { challenge: initialChallenge } = location.state || {};
  
  const [challenge, setChallenge] = useState(initialChallenge || null);
  const [loading, setLoading] = useState(!initialChallenge);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [competitiveMsg, setCompetitiveMsg] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await Community.getChallenge(id);
      const data = res?.data;
      if (data) {
        setChallenge(data);
        setQuestions(data.questions || []);
        // If opponent already finished, we see their total score
        const oppScore = data.my_role === 'challenger' ? (data.opponent_score || 0) : (data.challenger_score || 0);
        setOpponentScore(oppScore);
      }
    } catch (err) {
      console.error('Challenge load failed', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (questions.length === 0 || isFinishing) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questions, isFinishing]);

  // Competitive messages logic
  useEffect(() => {
    if (!challenge || questions.length === 0) return;
    const progress = (currentQuestion / questions.length) * 100;
    const oppName = challenge.my_role === 'challenger' ? challenge.opponent?.name : challenge.challenger?.name;

    if (opponentScore > playerScore + 20) {
      setCompetitiveMsg(`${oppName} is leading you oo! 🔥`);
    } else if (progress > 80 && opponentScore > playerScore) {
      setCompetitiveMsg(`You're close to finishing! Catch up! 🎯`);
    } else {
      setCompetitiveMsg('');
    }
  }, [playerScore, opponentScore, currentQuestion, questions.length, challenge]);

  const handleAnswer = async (index) => {
    if (selectedOption !== null || isFinishing) return;
    
    const q = questions[currentQuestion];
    const isCorrect = String(index) === String(q.correctAnswer);
    setSelectedOption(index);
    
    if (isCorrect) {
      setPlayerScore(prev => prev + (100 / questions.length));
    }

    try {
      // Sync with backend
      await Community.submitChallengeAnswer(id, {
        question_id: q.id,
        selected_option: index,
        time_spent: 60 - timeLeft
      });
    } catch (err) {
      console.warn('Silent answer sync fail', err);
    }
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedOption(null);
        setTimeLeft(60); // Reset timer per question if desired, or keep global? 
        // Backend expects time_spent, let's keep it per question for now
      } else {
        handleFinish();
      }
    }, 800);
  };

  const handleFinish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    try {
      await Community.completeChallenge(id);
      navigate(`/community/challenges/${id}/results`, { 
        state: { 
          challengeId: id,
          playerScore: Math.round(playerScore)
        } 
      });
    } catch (err) {
      alert('Failed to submit challenge results. Check your connection.');
      setIsFinishing(false);
    }
  };

  const handlePing = async () => {
    if (pinging) return;
    setPinging(true);
    try {
      await Community.pingOpponent(id);
      // Feedback button state
      setTimeout(() => setPinging(false), 5000);
    } catch (_) {
      setPinging(false);
    }
  };

  if (loading || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center p-8 text-center">
         <Swords size={48} className="text-sky-500 animate-bounce mb-4" />
         <h2 className="text-white font-bold text-lg">Entering Battle Field...</h2>
         <p className="text-sky-400/60 text-sm mt-2">Sharpening your weapons (questions)</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] text-[#0C4A6E] dark:text-[#F0F9FF] flex flex-col">
      {/* HUD */}
      <div className="px-5 pt-8 pb-4 flex items-center justify-between max-w-md mx-auto w-full">
        {/* PLAYER */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 border-2 border-white dark:border-sky-400 flex items-center justify-center text-white font-bold shadow-lg">
            YOU
          </div>
          <div className="font-['Plus_Jakarta_Sans'] font-black text-xl text-sky-700 dark:text-sky-300 mt-1">{Math.round(playerScore)}%</div>
        </div>

        {/* TIMER */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full border-4 border-sky-100 dark:border-sky-900/30 flex items-center justify-center relative overflow-hidden">
            <div className="font-black text-lg text-sky-900 dark:text-sky-50 z-10">{timeLeft}</div>
            <div className="absolute bottom-0 left-0 right-0 bg-red-500/20 transition-all duration-1000" style={{ height: `${(timeLeft/60)*100}%` }}></div>
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-1 text-red-500">Seconds</span>
        </div>

        {/* OPPONENT */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 border-2 border-white dark:border-amber-400 flex items-center justify-center text-white font-bold shadow-lg">
            {initials(challenge.my_role === 'challenger' ? challenge.opponent?.name : challenge.challenger?.name)}
          </div>
          <div className="font-['Plus_Jakarta_Sans'] font-black text-xl text-amber-600 dark:text-amber-400 mt-1">{Math.round(opponentScore)}%</div>
        </div>
      </div>

      {/* SCORE BAR */}
      <div className="px-5 max-w-md mx-auto w-full mb-6">
        <div className="h-2.5 w-full bg-sky-100 dark:bg-sky-900/30 rounded-full flex relative overflow-hidden shadow-inner">
          <div className="h-full bg-sky-600 transition-all duration-500 rounded-full" style={{ width: `${(playerScore / (playerScore + opponentScore + 0.1)) * 100}%` }}></div>
          <div className="h-full bg-amber-500 transition-all duration-500 rounded-full" style={{ width: `${(opponentScore / (playerScore + opponentScore + 0.1)) * 100}%` }}></div>
        </div>
        
        {competitiveMsg && (
          <div className="mt-3 text-center">
             <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-3 py-1 rounded-full animate-pulse">
                {competitiveMsg}
             </span>
          </div>
        )}
      </div>

      {/* QUESTION AREA */}
      <div className="flex-1 max-w-md mx-auto w-full px-5">
        <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 border-2 border-sky-100 dark:border-sky-900/20 shadow-xl relative overflow-hidden min-h-[400px]">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Swords size={64} />
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">Question {currentQuestion + 1} of {questions.length}</div>
            <button 
              onClick={handlePing}
              disabled={pinging}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                pinging 
                  ? 'bg-amber-100 text-amber-600 opacity-50' 
                  : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-lg shadow-amber-200 dark:shadow-none'
              }`}
            >
              <Bell size={12} /> {pinging ? 'Wait for me! Sent' : 'Wait for me!'}
            </button>
          </div>

          <h2 className="font-[var(--font-jakarta)] text-lg font-bold leading-relaxed mb-8">
            {questions[currentQuestion].text}
          </h2>

          <div className="space-y-4">
            {questions[currentQuestion].options.map((option, i) => {
              const label = ['A', 'B', 'C', 'D'][i];
              const isSelected = selectedOption === i;
              const isCorrect = String(i) === String(questions[currentQuestion].correctAnswer);
              
              let variant = 'border-sky-50 dark:border-sky-900/10 bg-sky-50/20 dark:bg-sky-900/5 hover:border-sky-200 dark:hover:border-sky-800';
              if (isSelected) {
                variant = isCorrect 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 scale-[1.02]' 
                  : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 scale-[0.98]';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={selectedOption !== null}
                  className={`w-full text-left p-5 rounded-2xl border-2 font-bold text-sm transition-all duration-200 flex items-center gap-4 ${variant}`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border-2 ${
                    isSelected ? 'border-transparent bg-white/20' : 'border-sky-100 dark:border-sky-800/50'
                  }`}>
                    {label}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-8 text-center max-w-md mx-auto">
        <div className="flex items-center justify-center gap-2 text-sky-500/50">
          <Zap size={14} className="animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest">LIVE MULTIPLAYER DUEL</span>
        </div>
      </div>
    </div>
  );
}
