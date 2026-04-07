import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Search } from 'lucide-react';
import api from '../../services/api';
import ConceptCard from './ConceptCard';

export default function ConceptsLibrary() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [weakAreas, setWeakAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (location.state?.searchQuery) {
      const next = location.state.searchQuery;
      setQueryInput(next);
      setSearchQuery(next);
    }
  }, [location.state]);

  const handleSearch = () => {
    const next = queryInput.trim();
    setSearchQuery(next);
    setIsLoading(true);
    if (!next) return;

    const q = next.toLowerCase();
    const exact = allConcepts.find((c) => (c.name || '').toLowerCase() === q);
    const starts = allConcepts.find((c) => (c.name || '').toLowerCase().startsWith(q));
    const contains = allConcepts.find((c) => (c.name || '').toLowerCase().includes(q));
    const match = exact || starts || contains;

    if (match) {
      navigate(`/ai-tutor/concepts/${match.id}`, {
        state: { concept: { ...match } },
      });
    } else {
      const fallbackSubject = filter !== 'All' ? filter : 'General';
      navigate(`/ai-tutor/concepts/${encodeURIComponent(next)}`, {
        state: { concept: { id: next, name: next, subject: fallbackSubject, is_freeform: true } },
      });
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const q = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
        const res = await api.get(`/api/ai-tutor/concepts${q}`);
        const data = res?.data || {};
        if (cancelled) return;
        setSubjects(Array.isArray(data.subjects) ? data.subjects : []);
        setWeakAreas(Array.isArray(data.weak_areas) ? data.weak_areas : []);
      } catch (_) {
        if (cancelled) return;
        setSubjects([]);
        setWeakAreas([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  const allConcepts = useMemo(() => {
    const fromSubjects = subjects.flatMap((sub) =>
      (sub.concepts || []).map((concept) => ({
        id: concept.id || concept.name,
        name: concept.name || concept,
        subject: sub.id,
      }))
    );
    const fromWeak = (weakAreas || []).map((area) => ({
      id: area.id || area.name,
      name: area.name,
      subject: area.subject || 'General',
    }));
    return [...fromWeak, ...fromSubjects];
  }, [subjects, weakAreas]);


  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isRubbish = (name) => {
    if (!name) return true;
    const n = name.toString().toLowerCase();
    const forbidden = ['.pdf', '.docx', '.pptx', '.txt', 'general'];
    return forbidden.some(f => n.includes(f)) || n.length < 3;
  };

  const filteredWeakAreas = (normalizedQuery
    ? weakAreas.filter((area) => (area?.name || '').toLowerCase().includes(normalizedQuery)
        || (area?.subject || '').toLowerCase().includes(normalizedQuery))
    : weakAreas).filter(area => !isRubbish(area.name));

  const filteredSubjects = subjects
    .filter((sub) => filter === 'All' || sub.id === filter)
    .map((sub) => {
      let filteredConcepts = (sub.concepts || []).filter(c => !isRubbish(c.name || c));
      
      if (!normalizedQuery) return { ...sub, concepts: filteredConcepts };
      const concepts = filteredConcepts.filter((concept) => {
        const name = (concept?.name || concept || '').toString().toLowerCase();
        const subj = (sub.id || '').toLowerCase();
        return name.includes(normalizedQuery) || subj.includes(normalizedQuery);
      });
      return { ...sub, concepts };
    })
    .filter((sub) => (sub.concepts || []).length > 0);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <SubScreenHeader title="Concepts" />

      {/* HERO */}
      <div className="px-5 pt-4 pb-2">
        <h1 className="font-[var(--font-syne)] font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">
          Browse Concepts Library
        </h1>
        <p className="text-sm text-sky-600/80 dark:text-sky-400/80">
          Explore explanations by subject
        </p>
      </div>

      {/* SEARCH */}
      <div className="px-5 pt-4 mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex items-center gap-2 bg-white dark:bg-[#0D1525] border border-sky-200 dark:border-sky-800/30 rounded-2xl px-4 py-3 shadow-[0_4px_12px_rgba(14,165,233,0.05)] dark:shadow-none mb-4"
        >
          <Search size={20} className="text-sky-400 dark:text-sky-600" />
          <input
            type="text"
            placeholder="Search concepts..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            className="flex-1 bg-transparent outline-none font-[var(--font-jakarta)] text-sm text-[#0C4A6E] dark:text-[#F0F9FF] placeholder:text-sky-300 dark:placeholder:text-sky-700"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-sky-600 text-white text-xs font-[var(--font-syne)] font-bold hover:bg-sky-700 transition-all"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setQueryInput('');
                setSearchQuery('');
                setIsLoading(true);
              }}
              className="px-2 py-2 rounded-xl text-xs font-[var(--font-syne)] font-bold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {['All', 'Math', 'Physics', 'Chemistry', 'Biology', 'English'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-[var(--font-jakarta)] font-semibold transition-all duration-200
                ${filter === f
                  ? 'bg-sky-600 dark:bg-sky-500 text-white'
                  : 'border border-sky-200 dark:border-sky-800/30 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: WEAK AREAS */}
      <div className="px-5 mb-8">
        <h2 className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-4">For you — weak areas</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-5 px-5">
          {(filteredWeakAreas.length ? filteredWeakAreas : []).map(area => (
            <ConceptCard
              key={area.id}
              concept={area}
              variant="compact"
            />
          ))}
          {filteredWeakAreas.length === 0 && (
            <div className="text-xs text-sky-500/70">No weak concept suggestions yet.</div>
          )}
        </div>
      </div>

      {/* SECTION 2: ALL CONCEPTS GRID */}
      <div className="px-5">
        <h2 className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-4">All concepts</h2>
        {isLoading && <div className="text-xs text-sky-500/70 mb-4">Loading concepts...</div>}
        <div className="grid grid-cols-2 gap-3 pb-20">
          {filteredSubjects.length === 0 && !isLoading && (
            <div className="text-xs text-sky-500/70 col-span-2 text-center py-6">
              No concepts found for "{searchQuery || 'your search'}".
            </div>
          )}
          {filteredSubjects.flatMap((sub) =>
            (sub.concepts || []).map((concept, i) => (
              <ConceptCard
                key={`${sub.id}-${i}`}
                concept={{
                  id: concept.id || concept.name,
                  name: concept.name || concept,
                  subject: sub.id,
                  topic: sub.id,
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
