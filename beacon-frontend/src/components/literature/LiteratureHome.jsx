import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Search, Filter, ChevronRight, 
  Clock, Award, MoreHorizontal
} from 'lucide-react';
import { Literature } from '../../services/api';

const EXAM_BODIES = ['All', 'WAEC', 'NECO', 'JAMB'];
const TEXT_TYPES = ['All', 'novel', 'drama', 'poetry'];

export default function LiteratureHome() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    exam_body: 'All',
    text_type: 'All',
    search: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadTexts();
  }, [filter.exam_body, filter.text_type]);

  const loadTexts = async () => {
    try {
      const params = {};
      if (filter.exam_body !== 'All') params.exam_body = filter.exam_body;
      if (filter.text_type !== 'All') params.text_type = filter.text_type;
      if (filter.search) params.q = filter.search;
      
      const res = await Literature.listTexts(params);
      setTexts(res.data?.items || []);
    } catch (err) {
      console.error('Failed to load literature:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTexts = texts.filter(text => 
    filter.search === '' || 
    text.title.toLowerCase().includes(filter.search.toLowerCase()) ||
    text.author?.toLowerCase().includes(filter.search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-[#0A101D] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-[#0A101D]">
      {/* Header */}
      <div className="bg-white dark:bg-[#0D1525] border-b border-sky-100 dark:border-sky-800/30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-sky-900 dark:text-sky-50">Literature</h1>
              <p className="text-sm text-sky-600 dark:text-sky-400">
                Novels, Drama & Poetry for WAEC/NECO/JAMB
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-400" />
            <input
              type="text"
              placeholder="Search texts, authors..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/30 rounded-xl text-sky-900 dark:text-sky-50 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white dark:bg-[#0D1525] px-3 py-2 rounded-xl border border-sky-100 dark:border-sky-800/30">
            <Filter className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <select
              value={filter.exam_body}
              onChange={(e) => setFilter({ ...filter, exam_body: e.target.value })}
              className="bg-transparent text-sm text-sky-900 dark:text-sky-50 focus:outline-none"
            >
              {EXAM_BODIES.map(body => (
                <option key={body} value={body}>{body}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-[#0D1525] px-3 py-2 rounded-xl border border-sky-100 dark:border-sky-800/30">
            <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <select
              value={filter.text_type}
              onChange={(e) => setFilter({ ...filter, text_type: e.target.value })}
              className="bg-transparent text-sm text-sky-900 dark:text-sky-50 focus:outline-none capitalize"
            >
              {TEXT_TYPES.map(type => (
                <option key={type} value={type}>
                  {type === 'All' ? 'All Types' : type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Texts Grid */}
        {filteredTexts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTexts.map(text => (
              <TextCard 
                key={text.id} 
                text={text}
                onClick={() => navigate(`/literature/${text.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TextCard({ text, onClick }) {
  const progress = text.user_progress?.overall_progress || 0;
  const isCompleted = text.user_progress?.status === 'completed';

  const typeIcons = {
    novel: '📗',
    drama: '🎭',
    poetry: '📜',
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-[#0D1525] rounded-xl p-5 border border-sky-100 dark:border-sky-800/30 hover:shadow-lg hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{typeIcons[text.text_type] || '📚'}</span>
          <div className="flex flex-wrap gap-1">
            {text.exam_bodies?.map(body => (
              <span 
                key={body}
                className="text-xs px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-full"
              >
                {body}
              </span>
            ))}
          </div>
        </div>
        {isCompleted && (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <Award className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <h3 className="font-bold text-lg text-sky-900 dark:text-sky-50 mb-1 group-hover:text-sky-600 transition-colors">
        {text.title}
      </h3>
      <p className="text-sm text-sky-600 dark:text-sky-400 mb-4">
        {text.author}
      </p>

      {/* Progress */}
      <div className="mb-3">
        <div className="h-2 bg-sky-100 dark:bg-sky-900/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-sky-600 dark:text-sky-400">
          {progress}% complete
        </span>
        <span className="text-sky-500 dark:text-sky-500">
          {text.chapter_count || text.chapters?.length || 0} chapters
        </span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mx-auto mb-4">
        <BookOpen className="w-10 h-10 text-sky-600 dark:text-sky-400" />
      </div>
      <h3 className="font-bold text-lg text-sky-900 dark:text-sky-50 mb-2">
        No texts found
      </h3>
      <p className="text-sky-600 dark:text-sky-400">
        Try adjusting your filters or search
      </p>
    </div>
  );
}
