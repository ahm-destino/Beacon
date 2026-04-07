import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Search, Filter, Star, Clock, CheckCircle, Bookmark } from 'lucide-react';
import { Community } from '../../services/api';
import { toast } from 'sonner';

export default function TutorDirectory() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const subject = filter === 'All' ? '' : filter;
        const res = await Community.listTutors({
          subject: subject || undefined,
          page: 1,
          per_page: 50,
        });
        if (cancelled) return;
        setTutors(res?.data?.tutors || []);
      } catch (_) {
        if (!cancelled) {
          setTutors([]);
          toast.error('Failed to load tutors');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const filteredTutors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tutors;
    return tutors.filter((t) => {
      const name = (t.full_name || '').toLowerCase();
      const bio = (t.bio || '').toLowerCase();
      const subjects = (t.subjects || []).join(' ').toLowerCase();
      const state = (t.state || '').toLowerCase();
      return name.includes(q) || bio.includes(q) || subjects.includes(q) || state.includes(q);
    });
  }, [searchQuery, tutors]);

  const formatPrice = (rate) => {
    if (!rate) return 'Negotiable';
    return `₦${Number(rate).toLocaleString()}/hr`;
  };

  const initialsFromName = (name) => {
    if (!name) return 'TU';
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader 
        title="Tutors" 
        rightAction={<Filter size={20} className="text-sky-600 dark:text-sky-400" />} 
      />

      <div className="px-5 pt-4 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#0D1525] border border-sky-200 dark:border-sky-800 rounded-xl p-3 shadow-sm focus-within:border-sky-400 transition-colors">
          <Search size={20} className="text-sky-400 dark:text-sky-600" />
          <input 
            type="text" 
            placeholder="Search by subject, name, or topic..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none font-[var(--font-jakarta)] text-sm text-[#0C4A6E] dark:text-[#F0F9FF] placeholder-sky-300 dark:placeholder-sky-700"
          />
          <button
            onClick={() => navigate('/community/tutors/saved')}
            className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-600 flex items-center justify-center"
          >
            <Bookmark size={16} />
          </button>
        </div>
      </div>

      <div className="px-5 mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-[var(--font-jakarta)] font-semibold transition-all duration-200
                ${filter === f 
                  ? 'bg-sky-600 dark:bg-sky-500 text-white shadow-md shadow-sky-900/20' 
                  : 'border border-sky-200 dark:border-sky-800/30 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4 pb-10">
        {loading && (
          <div className="text-sm text-sky-500">Loading tutors...</div>
        )}
        {!loading && filteredTutors.length === 0 && (
          <div className="text-sm text-sky-500">No tutors found yet.</div>
        )}
        {!loading && filteredTutors.map((tutor) => {
          const rating = Number(tutor.average_rating || 0);
          const reviews = Number(tutor.total_reviews || 0);
          const verified = ['verified', 'trusted', 'elite'].includes((tutor.verification_level || '').toLowerCase());
          const available = tutor.is_active !== false;
          return (
          <div 
            key={tutor.id} 
            onClick={() => navigate(`/community/tutor/${tutor.id}`, { state: { tutor } })}
            className="bg-white dark:bg-[#0D1525] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/20 shadow-sm hover:border-sky-300 dark:hover:border-sky-700 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex gap-4">
              <div className="relative shrink-0">
                {tutor.profile_photo ? (
                  <img
                    src={tutor.profile_photo}
                    alt={tutor.full_name}
                    className="w-16 h-16 rounded-2xl object-cover shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                    {initialsFromName(tutor.full_name)}
                  </div>
                )}
                {verified && (
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#0D1525] rounded-full p-0.5">
                    <CheckCircle size={14} className="text-sky-500 fill-sky-500" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {tutor.full_name}
                  </h3>
                  <span className="font-[var(--font-syne)] font-bold text-sm text-sky-600 dark:text-sky-400">{formatPrice(tutor.hourly_rate)}</span>
                </div>
                
                <p className="text-xs text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 mb-2 line-clamp-2">
                  {tutor.bio || 'Experienced tutor available for sessions.'}
                </p>
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1 text-xs font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" /> {rating.toFixed(1)}
                    <span className="text-[#0C4A6E]/50 dark:text-[#F0F9FF]/50 font-medium">({reviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60">
                    <Clock size={12} /> {available ? <span className="text-green-500 font-semibold">Available Now</span> : 'Offline'}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  {(tutor.subjects || []).map(sub => (
                    <span key={sub} className="bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-[10px] font-bold px-2 py-1 rounded-md">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
