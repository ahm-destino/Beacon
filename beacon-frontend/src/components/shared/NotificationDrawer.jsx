import React, { useEffect, useState } from 'react';
import { X, Bell, CheckCircle2, Trash2, Clock, Inbox, RefreshCw, ChevronRight } from 'lucide-react';
import { Notifications } from '../../services/api';

const NotificationDrawer = ({ isOpen, onClose, onUnreadUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await Notifications.list();
      const data = res?.data?.items || [];
      setNotifications(data);
      onUnreadUpdate?.(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await Notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      onUnreadUpdate?.(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await Notifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      const unread = notifications.filter(n => n.id !== id && !n.is_read).length;
      onUnreadUpdate?.(unread);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#080C14]/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div className="relative w-full max-w-sm bg-white dark:bg-[#0D1525] shadow-2xl h-full flex flex-col animate-in slide-in-from-right-full duration-500">
        {/* Header */}
        <div className="px-5 py-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="font-[var(--font-syne)] font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">Notifications</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Inbox Refresh</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Actions Bar */}
        {notifications.length > 0 && (
          <div className="px-5 py-3 bg-sky-50/50 dark:bg-sky-900/10 border-b border-sky-100 dark:border-sky-800/20 flex items-center justify-between">
            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-tighter">
              {notifications.filter(n => !n.is_read).length} Unread Alerts
            </span>
            <button 
              onClick={handleMarkAllRead}
              disabled={markingAll || !notifications.some(n => !n.is_read)}
              className="text-[10px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              {markingAll ? <RefreshCw className="animate-spin" size={10} /> : <CheckCircle2 size={10} />}
              Mark all as read
            </button>
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-2">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <RefreshCw className="animate-spin text-sky-500" size={32} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4">
                <Inbox size={32} className="text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-1">No Notifications</h3>
              <p className="text-xs text-slate-500 leading-relaxed">You're all caught up! Don't forget to maintain your daily study goal.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={`w-full text-left p-4 rounded-3xl transition-all relative group flex items-start gap-3 border ${
                  n.is_read 
                    ? 'bg-transparent border-transparent grayscale-[0.5] opacity-60' 
                    : 'bg-white dark:bg-[#0EA5E9]/5 border-sky-100 dark:border-sky-900/30 shadow-sm'
                }`}
              >
                {!n.is_read && <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 blink"></span>}
                
                <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center ${
                  n.is_read ? 'bg-slate-100 dark:bg-slate-800' : 'bg-sky-100 dark:bg-sky-900/30 text-sky-500'
                }`}>
                  <Bell size={18} />
                </div>
                
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] mb-1 line-clamp-1">{n.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">{n.message}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium font-[var(--font-jakarta)]">
                    <Clock size={10} />
                    {formatTime(n.created_at)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800/50">
          <button 
            onClick={onClose}
            className="w-full bg-[#0369A1] hover:bg-[#075985] text-white py-4 rounded-2xl font-[var(--font-syne)] font-bold transition-all active:scale-95 shadow-lg shadow-sky-500/20"
          >
            Great, Got It
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
