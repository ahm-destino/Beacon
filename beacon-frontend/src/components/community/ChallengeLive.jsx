import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Clock, ArrowRight, User, Swords } from 'lucide-react';

export default function ChallengeLive() {
  const navigate = useNavigate();
  const location = useLocation();
  const { challengeName } = location.state || { challengeName: "Global Math Marathon" };
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);

  const questions = [
    {
      id: 1,
      text: "If 2x + 5 = 15, what is the value of x²?",
      options: ["A. 5", "B. 25", "C. 10", "D. 50"],
      correct: 1,
    }
  ];

  useEffect(() => {
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

    // Mock opponent progress
    const oppTimer = setInterval(() => {
      setOpponentScore(prev => prev + (Math.random() > 0.7 ? 10 : 0));
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(oppTimer);
    };
  }, []);

  const handleAnswer = (index) => {
    setSelectedOption(index);
    if (index === questions[currentQuestion].correct) {
      setPlayerScore(prev => prev + 15);
    }
    
    // Auto next after 1s
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedOption(null);
      } else {
        handleFinish();
      }
    }, 1000);
  };

  const handleFinish = () => {
    navigate('/community/challenges/results', { state: { playerScore, opponentScore, challengeName } });
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] text-[#0C4A6E] dark:text-[#F0F9FF] flex flex-col">
      {/* HUD */}
      <div className="px-5 pt-8 pb-4 flex items-center justify-between max-w-md mx-auto w-full">
        {/* PLAYER */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 border-2 border-white dark:border-sky-400 flex items-center justify-center text-white font-bold shadow-lg">
            YOU
          </div>
          <div className="font-['Plus_Jakarta_Sans'] font-black text-xl text-sky-700 dark:text-sky-300 mt-1">{playerScore}</div>
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
            CH
          </div>
          <div className="font-['Plus_Jakarta_Sans'] font-black text-xl text-amber-600 dark:text-amber-400 mt-1">{opponentScore}</div>
        </div>
      </div>

      {/* SCORE BAR */}
      <div className="px-5 max-w-md mx-auto w-full mb-8">
        <div className="h-2 w-full bg-sky-100 dark:bg-sky-900/30 rounded-full flex relative overflow-hidden">
          <div className="h-full bg-sky-600 transition-all duration-500" style={{ width: `${(playerScore / (playerScore + opponentScore + 1)) * 100}%` }}></div>
          <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(opponentScore / (playerScore + opponentScore + 1)) * 100}%` }}></div>
          <div className="absolute left-1/2 -top-1 w-0.5 h-4 bg-white/50 dark:bg-sky-400/30 z-10"></div>
        </div>
      </div>

      {/* QUESTION AREA */}
      <div className="flex-1 max-w-md mx-auto w-full px-5">
        <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 border-2 border-sky-100 dark:border-sky-900/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Swords size={64} />
          </div>
          
          <div className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-4">Challenge Question {currentQuestion + 1}</div>
          <h2 className="font-[var(--font-jakarta)] text-lg font-bold leading-relaxed mb-8">
            {questions[currentQuestion].text}
          </h2>

          <div className="space-y-4">
            {questions[currentQuestion].options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className={`w-full text-left p-5 rounded-2xl border-2 font-bold text-sm transition-all duration-200 active:scale-[0.98]
                  ${selectedOption === i 
                    ? (i === questions[currentQuestion].correct ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400')
                    : 'border-sky-50 dark:border-sky-900/10 bg-sky-50/20 dark:bg-sky-900/5 hover:border-sky-200 dark:hover:border-sky-800'}`}
              >
                {option}
              </button>
            ))}
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
