import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Users, Zap, Clock, ShieldCheck, Swords } from 'lucide-react';
import { Community } from '../../services/api';

export default function ChallengeLobby() {
  const navigate = useNavigate();
  const location = useLocation();
  const { challengeName, challengeId } = location.state || { challengeName: "Global Math Marathon" };
  
  const [players, setPlayers] = useState([
    { id: 1, name: "You", initial: "Y", color: "bg-sky-600", ready: true },
    { id: 2, name: "Chioma", initial: "C", color: "bg-amber-500", ready: false },
    { id: 3, name: "Ben", initial: "B", color: "bg-green-500", ready: true },
  ]);

  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    let cancelled = false;
    const poll = setInterval(async () => {
      if (!challengeId) return;
      try {
        const res = await Community.getChallenge(challengeId);
        const c = res?.data || {};
        if (cancelled) return;
        const challengerReady = c.challenger_progress > 0 || c.status === 'active';
        const opponentReady = c.opponent_progress > 0 || c.status === 'active';
        setPlayers((prev) => prev.map((p, idx) => {
          if (idx === 0) return { ...p, ready: challengerReady };
          if (idx === 1) return { ...p, ready: opponentReady };
          return p;
        }));
      } catch (_) {}
    }, 2500);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (challengeId) navigate(`/community/challenges/${challengeId}`);
          else navigate('/community/challenges/live', { state: { challengeName } });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      clearInterval(poll);
    };
  }, [challengeId, challengeName, navigate]);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] text-[#0C4A6E] dark:text-[#F0F9FF] flex flex-col">
      {/* HEADER */}
      <div className="px-5 py-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400">
          <X size={20} />
        </button>
        <div className="flex items-center gap-2 bg-sky-100 dark:bg-sky-900/30 px-3 py-1.5 rounded-full border border-sky-200 dark:border-sky-800/30">
          <Users size={14} className="text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-bold text-sky-700 dark:text-sky-300">Lobby ID: #234-AX7</span>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-5 flex flex-col items-center justify-center -mt-10">
        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg animate-pulse">
          <Zap size={48} fill="white" />
        </div>

        <h1 className="font-[var(--font-syne)] font-black text-2xl text-[#0369A1] dark:text-[#0EA5E9] text-center mb-2">
          {challengeName}
        </h1>
        <p className="text-sm text-[#0369A1] dark:text-[#7DD3FC] text-center mb-10 font-medium">
          Waiting for all players to join...
        </p>

        {/* PLAYERS LIST */}
        <div className="w-full space-y-3 mb-10">
          {players.map(player => (
            <div key={player.id} className="bg-white dark:bg-[#0D1525] p-4 rounded-2xl border border-sky-100 dark:border-sky-900/20 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${player.color} text-white flex items-center justify-center font-bold`}>
                  {player.initial}
                </div>
                <span className="font-[var(--font-syne)] font-bold text-sm">{player.name}</span>
              </div>
              {player.ready ? (
                <div className="flex items-center gap-1.5 text-green-500 font-bold text-[10px] uppercase tracking-wider bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg border border-green-100 dark:border-green-800/30">
                  <ShieldCheck size={12} /> Ready
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[10px] uppercase tracking-wider bg-sky-50 dark:bg-sky-900/20 px-2 py-1 rounded-lg border border-sky-100 dark:border-sky-900/20">
                  <Clock size={12} className="animate-spin" /> Waiting
                </div>
              )}
            </div>
          ))}
        </div>

        {/* COUNTDOWN */}
        <div className="text-center">
          <div className="font-['Plus_Jakarta_Sans'] text-6xl font-black text-sky-700 dark:text-sky-300 mb-2">
            {countdown}
          </div>
          <p className="text-xs font-bold text-sky-500 uppercase tracking-widest">Starting Duel</p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-5 pb-10 max-w-md mx-auto w-full">
        <button className="w-full bg-sky-700 dark:bg-sky-500 text-white rounded-2xl py-4 font-[var(--font-syne)] font-bold text-sm shadow-[0_8px_24px_rgba(3,105,161,0.3)] flex items-center justify-center gap-2 hover:bg-sky-600 transition-all active:scale-95">
          Invite Study Buddy <Users size={18} />
        </button>
      </div>
    </div>
  );
}
