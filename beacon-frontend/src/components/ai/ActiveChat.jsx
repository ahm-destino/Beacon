import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, Settings, Camera, ArrowRight, ThumbsUp, ThumbsDown, PlayCircle, Target, Bookmark, X, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';
import { buildCopyText } from '../shared/FormattedExplanation';
import FormattedExplanation from '../shared/FormattedExplanation';
import { formatShortTime } from '../../utils/time';

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
    imageData: stateImageData,
    mimeType: stateMimeType,
  } = location.state || {};

  const paramConversationId = params.conversationId || params.id;
  const initialConversationId = stateConversationId || paramConversationId || `temp_${Date.now()}`;
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [level, setLevel] = useState(location.state?.level || localStorage.getItem('ai_tutor_level') || 'normal');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState(existingMessages || []);
  const [copiedId, setCopiedId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const didInitRef = useRef(false);

  const showToast = (msg) => {
    if (typeof window !== 'undefined') {
      console.info(msg);
    }
  };

  useEffect(() => {
    if (!paramConversationId || existingMessages?.length) return;
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paramConversationId);
    if (!isValidUUID) return;
    (async () => {
      try {
        const res = await api.get(`/api/ai-tutor/conversations/${paramConversationId}`);
        const data = res?.data || {};
        const backendMessages = (Array.isArray(data.messages) ? data.messages : []).map((m, idx) => ({
          id: m.id || `msg-${idx}`,
          sender: m.role === 'assistant' ? 'ai' : 'user',
          text: m.content,
          imageUrl: m.image_url,
          time: formatShortTime(m.created_at || Date.now()),
        }));
        setMessages(backendMessages);
        setConversationId(data.id || paramConversationId);
      } catch (err) {
        if (err?.status === 404) {
          // If conversation not found on server, check if we have it locally.
          const stored = JSON.parse(localStorage.getItem('conversations') || '[]');
          const match = stored.find(c => String(c.id) === String(paramConversationId));
          if (match?.messages?.length) {
            setMessages(match.messages);
            setConversationId(`temp_${Date.now()}`); // Degrade to temp so next message re-syncs
            showToast('Synchronizing history...');
          } else {
            setConversationId(`temp_${Date.now()}`);
            setMessages([]);
          }
        } else {
          const stored = JSON.parse(localStorage.getItem('conversations') || '[]');
          const match = stored.find(c => String(c.id) === String(paramConversationId));
          if (match?.messages?.length) {
            setMessages(match.messages);
            setConversationId(match.id);
          }
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

    if (initialMessage || stateImageData) {
      if (autoSend) {
        // If image present, we pass it to handleSend
        if (stateImageData) {
          setImagePreview(stateImageData);
          // mimeType is usually handled by imageFile.type in handleSend, 
          // so we set a temp file or update handleSend
        }
        handleSend(initialMessage || (stateImageData ? 'Analyze this image...' : ''), true, stateImageData, stateMimeType);
      } else {
        setInputText(initialMessage);
        if (stateImageData) {
          setImagePreview(stateImageData);
        }
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (text, silent = false, overrideImage = null, overrideMime = null) => {
    const currentImage = overrideImage || imagePreview;
    const currentMime = overrideMime || imageFile?.type || 'image/jpeg';

    if (!text.trim() && !currentImage) return;

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
      imageUrl: currentImage,
      time: formatShortTime(new Date()),
    };
    setMessages(prev => [...prev, userMessage]);
    if (!silent) setInputText('');
    setImagePreview(null);
    setImageFile(null);

    setIsTyping(true);

    const streamingAiId = `${Date.now()}-ai`;
    setMessages((prev) => [
      ...prev,
      {
        id: streamingAiId,
        sender: 'ai',
        text: '',
        time: formatShortTime(new Date()),
      },
    ]);

    try {
      await api.streamChat(
        activeConversationId,
        text,
        {
          explanationLevel: level,
          imageData: currentImage,
          mimeType: currentMime
        },
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
      if (e?.status === 404) {
        // Handle scenario where POST /messages returns 404
        setConversationId(`temp_${Date.now()}`);
        setMessages(prev => prev.filter(msg => msg.id !== streamingAiId));
        showToast('Session expired. Starting fresh turn...');
        // Optionally retry handleSend with temp ID:
        // handleSend(text, silent, overrideImage, overrideMime);
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingAiId
              ? { ...m, text: e?.error || 'AI response failed. Please try again.' }
              : m
          )
        );
      }
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

  const handleCopySteps = async (msg) => {
    const { text } = buildCopyText(msg?.text || '');
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (_) { }
  };

  const resourceTopic = subject || questionContext?.subject || conceptContext?.name || 'General';

  const lastAiMessage = useMemo(() => {
    const reversed = [...messages].reverse();
    return reversed.find(m => m.sender === 'ai');
  }, [messages]);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] text-[#0C4A6E] dark:text-[#F0F9FF]">
      
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white/85 dark:bg-[#080C14]/90 backdrop-blur-xl border-b border-sky-100 dark:border-sky-900/20 pt-4 pb-2 shadow-[0_4px_24px_rgba(14,165,233,0.08)]">
        <div className="flex items-center justify-between px-5 h-14 max-w-md mx-auto">
          <button 
            onClick={handleBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h1 className="flex-1 text-center font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9]">
            AI Tutor
          </h1>

          <button className="w-9 h-9 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Settings size={20} />
          </button>
        </div>

        {/* LEVEL PILLS */}
        <div className="flex gap-2 px-5 py-2 max-w-md mx-auto">
          {['basic', 'normal', 'deep'].map(l => (
            <button 
              key={l}
              onClick={() => setLevel(l)}
              className={`flex-1 text-center rounded-xl py-2 border-2 font-[var(--font-jakarta)] text-[10px] font-bold transition-all
                ${level === l 
                  ? (l === 'basic' ? 'bg-green-500 border-green-500 text-white' : l === 'normal' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-red-500 border-red-500 text-white')
                  : 'border-sky-100 dark:border-sky-800/20 text-sky-400'}`}
            >
              {l === 'basic' ? '🌱 BASIC' : l === 'normal' ? '⚡ NORMAL' : '🔥 DEEP'}
            </button>
          ))}
        </div>
      </div>

      {/* CHAT MESSAGES */}
      <div className="px-5 pt-4 pb-48 max-w-md mx-auto space-y-4">
        {messages.map((msg) => (
          msg.sender === 'user' ? (
            <div key={msg.id} className="max-w-[85%] ml-auto">
              <div className="bg-sky-700 dark:bg-sky-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Attached" className="w-full h-auto rounded-xl mb-3 border border-white/20" />
                )}
                <p className="font-[var(--font-jakarta)] text-sm leading-relaxed">{msg.text}</p>
              </div>
              <div className="text-[10px] text-sky-400 dark:text-sky-600 text-right mt-1">{msg.time}</div>
            </div>
          ) : (
            <div key={msg.id} className="max-w-[92%] mr-auto relative group">
              <div className="absolute -top-3 -left-3 w-7 h-7 rounded-lg bg-sky-600 dark:bg-sky-500 flex items-center justify-center text-white text-xs z-10">
                🤖
              </div>
              <div className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 shadow-sm rounded-2xl rounded-tl-sm px-5 py-4">
                <div className="font-[var(--font-jakarta)] text-sm leading-[1.8] text-[#0C4A6E] dark:text-[#F0F9FF]">
                  <FormattedExplanation text={msg.text} />

                  <div className="flex justify-end mt-3">
                    <button onClick={() => handleCopySteps(msg)} className="text-[10px] font-bold uppercase text-sky-500 hover:text-sky-600">
                      {copiedId === msg.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  {lastAiMessage?.id === msg.id && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-sky-50 dark:border-sky-900/20">
                      <button onClick={() => navigate('/practice/setup/exam-type', { state: { prefilledTopic: resourceTopic } })} className="bg-sky-50 dark:bg-sky-900/20 p-2 rounded-lg text-xs font-bold text-sky-700 flex items-center gap-1.5"><Target size={14} /> Practice</button>
                      <button onClick={() => navigate('/ai-tutor/concepts', { state: { searchQuery: resourceTopic } })} className="bg-sky-50 dark:bg-sky-900/20 p-2 rounded-lg text-xs font-bold text-sky-700 flex items-center gap-1.5"><PlayCircle size={14} /> Video</button>
                      <button onClick={() => saveFlashcard(msg.text, 'Concept')} className="bg-sky-50 dark:bg-sky-900/20 p-2 rounded-lg text-xs font-bold text-sky-700 flex items-center gap-1.5"><Bookmark size={14} /> Save</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ))}

        {isTyping && (
          <div className="max-w-[92%] mr-auto relative">
            <div className="absolute -top-3 -left-3 w-7 h-7 rounded-lg bg-sky-600 dark:bg-sky-500 flex items-center justify-center text-white text-xs z-10">🤖</div>
            <div className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 shadow-sm rounded-2xl p-4 w-fit">
              <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" /><div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce delay-150" /><div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce delay-300" /></div>
            </div>
          </div>
        )}
      </div>

      {/* INPUT BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-[#080C14]/90 backdrop-blur-xl border-t border-sky-100 dark:border-sky-900/20 px-5 py-3 pb-8">
        <div className="max-w-md mx-auto relative">
          {imagePreview && (
            <div className="absolute bottom-full left-0 mb-3 ml-2 group">
              <div className="relative border-4 border-white dark:border-[#0D1525] rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover" />
                <button 
                  onClick={() => { setImagePreview(null); setImageFile(null); }}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/30 rounded-2xl px-4 py-3">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
                placeholder="Ask anything..." 
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <button onClick={() => fileInputRef.current?.click()} className="text-sky-400 hover:text-sky-600"><ImageIcon size={20} /></button>
              <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileChange} />
            </div>
            <button 
              onClick={() => handleSend(inputText)}
              className="w-12 h-12 rounded-2xl bg-sky-700 dark:bg-sky-600 text-white flex items-center justify-center hover:scale-105 transition-transform"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
