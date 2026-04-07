import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Send, Phone, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { Community, Users } from '../../services/api';

const initials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const formatLastSeen = (iso) => {
  if (!iso) return 'Last seen: Unknown';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'Last seen: Unknown';
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff < 60) return 'Last seen: Just now';
  if (diff < 3600) return `Last seen: ${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `Last seen: ${Math.floor(diff / 3600)}h ago`;
  return `Last seen: ${Math.floor(diff / 86400)}d ago`;
};

export default function BuddyChat() {
  const navigate = useNavigate();
  const [buddy, setBuddy] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [meId, setMeId] = useState(null);
  const [buddyTyping, setBuddyTyping] = useState(false);
  const [buddyLastSeen, setBuddyLastSeen] = useState(null);
  const typingTimerRef = useRef(null);
  const typingPingRef = useRef(null);

  const loadChat = async () => {
    setLoading(true);
    const [buddyRes, meRes, msgRes, typingRes] = await Promise.allSettled([
      Community.getBuddy(),
      Users.getMe(),
      Community.getBuddyMessages(),
      Community.getBuddyTyping(),
    ]);

    if (meRes.status === 'fulfilled') {
      setMeId(meRes.value?.data?.id || null);
    }

    if (buddyRes.status === 'fulfilled' && buddyRes.value?.data?.has_buddy) {
      const b = buddyRes.value.data.buddy || null;
      setBuddy(b);
      setBuddyLastSeen(b?.last_seen || null);
    } else {
      setBuddy(null);
    }

    if (msgRes.status === 'fulfilled') {
      setMessages(msgRes.value?.data?.messages || []);
    } else {
      setMessages([]);
    }

    if (typingRes.status === 'fulfilled') {
      setBuddyTyping(!!typingRes.value?.data?.is_typing);
      setBuddyLastSeen(typingRes.value?.data?.last_seen || null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadChat();
  }, []);

  useEffect(() => {
    if (!buddy?.id) return;
    const intervalId = setInterval(() => {
      Promise.all([
        Community.getBuddyMessages().then((res) => setMessages(res?.data?.messages || [])).catch(() => {}),
        Community.getBuddyTyping().then((res) => {
          setBuddyTyping(!!res?.data?.is_typing);
          if (res?.data?.last_seen) setBuddyLastSeen(res.data.last_seen);
        }).catch(() => {}),
      ]);
    }, 8000);
    return () => clearInterval(intervalId);
  }, [buddy?.id]);

  const statusLabel = useMemo(() => {
    if (buddyTyping) return 'Typing...';
    if (buddyLastSeen) {
      const diff = Math.floor((Date.now() - new Date(buddyLastSeen).getTime()) / 1000);
      if (diff < 120) return 'Online';
      return formatLastSeen(buddyLastSeen);
    }
    return 'Last seen: Unknown';
  }, [buddyTyping, buddyLastSeen]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !buddy) return;
    setSending(true);
    try {
      const res = await Community.sendBuddyMessage(trimmed);
      const msg = res?.data?.message;
      if (msg) {
        setMessages((prev) => [...prev, msg]);
      }
      setInputText('');
      Community.setBuddyTyping(false).catch(() => {});
    } catch (err) {
      toast.error(err?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value) => {
    setInputText(value);
    if (!buddy) return;

    if (!typingPingRef.current) {
      Community.setBuddyTyping(true).catch(() => {});
      typingPingRef.current = setInterval(() => {
        Community.setBuddyTyping(true).catch(() => {});
      }, 4000);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      Community.setBuddyTyping(false).catch(() => {});
      if (typingPingRef.current) {
        clearInterval(typingPingRef.current);
        typingPingRef.current = null;
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (typingPingRef.current) clearInterval(typingPingRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center">
        <p className="text-sm text-sky-600 dark:text-sky-400">Loading chat…</p>
      </div>
    );
  }

  if (!buddy) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
        <div className="sticky top-0 z-40 bg-white/85 dark:bg-[#080C14]/90 backdrop-blur-xl border-b border-sky-100 dark:border-sky-900/20 pt-4 pb-2">
          <div className="flex items-center gap-3 px-5 h-14 max-w-md mx-auto">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400">
              <ChevronLeft size={20} />
            </button>
            <div className="text-sm font-bold text-sky-700 dark:text-sky-300">Buddy Chat</div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-5 text-center text-sky-500">
          No active buddy yet. Find one to start chatting.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white/85 dark:bg-[#080C14]/90 backdrop-blur-xl border-b border-sky-100 dark:border-sky-900/20 pt-4 pb-2">
        <div className="flex items-center gap-3 px-5 h-14 max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400">
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm relative overflow-hidden">
              {buddy.profile_photo_url ? (
                <img src={buddy.profile_photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                initials(buddy.full_name)
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#080C14]"></div>
            </div>
            <div>
              <h2 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] leading-tight">{buddy.full_name}</h2>
              <p className="text-[10px] text-sky-500 font-bold uppercase tracking-wider">{statusLabel}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all">
              <Phone size={18} />
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 px-5 pt-6 pb-24 max-w-md mx-auto w-full space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-sky-500/70 text-sm">Say hi to your buddy!</div>
        ) : (
          messages.map((msg) => {
            const mine = meId && msg.sender_id === meId;
            return (
              <div key={msg.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm text-sm font-[var(--font-jakarta)] leading-relaxed
                  ${mine
                    ? 'bg-sky-700 dark:bg-sky-600 text-white rounded-tr-sm'
                    : 'bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-[#0C4A6E] dark:text-[#F0F9FF] rounded-tl-sm'}`}
                >
                  {msg.body}
                </div>
                <span className="text-[10px] text-sky-400 dark:text-sky-600 mt-1">
                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* INPUT BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-[#080C14]/90 backdrop-blur-xl border-t border-sky-100 dark:border-sky-900/20 px-5 py-3 pb-8">
        <div className="max-w-md mx-auto bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/30 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[0_2px_8px_rgba(14,165,233,0.05)]">
          <button className="text-sky-400 hover:text-sky-600 transition-colors">
            <Smile size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none font-[var(--font-jakarta)] text-sm text-[#0C4A6E] dark:text-[#F0F9FF] placeholder:text-sky-400 dark:placeholder:text-sky-600"
          />
          <button className="text-sky-400 hover:text-sky-600 transition-colors">
            <Paperclip size={20} />
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95
              ${inputText.trim() ? 'bg-sky-700 dark:bg-sky-500 text-white' : 'text-sky-300 dark:text-sky-700'} ${sending ? 'opacity-70' : ''}`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
