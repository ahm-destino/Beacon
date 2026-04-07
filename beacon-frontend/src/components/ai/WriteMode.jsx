import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Economics',
  'Government',
  'Literature'
];

export default function WriteMode() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [step, setStep] = useState('setup');
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scores, setScores] = useState([]);
  const [inputMode, setInputMode] = useState('write');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [config, setConfig] = useState({
    subject: 'Mathematics',
    topic: '',
    question_count: 5,
    type: 'problem_solving'
  });

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = 350;
    const height = 400;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  };

  useEffect(() => {
    if (step === 'writing' && inputMode === 'write') {
      setupCanvas();
    }
  }, [step, currentIndex, inputMode]);

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getPoint(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getPoint(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = '#0C4A6E';
    ctx.lineWidth = 3;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  const startSession = async () => {
    try {
      const res = await api.post('/api/ai-tutor/write/session', config);
      const data = res?.data || {};
      setSessionId(data.session_id);
      setQuestions(data.questions || []);
      setCurrentIndex(0);
      setScores([]);
      setFeedback(null);
      setTypedAnswer('');
      setInputMode('write');
      setStep('writing');
    } catch (e) {
      window.alert(e?.error || 'Failed to start write session');
    }
  };

  const submitAnswer = async () => {
    if (!sessionId) return;
    const payload = {
      session_id: sessionId,
      question_index: currentIndex,
    };

    if (inputMode === 'type') {
      const text = typedAnswer.trim();
      if (!text) {
        window.alert('Please type your answer before submitting.');
        return;
      }
      payload.extracted_text = text;
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const imageData = canvas.toDataURL('image/png').split(',')[1];
      payload.image_data = imageData;
    }
    setStep('processing');
    try {
      const res = await api.post('/api/ai-tutor/write/submit', payload);
      const data = res?.data || {};
      setFeedback(data);
      setScores(prev => [...prev, Number(data.score || 0)]);
      setStep('feedback');
    } catch (e) {
      setStep('writing');
      window.alert(e?.error || 'Failed to check answer');
    }
  };

  const nextQuestion = () => {
    clearCanvas();
    setFeedback(null);
    setTypedAnswer('');
    if (currentIndex + 1 >= questions.length) {
      setStep('complete');
    } else {
      setCurrentIndex(prev => prev + 1);
      setStep('writing');
    }
  };

  const retryTyping = () => {
    setFeedback(null);
    setTypedAnswer('');
    setInputMode('type');
    setStep('writing');
  };

  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
        <div className="bg-white dark:bg-[#0D1525] px-5 py-4 border-b border-sky-100 dark:border-sky-900/20 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 text-sky-600 dark:text-sky-400">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF]">Write mode</h2>
            <p className="text-[10px] font-bold text-sky-600/40 uppercase tracking-widest -mt-0.5">Practice by writing</p>
          </div>
        </div>

        <div className="px-5 pt-6 pb-24 space-y-6">
          <div>
            <p className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-2">Subject</p>
            <select
              value={config.subject}
              onChange={(e) => setConfig(p => ({ ...p, subject: e.target.value }))}
              className="w-full bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-xl px-4 py-3 text-sm"
            >
              {SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-2">Topic (optional)</p>
            <input
              value={config.topic}
              onChange={(e) => setConfig(p => ({ ...p, topic: e.target.value }))}
              className="w-full bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-xl px-4 py-3 text-sm"
              placeholder="Enter a topic"
            />
          </div>

          <div>
            <p className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-2">Questions</p>
            <div className="flex gap-2">
              {[3, 5, 7, 10].map(n => (
                <button
                  key={n}
                  onClick={() => setConfig(p => ({ ...p, question_count: n }))}
                  className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold ${
                    config.question_count === n
                      ? 'border-sky-600 bg-sky-600 text-white'
                      : 'border-sky-100 dark:border-sky-900/20 bg-white dark:bg-[#0D1525] text-sky-700 dark:text-sky-400'
                  }`}
                >
                  {n} Questions
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startSession}
            className="w-full py-4 rounded-xl font-[var(--font-syne)] font-black text-lg text-white bg-sky-700 dark:bg-sky-500 hover:bg-sky-800 shadow-[0_12px_32px_rgba(3,105,161,0.35)] active:scale-[0.98] transition-all duration-200"
          >
            Start Writing Session
          </button>
        </div>
      </div>
    );
  }

  if (step === 'writing') {
    const question = questions[currentIndex];
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
        <div className="bg-white dark:bg-[#0D1525] px-5 py-4 border-b border-sky-100 dark:border-sky-900/20 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-1 text-sky-600 dark:text-sky-400">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-bold text-sky-600/40 uppercase tracking-widest">Question</p>
            <p className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">
              {currentIndex + 1} of {questions.length}
            </p>
          </div>
          <button
            onClick={() => (inputMode === 'write' ? clearCanvas() : setTypedAnswer(''))}
            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="px-5 py-6 space-y-5 flex flex-col items-center">
          <div className="w-full max-w-sm bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-2 flex items-center justify-between">
            <button
              onClick={() => setInputMode('write')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                inputMode === 'write'
                  ? 'bg-sky-600 text-white'
                  : 'text-sky-600 dark:text-sky-400'
              }`}
            >
              Write
            </button>
            <button
              onClick={() => setInputMode('type')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                inputMode === 'type'
                  ? 'bg-sky-600 text-white'
                  : 'text-sky-600 dark:text-sky-400'
              }`}
            >
              Type
            </button>
          </div>

          <div className="w-full bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-4">
            <p className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-1">Prompt</p>
            <p className="text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">
              {question?.question} ({question?.marks || 5} marks)
            </p>
          </div>

          {inputMode === 'type' ? (
            <div className="w-full">
              <textarea
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                className="w-full h-56 rounded-2xl border border-sky-100 dark:border-sky-900/30 bg-white dark:bg-[#0D1525] p-4 text-sm text-[#0C4A6E] dark:text-[#F0F9FF] resize-none"
                placeholder="Type your answer here..."
              />
              <p className="text-[10px] text-sky-500 mt-2 text-center">Tip: use short steps or bullet points.</p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={350}
              height={400}
              className="writing-canvas border border-sky-100 dark:border-sky-900/30 rounded-2xl bg-white"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
              style={{ touchAction: 'none' }}
            />
          )}

          <button
            onClick={submitAnswer}
            className="w-full max-w-sm bg-sky-700 dark:bg-sky-600 text-white py-4 rounded-2xl font-[var(--font-syne)] font-black text-lg shadow-xl shadow-sky-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={20} /> Check My Answer
          </button>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
        <p className="mt-4 text-sm text-sky-600/70 dark:text-sky-400/70">Reading your answer...</p>
      </div>
    );
  }

  if (step === 'feedback') {
    const canRetryTyping = inputMode === 'write' && !feedback?.transcription;
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] p-6">
        <div className="max-w-md mx-auto bg-white dark:bg-[#0D1525] rounded-3xl border border-sky-100 dark:border-sky-900/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-[var(--font-syne)] font-bold text-lg text-[#0369A1] dark:text-[#0EA5E9]">Feedback</h2>
            <div className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs font-bold">
              {feedback?.score || 0}/{feedback?.max_score || 0}
            </div>
          </div>

          <div className="text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">
            <p className="font-bold mb-1">Transcription</p>
            <p className="text-sky-600/80 dark:text-sky-400/80">{feedback?.transcription || 'No text detected.'}</p>
          </div>

          <div className="space-y-2">
            {(feedback?.points_covered || []).map((p, i) => (
              <p key={`c-${i}`} className="text-xs text-emerald-600">OK: {p}</p>
            ))}
            {(feedback?.points_missed || []).map((p, i) => (
              <p key={`m-${i}`} className="text-xs text-rose-600">Missed: {p}</p>
            ))}
          </div>

          <p className="text-sm text-[#0C4A6E] dark:text-[#F0F9FF]/80">{feedback?.feedback}</p>

          {canRetryTyping && (
            <button
              onClick={retryTyping}
              className="w-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 py-3 rounded-2xl font-[var(--font-syne)] font-bold"
            >
              Try Typing Instead
            </button>
          )}

          <button
            onClick={nextQuestion}
            className="w-full bg-sky-700 dark:bg-sky-600 text-white py-3 rounded-2xl font-[var(--font-syne)] font-bold"
          >
            {currentIndex + 1 >= questions.length ? 'See Final Results' : 'Next Question'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col items-center justify-center text-center p-6">
        <h2 className="font-[var(--font-syne)] font-bold text-2xl text-[#0369A1] dark:text-[#0EA5E9] mb-3">Session Complete</h2>
        <p className="text-sm text-sky-600/70 dark:text-sky-400/70 mb-6">Average score: {avg}%</p>
        <button
          onClick={() => navigate('/ai-tutor')}
          className="w-full max-w-sm bg-sky-700 dark:bg-sky-600 text-white py-4 rounded-2xl font-[var(--font-syne)] font-black"
        >
          Back to AI Tutor
        </button>
      </div>
    );
  }

  return null;
}
