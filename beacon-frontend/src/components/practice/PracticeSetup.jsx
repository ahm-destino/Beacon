import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';
import BottomNav from '../shared/BottomNav';
import { updatePracticeState } from '../../utils/practiceState';

const EXAMS = ['JAMB', 'WAEC', 'NECO', 'JUPEB'];
const SUBJECTS = ['Mathematics', 'English', 'Biology', 'Chemistry', 'Physics'];
const YEARS = ['2023', '2022', '2021', '2020', '2019', '2018'];
const TOPICS = ['Algebra', 'Logarithms', 'Organic Chemistry', 'Osmosis', 'Kinematics'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const TIMERS = [15, 30, 45, 60];

export default function PracticeSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledSubject = location.state?.prefilledSubject;
  const prefilledTopic = location.state?.prefilledTopic;
  const prefilledExam = location.state?.prefilledExam;

  const [step, setStep] = useState(1);
  const [examType, setExamType] = useState(prefilledExam || 'JAMB');
  const [practiceType, setPracticeType] = useState(prefilledTopic ? 'topic' : 'subject');
  const [subject, setSubject] = useState(prefilledSubject || 'Mathematics');
  const [year, setYear] = useState('2023');
  const [topic, setTopic] = useState(prefilledTopic || 'Algebra');
  const [difficulty, setDifficulty] = useState('Medium');
  const [timer, setTimer] = useState(30);
  const [noTimer, setNoTimer] = useState(false);

  useEffect(() => {
    if (prefilledTopic) {
      setPracticeType('topic');
    }
  }, [prefilledTopic]);

  const canProceed = useMemo(() => {
    if (step === 1) return !!examType;
    if (step === 2) return !!practiceType;
    if (step === 3 && practiceType === 'subject') return !!subject && !!year;
    if (step === 3 && practiceType === 'topic') return !!subject && !!topic && !!difficulty;
    return true;
  }, [step, examType, practiceType, subject, year, topic, difficulty]);

  const generateQuestions = (count = 10) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `q_${Date.now()}_${i}`,
      text: `${subject} ${practiceType === 'topic' ? topic : 'practice'} question ${i + 1}`,
      options: ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'],
      correctAnswer: 'A',
      explanation: 'This is a sample explanation. Replace with real question bank logic.',
      topic: practiceType === 'topic' ? topic : 'General',
      subject,
    }));
  };

  const startSession = () => {
    const id = Date.now().toString();
    const questions = generateQuestions(practiceType === 'topic' ? 12 : 20);
    const session = {
      id,
      mode: 'practice',
      examType,
      subject,
      topic: practiceType === 'topic' ? topic : null,
      year: practiceType === 'subject' ? Number(year) : null,
      questions,
      answers: {},
      currentIndex: 0,
      startTime: new Date().toISOString(),
      timer: noTimer ? null : timer * 60,
      status: 'active',
    };

    updatePracticeState(prev => ({ ...prev, currentSession: session }));
    localStorage.setItem('savedPracticeSession', JSON.stringify(session));

    navigate(`/practice/session/${id}`, { state: session });
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-24">
      <SubScreenHeader title="Practice Setup" backPath="/practice" />

      <div className="px-5 pt-6">
        {step === 1 && (
          <div>
            <p className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">
              Select exam type
            </p>
            <div className="grid grid-cols-2 gap-3">
              {EXAMS.map(exam => (
                <button
                  key={exam}
                  onClick={() => setExamType(exam)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    examType === exam
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-900/20'
                      : 'border-sky-100 dark:border-sky-900/20 bg-white dark:bg-[#0D1525]'
                  }`}
                >
                  <p className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">
                    {exam} UTME
                  </p>
                  <p className="text-xs text-sky-500 mt-1">Past questions + AI</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">
              Choose practice type
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setPracticeType('subject')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  practiceType === 'subject'
                    ? 'border-sky-600 bg-sky-50 dark:bg-sky-900/20'
                    : 'border-sky-100 dark:border-sky-900/20 bg-white dark:bg-[#0D1525]'
                }`}
              >
                <p className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">
                  Subject-Based
                </p>
                <p className="text-xs text-sky-500 mt-1">Pick subject and year</p>
              </button>
              <button
                onClick={() => setPracticeType('topic')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  practiceType === 'topic'
                    ? 'border-sky-600 bg-sky-50 dark:bg-sky-900/20'
                    : 'border-sky-100 dark:border-sky-900/20 bg-white dark:bg-[#0D1525]'
                }`}
              >
                <p className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">
                  Topic-Based
                </p>
                <p className="text-xs text-sky-500 mt-1">Focus on one topic</p>
              </button>
            </div>
          </div>
        )}

        {step === 3 && practiceType === 'subject' && (
          <div>
            <p className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">
              Choose subject and year
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border ${
                    subject === s
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white dark:bg-[#0D1525] border-sky-200 dark:border-sky-900/20 text-sky-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {YEARS.map(y => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    year === y
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white dark:bg-[#0D1525] border-sky-200 dark:border-sky-900/20 text-sky-600'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && practiceType === 'topic' && (
          <div>
            <p className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">
              Choose topic and difficulty
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border ${
                    subject === s
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white dark:bg-[#0D1525] border-sky-200 dark:border-sky-900/20 text-sky-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {TOPICS.map(t => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border ${
                    topic === t
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white dark:bg-[#0D1525] border-sky-200 dark:border-sky-900/20 text-sky-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold border ${
                    difficulty === d
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white dark:bg-[#0D1525] border-sky-200 dark:border-sky-900/20 text-sky-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <p className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-4">
              Timer settings
            </p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {TIMERS.map(t => (
                <button
                  key={t}
                  onClick={() => { setTimer(t); setNoTimer(false); }}
                  className={`py-3 rounded-xl text-xs font-bold border ${
                    timer === t && !noTimer
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white dark:bg-[#0D1525] border-sky-200 dark:border-sky-900/20 text-sky-600'
                  }`}
                >
                  {t} min
                </button>
              ))}
            </div>
            <button
              onClick={() => setNoTimer(!noTimer)}
              className={`w-full py-3 rounded-xl border text-sm font-bold ${
                noTimer
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white dark:bg-[#0D1525] border-sky-200 dark:border-sky-900/20 text-sky-600'
              }`}
            >
              No timer (practice pace)
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-[72px] left-0 right-0 px-5">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              className="flex-1 bg-white dark:bg-[#0D1525] border border-sky-200 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 rounded-xl py-3 font-[var(--font-syne)] font-bold"
            >
              Back
            </button>
          )}
          {step < 4 && (
            <button
              onClick={() => canProceed && setStep(prev => prev + 1)}
              disabled={!canProceed}
              className="flex-[2] bg-sky-700 dark:bg-sky-500 text-white rounded-xl py-3 font-[var(--font-syne)] font-bold shadow-[0_8px_24px_rgba(3,105,161,0.25)] disabled:opacity-50"
            >
              Next →
            </button>
          )}
          {step === 4 && (
            <button
              onClick={startSession}
              className="flex-[2] bg-sky-700 dark:bg-sky-500 text-white rounded-xl py-3 font-[var(--font-syne)] font-bold shadow-[0_8px_24px_rgba(3,105,161,0.25)]"
            >
              Start Practice
            </button>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
