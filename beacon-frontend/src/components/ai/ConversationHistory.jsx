import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Trash2 } from 'lucide-react';

export default function ConversationHistory() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const conversations = useMemo(() => {
    const list = JSON.parse(localStorage.getItem('conversations') || '[]');
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [refreshKey]);

  const deleteConversation = (id) => {
    const updated = conversations.filter(c => c.id !== id);
    localStorage.setItem('conversations', JSON.stringify(updated));
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="Conversation History" />

      <div className="px-5 pt-4 pb-10">
        {conversations.length === 0 && (
          <div className="text-sm text-sky-400 font-semibold">No saved conversations yet.</div>
        )}
        <div className="space-y-3">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-4 flex items-center gap-3"
            >
              <button
                onClick={() => navigate(`/ai-tutor/chat/${conv.id}`, {
                  state: { conversationId: conv.id, messages: conv.messages, subject: conv.subject }
                })}
                className="flex-1 text-left"
              >
                <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] truncate">
                  {conv.subject || 'General'}
                </h3>
                <p className="font-[var(--font-jakarta)] text-xs text-[#0369A1] dark:text-[#7DD3FC] truncate mt-1">
                  {conv.messages?.[conv.messages.length - 1]?.text || 'Conversation'}
                </p>
              </button>
              <button
                onClick={() => deleteConversation(conv.id)}
                className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 flex items-center justify-center hover:bg-sky-100 dark:hover:bg-sky-900/30"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
