import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Plus, MoreVertical, TrendingUp, 
  Clock, Award, Brain, ChevronRight 
} from 'lucide-react';
import { Flashcards } from '../../services/api';

export default function FlashcardHome() {
  const [decks, setDecks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [decksRes, statsRes] = await Promise.all([
        Flashcards.listDecks(),
        Flashcards.getStats()
      ]);
      setDecks(decksRes.data?.items || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-[#0A101D] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  const dueCards = stats?.due_today || 0;

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-[#0A101D]">
      {/* Header */}
      <div className="bg-white dark:bg-[#0D1525] border-b border-sky-100 dark:border-sky-800/30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-sky-900 dark:text-sky-50">Flashcards</h1>
                <p className="text-sm text-sky-600 dark:text-sky-400">Master with spaced repetition</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/flashcards/create')}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Deck
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Study Now Banner */}
        {dueCards > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">{dueCards} cards due today</h2>
                  <p className="text-white/80 text-sm">Keep your streak going!</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/flashcards/study')}
                className="px-5 py-2.5 bg-white text-amber-600 rounded-xl font-semibold hover:bg-white/90 transition-colors"
              >
                Study Now
              </button>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard 
              icon={BookOpen} 
              label="Total Cards" 
              value={stats.total_cards || 0}
              color="sky"
            />
            <StatCard 
              icon={Award} 
              label="Mastered" 
              value={stats.mastered_cards || 0}
              suffix={`(${stats.mastery_percentage || 0}%)`}
              color="green"
            />
            <StatCard 
              icon={Clock} 
              label="Due Today" 
              value={stats.due_today || 0}
              color="amber"
            />
            <StatCard 
              icon={TrendingUp} 
              label="Due This Week" 
              value={stats.due_this_week || 0}
              color="purple"
            />
          </div>
        )}

        {/* Decks Grid */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-sky-900 dark:text-sky-50">Your Decks</h2>
          <Link 
            to="/flashcards/generate" 
            className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700"
          >
            Generate with AI →
          </Link>
        </div>

        {decks.length === 0 ? (
          <EmptyState onCreate={() => navigate('/flashcards/create')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map(deck => (
              <DeckCard 
                key={deck.id} 
                deck={deck} 
                onClick={() => navigate(`/flashcards/deck/${deck.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, suffix, color }) {
  const colorClasses = {
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-[#0D1525] rounded-xl p-4 border border-sky-100 dark:border-sky-800/30">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-sky-900 dark:text-sky-50">{value}</span>
        {suffix && <span className="text-sm text-sky-600 dark:text-sky-400">{suffix}</span>}
      </div>
      <p className="text-sm text-sky-600 dark:text-sky-400">{label}</p>
    </div>
  );
}

function DeckCard({ deck, onClick }) {
  const progress = deck.total_cards > 0 
    ? Math.round((deck.mastered_cards / deck.total_cards) * 100) 
    : 0;

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-[#0D1525] rounded-xl p-5 border border-sky-100 dark:border-sky-800/30 hover:shadow-lg hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sky-900 dark:text-sky-50 group-hover:text-sky-600 transition-colors">
              {deck.name}
            </h3>
            {deck.subject && (
              <p className="text-xs text-sky-600 dark:text-sky-400">{deck.subject}</p>
            )}
          </div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            // Show deck menu
          }}
          className="p-2 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-lg transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-sky-600 dark:text-sky-400" />
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm text-sky-600 dark:text-sky-400 mb-3">
        <span>{deck.total_cards} cards</span>
        <span>•</span>
        <span>{deck.mastered_cards} mastered</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-sky-100 dark:bg-sky-900/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-sky-700 dark:text-sky-400">
          {progress}% mastered
        </span>
        <ChevronRight className="w-5 h-5 text-sky-400 group-hover:text-sky-600 transition-colors" />
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mx-auto mb-4">
        <Brain className="w-10 h-10 text-sky-600 dark:text-sky-400" />
      </div>
      <h3 className="font-bold text-lg text-sky-900 dark:text-sky-50 mb-2">
        No flashcards yet
      </h3>
      <p className="text-sky-600 dark:text-sky-400 mb-6 max-w-sm mx-auto">
        Create flashcards from your wrong answers, AI tutor conversations, or generate them for any topic
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onCreate}
          className="px-5 py-2.5 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 transition-colors"
        >
          Create Deck
        </button>
        <Link
          to="/flashcards/generate"
          className="px-5 py-2.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-xl font-medium hover:bg-sky-200 transition-colors"
        >
          Generate with AI
        </Link>
      </div>
    </div>
  );
}
