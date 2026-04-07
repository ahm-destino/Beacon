import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Brain, Zap, Cpu, Loader2 } from 'lucide-react';
import { Practice } from '../../services/api';

export default function GeneratingQuestions() {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);

  const stages = [
    "Analyzing subject metadata...",
    "Retrieving optimized questions...",
    "Calibrating difficulty levels...",
    "Finalizing interactive modules..."
  ];

  useEffect(() => {
    const state = location.state || {};
    const isTopic = state.practiceType === 'topic' || !!state.topic;
    const totalQuestions = isTopic ? 12 : 20;

    const difficultyMap = {
      Basic: 'easy',
      Normal: 'medium',
      Deep: 'hard',
      easy: 'easy',
      medium: 'medium',
      hard: 'hard',
    };

    const difficulty = state.difficulty ? difficultyMap[state.difficulty] || state.difficulty : undefined;

    // Convert backend question shape to the UI's expected shape
    const normalizeQuestion = (q) => ({
      id: q.id,
      text: q.question_text,
      options: [`A. ${q.option_a}`, `B. ${q.option_b}`, `C. ${q.option_c}`, `D. ${q.option_d}`],
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      topic: q.topic,
      subject: q.subject,
    });

    let cancelled = false;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    const stageInterval = setInterval(() => {
      setStage(prev => (prev < 3 ? prev + 1 : 3));
    }, 1000);

    const run = async () => {
      try {
        const payload = {
          mode: (state.mode || 'practice').toLowerCase(),
          practice_type: isTopic ? 'topic_based' : 'subject_based',
          exam_type: state.examType || state.exam_type,
          subject: state.subject,
          topic: isTopic ? state.topic : null,
          year: !isTopic && state.year ? Number(state.year) : null,
          difficulty,
          time_limit: state.timer ?? null,
          total_questions: totalQuestions,
        };

        const res = await Practice.createSession(payload);
        const backendSession = res?.data?.session;
        const backendQuestions = res?.data?.questions || [];
        const uiQuestions = backendQuestions.map(normalizeQuestion);

        if (cancelled) return;

        setProgress(100);
        clearInterval(progressInterval);
        clearInterval(stageInterval);

        navigate('/practice/session', {
          state: {
            ...state,
            id: backendSession?.id,
            questions: uiQuestions,
            answers: {},
            currentIndex: 0,
            startTime: backendSession?.started_at,
            timer: backendSession?.time_limit ?? state.timer ?? null,
          },
        });
      } catch (e) {
        if (cancelled) return;
        window.alert(e?.error || e?.data?.error || 'Could not generate practice questions.');
      }
    };

    run();

    return () => {
      cancelled = true;
      clearInterval(progressInterval);
      clearInterval(stageInterval);
    };
  }, []); // intentionally only run once per mount

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-12 text-center animate-in fade-in zoom-in-95 duration-1000">
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
            <p className="text-[10px] text-sky-600/40 font-bold uppercase">Target</p>
            <p className="text-xs text-[#0C4A6E] dark:text-[#F0F9FF] font-black truncate">{location.state?.subject}</p>
          </div>
          <div className="bg-white/50 dark:bg-sky-900/10 p-4 rounded-3xl border border-sky-100 dark:border-sky-900/20 backdrop-blur-sm">
            <Brain size={20} className="text-sky-500 mx-auto mb-2" />
            <p className="text-[10px] text-sky-600/40 font-bold uppercase">Strategy</p>
            <p className="text-xs text-[#0C4A6E] dark:text-[#F0F9FF] font-black">{location.state?.difficulty || 'Normal'}</p>
          </div>
        </div>

        <p className="text-sm text-sky-600/40 dark:text-sky-400/40 font-medium italic animate-pulse">
          "The secret to mastery is consistent deliberate practice."
        </p>
      </div>
    </div>
  );
}

