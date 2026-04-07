import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Undo, Trash2, Edit2, Eraser, CheckCircle } from 'lucide-react';
import api from '../../services/api';

export default function HandwritingCanvas() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState('pen'); // pen, eraser
  const [brushSize, setBrushSize] = useState(4);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Fill white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, rect.width, rect.height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Initial state save
    setHistory([canvas.toDataURL()]);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setHistory(prev => [...prev.slice(-19), dataUrl]);
  };

  const undo = (e) => {
    e.stopPropagation();
    if (history.length <= 1) return;
    
    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const prevState = newHistory[newHistory.length - 1];
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = prevState;
    img.onload = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      setHistory(newHistory);
    };
  };

  const clearAll = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);
    saveToHistory();
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = mode === 'pen' ? '#0C4A6E' : '#FFFFFF';
    ctx.lineWidth = mode === 'pen' ? brushSize : brushSize * 5;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="bg-white dark:bg-[#0D1525] px-5 py-4 border-b border-sky-100 dark:border-sky-900/20 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1 text-sky-600 dark:text-sky-400">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF]">Write mode</h2>
            <p className="text-[10px] font-bold text-sky-600/40 uppercase tracking-widest -mt-0.5">Solve by drawing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={undo} 
            disabled={history.length <= 1}
            className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 disabled:opacity-30 transition-opacity"
          >
            <Undo size={18} />
          </button>
          <button 
            onClick={clearAll}
            className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* CANVAS */}
      <div className="flex-1 relative bg-white touch-none cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full"
        />
        
        {/* WATERMARK */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <h1 className="text-8xl font-black rotate-[-30deg]">BEACON</h1>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white dark:bg-[#0D1525] p-5 pb-10 border-t border-sky-100 dark:border-sky-900/20 space-y-5 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-sky-50 dark:bg-sky-900/20 p-1 rounded-2xl">
            <button
              onClick={() => setMode('pen')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all ${
                mode === 'pen' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'text-sky-400'
              }`}
            >
              <Edit2 size={16} /> Pen
            </button>
            <button
              onClick={() => setMode('eraser')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all ${
                mode === 'eraser' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'text-sky-400'
              }`}
            >
              <Eraser size={16} /> Eraser
            </button>
          </div>

          <div className="flex items-center gap-3">
             <div className={`w-3 h-3 rounded-full bg-sky-600`} style={{ transform: `scale(${1 + brushSize/10})` }} />
             <input 
              type="range" min="2" max="15" 
              value={brushSize} 
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-20 accent-sky-600"
            />
          </div>
        </div>

        <button
          onClick={async () => {
            try {
              const canvas = canvasRef.current;
              const imageData = canvas?.toDataURL?.('image/png') || '';
              const res = await api.post('/api/ai-tutor/handwriting/check', {
                extracted_text: 'Handwritten math solution submitted for checking.',
                image_data: imageData,
              });
              const data = res?.data || {};
              const nextSteps = Array.isArray(data.next_steps) ? data.next_steps.join('\n- ') : '';
              const message = [
                "I've written a mathematical problem on the canvas. Can you help me check my work and explain the steps?",
                data.summary ? `Summary: ${data.summary}` : '',
                nextSteps ? `Next steps:\n- ${nextSteps}` : '',
              ].filter(Boolean).join('\n\n');

              navigate('/ai-tutor/chat/new', {
                state: {
                  initialMessage: message,
                  autoSend: true,
                  mode: 'write',
                },
              });
            } catch (_) {
              navigate('/ai-tutor/chat/new', {
                state: {
                  initialMessage: "I've written a mathematical problem on the canvas. Can you help me check my work and explain the steps?",
                  autoSend: true,
                  mode: 'write',
                },
              });
            }
          }}
          className="w-full bg-sky-700 dark:bg-sky-600 text-white py-4.5 rounded-[2rem] font-[var(--font-syne)] font-black text-lg shadow-2xl shadow-sky-900/30 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          Check My Work <CheckCircle size={22} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
