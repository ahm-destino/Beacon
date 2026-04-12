import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Settings, MessageSquare, Camera, Edit3, Mic, ArrowRight, BookOpen, ChevronRight, Clock, Target, Zap, Brain, Sparkles, Image as ImageIcon } from 'lucide-react';
import AppHeader from '../shared/AppHeader';
import BottomNav from '../shared/BottomNav';
import api from '../../services/api';

export default function AITutor() {
  const navigate = useNavigate();
  const [level, setLevel] = useState('normal'); // basic, normal, deep
  const [mode, setMode] = useState('chat'); // chat, scan, write, voice
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const fileInputRef = useRef(null);

  // Load conversations and group them
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('conversations') || '[]');
    setConversations(saved.sort((a, b) => b.createdAt - a.createdAt));
    
    // Load preferred level
    const savedLevel = localStorage.getItem('ai_tutor_level');
    if (savedLevel) setLevel(savedLevel);

    // Load weak-area suggestions from backend
    (async () => {
      try {
        const res = await api.get('/api/ai-tutor/suggestions');
        setSuggestions(Array.isArray(res?.data) ? res.data : []);
      } catch (_) {
        setSuggestions([]);
      }
    })();
  }, []);

  const handleLevelChange = (newLevel) => {
    setLevel(newLevel);
    localStorage.setItem('ai_tutor_level', newLevel);
  };

  const groupedHistory = useMemo(() => {
    const today = [];
    const yesterday = [];
    const thisWeek = [];
    const older = [];
    
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    conversations.forEach(conv => {
      const date = new Date(conv.createdAt);
      const diff = now - date;

      if (diff < oneDay && date.getDate() === now.getDate()) {
        today.push(conv);
      } else if (diff < oneDay * 2) {
        yesterday.push(conv);
      } else if (diff < oneDay * 7) {
        thisWeek.push(conv);
      } else {
        older.push(conv);
      }
    });

    return { today, yesterday, thisWeek, older };
  }, [conversations]);

  const suggestionButtons = (suggestions || []).map((s) => ({
    text: `Focus on ${s.topic}`,
    subject: s.subject,
    icon: '🧠',
    raw: s,
  }));

  const handleSend = () => {
    if (!message.trim()) return;
    // Starts a brand new conversation
    navigate('/ai-tutor/chat/new', {
      state: {
        initialMessage: message,
        level,
        autoSend: true
      }
    });
    setMessage('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      navigate('/ai-tutor/chat/new', {
        state: {
          initialMessage: message || 'Analyze this image...',
          imageData: reader.result,
          mimeType: file.type,
          level,
          autoSend: true
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const getTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      <AppHeader 
        title="AI TUTOR" 
        rightAction={
          <button className="p-2 rounded-xl text-sky-600 dark:text-sky-400">
            <Settings size={20} />
          </button>
        } 
      />
      
      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto pb-40">
        <div className="max-w-md mx-auto pt-6 space-y-8">
          
          {/* BLOCK 1: EXPLANATION LEVEL */}
          <div className="px-5">
            <div className="flex bg-white/50 dark:bg-sky-900/10 p-1.5 rounded-2xl border border-sky-100 dark:border-sky-900/20 gap-2">
              {[
                { id: 'basic', label: '🌱 BASIC', theme: 'green' },
                { id: 'normal', label: '⚡ NORMAL', theme: 'amber' },
                { id: 'deep', label: '🔥 DEEP', theme: 'rose' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleLevelChange(opt.id)}
                  className={`flex-1 py-3 rounded-xl font-[var(--font-syne)] font-bold text-[10px] tracking-widest transition-all duration-300 active:scale-95 ${
                    level === opt.id
                      ? `bg-sky-600 text-white shadow-lg shadow-sky-600/20`
                      : 'text-sky-600/60 dark:text-sky-400/60'
                  }`}
                >
                  {opt.label} {level === opt.id && '✓'}
                </button>
              ))}
            </div>
          </div>

          {/* BLOCK 2: INPUT MODE */}
          <div className="px-5">
            <div className="flex gap-2">
              {[
                { id: 'chat', label: 'Chat', icon: MessageSquare, route: null },
                { id: 'scan', label: 'Scan', icon: Camera, route: '/ai-tutor/camera' },
                { id: 'write', label: 'Write', icon: Edit3, route: '/ai-tutor/handwriting' },
                { id: 'voice', label: 'Voice', icon: Mic, route: '/ai-tutor/voice/setup' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    if (m.route) navigate(m.route);
                  }}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all duration-300 active:scale-95 ${
                    mode === m.id
                      ? 'bg-sky-600 border-sky-600 text-white shadow-xl shadow-sky-600/20'
                      : 'bg-white dark:bg-[#0D1525] border-sky-100 dark:border-sky-900/20 text-sky-600 dark:text-sky-400'
                  }`}
                >
                  <m.icon size={18} />
                  <span className="font-[var(--font-syne)] text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* BLOCK 3: SUGGESTED QUESTIONS */}
          <div className="space-y-3">
            <p className="px-5 font-[var(--font-jakarta)] text-[11px] font-bold text-sky-600/60 dark:text-sky-400/60 uppercase tracking-widest">Suggested for you</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide px-5">
              {(suggestionButtons.length ? suggestionButtons : [
                { text: 'Explain Organic Chemistry', subject: 'Chemistry', icon: '🧪' },
                { text: 'Help with Logarithms', subject: 'Mathematics', icon: '📐' },
              ]).map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMessage(s.text);
                    navigate('/ai-tutor/chat/new', { state: { initialMessage: s.text, autoSend: true, level } });
                  }}
                  className="shrink-0 flex items-center gap-2 bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-xl px-4 py-3 hover:border-sky-300 dark:hover:border-sky-700/50 transition-all shadow-sm"
                >
                  <span className="text-sm">{s.icon}</span>
                  <span className="font-[var(--font-jakarta)] text-xs font-semibold text-[#0C4A6E] dark:text-[#F0F9FF] whitespace-nowrap">{s.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* BLOCK 4: BROWSE CONCEPTS BUTTON */}
          <div className="px-5">
            <button
              onClick={() => navigate('/ai-tutor/concepts')}
              className="w-full flex items-center gap-4 bg-white dark:bg-[#0D1525] border-2 border-sky-50 dark:border-sky-900/10 rounded-2xl p-5 hover:border-sky-200 dark:hover:border-sky-800/40 transition-all text-left shadow-sm group"
            >
              <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 group-hover:scale-110 transition-transform">
                <BookOpen size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF]">Browse Concepts Library</h3>
                <p className="font-[var(--font-jakarta)] text-xs text-sky-600/60 dark:text-sky-400/60 mt-0.5">Explore explanations by subject</p>
              </div>
              <ChevronRight size={20} className="text-sky-200 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* BLOCK 5: CONVERSATION HISTORY */}
          <div className="px-5 space-y-4 pb-10">
            <div className="flex justify-between items-center">
              <h3 className="font-[var(--font-syne)] font-bold text-base text-[#0C4A6E] dark:text-[#F0F9FF]">Recent Conversations</h3>
              <button onClick={() => navigate('/ai-tutor/history')} className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                See All <ChevronRight size={14} />
              </button>
            </div>

            {conversations.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center space-y-4 bg-white dark:bg-[#0D1525] rounded-[2.5rem] border border-sky-100 dark:border-sky-900/10">
                <div className="w-16 h-16 rounded-[2rem] bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-sky-300 dark:text-sky-700">
                  <MessageSquare size={32} />
                </div>
                <div>
                  <h4 className="font-[var(--font-syne)] font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">No conversations yet.</h4>
                  <p className="text-xs text-sky-600/40 dark:text-sky-400/40 mt-1 max-w-[200px]">Ask me anything about your subjects to get started!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedHistory).map(([key, list]) => (
                  list.length > 0 && (
                    <div key={key} className="space-y-3">
                      <h4 className="font-[var(--font-syne)] font-black text-[10px] text-sky-600/40 dark:text-sky-400/40 uppercase tracking-[0.2em]">{key}</h4>
                      <div className="space-y-2">
                        {list.map(conv => (
                          <button
                            key={conv.id}
                            onClick={() => navigate(`/ai-tutor/chat/${conv.id}`, { state: { level } })}
                            className="w-full bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all text-left"
                          >
                            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-lg">
                              {conv.subjectEmoji || '🧬'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] truncate">
                                {conv.messages?.[0]?.text || 'New Conversation'}
                              </h5>
                              <p className="text-[10px] font-bold text-sky-600/30 dark:text-sky-400/30 uppercase tracking-tight mt-0.5">
                                {getTimeAgo(conv.createdAt)}
                              </p>
                            </div>
                            <ChevronRight size={16} className="text-sky-200" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BLOCK 6: INPUT BAR (PINNED ABOVE BOTTOM NAV) */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-[#F0F9FF]/80 dark:bg-[#080C14]/80 backdrop-blur-xl border-t border-sky-100 dark:border-sky-900/20 px-5 py-3 shadow-[0_-10px_30px_rgba(14,165,233,0.1)]">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3 bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/30 rounded-2xl px-4 py-3 shadow-xl shadow-sky-500/5">
            <input 
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="px-2 flex-1 bg-transparent outline-none font-[var(--font-jakarta)] text-sm text-[#0C4A6E] dark:text-[#F0F9FF] placeholder:text-sky-400/60"
            />
            <div className="flex items-center gap-3 pr-1">
              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sky-400 hover:text-sky-600 transition-colors"
                title="Upload Image"
              >
                <ImageIcon size={20} />
              </button>
              <button 
                onClick={() => navigate('/ai-tutor/camera')} 
                className="text-sky-400 hover:text-sky-600 transition-colors"
                title="Scan"
              >
                <Camera size={20} />
              </button>
              <button 
                onClick={() => navigate('/ai-tutor/voice/setup')} 
                className="text-sky-400 hover:text-sky-600 transition-colors"
                title="Voice"
              >
                <Mic size={20} />
              </button>
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              message.trim()
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 scale-100'
                : 'bg-sky-100 dark:bg-sky-900/20 text-sky-300 dark:text-sky-800 scale-95'
            }`}
          >
            <ArrowRight size={22} strokeWidth={3} />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
