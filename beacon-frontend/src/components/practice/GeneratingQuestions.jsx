import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Brain, Zap, Cpu, Loader2, AlertCircle, RefreshCcw, ArrowLeft } from 'lucide-react';
import { Practice } from '../../services/api';
import { toast } from 'sonner';

export default function GeneratingQuestions() {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const runAttempted = useRef(false);

  const stages = [
    "Analyzing subject metadata...",
    "Retrieving optimized questions...",
    "Calibrating difficulty levels...",
    "Finalizing interactive modules..."
  ];

  const normalizeQuestion = (q) => ({
    id: q.id,
    text: q.question_text,
    options: [q.option_a, q.option_b, q.option_c, q.option_d],
    correctAnswer: q.correct_answer,
    explanation: q.explanation,
    topic: q.topic,
    subject: q.subject,
    imageUrl: q.image_url,
    optionMapping: q.optionMapping || null, // For shuffled options in full exams
  });

  const run = async () => {
    const state = location.state?.config || location.state || {};
    const isMock = state.is_mock;
    const isFullJamb = isMock && state.exam_type === 'JAMB';
    
    setError(null);
    setIsRetrying(true);
    setProgress(10);
    setStage(0);

    try {
      let res;
      if (isFullJamb) {
        setStage(1);
        // Specialized endpoint for multi-subject JAMB simulation
        res = await Practice.createJambFullSession({
          subjects: state.subjects || state.selectedSubjects || []
        });
      } else {
        const difficultyMap = { Basic: 'easy', Normal: 'medium', Deep: 'hard' };
        const difficulty = state.difficulty ? (difficultyMap[state.difficulty] || state.difficulty) : 'medium';
        
        const payload = {
          mode: (state.mode || 'practice').toLowerCase(),
          practice_type: state.topic ? 'topic_based' : 'subject_based',
          exam_type: state.exam_type || 'JAMB',
          subject: state.subject || (state.subjects ? state.subjects[0] : null),
          topic: state.topic || null,
          year: state.year ? Number(state.year) : null,
          difficulty,
          time_limit: state.time_limit ?? state.timer ?? null,
          total_questions: state.total_questions || (state.topic ? 12 : 20),
        };
        res = await Practice.createSession(payload);
      }

      if (!res?.data) throw new Error("Empty response from server");

      const backendSession = res.data.session;
      const backendQuestions = res.data.questions || [];
      
      // If full JAMB, the questions might be in sections
      const sections = res.data.sections || [];
      
      setProgress(100);
      setStage(3);

      setTimeout(() => {
        if (isFullJamb) {
          navigate('/practice/jamb-full', {
            state: {
              session: backendSession,
              sections: sections,
              time_limit: res.data.time_limit_seconds || 7200
            }
          });
        } else {
          const uiQuestions = backendQuestions.map(normalizeQuestion);
          navigate('/practice/session', {
            state: {
              ...state,
              id: backendSession?.id,
              questions: uiQuestions,
              answers: {},
              currentIndex: 0,
              startTime: backendSession?.started_at,
              timer: backendSession?.time_limit ?? state.time_limit ?? null,
            },
          });
        }
      }, 800);

    } catch (e) {
      console.error("Generation Error:", e);
      const msg = e?.response?.data?.error || e?.message || 'Connection timeout or data mismatch.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    if (runAttempted.current) return;
    runAttempted.current = true;

    const progressInterval = setInterval(() => {
      setProgress(prev => (prev >= 90 ? 90 : prev + 1));
    }, 100);

    const stageInterval = setInterval(() => {
      setStage(prev => (prev < 2 ? prev + 1 : 2));
    }, 1500);

    run();

    return () => {
      clearInterval(progressInterval);
      clearInterval(stageInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col items-center justify-center p-8 font-[var(--font-jakarta)]">
      <div className="w-full max-w-md space-y-12 text-center">
        {error ? (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="mx-auto w-24 h-24 bg-rose-100 dark:bg-rose-900/30 rounded-[2rem] flex items-center justify-center text-rose-600 border-2 border-rose-200 dark:border-rose-800">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-3">
              <h2 className="font-[var(--font-syne)] font-black text-2xl text-[#0C4A6E] dark:text-[#F0F9FF]">
                Generation <span className="text-rose-600">Failed</span>
              </h2>
              <p className="text-sm text-sky-600/60 dark:text-sky-400/60 max-w-[280px] mx-auto leading-relaxed">
                {error}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={run}
                disabled={isRetrying}
                className="w-full bg-sky-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
              >
                <RefreshCcw size={18} className={isRetrying ? 'animate-spin' : ''} />
                {isRetrying ? 'Retrying...' : 'Retry Generation'}
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full py-4 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} /> Go Back
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000">
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-sky-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
              <div className="relative w-full h-full bg-white dark:bg-[#0D1525] rounded-[2.5rem] shadow-2xl flex items-center justify-center border-4 border-white dark:border-sky-900/40 overflow-hidden">
                <Cpu size={48} className="text-sky-500 animate-[spin_4s_linear_infinite]" />
                <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 to-transparent"></div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-[var(--font-syne)] font-black text-2xl text-[#0C4A6E] dark:text-[#F0F9FF]">
                Architecting <span className="text-sky-600">Your Session</span>
              </h2>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-sky-600/60 pl-1 pr-1">
                  <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> {stages[stage]}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full bg-sky-100 dark:bg-sky-900/30 rounded-full overflow-hidden border border-sky-200/20">
                  <div 
                    className="h-full bg-sky-600 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(14,165,233,0.5)]"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/50 dark:bg-sky-900/10 p-4 rounded-3xl border border-sky-100 dark:border-sky-900/20 backdrop-blur-sm">
                <Zap size={20} className="text-amber-500 mx-auto mb-2" />
                <p className="text-[10px] text-sky-600/40 font-bold uppercase">Exam Engine</p>
                <p className="text-xs text-[#0C4A6E] dark:text-[#F0F9FF] font-black truncate">
                  {location.state?.config?.exam_type || location.state?.exam_type || 'Standard'}
                </p>
              </div>
              <div className="bg-white/50 dark:bg-sky-900/10 p-4 rounded-3xl border border-sky-100 dark:border-sky-900/20 backdrop-blur-sm">
                <Brain size={20} className="text-sky-500 mx-auto mb-2" />
                <p className="text-[10px] text-sky-600/40 font-bold uppercase">Optimizing</p>
                <p className="text-xs text-[#0C4A6E] dark:text-[#F0F9FF] font-black text-center">
                  Live DB Queries
                </p>
              </div>
            </div>

            <p className="text-sm text-sky-600/40 dark:text-sky-400/40 font-medium italic animate-pulse">
              "The secret to mastery is consistent deliberate practice."
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
