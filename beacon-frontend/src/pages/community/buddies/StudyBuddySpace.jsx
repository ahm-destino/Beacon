import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import SubScreenHeader from '../../../components/shared/SubScreenHeader';

export default function StudyBuddySpace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const buddy = location.state?.buddy || { id, name: 'Study Buddy', avatar: 'SB' };
  const avatar = buddy.avatar || buddy.img || 'SB';

  const [goals, setGoals] = useState([
    { id: 1, text: 'Complete 20 questions', completed: false },
    { id: 2, text: 'Review weak topics', completed: true },
  ]);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalText, setGoalText] = useState('');

  const toggleGoal = (goalId) => {
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, completed: !g.completed } : g));
  };

  const addGoal = () => {
    if (!goalText.trim()) return;
    setGoals(prev => [...prev, { id: Date.now(), text: goalText, completed: false, createdAt: Date.now() }]);
    setGoalText('');
    setShowGoalInput(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="Study Buddy" />
      <div className="px-5 pt-6 pb-24">
        <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5 mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-bold text-base">
            {avatar}
          </div>
          <div>
            <p className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9]">{buddy.name}</p>
            <p className="text-xs text-sky-500">Study Partner</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={() => navigate('/community/challenges/send', { state: { prefillFriend: { ...buddy, avatar } } })}
            className="w-full py-3 rounded-xl bg-sky-700 text-white font-[var(--font-syne)] font-bold"
          >
            Start Challenge
          </button>
          <button
            onClick={() => navigate(`/community/students/${buddy.id}`, { state: { student: buddy } })}
            className="w-full py-3 rounded-xl bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 font-[var(--font-syne)] font-bold"
          >
            View their profile
          </button>
          <button
            onClick={() => navigate('/practice/setup/exam-type', {
              state: { mode: 'practice', buddySession: true, buddyId: buddy.id }
            })}
            className="w-full py-3 rounded-xl bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 font-[var(--font-syne)] font-bold"
          >
            Practice Together
          </button>
          <button
            onClick={() => navigate('/ai-tutor/chat', {
              state: { buddyChat: true, buddy, initialMessage: '' }
            })}
            className="w-full py-3 rounded-xl bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 font-[var(--font-syne)] font-bold"
          >
            Send message / chat
          </button>
        </div>

        <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9]">Shared Goals</p>
            <button
              onClick={() => setShowGoalInput(true)}
              className="text-xs font-bold text-sky-600 hover:underline"
            >
              + Add Goal
            </button>
          </div>
          <div className="space-y-2">
            {goals.map(goal => (
              <label key={goal.id} className="flex items-center gap-2 text-sm text-sky-700">
                <input type="checkbox" checked={goal.completed} onChange={() => toggleGoal(goal.id)} />
                <span className={goal.completed ? 'line-through text-sky-400' : ''}>{goal.text}</span>
              </label>
            ))}
          </div>

          {showGoalInput && (
            <div className="mt-3">
              <input
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="New goal"
                className="w-full bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/20 rounded-xl px-3 py-2 text-sm"
              />
              <button
                onClick={addGoal}
                className="w-full mt-2 bg-sky-700 text-white rounded-xl py-2 text-sm font-bold"
              >
                Add Goal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
