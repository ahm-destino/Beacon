import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Mic, Square, RotateCcw, HelpCircle, Info } from 'lucide-react';
import api from '../../services/api';

export default function VoiceSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const { subject, topic, difficulty, language } = location.state || { subject: 'Mathematics', topic: 'General Algebra', difficulty: 'Normal', language: 'English' };
  
  const recognitionRef = useRef(null);
  const sessionIdRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [finalResult, setFinalResult] = useState(null);
  const [lastSpeakText, setLastSpeakText] = useState('');
  const [turnScore, setTurnScore] = useState(null);

  useEffect(() => {
    let mounted = true;
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    const startSession = async () => {
      try {
        const duration = location.state?.duration || '15min';
        const count = duration === '45min' ? 20 : duration === '30min' ? 15 : 10;
        const res = await api.post('/api/ai-tutor/voice/session', {
          subject,
          topic,
          difficulty,
          language,
          count,
        });
        const data = res?.data || {};
        if (!mounted) return;
        sessionIdRef.current = data.session_id;
        setCurrentQuestion(data.first_question);
        const speakText = data.text_to_speak || '';
        if (speakText) {
          setTranscript([{ sender: 'ai', text: speakText }]);
          setLastSpeakText(speakText);
          speak(speakText, () => listen());
        } else {
          setIsAISpeaking(false);
        }
      } catch (_) {
        if (mounted) {
          setTranscript([{ sender: 'ai', text: 'Unable to start voice session.' }]);
          setIsAISpeaking(false);
        }
      }
    };

    startSession();

    return () => {
      mounted = false;
      clearInterval(timer);
      if (recognitionRef.current) {
        recognitionRef.current.abort?.();
        recognitionRef.current.stop?.();
      }
      if (window?.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = (text, onEnd) => {
    if (!text) {
      onEnd?.();
      return;
    }
    if (!window?.speechSynthesis) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.lang = language === 'Pidgin' ? 'en-NG' : 'en-GB';
    setIsAISpeaking(true);
    utterance.onend = () => {
      setIsAISpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setIsAISpeaking(false);
      onEnd?.();
    };
    window.speechSynthesis.speak(utterance);
  };

  const listen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      window.alert('Speech recognition is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = language === 'Pidgin' ? 'en-NG' : 'en-US';
    recognition.maxAlternatives = 3;
    recognition.onresult = (e) => {
      const spoken = e.results?.[0]?.[0]?.transcript || '';
      setIsListening(false);
      if (spoken) {
        setTranscript(prev => [...prev, { sender: 'student', text: spoken }]);
        submitVoiceAnswer(spoken);
      } else {
        speak('I did not hear you. Please say A, B, C, or D.', () => listen());
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      speak('I did not hear you. Please say A, B, C, or D.', () => listen());
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    setIsListening(true);
    recognition.start();
  };

  const submitVoiceAnswer = async (spokenText) => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    try {
      const res = await api.post('/api/ai-tutor/voice/answer', {
        session_id: sid,
        spoken_text: spokenText,
      });
      const data = res?.data || {};
      if (data.understood === false) {
        const retryText = data.text_to_speak || 'Please say A, B, C, or D.';
        setTranscript(prev => [...prev, { sender: 'ai', text: retryText }]);
        setLastSpeakText(retryText);
        speak(retryText, () => listen());
        return;
      }

      const isCorrect = Boolean(data.is_correct);
      const nextCorrect = score.correct + (isCorrect ? 1 : 0);
      const nextTotal = score.total + 1;
      setScore({ correct: nextCorrect, total: nextTotal });
      setTurnScore(isCorrect ? 100 : 0);

      if (data.session_complete) {
        const finalText = data.text_to_speak || 'Session complete.';
        setFinalResult({
          correct: data.final_score ?? nextCorrect,
          total: data.total ?? nextTotal,
          percentage: data.percentage,
        });
        setTranscript(prev => [...prev, { sender: 'ai', text: finalText }]);
        speak(finalText);
        setShowSummary(true);
        return;
      }

      if (data.next_question) {
        setCurrentQuestion(data.next_question);
      }
      const nextText = data.text_to_speak || '';
      if (nextText) {
        setTranscript(prev => [...prev, { sender: 'ai', text: nextText }]);
        setLastSpeakText(nextText);
        speak(nextText, () => setTimeout(() => listen(), 500));
      } else {
        listen();
      }
    } catch (_) {
      const errorText = 'I could not process that. Please say A, B, C, or D.';
      setTranscript(prev => [...prev, { sender: 'ai', text: errorText }]);
      speak(errorText, () => listen());
    }
  };

  const toggleListen = () => {
    if (isAISpeaking) return;
    if (isListening) {
      recognitionRef.current?.stop?.();
      setIsListening(false);
      return;
    }
    listen();
  };

  const endSession = () => {
    if (window?.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    recognitionRef.current?.stop?.();
    setShowSummary(true);
  };

  if (showSummary) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] p-8 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-[2.5rem] bg-sky-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-sky-600/20">
          <Mic size={32} />
        </div>
        <h1 className="font-[var(--font-syne)] font-black text-3xl text-[#0C4A6E] dark:text-[#F0F9FF] mb-2">Session Complete!</h1>
        <p className="text-sky-600/60 dark:text-sky-400/60 mb-8">You've made great progress in {subject}.</p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-10">
          <div className="bg-white dark:bg-[#0D1525] p-6 rounded-[2rem] border border-sky-100 dark:border-sky-900/20 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-1">Time Spent</p>
            <p className="text-2xl font-black text-sky-700 dark:text-sky-300">{Math.floor(elapsed / 60)}m {elapsed % 60}s</p>
          </div>
          <div className="bg-white dark:bg-[#0D1525] p-6 rounded-[2rem] border border-sky-100 dark:border-sky-900/20 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-1">Questions</p>
            <p className="text-2xl font-black text-sky-700 dark:text-sky-300">{finalResult?.total ?? score.total}</p>
          </div>
        </div>
        {typeof turnScore === 'number' && (
          <div className="mb-8 bg-white dark:bg-[#0D1525] p-4 rounded-2xl border border-sky-100 dark:border-sky-900/20 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-400">Recent Turn Score</p>
            <p className="text-xl font-black text-sky-700 dark:text-sky-300">{turnScore}%</p>
          </div>
        )}

        <button
          onClick={() => navigate('/ai-tutor')}
          className="w-full max-w-sm bg-sky-700 dark:bg-sky-600 text-white py-4.5 rounded-[2rem] font-[var(--font-syne)] font-black text-lg shadow-xl shadow-sky-900/20 active:scale-95 transition-all"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="px-5 py-4 flex items-center justify-between z-10">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white dark:bg-sky-900/20 flex items-center justify-center text-sky-600 shadow-sm">
          <ChevronLeft size={20} />
        </button>
        <div className="flex bg-sky-600/10 px-4 py-1.5 rounded-full items-center gap-2 border border-sky-600/20">
          <div className={`w-2 h-2 rounded-full ${isAISpeaking || isListening ? 'bg-sky-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Live Session</span>
        </div>
        <div className="w-10" />
      </div>
      <div className="px-5 text-center text-xs font-bold text-sky-600/70 dark:text-sky-400/70">
        Score {score.correct} / {score.total}
      </div>

      {/* WAVEFORM / ANIMATION ZONE */}
      <div className="flex-1 flex flex-col items-center justify-center p-10 relative">
        <div className="relative">
          {/* Breathing Rings */}
          <div className={`absolute inset-0 rounded-full bg-sky-500/10 animate-ping transition-all duration-1000 ${isAISpeaking || isListening ? 'scale-150 opacity-100' : 'scale-100 opacity-0'}`} />
          <div className={`absolute inset-0 rounded-full bg-sky-600/5 animate-pulse transition-all duration-700 ${isAISpeaking || isListening ? 'scale-125 opacity-100' : 'scale-100 opacity-0'}`} />
          
          <div className={`w-48 h-48 rounded-[2.5rem] flex items-center justify-center relative z-10 transition-all duration-500 ${
            isListening ? 'bg-rose-500 scale-110' : isAISpeaking ? 'bg-sky-600 scale-105 shadow-2xl shadow-sky-600/30' : 'bg-gray-200 dark:bg-sky-900/20'
          }`}>
            {isListening ? <Mic size={64} className="text-white animate-bounce" /> : <div className="flex gap-1.5 items-end h-16">
              {[0,1,2,3,4].map(i => (
                <div 
                  key={i} 
                  className={`w-2 bg-white rounded-full transition-all duration-200 ${isAISpeaking ? 'animate-[voice-bar_0.5s_infinite_alternate]' : 'h-2'}`}
                  style={{ animationDelay: `${i * 0.1}s`, height: isAISpeaking ? '100%' : '8px' }}
                />
              ))}
            </div>}
          </div>
        </div>

        <div className="mt-12 text-center">
          <h2 className="font-[var(--font-syne)] font-bold text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">
            {isAISpeaking ? 'AI is explaining...' : isListening ? 'Listening to you...' : 'Tap Mic to speak'}
          </h2>
          <p className="text-sm text-sky-600/40 dark:text-sky-400/40 mt-1 max-w-[200px]">{topic}</p>
          {currentQuestion && (
            <div className="mt-6 bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-sky-500 mb-2">Question</p>
              <p className="text-sm text-[#0C4A6E] dark:text-[#F0F9FF] mb-3">{currentQuestion.question}</p>
              {currentQuestion.options && (
                <div className="space-y-1 text-xs text-sky-600/80 dark:text-sky-400/80">
                  {Object.entries(currentQuestion.options).map(([letter, text]) => (
                    <p key={letter}><strong>{letter}:</strong> {text}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TRANSCRIPT HUD */}
      <div className="px-5 mb-6">
        <div className="bg-white/40 dark:bg-sky-900/5 backdrop-blur-xl border border-sky-100 dark:border-sky-900/20 rounded-3xl p-6 h-32 overflow-y-auto scrollbar-hide">
          {transcript.map((t, i) => (
            <p key={i} className={`text-xs font-medium mb-3 ${t.sender === 'ai' ? 'text-sky-700 dark:text-sky-300' : 'text-gray-500 dark:text-gray-400 italic'}`}>
              <span className="font-black uppercase text-[10px] mr-2">{t.sender}:</span>
              {t.text}
            </p>
          ))}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="bg-white dark:bg-[#0D1525] p-5 pb-12 border-t border-sky-100 dark:border-sky-900/20 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { id: 'repeat', icon: RotateCcw, label: 'Repeat' },
            { id: 'hint', icon: HelpCircle, label: 'Hint' },
            { id: 'skip', icon: HelpCircle, label: 'Skip' },
            { id: 'explain', icon: Info, label: 'Explain' }
          ].map(cmd => (
            <button
              key={cmd.id}
              onClick={() => {
                if (cmd.id === 'repeat' && lastSpeakText) {
                  speak(lastSpeakText, () => listen());
                }
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-sky-50 dark:border-sky-900/10 hover:bg-sky-50 active:scale-90 transition-all"
            >
              <cmd.icon size={18} className="text-sky-600" />
              <span className="text-[10px] font-black uppercase text-sky-600/40">{cmd.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleListen}
            className={`flex-1 h-18 rounded-[2rem] flex items-center justify-center gap-3 font-[var(--font-syne)] font-black text-lg transition-all duration-300 shadow-xl ${
              isListening ? 'bg-rose-600 text-white shadow-rose-600/20' : 'bg-sky-700 text-white shadow-sky-700/20'
            }`}
             style={{ height: '72px' }}
          >
            {isListening ? <><Square size={24} fill="currentColor" /> Stop</> : <><Mic size={24} /> Tap to Talk</>}
          </button>
          
          <button 
            onClick={endSession}
            className="w-18 h-18 rounded-[2rem] bg-gray-100 dark:bg-sky-900/20 text-gray-500 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
            style={{ width: '72px', height: '72px' }}
          >
            <Square size={24} />
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes voice-bar {
          0% { height: 10%; }
          100% { height: 70%; }
        }
      `}} />
    </div>
  );
}
