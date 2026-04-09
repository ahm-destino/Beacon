import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User } from 'lucide-react';
import api from '../../services/api';
import FormattedExplanation from '../shared/FormattedExplanation';

export default function DocumentChat({ 
  documentId, 
  onClose, 
  messages, 
  setMessages, 
  explanationLevel, 
  setExplanationLevel 
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post(`/api/documents/${documentId}/chat`, { 
        message: userMsg,
        explanation_level: explanationLevel
      });
      if (res?.data?.answer) {
        setMessages(prev => [...prev, { role: 'assistant', text: res.data.answer }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Error: Could not reach the AI tutor right now." }]);
    } finally {
      setLoading(false);
    }
  };

  const tutorModes = [
    { id: 'basic', label: 'Basic', icon: '🐣' },
    { id: 'normal', label: 'Standard', icon: '📖' },
    { id: 'deep', label: 'Deep Dive', icon: '🧠' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm sm:items-start sm:p-4">
      <div className="w-full h-full sm:w-[450px] sm:h-[650px] bg-white dark:bg-[#0D1525] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-sky-100 dark:border-sky-900/30 animate-in slide-in-from-right-8">
        
        {/* Header */}
        <div className="px-4 py-3 bg-sky-50 dark:bg-sky-900/20 border-b border-sky-100 dark:border-sky-900/30">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-[var(--font-syne)] font-bold">
              <MessageSquare size={18} />
              AI Studio Tutor
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-sky-500 hover:bg-sky-100 dark:hover:bg-sky-900/40">
              <X size={18} />
            </button>
          </div>
          
          {/* Level Selector */}
          <div className="flex gap-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
            {tutorModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setExplanationLevel(mode.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  explanationLevel === mode.id 
                    ? 'bg-white dark:bg-[#0D1525] text-sky-600 dark:text-sky-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                <span>{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-sky-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`p-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-sky-500 text-white rounded-tr-none' 
                  : 'bg-slate-100 dark:bg-[#1A2333] text-slate-700 dark:text-slate-200 rounded-tl-none'
              }`}>
                {msg.role === 'assistant' ? <FormattedExplanation text={msg.text} /> : msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Bot size={14} />
              </div>
              <div className="p-3 rounded-2xl text-sm bg-slate-100 dark:bg-[#1A2333] text-slate-700 dark:text-slate-200 rounded-tl-none animate-pulse">
                Thinking at <span className="font-bold text-sky-500 underline uppercase">{explanationLevel}</span> level...
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-sky-100 dark:border-sky-900/30 bg-white dark:bg-[#0D1525]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="flex-1 bg-slate-50 dark:bg-[#1A2333] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-10 h-10 flex items-center justify-center bg-sky-500 text-white rounded-xl disabled:opacity-50 transition-colors hover:bg-sky-600"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
