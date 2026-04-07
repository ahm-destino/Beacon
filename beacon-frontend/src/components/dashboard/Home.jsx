import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, Star, Globe, ArrowRight, PlayCircle } from 'lucide-react';
import AppHeader from '../shared/AppHeader';
import BottomNav from '../shared/BottomNav';
import { Analytics, Onboarding, Streaks, Leaderboard, Practice, Users } from '../../services/api';

export default function Home() {
  const navigate = useNavigate();
  
  // ALL useState hooks at the top - before any conditional returns
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [weakAreas, setWeakAreas] = useState([]);
  const [weakLoading, setWeakLoading] = useState(true);
  
  // Dashboard data states
  const [user, setUser] = useState(null);
  const [streak, setStreak] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [stats, setStats] = useState(null);
  const [globalRank, setGlobalRank] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  // ALL useEffect hooks
  useEffect(() => {
    let mounted = true;
    let timeoutId;
    
    const loadAllData = async () => {
      // Watchdog: avoid infinite spinner if backend never responds
      timeoutId = setTimeout(() => {
        if (!mounted) return;
        setHasError(true);
        setErrorMessage('Dashboard check timed out. Please ensure the backend is running and try again.');
        setIsChecking(false);
      }, 12000);

      try {
        // First check onboarding status
        const statusRes = await Onboarding.getStatus();
        const statusData = statusRes?.data;
        
        if (statusRes?.error || !statusData) {
          localStorage.removeItem('beacon_token');
          navigate('/auth/signin', { replace: true });
          if (mounted) {
            setIsChecking(false);
          }
          return;
        }
        
        const userData = statusData?.data || {};
        
        if (mounted) {
          setUser(userData);
          setIsChecking(false);
          setHasError(false);
          setErrorMessage('');
        }

        // Then load dashboard data in parallel
        const [weakRes, streakRes, predictionRes, sessionsRes, leaderboardRes, userStatsRes] = await Promise.allSettled([
          Analytics.weakAreas(),
          Streaks.getMe(),
          Analytics.prediction(),
          Practice.getSessions(),
          Leaderboard.global(1, 1),
          Users.getStats()
        ]);

        if (!mounted) return;

        // Set weak areas
        if (weakRes.status === 'fulfilled') {
          const data = weakRes.value?.data || {};
          setWeakAreas(Array.isArray(data.weak_areas) ? data.weak_areas : []);
        }
        setWeakLoading(false);

        // Set streak data
        if (streakRes.status === 'fulfilled' && streakRes.value?.data) {
          setStreak(streakRes.value.data);
        }

        // Set prediction data
        if (predictionRes.status === 'fulfilled' && predictionRes.value?.data) {
          setPrediction(predictionRes.value.data);
        }

        let statsSet = false;
        if (userStatsRes.status === 'fulfilled' && userStatsRes.value?.data) {
          const data = userStatsRes.value.data;
          setStats({
            accuracy: data.overall_accuracy ?? 0,
            total_points: data.points_balance ?? 0,
            total_questions: data.total_questions_answered ?? 0,
            sessions_completed: data.sessions_completed ?? 0,
            daily_progress: data.daily_progress ?? 0,
            questions_done_today: data.questions_done_today ?? 0,
            daily_goal: data.daily_question_goal ?? data.daily_goal ?? 0,
            reviews_due: data.reviews_due ?? 0,
          });
          statsSet = true;
        }

        // Calculate stats from sessions
        if (sessionsRes.status === 'fulfilled') {
          const payload = sessionsRes.value?.data || {};
          const sessions = payload.sessions || payload.items || payload || [];
          const list = Array.isArray(sessions) ? sessions : [];
          const completedSessions = list.filter(s => (s.status || '').toLowerCase() === 'completed');
          const totalQuestions = completedSessions.reduce((sum, s) => sum + (s.total_questions || 0), 0);
          const correctAnswers = completedSessions.reduce((sum, s) => sum + (s.correct || 0), 0);
          const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

          if (!statsSet) {
            setStats({
              accuracy,
              total_points: 0,
              total_questions: totalQuestions,
              sessions_completed: completedSessions.length
            });
          }

          setRecentActivity(completedSessions.slice(0, 5));
        }

        // Set global rank
        if (leaderboardRes.status === 'fulfilled' && leaderboardRes.value?.data) {
          const leaderboardData = leaderboardRes.value.data;
          setGlobalRank(leaderboardData.user_rank || leaderboardData.rank || null);
        }

      } catch (e) {
        console.error('Dashboard load error:', e);
        if (e?.status === 401 || e?.status === 404) {
          localStorage.removeItem('beacon_token');
          navigate('/auth/signin', { replace: true });
          return;
        }
        if (mounted) {
          setHasError(true);
          setErrorMessage(e?.error || e?.message || 'Could not load dashboard. Please try again.');
          setIsChecking(false);
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };
    
    loadAllData();
    
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // ALL useMemo hooks
  const priorityAreas = useMemo(() => weakAreas.slice(0, 3), [weakAreas]);

  // NOW conditional returns after all hooks
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
          <p className="text-sky-600 dark:text-sky-400 text-sm">Checking...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center p-5">
        <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-6 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF] mb-2">Dashboard Error</h2>
          <p className="text-sm text-[#0369A1] dark:text-[#7DD3FC] mb-4">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl bg-[#0369A1] text-white font-bold text-sm"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Dynamic greeting based on time and user
  const hour = new Date().getHours();
  const displayName = user?.username || user?.full_name || 'Student';
  const userName = displayName.split(' ')[0] || 'Student';
  let greeting = `Good evening, ${userName} 🌙`;
  if (hour >= 5 && hour < 12) greeting = `Good morning, ${userName} ☀️`;
  else if (hour >= 12 && hour < 17) greeting = `Good afternoon, ${userName} 👋`;
  else if (hour >= 21 || hour < 5) greeting = `Studying late, ${userName} 🌙`;

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <AppHeader />

      <div className="max-w-md mx-auto px-5 pt-4 pb-24">
        
        {/* PERSONALIZED GREETING */}
        <div className="mb-5">
          <h1 className="font-[var(--font-syne)] font-black text-2xl text-[#0369A1] dark:text-[#0EA5E9] tracking-tight">{greeting}</h1>
          <p className="font-[var(--font-jakarta)] font-medium text-sm text-[#0369A1] dark:text-[#7DD3FC]">
            {user?.exam_date ? (
              (() => {
                const daysLeft = Math.ceil((new Date(user.exam_date) - new Date()) / (1000 * 60 * 60 * 24));
                if (daysLeft < 0) return 'Exam date has passed';
                if (daysLeft === 0) return 'Exam is today! Good luck! 🎉';
                return `${user.primary_exam || 'JAMB'} in ${daysLeft} days`;
              })()
            ) : (
              `Keep practicing for ${user?.primary_exam || 'JAMB'}!`
            )}
          </p>
          
          {hour >= 18 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 rounded-xl p-3 flex items-center gap-3 animate-in slide-in-from-top-4 mt-3">
              <span className="text-orange-500 text-lg">🔥</span>
              <div className="flex-1">
                <h3 className="font-[var(--font-syne)] font-bold text-sm text-orange-700 dark:text-orange-400">Night Owl Session</h3>
                <p className="text-xs text-orange-600 dark:text-orange-300">Complete 20 questions before bed</p>
              </div>
              <button className="bg-orange-500 text-white rounded-lg px-3 py-1.5 text-xs font-[var(--font-syne)] font-bold hover:bg-orange-600 active:scale-95 transition-all">Start</button>
            </div>
          )}
        </div>

        {/* STREAK CARD */}
        <Link to="/streak" className="block bg-gradient-to-br from-orange-500 to-amber-500 dark:from-orange-900/40 dark:to-amber-900/30 rounded-2xl p-5 mb-4 border border-transparent dark:border-orange-700/20 shadow-[0_8px_24px_rgba(249,115,22,0.25)] dark:shadow-none cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 focus:ring-2 focus:ring-orange-500/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-orange-100 dark:text-orange-300">Current Streak</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-['Plus_Jakarta_Sans'] text-5xl font-black text-white tracking-tighter">{streak?.current_streak || 0}</span>
                <span className="text-3xl">🔥</span>
              </div>
              <p className="text-xs text-orange-200 dark:text-orange-400 mt-1">Your best: {streak?.longest_streak || 0} days</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-white/30" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (streak?.current_streak || 0)) / 30} strokeLinecap="round" className="text-white" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-['Plus_Jakarta_Sans'] text-xs text-white font-bold">{streak?.current_streak || 0}/30</span>
                </div>
              </div>
              <p className="text-xs text-orange-100 mt-1">to Legend</p>
            </div>
          </div>
        </Link>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link to="/prediction" className="bg-white dark:bg-[#0D1525] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/20 shadow-[0_2px_8px_rgba(14,165,233,0.06)] dark:shadow-none hover:border-sky-300 dark:hover:border-sky-700/50 transition-all duration-200 active:scale-95 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center text-lg mb-3">📈</div>
            <div className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-[#0369A1] dark:text-[#0EA5E9]">{prediction?.predicted_score || prediction?.predictedScore || '--'}</div>
            <div className="text-xs text-[#0369A1] dark:text-[#7DD3FC] mt-1">Predicted JAMB</div>
          </Link>
          <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/20 shadow-[0_2px_8px_rgba(14,165,233,0.06)] dark:shadow-none hover:border-sky-300 dark:hover:border-sky-700/50 transition-all duration-200 active:scale-95 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center text-lg mb-3"><Target size={18} /></div>
            <div className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-[#0369A1] dark:text-[#0EA5E9]">{stats?.accuracy || 0}%</div>
            <div className="text-xs text-[#0369A1] dark:text-[#7DD3FC] mt-1">Accuracy</div>
          </div>
          <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/20 shadow-[0_2px_8px_rgba(14,165,233,0.06)] dark:shadow-none hover:border-sky-300 dark:hover:border-sky-700/50 transition-all duration-200 active:scale-95 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg mb-3"><Star size={18} /></div>
            <div className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-[#0369A1] dark:text-[#0EA5E9]">{stats?.total_points?.toLocaleString() || 0}</div>
            <div className="text-xs text-[#0369A1] dark:text-[#7DD3FC] mt-1">Total Points</div>
          </div>
          <Link to="/community/leaderboard" className="bg-white dark:bg-[#0D1525] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/20 shadow-[0_2px_8px_rgba(14,165,233,0.06)] dark:shadow-none hover:border-sky-300 dark:hover:border-sky-700/50 transition-all duration-200 active:scale-95 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center text-lg mb-3"><Globe size={18} /></div>
            <div className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-[#0369A1] dark:text-[#0EA5E9]">#{globalRank || '--'}</div>
            <div className="text-xs text-[#0369A1] dark:text-[#7DD3FC] mt-1">Global Rank</div>
          </Link>
        </div>

        {/* TODAY'S PLAN CARD */}
        <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9]">Today's Plan</h2>
            <button className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 transition-all duration-200">
              Edit <ArrowRight size={12} />
            </button>
          </div>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-3 bg-sky-100 dark:bg-sky-900/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full animate-pulse-slow"
                style={{ width: `${stats?.daily_progress || 0}%` }}
              ></div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-sky-600 dark:text-sky-400">
                {stats?.questions_done_today || 0} / {stats?.daily_goal || 45}
              </span>
              <span className="text-xs text-[#0369A1] dark:text-[#7DD3FC]">questions</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-lg px-2.5 py-1 text-xs font-semibold">
              {priorityAreas[0]?.subject || 'General'} — {priorityAreas[0]?.topic || 'Practice'}
            </span>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 rounded-xl p-3 mt-3 flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">🔁 {stats?.reviews_due || 0} reviews due today</span>
            <button 
              onClick={() => navigate('/practice/session', { state: { mode: 'Review', subject: 'Spaced Repetition' } })}
              className="bg-amber-500 text-white rounded-lg px-3 py-1.5 text-xs font-[var(--font-syne)] font-bold hover:bg-amber-600 active:scale-95 transition-all duration-200 focus:ring-2 focus:ring-amber-500/50"
            >
              Start Reviews
            </button>
          </div>

          <button 
            onClick={() => navigate('/practice/session', { state: { mode: 'Daily', subject: 'Unified JAMB Syllabus' } })}
            className="w-full bg-[#0369A1] dark:bg-[#0EA5E9] text-white rounded-xl py-3.5 font-[var(--font-syne)] font-bold text-sm hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] active:scale-[0.98] transition-all duration-200 focus:ring-2 focus:ring-sky-500/50 shadow-[0_4px_12px_rgba(3,105,161,0.2)] dark:shadow-none"
          >
            🚀 Start Today's Session
          </button>
        </div>

        {/* WEAK AREAS CARD */}
        <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-5 border border-sky-100 dark:border-sky-900/20 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9]">Weak Areas</h2>
            <Link to="/weak-areas" className="text-xs text-sky-600 dark:text-sky-400 hover:underline transition-all duration-200">
              Practice All →
            </Link>
          </div>

          <div className="space-y-3">
            {weakLoading ? (
              <div className="py-6 text-center opacity-70">Loading…</div>
            ) : priorityAreas.length === 0 ? (
              <div className="py-6 text-center opacity-70">No weak areas yet.</div>
            ) : priorityAreas.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider w-20 text-center">
                  {item.subject}
                </div>
                <div className="flex-1 h-2 bg-sky-100 dark:bg-sky-900/30 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${item.accuracy}%` }}></div>
                </div>
                <div className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-red-500 w-10 text-right">{item.accuracy}%</div>
                <button 
                  onClick={() => {
                    const examType = (localStorage.getItem('beacon_exam') || 'JAMB').toUpperCase();
                    navigate('/practice/generating', {
                      state: {
                        mode: 'practice',
                        practiceType: 'topic',
                        examType,
                        subject: item.subject,
                        topic: item.topic,
                        difficulty: 'Normal',
                        timer: 30 * 60,
                      },
                    });
                  }}
                  className="bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 w-8 h-8 flex justify-center items-center rounded-lg hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors"
                >
                  <PlayCircle size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK ACTIONS ROW */}
        <div className="flex gap-3 mb-4">
          <Link to="/ai-tutor" className="flex-1 bg-gradient-to-br from-sky-600 to-sky-700 dark:from-sky-800 dark:to-sky-900 dark:border dark:border-sky-700/20 rounded-2xl p-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:ring-2 focus:ring-sky-500/50">
            <div className="text-2xl mb-2 text-white">🤖</div>
            <h3 className="font-[var(--font-syne)] font-bold text-sm text-white">Ask AI</h3>
            <p className="text-xs text-sky-200 mt-0.5">24/7 help</p>
          </Link>
          <Link to="/practice/setup/exam-type" className="flex-1 bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:border-sky-300 dark:hover:border-sky-700/50 focus:ring-2 focus:ring-sky-500/50">
            <div className="text-2xl mb-2 text-amber-500">⚡</div>
            <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9]">Quick 10</h3>
            <p className="text-xs text-[#0369A1] dark:text-[#7DD3FC] mt-0.5">Fast session</p>
          </Link>
          <Link to="/community/leaderboard" className="flex-1 bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:border-sky-300 dark:hover:border-sky-700/50 focus:ring-2 focus:ring-sky-500/50">
            <div className="text-2xl mb-2 text-amber-500">🏆</div>
            <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9]">Ranking</h3>
            <p className="text-xs text-[#0369A1] dark:text-[#7DD3FC] mt-0.5">#{globalRank || '--'} globally</p>
          </Link>
        </div>

        {/* RECENT ACTIVITY FEED */}
        <div>
          <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {recentActivity.length === 0 ? (
              <div className="py-6 text-center opacity-70">No recent activity yet. Start practicing!</div>
            ) : (
              recentActivity.map((session, i) => {
                const sessionAccuracy = session.total_questions > 0 
                  ? Math.round((session.correct / session.total_questions) * 100) 
                  : 0;
                return (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-sky-50 dark:border-sky-900/20">
                    <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 flex items-center justify-center text-sm shrink-0">✅</div>
                    <div>
                      <h4 className="font-[var(--font-syne)] font-semibold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">
                        {session.subject || 'Practice'} session — {sessionAccuracy}%
                      </h4>
                      <p className="text-xs text-[#0369A1] dark:text-[#7DD3FC] mt-0.5">
                        {session.total_questions || 0} questions - {new Date(session.completed_at || session.started_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}

