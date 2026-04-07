import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Trophy } from 'lucide-react';
import { Community } from '../../services/api';

export default function Challenges() {
  const navigate = useNavigate();
  const location = useLocation();
  const { highlightChallengeId } = location.state || {};
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadChallenges = async () => {
    try {
      const res = await Community.listChallenges();
      setChallenges(Array.isArray(res?.data) ? res.data : []);
    } catch (_) {
      setChallenges([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  useEffect(() => {
    if (highlightChallengeId) {
      const el = document.getElementById(`challenge-${highlightChallengeId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightChallengeId, challenges]);

  const handleAccept = async (challenge) => {
    try {
      await Community.acceptChallenge(challenge.id);
      navigate(`/community/challenges/${challenge.id}`);
    } catch (e) {
      window.alert(e?.error || 'Could not accept challenge.');
    }
  };

  const handleDecline = async (challengeId) => {
    try {
      await Community.declineChallenge(challengeId);
      await loadChallenges();
    } catch (e) {
      window.alert(e?.error || 'Could not decline challenge.');
    }
  };

  const pending = challenges.filter(c => c.status === 'pending' && c.my_role === 'opponent');
  const active = challenges.filter(c => c.status === 'active');
  const past = challenges.filter(c => c.status === 'completed');

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <SubScreenHeader title="Challenges" rightAction={<Trophy size={20} className="text-yellow-500 fill-yellow-500" />} />

      <div className="px-5 pt-6 pb-24 space-y-6">
        {isLoading && (
          <div className="py-4 text-center text-sky-500/70">Loading challenges…</div>
        )}
        <button
          onClick={() => navigate('/community/challenges/send')}
          className="w-full py-3.5 rounded-xl font-[var(--font-syne)] font-bold text-base text-white bg-sky-700 dark:bg-sky-500 hover:bg-sky-800 transition-all"
        >
          Send a Challenge
        </button>

        {pending.length > 0 && (
          <div>
            <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-2">Pending</h3>
            <div className="space-y-3">
              {pending.map(challenge => (
                <div id={`challenge-${challenge.id}`} key={challenge.id} className="bg-white dark:bg-[#0D1525] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/20">
                  <p className="text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF]">{challenge.challenger?.name} challenged you</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleAccept(challenge)}
                      className="flex-1 bg-sky-700 text-white rounded-xl py-2 text-xs font-bold"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(challenge.id)}
                      className="flex-1 bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-600 rounded-xl py-2 text-xs font-bold"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {active.length > 0 && (
          <div>
            <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-2">Active</h3>
            <div className="space-y-3">
              {active.map(challenge => (
                <div id={`challenge-${challenge.id}`} key={challenge.id} className="bg-white dark:bg-[#0D1525] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/20">
                  <p className="text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF]">
                    {challenge.subject} vs {challenge.my_role === 'challenger' ? challenge.opponent?.name : challenge.challenger?.name}
                  </p>
                  <button
                    onClick={() => navigate(`/community/challenges/${challenge.id}`, {
                      state: { challenge },
                    })}
                    className="mt-3 w-full bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/20 text-sky-600 rounded-xl py-2 text-xs font-bold"
                  >
                    Continue
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-2">Completed</h3>
            <div className="space-y-3">
              {past.map(challenge => (
                <div id={`challenge-${challenge.id}`} key={challenge.id} className="bg-white dark:bg-[#0D1525] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/20">
                  <p className="text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF]">
                    {challenge.subject} vs {challenge.my_role === 'challenger' ? challenge.opponent?.name : challenge.challenger?.name}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/community/challenges/${challenge.id}/results`, { state: { challengeId: challenge.id, challenge } })}
                      className="flex-1 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/20 text-sky-600 rounded-xl py-2 text-xs font-bold"
                    >
                      View Results
                    </button>
                    <button
                      onClick={() => navigate('/community/challenges/send', { state: { prefillFriend: challenge.my_role === 'challenger' ? challenge.opponent : challenge.challenger } })}
                      className="flex-1 bg-sky-700 text-white rounded-xl py-2 text-xs font-bold"
                    >
                      Rematch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
