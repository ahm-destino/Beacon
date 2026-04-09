import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, Settings, Camera, ArrowRight, ThumbsUp, ThumbsDown, PlayCircle, Target, Bookmark, RotateCw } from 'lucide-react';
import api from '../../services/api';
import { buildCopyText } from '../shared/FormattedExplanation';
import FormattedExplanation from '../shared/FormattedExplanation';

export default function ActiveChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const {
    initialMessage,
    subject,
    autoSend,
    conversationId: stateConversationId,
    messages: existingMessages,
    questionContext,
    conceptContext,
    returnTo,
    returnState,
  } = location.state || {};

  const paramConversationId = params.conversationId || params.id;
  const initialConversationId = stateConversationId || paramConversationId || `temp_${Date.now()}`;
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [level, setLevel] = useState(location.state?.level || localStorage.getItem('ai_tutor_level') || 'normal');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState(existingMessages || []);
  const [copiedId, setCopiedId] = useState(null);
  const didInitRef = useRef(false);

  const showToast = (msg) => {
    if (typeof window !== 'undefined') {
      // No UI change required; log for now
      console.info(msg);
    }
  };

  useEffect(() => {
    if (!paramConversationId || existingMessages?.length) return;
    // Skip if ID is not a valid UUID (e.g., temp_ or timestamp IDs)
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paramConversationId);
    if (!isValidUUID) return;
    (async () => {
      try {
        const res = await api.get(`/api/ai-tutor/conversations/${paramConversationId}`);
        const data = res?.data || {};
        const backendMessages = (data.messages || []).map((m, idx) => ({
          id: m.id || `msg-${idx}`,
          sender: m.role === 'assistant' ? 'ai' : 'user',
          text: m.content,
          time: new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(backendMessages);
        setConversationId(data.id || paramConversationId);
      } catch (_) {
        const stored = JSON.parse(localStorage.getItem('conversations') || '[]');
        const match = stored.find(c => String(c.id) === String(paramConversationId));
        if (match?.messages?.length) {
          setMessages(match.messages);
          setConversationId(match.id);
        }
      }
    })();
  }, [paramConversationId, existingMessages]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    if (questionContext) {
      const contextMsg = `I got this question wrong and want to understand it:\n\n"${questionContext.text}"\n\nThe correct answer was: ${questionContext.correctAnswer}\n\nCan you explain why?`;
      handleSend(contextMsg, true);
      return;
    }

    if (conceptContext) {
      handleSend(`Explain ${conceptContext.name} at Level 2 with simple examples`, true);
      return;
    }

    if (initialMessage) {
      if (autoSend) {
        handleSend(initialMessage, true);
      } else {
        setInputText(initialMessage);
      }
    }
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    const idx = conversations.findIndex(c => String(c.id) === String(conversationId));
    const updated = {
      id: conversationId,
      subject: subject || 'General',
      messages,
      createdAt: idx >= 0 ? conversations[idx].createdAt : Date.now(),
    };
    if (idx >= 0) {
      conversations[idx] = updated;
    } else {
      conversations.unshift(updated);
    }
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [messages, conversationId, subject]);

  const handleSend = async (text, silent = false) => {
    if (!text.trim()) return;

    let activeConversationId = conversationId;
    if (!activeConversationId || String(activeConversationId).startsWith('temp_')) {
      try {
        const res = await api.post('/api/ai-tutor/conversations', {
          title: (text || 'New Conversation').slice(0, 60),
          subject: subject || resourceTopic || 'General',
          topic: conceptContext?.name || questionContext?.subject || null,
        });
        activeConversationId = res?.data?.id;
        setConversationId(activeConversationId);
      } catch (e) {
        window.alert(e?.error || 'Could not start conversation.');
        return;
      }
    }

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMessage]);
    if (!silent) setInputText('');

    setIsTyping(true);

    const streamingAiId = `${Date.now()}-ai`;
    setMessages((prev) => [
      ...prev,
      {
        id: streamingAiId,
        sender: 'ai',
        text: '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      await api.streamChat(
        activeConversationId,
        text,
        level,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === streamingAiId ? { ...m, text: `${m.text}${chunk}` } : m))
          );
        },
        () => {
          setIsTyping(false);
        }
      );
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingAiId
            ? { ...m, text: e?.error || 'AI response failed. Please try again.' }
            : m
        )
      );
      setIsTyping(false);
    }
  };

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo, { state: returnState });
      return;
    }
    navigate('/ai-tutor');
  };

  const saveFlashcard = (question, answer) => {
    const cards = JSON.parse(localStorage.getItem('flashcards') || '[]');
    cards.push({ question, answer, subject, createdAt: Date.now() });
    localStorage.setItem('flashcards', JSON.stringify(cards));
    showToast('Saved to flashcards!');
  };

  const addToReviews = (content) => {
    const reviews = JSON.parse(localStorage.getItem('reviewQueue') || '[]');
    reviews.push({ content, subject, dueDate: Date.now(), createdAt: Date.now() });
    localStorage.setItem('reviewQueue', JSON.stringify(reviews));
    showToast('Added to review queue!');
  };

  const handleCopySteps = async (msg) => {
    const { text } = buildCopyText(msg?.text || '');
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (_) {
      // best effort
    }
  };

  const resourceTopic = subject || questionContext?.subject || conceptContext?.name || 'General';

  const lastAiMessage = useMemo(() => {
    const reversed = [...messages].reverse();
    return reversed.find(m => m.sender === 'ai');
  }, [messages]);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] text-[#0C4A6E] dark:text-[#F0F9FF]">
      
      {/* HEADER OVERLAY */}
      <div className="sticky top-0 z-40 bg-white/85 dark:bg-[#080C14]/90 backdrop-blur-xl border-b border-sky-100 dark:border-sky-900/20 pt-4 pb-2 shadow-[0_4px_24px_rgba(14,165,233,0.08)] dark:shadow-none">
        <div className="flex items-center justify-between px-5 h-14 max-w-md mx-auto">
          <button 
            onClick={handleBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-all duration-200 active:scale-95 focus:ring-2 focus:ring-sky-500/50"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h1 className="flex-1 text-center font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9]">
            AI Tutor
          </h1>

          <button className="w-9 h-9 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all duration-200 active:scale-95 focus:ring-2 focus:ring-sky-500/50">
            <Settings size={20} />
          </button>
        </div>

        {/* LEVEL PILLS */}
        <div className="flex gap-2 px-5 py-2 max-w-md mx-auto">
          <button 
            onClick={() => setLevel('basic')}
            className={`flex-1 text-center rounded-xl py-2 border-2 font-[var(--font-jakarta)] text-[10px] font-bold cursor-pointer transition-all duration-200 active:scale-95 focus:ring-2 focus:ring-green-500/50
              ${level === 'basic' 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-green-200 dark:border-green-800/30 text-green-600 dark:text-green-400'}`}
          >
            🌱 BASIC
          </button>
          <button 
            onClick={() => setLevel('normal')}
            className={`flex-1 text-center rounded-xl py-2 border-2 font-[var(--font-jakarta)] text-[10px] font-bold cursor-pointer transition-all duration-200 active:scale-95 focus:ring-2 focus:ring-amber-500/50
              ${level === 'normal' 
                ? 'bg-amber-500 border-amber-500 text-white' 
                : 'border-amber-200 dark:border-amber-800/30 text-amber-600 dark:text-amber-400'}`}
          >
            ⚡ NORMAL
          </button>
          <button 
            onClick={() => setLevel('deep')}
            className={`flex-1 text-center rounded-xl py-2 border-2 font-[var(--font-jakarta)] text-[10px] font-bold cursor-pointer transition-all duration-200 active:scale-95 focus:ring-2 focus:ring-red-500/50
              ${level === 'deep' 
                ? 'bg-red-500 border-red-500 text-white' 
                : 'border-red-200 dark:border-red-800/30 text-red-500 dark:text-red-400'}`}
          >
            🔥 DEEP
          </button>
        </div>
      </div>

      {/* CHAT MESSAGES */}
      <div className="px-5 pt-4 pb-32 max-w-md mx-auto space-y-4">
        {messages.map((msg) => (
          msg.sender === 'user' ? (
            <div key={msg.id} className="max-w-[80%] ml-auto">
              <div className="bg-sky-700 dark:bg-sky-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 font-[var(--font-jakarta)] text-sm leading-relaxed shadow-sm">
                {msg.text}
              </div>
              <div className="text-[10px] text-sky-400 dark:text-sky-600 text-right mt-1">{msg.time}</div>
            </div>
          ) : (
            <div key={msg.id} className="max-w-[92%] mr-auto relative group">
              <div className="absolute -top-3 -left-3 w-7 h-7 rounded-lg bg-sky-600 dark:bg-sky-500 flex items-center justify-center text-white text-xs z-10 shadow-sm">
                🤖
              </div>
              <div className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 shadow-[0_2px_8px_rgba(14,165,233,0.06)] dark:shadow-none rounded-2xl rounded-tl-sm px-5 py-4">
                <div className="font-[var(--font-jakarta)] text-sm leading-[1.8] text-[#0C4A6E] dark:text-[#F0F9FF]">
                  <FormattedExplanation text={msg.text} />

                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => handleCopySteps(msg)}
                      className="text-[10px] font-bold uppercase tracking-widest text-sky-500 hover:text-sky-600"
                      title="Copy steps"
                    >
                      {copiedId === msg.id ? 'Copied' : 'Copy steps'}
                    </button>
                  </div>

                  {lastAiMessage?.id === msg.id && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-sky-50 dark:border-sky-900/20">
                      <button 
                        onClick={() => navigate('/practice/setup/exam-type', { state: { prefilledTopic: resourceTopic } })}
                        className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/30 text-sky-700 dark:text-sky-400 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-sky-100 flex items-center gap-1.5 transition-colors"
                      >
                        <Target size={14} /> 🎯 Practice This
                      </button>
                      <button 
                        onClick={() => navigate('/ai-tutor/concepts', { state: { searchQuery: resourceTopic } })}
                        className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/30 text-sky-700 dark:text-sky-400 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-sky-100 flex items-center gap-1.5 transition-colors"
                      >
                        <PlayCircle size={14} /> 📹 Watch Video
                      </button>
                      <button 
                        onClick={() => saveFlashcard(msg.text, 'Key concept explanation')}
                        className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/30 text-sky-700 dark:text-sky-400 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-sky-100 flex items-center gap-1.5 transition-colors"
                      >
                        <Bookmark size={14} /> 🔖 Save as Flashcard
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button className="text-sky-300 dark:text-sky-700 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"><ThumbsUp size={16} /></button>
                <button className="text-sky-300 dark:text-sky-700 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"><ThumbsDown size={16} /></button>
              </div>
            </div>
          )
        ))}

        {isTyping && (
          <div className="max-w-[92%] mr-auto relative">
            <div className="absolute -top-3 -left-3 w-7 h-7 rounded-lg bg-sky-600 dark:bg-sky-500 flex items-center justify-center text-white text-xs z-10 shadow-sm">
              🤖
            </div>
            <div className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 shadow-[0_2px_8px_rgba(14,165,233,0.06)] dark:shadow-none rounded-2xl rounded-tl-sm px-5 py-4 w-fit">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-sky-400 dark:bg-sky-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-sky-400 dark:bg-sky-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-sky-400 dark:bg-sky-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI TUTOR INPUT BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-[#080C14]/90 backdrop-blur-xl border-t border-sky-100 dark:border-sky-900/20 px-5 py-3 pb-6">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/30 rounded-2xl px-4 py-3 shadow-[0_2px_8px_rgba(14,165,233,0.05)] dark:shadow-none">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
              placeholder="Ask anything about your subjects..." 
              className="flex-1 bg-transparent outline-none font-[var(--font-jakarta)] text-sm text-[#0C4A6E] dark:text-[#F0F9FF] placeholder:text-sky-400 dark:placeholder:text-sky-600"
            />
            <button 
              onClick={() => navigate('/ai-tutor/camera', { state: { returnTo: '/ai-tutor/chat', returnState: location.state } })}
              className="text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors duration-200"
            >
              <Camera size={20} />
            </button>
          </div>
          <button 
            onClick={() => handleSend(inputText)}
            className="w-11 h-11 rounded-xl bg-sky-700 dark:bg-sky-500 text-white shadow-[0_4px_12px_rgba(3,105,161,0.3)] dark:shadow-none flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 focus:ring-2 focus:ring-sky-500/50"
          >
            <ArrowRight size={20} className="font-bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
