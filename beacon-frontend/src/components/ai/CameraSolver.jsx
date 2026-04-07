import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

export default function CameraSolver() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState('camera');
  const [capturedImage, setCapturedImage] = useState(null);
  const [manualText, setManualText] = useState('');
  const [solution, setSolution] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [detectedText, setDetectedText] = useState('');
  const [detectedSubject, setDetectedSubject] = useState('');
  const [detectedTopic, setDetectedTopic] = useState('');
  const [conversationId, setConversationId] = useState('');

  const handleCapture = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target.result);
      setStep('preview');
    };
    reader.readAsDataURL(file);
  };

  const handleSolve = async (overrideText = '') => {
    if (!capturedImage && !overrideText) return;
    setStep('solving');
    setSolution('');
    setStreaming(true);
    setError('');

    try {
      const payload = { stream: true };
      if (overrideText) {
        payload.detected_text = overrideText;
      } else {
        const base64 = capturedImage.split(',')[1];
        payload.image_data = base64;
      }
      const token = localStorage.getItem('beacon_token');
      const response = await fetch(`${API_BASE_URL}/api/ai-tutor/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok || !response.body) {
        throw new Error('Could not process scan');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const payload = line.replace('data:', '').trim();
          if (!payload) continue;
          if (payload === '[DONE]') {
            setStreaming(false);
            continue;
          }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.meta) {
              setDetectedText(parsed.meta.detected_text || '');
              setDetectedSubject(parsed.meta.subject || '');
              setDetectedTopic(parsed.meta.topic || '');
              setConversationId(parsed.meta.conversation_id || '');
            }
            if (parsed.text) {
              setSolution(prev => prev + parsed.text);
            }
            if (parsed.error) {
              setError(parsed.error);
            }
          } catch (_) {}
        }
      }

      setStreaming(false);
      setStep('result');
    } catch (e) {
      setStreaming(false);
      setError(e?.message || 'Could not process scan');
      setStep('result');
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setManualText('');
    setSolution('');
    setError('');
    setDetectedText('');
    setDetectedSubject('');
    setDetectedTopic('');
    setConversationId('');
    setStep('camera');
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <div className="bg-white dark:bg-[#0D1525] px-5 py-4 border-b border-sky-100 dark:border-sky-900/20 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 text-sky-600 dark:text-sky-400">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF]">Scan Mode</h2>
          <p className="text-[10px] font-bold text-sky-600/40 uppercase tracking-widest -mt-0.5">Solve from a photo</p>
        </div>
      </div>

      {step === 'camera' && (
        <div className="px-5 pt-10 pb-24 text-center space-y-6">
          <div className="mx-auto w-64 h-40 rounded-2xl border-2 border-dashed border-sky-300 bg-white dark:bg-[#0D1525] flex items-center justify-center text-sky-400">
            Tap below to take a photo or upload
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-sm bg-sky-700 dark:bg-sky-600 text-white py-4 rounded-2xl font-[var(--font-syne)] font-black"
          >
            <span className="inline-flex items-center gap-2"><Camera size={18} /> Capture or Upload</span>
          </button>
          <button
            onClick={() => setStep('manual')}
            className="w-full max-w-sm bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 py-3 rounded-2xl font-[var(--font-syne)] font-bold"
          >
            Type the question instead
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => handleCapture(e.target.files?.[0])}
          />
        </div>
      )}

      {step === 'manual' && (
        <div className="px-5 pt-8 pb-24 space-y-4">
          <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-4">
            <p className="text-sm font-bold text-[#0369A1] dark:text-[#0EA5E9] mb-2">Type your question</p>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="w-full h-40 rounded-xl border border-sky-100 dark:border-sky-900/30 bg-white dark:bg-[#0D1525] p-3 text-sm text-[#0C4A6E] dark:text-[#F0F9FF] resize-none"
              placeholder="e.g. Factorize x^2 + 5x + 6"
            />
          </div>
          <button
            onClick={() => {
              if (!manualText.trim()) return;
              handleSolve(manualText.trim());
            }}
            className="w-full bg-sky-700 dark:bg-sky-600 text-white py-4 rounded-2xl font-[var(--font-syne)] font-bold"
          >
            Solve Typed Question
          </button>
          <button
            onClick={reset}
            className="w-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 py-3 rounded-2xl font-[var(--font-syne)] font-bold"
          >
            Back to Camera
          </button>
        </div>
      )}

      {step === 'preview' && (
        <div className="px-5 pt-6 pb-24 space-y-6">
          <div className="w-full rounded-2xl overflow-hidden border border-sky-100 dark:border-sky-900/20">
            <img src={capturedImage} alt="Preview" className="w-full h-auto" />
          </div>
          <div className="space-y-3">
            <button
              onClick={handleSolve}
              className="w-full bg-sky-700 dark:bg-sky-600 text-white py-4 rounded-2xl font-[var(--font-syne)] font-bold"
            >
              Solve This
            </button>
            <button
              onClick={reset}
              className="w-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 py-3 rounded-2xl font-[var(--font-syne)] font-bold"
            >
              Rescan
            </button>
          </div>
        </div>
      )}

      {step === 'solving' && (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
          <p className="mt-4 text-sm text-sky-600/70 dark:text-sky-400/70">Solving...</p>
        </div>
      )}

      {step === 'result' && (
        <div className="px-5 pt-6 pb-24 space-y-6">
          <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-4">
            <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-2">Solution</h3>
            {error ? (
              <p className="text-sm text-rose-600">{error}</p>
            ) : (
              <pre className="text-sm text-[#0C4A6E] dark:text-[#F0F9FF] whitespace-pre-wrap">{solution}</pre>
            )}
            {streaming && !error && (
              <p className="text-xs text-sky-500 mt-2">Streaming...</p>
            )}
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/ai-tutor/camera/solution', {
                state: {
                  photo: capturedImage,
                  detectedText,
                  subject: detectedSubject,
                  topic: detectedTopic,
                  solution: { final_answer: solution },
                  conversationId
                }
              })}
              className="w-full bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 py-3 rounded-2xl font-[var(--font-syne)] font-bold"
            >
              Open Solution View
            </button>
            {error && (
              <button
                onClick={() => setStep('manual')}
                className="w-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 py-3 rounded-2xl font-[var(--font-syne)] font-bold"
              >
                Type the question instead
              </button>
            )}
            <button
              onClick={reset}
              className="w-full bg-sky-700 dark:bg-sky-600 text-white py-3 rounded-2xl font-[var(--font-syne)] font-bold"
            >
              Scan Another
            </button>
            <button
              onClick={() => {
                if (conversationId) {
                  navigate(`/ai-tutor/chat/${conversationId}`);
                  return;
                }
                navigate('/ai-tutor/chat/new', {
                  state: {
                    initialMessage: 'I just scanned a question. Can you explain the solution step by step?',
                    autoSend: true,
                  }
                });
              }}
              className="w-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 py-3 rounded-2xl font-[var(--font-syne)] font-bold"
            >
              Continue in Chat
            </button>
          </div>
        </div>
      )}

      {step !== 'camera' && (
        <button
          onClick={reset}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 shadow-md flex items-center justify-center text-sky-600"
        >
          <RefreshCw size={18} />
        </button>
      )}
    </div>
  );
}
