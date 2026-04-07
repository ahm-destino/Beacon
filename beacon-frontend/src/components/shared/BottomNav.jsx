import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Bot, Users, User } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  const hideOnRoutes = ['/practice/session', '/practice/exam', '/ai-tutor/chat', '/community/challenges/live'];
  const shouldHide = hideOnRoutes.some(r => path.startsWith(r));

  if (shouldHide) return null;

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/dashboard' },
    { id: 'practice', label: 'Practice', icon: BookOpen, path: '/practice' },
    { id: 'tutor', label: 'AI Tutor', icon: Bot, path: '/ai-tutor' },
    { id: 'community', label: 'Community', icon: Users, path: '/community' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-16 pb-safe bg-white/85 dark:bg-[#0D1525]/85 backdrop-blur-md border-t border-sky-100 dark:border-[rgba(14,165,233,0.1)] shadow-[0_-4px_20px_rgba(14,165,233,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="flex justify-around items-center h-full px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = path.startsWith(item.path);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 py-2 px-3 rounded-xl hover:opacity-90 active:scale-95 focus:ring-2 focus:ring-sky-400/40 ${
                isActive ? 'bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400' : 'text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:text-sky-600 dark:hover:text-sky-400'
              }`}
            >
              <Icon 
                className={`w-5 h-5 transition-all duration-200 ${
                  isActive ? 'text-sky-700 dark:text-sky-400' : ''
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-['Plus_Jakarta_Sans'] transition-all duration-200 ${
                isActive ? 'font-bold text-sky-700 dark:text-sky-400' : 'font-medium'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
