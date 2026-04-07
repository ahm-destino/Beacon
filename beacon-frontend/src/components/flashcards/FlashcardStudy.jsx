import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, RotateCw, Eye, EyeOff, HelpCircle,
  ThumbsUp, ThumbsDown, MoreHorizontal, Clock
} from 'lucide-react';
import { Flashcards } from '../../services/api';

// SM-2 Quality ratings
const QUALITY_RATINGS = [
  { value: 0, label: 'Again', desc: 'Complete blackout', color: 'bg-red-500' },
  { value: 1, label: 'Hard', desc: 'Incorrect, recognized', color: 'bg-orange-500' },
  { value: 2, label: 'Good', desc: 'Incorrect but easy', color: 'bg-yellow-500' },
  { value: 3, label: 'Easy', desc: 'Correct with difficulty', color: 'bg-sky-500' },
  { value: 4, label: 'Good', desc: 'Correct with hesitation', color: 'bg-green-500' },
  { value: 5, label: 'Easy', desc: 'Perfect response', color: 'bg-emerald-500' },
];

export default function FlashcardStudy() {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    try {
      const res = await Flashcards.getDueCards();
      setCards(res.data?.cards || []);
    } catch (err) {
      console.error('Failed to load cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (quality) => {
    const card = cards[currentIndex];
    
    try {
      await Flashcards.reviewCard(card.id, { 
        quality,
        time_spent: 0 // Could track actual time
      });

      // Update stats
      if (quality >= 3) {
        setSessionStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      }
      setSessionStats(prev => ({ ...prev, total: prev.total + 1 }));

      // Move to next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        setSessionComplete(true);
      }
    } catch (err) {
      console.error('Failed to rate card:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-[#0A101D] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-[#0A101D] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <ThumbsUp className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="font-bold text-xl text-sky-900 dark:text-sky-50 mb-2">
            All caught up!
          </h2>
          <p className="text-sky-600 dark:text-sky-400 mb-6">
            No cards are due for review right now.
          </p>
          <button
            onClick={() => navigate('/flashcards')}
            className="px-5 py-2.5 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 transition-colors"
          >
            Back to Decks
          </button>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <StudyComplete 
        stats={sessionStats} 
        onContinue={() => navigate('/flashcards')}
      />
    );
  }

  const card = cards[currentIndex];
  const progress = ((currentIndex) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-[#0A101D] flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-[#0D1525] border-b border-sky-100 dark:border-sky-800/30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/flashcards')}
              className="flex items-center gap-2 text-sky-600 dark:text-sky-400 hover:text-sky-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Exit
            </button>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-sky-600 dark:text-sky-400">
                {currentIndex + 1} / {cards.length}
              </span>
              <div className="w-32 h-2 bg-sky-100 dark:bg-sky-900/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Flashcard */}
          <div 
            className="bg-white dark:bg-[#0D1525] rounded-2xl shadow-xl border border-sky-100 dark:border-sky-800/30 min-h-[400px] p-8 cursor-pointer transition-transform hover:scale-[1.01]"
            onClick={() => !showAnswer && setShowAnswer(true)}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-medium px-3 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-full">
                {card.source_type || 'Manual'}
              </span>
              {card.hint && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show hint modal
                  }}
                  className="p-2 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-lg transition-colors"
                >
                  <HelpCircle className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </button>
              )}
            </div>

            {/* Card Content */}
            <div className="text-center">
              <p className="text-lg text-sky-600 dark:text-sky-400 mb-4">Question:</p>
              <h2 className="text-2xl md:text-3xl font-bold text-sky-900 dark:text-sky-50 mb-8">
                {card.front}
              </h2>

              {showAnswer ? (
                <div className="border-t border-sky-100 dark:border-sky-800/30 pt-6 mt-6">
                  <p className="text-lg text-sky-600 dark:text-sky-400 mb-4">Answer:</p>
                  <p className="text-xl text-sky-900 dark:text-sky-50 whitespace-pre-wrap">
                    {card.back}
                  </p>
                  {card.context && (
                    <p className="text-sm text-sky-500 dark:text-sky-500 mt-4">
                      {card.context}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sky-500 dark:text-sky-500 text-sm mt-8">
                  Click to reveal answer
                </p>
              )}
            </div>
          </div>

          {/* Rating Buttons */}
          {showAnswer ? (
            <div className="mt-6 grid grid-cols-3 md:grid-cols-6 gap-2">
              {QUALITY_RATINGS.map((rating) => (
                <button
                  key={rating.value}
                  onClick={() => handleRate(rating.value)}
                  className={`p-3 rounded-xl ${rating.color} text-white font-medium hover:opacity-90 transition-opacity`}
                >
                  <div className="text-sm font-bold">{rating.label}</div>
                  <div className="text-xs opacity-80 hidden md:block">{rating.desc}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowAnswer(true)}
                className="flex items-center gap-2 px-8 py-3 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 transition-colors"
              >
                <Eye className="w-5 h-5" />
                Show Answer
              </button>
            </div>
          )}

          {/* Flip Hint */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="text-sm text-sky-500 dark:text-sky-500 hover:text-sky-600 flex items-center gap-1 mx-auto"
            >
              <RotateCw className="w-4 h-4" />
              {showAnswer ? 'Hide Answer' : 'Flip Card'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudyComplete({ stats, onContinue }) {
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  
  return (
    <div className="min-h-screen bg-sky-50 dark:bg-[#0A101D] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D1525] rounded-2xl shadow-xl border border-sky-100 dark:border-sky-800/30 p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6">
          <Award className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="font-bold text-2xl text-sky-900 dark:text-sky-50 mb-2">
          Session Complete!
        </h2>
        <p className="text-sky-600 dark:text-sky-400 mb-6">
          Great job keeping up with your reviews
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
            <div className="text-3xl font-bold text-sky-700 dark:text-sky-300">
              {stats.correct}/{stats.total}
            </div>
            <div className="text-sm text-sky-600 dark:text-sky-400">Correct</div>
          </div>
          <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
            <div className="text-3xl font-bold text-sky-700 dark:text-sky-300">
              {accuracy}%
            </div>
            <div className="text-sm text-sky-600 dark:text-sky-400">Accuracy</div>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full py-3 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
