import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FileText, Target, AlertTriangle, MessageSquare, Plus, ChevronRight, ChevronDown, ArrowRight, LayoutList, Layers, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import SubScreenHeader from '../shared/SubScreenHeader';
import api from '../../services/api';
import DocumentChat from './DocumentChat';

export default function DocumentView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [document, setDocument] = useState(location.state?.doc || null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [activeSectionId, setActiveSectionId] = useState(null);
  
  const [flippedMap, setFlippedMap] = useState({});
  const [processingStage, setProcessingStage] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      // Potentially auto-close on mobile if preferred, but usually manual is better
      // For now, let's just ensure we don't break the user's manual toggle
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // PERSISTENT CHAT STATE
  const [explanationLevel, setExplanationLevel] = useState(localStorage.getItem(`beacon_exp_level_${id}`) || 'normal');
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(`beacon_chat_${id}`);
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', text: "Hi! I'm your tutor for this document. What would you like to know?" }
    ];
  });

  useEffect(() => {
    localStorage.setItem(`beacon_chat_${id}`, JSON.stringify(messages));
  }, [messages, id]);

  useEffect(() => {
    localStorage.setItem(`beacon_exp_level_${id}`, explanationLevel);
  }, [explanationLevel, id]);

  const processingStages = [
    'Reading document...',
    'Identifying key concepts...',
    'Creating summary...',
    'Generating flashcards...',
    'Building quiz...',
  ];

  useEffect(() => {
    loadDocument();
  }, [id]);

  useEffect(() => {
    if (!document?.id || document.status !== 'processing') return undefined;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/documents/${document.id}`);
        const doc = res?.data;
        if (!doc) return;
        setDocument(doc);
        if (doc.status === 'complete') toast.success('Document ready');
        if (doc.status === 'failed') toast.error('Document processing failed');
        if (doc.status !== 'processing') clearInterval(interval);
      } catch (_) {
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [document?.id, document?.status]);

  useEffect(() => {
    if (document?.status !== 'processing') {
      setProcessingStage(0);
      return undefined;
    }
    const interval = setInterval(() => {
      setProcessingStage((prev) => (prev + 1) % processingStages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [document?.status]);

  const loadDocument = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/documents/${id}`);
      const doc = res?.data || null;
      setDocument(doc);
      
      // Auto-advance logic if coming from a Quiz result
      if (location.state?.autoNext && doc?.sections) {
        const fromSecId = location.state.fromSectionId;
        const currentSecs = doc.sections.filter(s => s.status === 'complete');
        const fromIndex = currentSecs.findIndex(s => s.id === fromSecId);
        
        if (fromIndex >= 0 && fromIndex < currentSecs.length - 1) {
          const nextSec = currentSecs[fromIndex + 1];
          setActiveSectionId(nextSec.id);
          setActiveTab('summary');
          toast.success(`Success! Moving to Chapter ${fromIndex + 2}`);
        } else {
          setActiveSectionId(currentSecs[0].id);
        }
      } else if (location.state?.autoGenerate && doc?.sections) {
        const sid = location.state.section_id;
        setActiveSectionId(sid);
        setActiveTab('quiz');
        // Trigger generation after a small delay to ensure state is set
        setTimeout(() => handleGenerateMoreQuiz(), 500);
      } else if (doc?.sections && doc.sections.length > 0) {
        setActiveSectionId(doc.sections[0].id);
      }
    } catch (err) {
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = (i) => setFlippedMap((prev) => ({ ...prev, [i]: !prev[i] }));

  const handleReprocess = async () => {
    if (!document?.id) return;
    try {
      const res = await api.post(`/api/documents/${document.id}/reprocess`, {});
      setDocument(res?.data);
      toast.success('Reprocessing started');
    } catch (_) {
      toast.error('Failed to reprocess document');
    }
  };

  const handleGenerateMoreQuiz = async () => {
    if (!document?.id || !activeSectionId) return;
    setGeneratingMore(true);
    try {
      const res = await api.post(`/api/documents/${document.id}/sections/${activeSectionId}/generate_more_quiz`, { count: 5 });
      if (res?.data) {
        toast.success('Successfully generated more questions!');
        await loadDocument(); // Reload to get fresh section data
      }
    } catch (_) {
      toast.error('Failed to generate more questions. Model rate limit might be strictly capped.');
    } finally {
      setGeneratingMore(false);
    }
  };

  const handleUnlockNext = async () => {
    if (!document?.id) return;
    setUnlocking(true);
    try {
      const res = await api.post(`/api/documents/${document.id}/process_next_batch`);
      if (res?.data) {
        toast.success(res.message || 'Unlocked next batch of chapters!');
        setDocument(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unlock more sections. Wait a minute for the AI to cool down.');
    } finally {
      setUnlocking(false);
    }
  };

  // Derived sections
  const completeSections = useMemo(() => {
    if (!document?.sections) return [];
    return document.sections.filter(s => s.status === 'complete');
  }, [document?.sections]);

  const pendingCount = useMemo(() => {
    if (!document?.sections) return 0;
    return document.sections.filter(s => s.status === 'pending').length;
  }, [document?.sections]);

  const handleExplainMore = (concept, context = "") => {
    const prompt = `Explain more about "${concept}" ${context ? `in the context of ${context}` : ''} at my current level (${explanationLevel}).`;
    
    // Switch to assistant role temporarily to show "Thinking" or just append user msg
    setMessages(prev => [...prev, { role: 'user', text: prompt }]);
    setShowChat(true);
    
    // Auto-trigger the API call for the chat
    triggerChatAuto(prompt);
  };

  const triggerChatAuto = async (text) => {
    try {
      const res = await api.post(`/api/documents/${id}/chat`, { 
        message: text,
        explanation_level: explanationLevel 
      });
      if (res?.data?.answer) {
        setMessages(prev => [...prev, { role: 'assistant', text: res.data.answer }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Error: Could not reach the AI tutor right now." }]);
    }
  };

  const handleNextChapter = () => {
    if (!document?.sections) return;
    const currentIndex = completeSections.findIndex(s => s.id === activeSectionId);
    if (currentIndex >= 0 && currentIndex < completeSections.length - 1) {
      const nextSec = completeSections[currentIndex + 1];
      setActiveSectionId(nextSec.id);
      setActiveTab('summary'); // Reset to summary for the new chapter
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.info(`Moving to Chapter ${currentIndex + 2}: ${nextSec.subtopic}`);
    } else if (pendingCount > 0) {
      toast.warning("The next chapter is still being analyzed by AI. Hang tight!");
    } else {
      toast.success("You've reached the end of the course! Great job studying.");
    }
  };

  const isLastChapter = useMemo(() => {
    const currentIndex = completeSections.findIndex(s => s.id === activeSectionId);
    return currentIndex === completeSections.length - 1 && pendingCount === 0;
  }, [completeSections, activeSectionId, pendingCount]);

  // Derived current section
  const currentSection = useMemo(() => {
    if (!document) return null;
    if (completeSections.length > 0) {
      return completeSections.find(s => s.id === activeSectionId) || completeSections[0];
    }
    // Fallback for old documents before sections were added
    return {
      topic: document.subject,
      subtopic: document.filename,
      summary: document.summary,
      flashcards: document.flashcards || [],
      quiz_questions: document.quiz_questions || []
    };
  }, [document, completeSections, activeSectionId]);

  const flashcards = useMemo(() => {
    if (!Array.isArray(currentSection?.flashcards)) return [];
    return currentSection.flashcards.map((c, idx) => ({
      id: c.id || `${idx}`,
      front: c.question || c.front || c.term || 'Question',
      back: c.answer || c.back || c.definition || 'Answer',
    }));
  }, [currentSection?.flashcards]);

  const quizQuestions = useMemo(() => {
    if (!Array.isArray(currentSection?.quiz_questions)) return [];
    return currentSection.quiz_questions;
  }, [currentSection?.quiz_questions]);

  const normalizeQuizQuestion = (q, idx) => {
    const options = q.options || {};
    const optionA = q.option_a || q.optionA || options.a || options.A || options.option_a || '';
    const optionB = q.option_b || q.optionB || options.b || options.B || options.option_b || '';
    const optionC = q.option_c || q.optionC || options.c || options.C || options.option_c || '';
    const optionD = q.option_d || q.optionD || options.d || options.D || options.option_d || '';
    const answer = (q.correct_answer || q.answer || q.correct || 'A').toString().toUpperCase();

    return {
      id: q.id || `${document?.id || 'doc'}-q${idx}`,
      text: q.question_text || q.question || q.text || 'Question',
      options: [`A. ${optionA}`, `B. ${optionB}`, `C. ${optionC}`, `D. ${optionD}`],
      correctAnswer: answer,
      explanation: q.explanation || '',
      topic: document?.filename || 'Document',
      subject: document?.subject || 'General',
    };
  };

  const handleStartQuiz = async () => {
    if (!document?.id) return;
    try {
      const res = await api.post(`/api/documents/${document.id}/quiz/session`, { 
        count: 15,
        section_id: (completeSections.length > 0) ? activeSectionId : null
      });
      const payload = res?.data || {};
      const session = payload.session;
      const questions = payload.questions || [];
      if (!session || questions.length === 0) {
        toast.error('Quiz could not be generated.');
        return;
      }
      const normalized = questions.map((q, idx) => normalizeQuizQuestion(q, idx));
      navigate(`/practice/session/${session.id}`, {
        state: {
          id: session.id,
          document_id: document.id,
          section_id: activeSectionId,
          mode: 'practice',
          subject: document.subject || 'General',
          topic: document.filename,
          questions: normalized,
        },
      });
    } catch (_) {
      toast.error('Failed to start quiz');
    }
  };

  if (loading && !document) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center">
        <div className="text-sm text-sky-500 flex items-center gap-2">
          <RefreshCw className="animate-spin" size={16} /> Loading Course...
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'summary', label: 'Summary Overview' },
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'quiz', label: 'Knowledge Check' },
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      <SubScreenHeader title={document?.filename || 'Document Course'} />

      {/* Floating Chat Button */}
      {document?.status === 'complete' && (
        <button 
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 z-40 bg-sky-500 hover:bg-sky-600 shadow-xl shadow-sky-500/20 text-white p-4 rounded-full transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {showChat && (
        <DocumentChat 
          documentId={document.id} 
          onClose={() => setShowChat(false)} 
          messages={messages}
          setMessages={setMessages}
          explanationLevel={explanationLevel}
          setExplanationLevel={setExplanationLevel}
        />
      )}

      {/* STATUS */}
      {document?.status === 'processing' && (
        <div className="mx-5 mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300 text-xs rounded-xl px-3 py-2">
          <div className="flex items-center justify-between">
            <span>{processingStages[processingStage]}</span>
            <span className="font-bold">Building Course...</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-amber-200/60 dark:bg-amber-900/40 overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${Math.round(((processingStage + 1) / processingStages.length) * 100)}%` }}
            />
          </div>
        </div>
      )}
      
      {document?.status === 'failed' && (
        <div className="mx-5 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300 text-xs rounded-xl px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} />
            Course processing failed. You can retry.
          </div>
          <button onClick={handleReprocess} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-100 dark:bg-red-900/40">
            Retry
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row mt-2 max-w-7xl mx-auto w-full px-2 lg:px-5 gap-4 pb-24">
        
        {/* Left Sidebar: Course Sections */}
        {document?.sections && document.sections.length > 0 && (
          <div className={`w-full md:w-72 transition-all duration-500 shrink-0 bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/30 shadow-sm overflow-hidden flex flex-col self-start p-3 gap-2 ${!sidebarOpen ? 'max-h-[64px]' : 'max-h-[90vh] md:max-h-none'}`}>
            <div className="px-3 py-3 animate-in fade-in flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-2 overflow-hidden">
                <LayoutList size={18} className="text-sky-500 shrink-0" />
                <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] whitespace-nowrap">Course Outline</h3>
              </div>
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-8 h-8 flex items-center justify-center hover:bg-sky-50 dark:hover:bg-sky-900/40 rounded-xl text-sky-500 transition-all active:scale-90"
              >
                <ChevronDown className={`transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : 'rotate-0'}`} size={18} />
              </button>
            </div>
            
            {sidebarOpen && (
              <div className="flex-1 overflow-y-auto space-y-1 mt-2 max-h-[70vh]">
                {completeSections.map((sec, idx) => (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group ${
                      activeSectionId === sec.id 
                        ? 'bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/40 shadow-sm' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 ${
                      activeSectionId === sec.id ? 'bg-sky-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold truncate ${activeSectionId === sec.id ? 'text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {sec.subtopic}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 truncate">
                        {sec.topic}
                      </p>
                    </div>
                    <ChevronRight size={14} className={`shrink-0 mt-1 transition-opacity ${activeSectionId === sec.id ? 'text-sky-500 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))}

                {pendingCount > 0 && (
                  <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                      <Layers size={14} />
                      <span className="text-xs font-bold uppercase tracking-wider">{pendingCount} Locked</span>
                    </div>
                    <button
                      onClick={handleUnlockNext}
                      disabled={unlocking}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {unlocking ? '...' : 'Unlock Next'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* TABS */}
          <div className="bg-white/80 dark:bg-[#0D1525]/80 backdrop-blur-md rounded-2xl border border-sky-100 dark:border-sky-900/30 p-2 overflow-x-auto hide-scrollbar mb-4 shadow-sm relative z-10 mx-2 md:mx-0">
            <div className="flex min-w-max gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl font-[var(--font-syne)] font-bold text-sm whitespace-nowrap transition-colors flex-1 text-center ${
                    activeTab === tab.id
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 px-2 md:px-0">
            {activeTab === 'summary' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 md:mb-4 px-2">
                  <FileText className="text-sky-500" size={20} />
                  <h2 className="font-[var(--font-syne)] font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">Course Summary: <span className="text-sky-500">{currentSection?.subtopic}</span></h2>
                </div>
                
                <div className="bg-white dark:bg-[#0D1525] p-6 lg:p-8 shrink-0 rounded-2xl border border-sky-100 dark:border-sky-900/20 shadow-sm text-[#0C4A6E] dark:text-[#F0F9FF] mt-3 md:mt-0">
                  {currentSection?.summary ? (
                    <div className="prose dark:prose-invert max-w-none prose-sm lg:prose-base space-y-6">
                      <SummaryContent summary={currentSection.summary} onExplain={handleExplainMore} sectionName={currentSection.subtopic} />
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 italic">Summary will appear once processing is complete.</div>
                  )}
                </div>

                {!isLastChapter && (
                  <div className="mt-8 flex justify-center">
                    <button 
                      onClick={() => { setActiveTab('flashcards'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="px-8 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-sky-500/20 transition-all active:scale-95"
                    >
                      Continue to Flashcards <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'flashcards' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Layers className="text-amber-500" size={20} />
                  <h2 className="font-[var(--font-syne)] font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">Flashcards: <span className="text-amber-500">{currentSection?.subtopic}</span></h2>
                </div>
                {flashcards.length === 0 ? (
                  <div className="bg-white dark:bg-[#0D1525] p-8 rounded-2xl border border-sky-100 dark:border-sky-900/20 flex justify-center text-sm text-sky-600 dark:text-sky-300">No flashcards yet.</div>
                ) : (
                  <>
                    <p className="font-[var(--font-jakarta)] text-xs text-sky-600 dark:text-sky-400 text-center mb-6 uppercase tracking-widest font-bold">Tap a card to flip it over</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {flashcards.map((card, i) => (
                        <div key={card.id} onClick={() => handleFlip(i)} className="w-full h-48 cursor-pointer" style={{ perspective: '1000px' }}>
                          <div className="w-full h-full relative duration-500" style={{ transformStyle: 'preserve-3d', transform: flippedMap[i] ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                            
                            {/* Front of card */}
                            <div className="absolute inset-0 bg-white dark:bg-[#0D1525] rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center shadow-sm overflow-hidden"
                              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-widest font-bold">Front</p>
                              <p className="font-[var(--font-syne)] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF]">{card.front}</p>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleExplainMore(card.front, currentSection?.subtopic); }}
                                className="absolute bottom-3 right-3 text-[10px] bg-sky-50 dark:bg-sky-900/30 text-sky-500 px-2 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-sky-100 transition-colors"
                              >
                                💡 AI Explain
                              </button>
                            </div>
                            
                            {/* Back of card */}
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl border-2 border-sky-400 p-6 flex flex-col items-center justify-center text-center shadow-lg overflow-hidden"
                              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                              <p className="text-[10px] text-sky-200 mb-3 uppercase tracking-widest font-bold">Back</p>
                              <p className="font-[var(--font-jakarta)] font-medium text-sm text-white overflow-y-auto hide-scrollbar">{card.back}</p>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleExplainMore(card.back, currentSection?.subtopic); }}
                                className="absolute bottom-3 right-3 text-[10px] bg-white/20 text-white px-2 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-white/30 transition-colors"
                              >
                                💡 AI Explain
                              </button>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {!isLastChapter && (
                  <div className="mt-12 flex justify-center border-t border-slate-100 dark:border-slate-800 pt-8">
                    <button 
                      onClick={() => { setActiveTab('quiz'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                    >
                      Mastered Flashcards? Take Quiz <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between gap-2 mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <Target className="text-emerald-500" size={20} />
                    <h2 className="font-[var(--font-syne)] font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">Knowledge Check</h2>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 shadow-sm p-6 flex flex-col items-center justify-center text-center overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full"></div>
                  
                  <div className="w-16 h-16 bg-sky-100 dark:bg-sky-900/30 text-sky-500 rounded-2xl flex items-center justify-center mb-4 shadow-inner relative z-10">
                    <Target size={32} />
                  </div>
                  <h2 className="font-[var(--font-syne)] font-bold text-2xl text-[#0C4A6E] dark:text-[#F0F9FF] mb-2 relative z-10">Test Your Knowledge</h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-8 text-sm relative z-10">
                    Take a mini-quiz specifically designed for <strong className="text-sky-500">{currentSection?.subtopic}</strong> to test your mastery of this section.
                  </p>
                  
                  <div className="flex flex-col w-full max-w-xs gap-3 relative z-10">
                    <button
                      onClick={handleStartQuiz}
                      disabled={quizQuestions.length === 0}
                      className="w-full px-6 py-4 rounded-xl font-[var(--font-syne)] font-bold bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-95 text-white transition-all shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
                    >
                      <span>Start Mini-Quiz ({quizQuestions.length} Qs)</span>
                      <ExternalLink size={16} />
                    </button>

                    <button
                      onClick={handleGenerateMoreQuiz}
                      disabled={generatingMore}
                      className="w-full px-6 py-3 rounded-xl font-[var(--font-jakarta)] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {generatingMore ? (
                        <><RefreshCw className="animate-spin" size={16} /> Generating AI...</>
                      ) : (
                        <><Plus size={16} /> Generate More Questions</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PREMIUM STUDY GUIDE COMPONENTS ──────────────────────────────────────────

function SummaryContent({ summary, onExplain, sectionName }) {
  const data = useMemo(() => {
    if (!summary) return null;
    try {
      // Try to parse if it's a JSON string
      if (typeof summary === 'string' && (summary.startsWith('{') || summary.startsWith('['))) {
        return JSON.parse(summary);
      }
      return summary; // Might already be an object
    } catch (_) {
      return { _legacy: summary };
    }
  }, [summary]);

  if (!data) return null;

  // Legacy fallback
  if (data._legacy) {
    return (
      <div className="text-sm leading-relaxed whitespace-pre-wrap font-[var(--font-jakarta)]">
        {data._legacy}
      </div>
    );
  }

  const takeaways = data["Key Takeaways"] || data.key_takeaways || [];
  const deepDive = data["Deep Dive"] || data.deep_dive || [];
  const glossary = data["Glossary"] || data.glossary || {};

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🚀 KEY TAKEAWAYS */}
      {takeaways.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <span className="text-lg">🚀</span>
            </div>
            <h3 className="font-[var(--font-syne)] font-bold text-base text-sky-600 dark:text-sky-400 uppercase tracking-wider">Key Takeaways</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {takeaways.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => onExplain(item, sectionName)}
                className="bg-sky-50/50 dark:bg-sky-900/10 border border-sky-100/50 dark:border-sky-800/30 p-4 rounded-2xl flex gap-3 group cursor-help hover:bg-sky-100/50 transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 mt-1 text-[10px] font-black">
                  ✓
                </div>
                <p className="text-sm font-[var(--font-jakarta)] font-medium leading-relaxed group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 📖 DEEP DIVE */}
      {deepDive.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <span className="text-lg">📖</span>
            </div>
            <h3 className="font-[var(--font-syne)] font-bold text-base text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Deep Dive</h3>
          </div>
          <div className="space-y-4">
            {(Array.isArray(deepDive) ? deepDive : [deepDive]).map((para, idx) => (
              <p key={idx} className="text-sm lg:text-base font-[var(--font-jakarta)] leading-relaxed text-[#0C4A6E] dark:text-[#F0F9FF]/80">
                {para}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* 📚 GLOSSARY */}
      {Object.keys(glossary).length > 0 && (
        <section className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <span className="text-lg">📚</span>
            </div>
            <h3 className="font-[var(--font-syne)] font-bold text-base text-amber-600 dark:text-amber-400 uppercase tracking-wider">Glossary</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(glossary).map(([term, definition], idx) => (
              <div key={idx} className="group cursor-help" onClick={() => onExplain(term, sectionName)}>
                <h4 className="font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] group-hover:text-sky-500 transition-colors">{term}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {definition}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
