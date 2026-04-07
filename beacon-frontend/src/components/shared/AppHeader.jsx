import React from 'react';
import { Bell, Search } from 'lucide-react';
import PointsBadge from './PointsBadge';
import NotificationDrawer from './NotificationDrawer';
import { Notifications } from '../../services/api';

export default function AppHeader() {
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await Notifications.list();
      const data = res?.data?.items || [];
      const count = data.filter(n => !n.is_read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  React.useEffect(() => {
    fetchUnreadCount();
  }, []);

  return (
    <div className="sticky top-0 z-40 h-14 bg-white/85 dark:bg-[rgba(14,165,233,0.08)]">
      <div className="flex items-center justify-between px-5 h-full max-w-md mx-auto">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="4" fill="white"/>
              <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-[var(--font-syne)] font-bold text-base tracking-tight text-[#0369A1] dark:text-[#0EA5E9]">BEACON</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <PointsBadge compact />
          <button className="w-9 h-9 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all duration-200 active:scale-95 focus:ring-2 focus:ring-sky-500/50">
            <Search size={20} />
          </button>
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all duration-200 active:scale-95 focus:ring-2 focus:ring-sky-500/50"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#080C14]"></span>}
          </button>
        </div>
      </div>
      
      <NotificationDrawer 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        onUnreadUpdate={setUnreadCount}
      />
    </div>
  );
}
