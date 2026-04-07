import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Users, Sparkles, FileText,
  ChevronRight, Clock, Award, Play, CheckCircle
} from 'lucide-react';
import { Literature } from '../../services/api';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'chapters', label: 'Chapters', icon: FileText },
  { id: 'characters', label: 'Characters', icon: Users },
  { id: 'themes', label: 'Themes', icon: Sparkles },
];

export default function LiteratureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [text, setText] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadText();
  }, [id]);

  const loadText = async () => {
    try {
      const res = await Literature.getText(id);
      setText(res.data);
    } catch (err) {
      console.error('Failed to load text:', err);
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

  if (!text) {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-[#0A101D] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sky-600 dark:text-sky-400">Text not found</p>
          <button
            onClick={() => navigate('/literature')}
            className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg"
          >
            Back to Literature
          </button>
        </div>
      </div>
    );
  }

  const progress = text.user_progress?.overall_progress || 0;
  const typeIcons = { novel: '📗', drama: '🎭', poetry: '📜' };

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-[#0A101D]">
      {/* Header */}
      <div className="bg-white dark:bg-[#0D1525] border-b border-sky-100 dark:border-sky-800/30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/literature')}
            className="flex items-center gap-2 text-sky-600 dark:text-sky-400 hover:text-sky-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-start gap-4">
            <span className="text-4xl">{typeIcons[text.text_type] || '📚'}</span>
            <div className="flex-1">
              <h1 className="font-bold text-2xl text-sky-900 dark:text-sky-50 mb-1">
                {text.title}
              </h1>
              <p className="text-sky-600 dark:text-sky-400">{text.author}</p>
              
              {/* Exam Bodies */}
              <div className="flex gap-2 mt-2">
                {text.exam_bodies?.map(body => (
                  <span 
                    key={body}
                    className="text-xs px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-full"
                  >
                    {body}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-sky-600 dark:text-sky-400">Reading Progress</span>
              <span className="font-medium text-sky-900 dark:text-sky-50">{progress}%</span>
            </div>
            <div className="h-2 bg-sky-100 dark:bg-sky-900/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => navigate(`/literature/${id}/quiz`)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Take Quiz
            </button>
            <button
              onClick={() => navigate(`/literature/${id}/past-questions`)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-xl font-medium hover:bg-sky-200 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Past Questions
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#0D1525] border-b border-sky-100 dark:border-sky-800/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-sky-600 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'overview' && <OverviewTab text={text} />}
        {activeTab === 'chapters' && <ChaptersTab textId={id} chapters={text.chapters} progress={text.user_progress} />}
        {activeTab === 'characters' && <CharactersTab characters={text.characters} />}
        {activeTab === 'themes' && <ThemesTab themes={text.themes} />}
      </div>
    </div>
  );
}

function OverviewTab({ text }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <section className="bg-white dark:bg-[#0D1525] rounded-xl p-6 border border-sky-100 dark:border-sky-800/30">
        <h2 className="font-bold text-lg text-sky-900 dark:text-sky-50 mb-4">Summary</h2>
        <p className="text-sky-700 dark:text-sky-300 leading-relaxed">
          {text.summary || 'No summary available.'}
        </p>
      </section>

      {/* Key Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard label="Published" value={text.year_published || 'Unknown'} />
        <InfoCard label="Type" value={text.text_type} />
        <InfoCard label="Chapters" value={text.chapters?.length || text.chapter_count || 0} />
        <InfoCard label="Exam Bodies" value={text.exam_bodies?.join(', ') || 'N/A'} />
      </div>

      {/* Writing Style */}
      {text.writing_style && (
        <section className="bg-white dark:bg-[#0D1525] rounded-xl p-6 border border-sky-100 dark:border-sky-800/30">
          <h2 className="font-bold text-lg text-sky-900 dark:text-sky-50 mb-4">Writing Style</h2>
          <p className="text-sky-700 dark:text-sky-300">{text.writing_style}</p>
        </section>
      )}
    </div>
  );
}

function ChaptersTab({ textId, chapters, progress }) {
  const navigate = useNavigate();
  const completedChapters = new Set(progress?.chapters_completed || []);

  return (
    <div className="space-y-3">
      {chapters?.map(chapter => {
        const isCompleted = completedChapters.has(chapter.number);
        
        return (
          <div
            key={chapter.id}
            onClick={() => navigate(`/literature/${textId}/chapter/${chapter.number}`)}
            className="bg-white dark:bg-[#0D1525] rounded-xl p-4 border border-sky-100 dark:border-sky-800/30 hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isCompleted 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                  : 'bg-sky-100 dark:bg-sky-900/30 text-sky-600'
              }`}>
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : <span className="font-bold">{chapter.number}</span>}
              </div>
              <div>
                <h3 className="font-semibold text-sky-900 dark:text-sky-50">
                  {chapter.title || `Chapter ${chapter.number}`}
                </h3>
                {chapter.summary && (
                  <p className="text-sm text-sky-600 dark:text-sky-400 line-clamp-1">
                    {chapter.summary.substring(0, 100)}...
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-sky-400" />
          </div>
        );
      })}
    </div>
  );
}

function CharactersTab({ characters }) {
  if (!characters || characters.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sky-600 dark:text-sky-400">No character analysis available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {characters.map((char, idx) => (
        <div key={idx} className="bg-white dark:bg-[#0D1525] rounded-xl p-5 border border-sky-100 dark:border-sky-800/30">
          <h3 className="font-bold text-lg text-sky-900 dark:text-sky-50 mb-2">{char.name}</h3>
          <p className="text-sm text-sky-600 dark:text-sky-400 mb-2">{char.role}</p>
          <p className="text-sky-700 dark:text-sky-300 text-sm">{char.description}</p>
          {char.traits && (
            <div className="flex flex-wrap gap-1 mt-3">
              {char.traits.map((trait, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 rounded-full">
                  {trait}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ThemesTab({ themes }) {
  if (!themes || themes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sky-600 dark:text-sky-400">No theme analysis available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {themes.map((theme, idx) => (
        <div key={idx} className="bg-white dark:bg-[#0D1525] rounded-xl p-5 border border-sky-100 dark:border-sky-800/30">
          <h3 className="font-bold text-lg text-sky-900 dark:text-sky-50 mb-3">{theme.name}</h3>
          <p className="text-sky-700 dark:text-sky-300 text-sm mb-3">{theme.description}</p>
          {theme.examples && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-sky-600 dark:text-sky-400">Examples:</p>
              <ul className="text-sm text-sky-700 dark:text-sky-300 space-y-1">
                {theme.examples.map((ex, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-sky-400">•</span>
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-[#0D1525] rounded-xl p-4 border border-sky-100 dark:border-sky-800/30">
      <p className="text-xs text-sky-600 dark:text-sky-400 mb-1">{label}</p>
      <p className="font-medium text-sky-900 dark:text-sky-50 capitalize">{value}</p>
    </div>
  );
}
