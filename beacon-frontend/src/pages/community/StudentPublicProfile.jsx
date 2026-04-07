import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import SubScreenHeader from '../../components/shared/SubScreenHeader';
import BottomNav from '../../components/shared/BottomNav';
import { Community } from '../../services/api';

const initials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const mapApiToProfile = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    name: data.full_name,
    avatar: initials(data.full_name),
    photo: data.profile_photo_url,
    bio: data.bio,
    bioStatus: data.bio_status,
    bioVisibility: data.bio_visibility,
    school: data.school_name,
    state: data.state,
    streak: data.streak || 0,
    accuracy: data.accuracy || 0,
    rank: data.rank || 0,
    points: data.points || 0,
    badges: data.badges || [],
    subjects: data.subjects || [],
    exam: data.primary_exam || 'Exam',
  };
};

export default function StudentPublicProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { student, showCongrats } = location.state || {};
  const [profile, setProfile] = useState(student || null);
  const [loading, setLoading] = useState(!student);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await Community.getStudent(id);
        if (cancelled) return;
        const mapped = mapApiToProfile(res?.data);
        setProfile(mapped || null);
      } catch (_) {
        if (!cancelled && !student) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const displayProfile = useMemo(() => {
    if (profile) return profile;
    return {
      id,
      name: 'Student',
      avatar: 'ST',
      bio: '',
      bioStatus: 'empty',
      bioVisibility: 'public',
      school: 'School',
      state: 'State',
      streak: 0,
      accuracy: 0,
      rank: 0,
      points: 0,
      badges: ['🔥', '💪', '⚡'],
      subjects: [],
      exam: 'Exam',
    };
  }, [profile, id]);

  const badges = displayProfile.badges || ['🔥', '💪', '⚡'];
  const isBuddy = false;
  const bioLimit = 200;
  const bioLength = (displayProfile.bio || '').length;
  const bioStatus = displayProfile.bioStatus || 'empty';
  const bioMessage = displayProfile.bio
    ? displayProfile.bio
    : bioStatus === 'pending'
      ? 'Bio is under review.'
      : bioStatus === 'flagged'
        ? 'Bio has been hidden for moderation.'
        : bioStatus === 'friends_only'
          ? 'Bio is visible to study buddies only.'
          : bioStatus === 'private'
            ? 'Bio is private.'
            : 'No bio yet.';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center">
        <p className="text-sm text-sky-600 dark:text-sky-400">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="Profile" />

      <div className="px-5 pt-6 pb-24">
        <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-6 mb-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 overflow-hidden">
            {displayProfile.photo ? (
              <img src={displayProfile.photo} alt="" className="w-full h-full object-cover" />
            ) : (
              displayProfile.avatar
            )}
          </div>
          <h1 className="font-['Syne'] font-black text-2xl text-sky-900 dark:text-sky-50 mb-1">
            {displayProfile.name}
          </h1>
          <p className="font-['Plus_Jakarta_Sans'] text-sm text-sky-500 mb-3">
            {displayProfile.school} · {displayProfile.state}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-full px-3 py-1 text-xs font-semibold font-['Plus_Jakarta_Sans']">
              {displayProfile.exam}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-5 mb-4">
          <p className="font-['Syne'] font-bold text-sm text-sky-900 dark:text-sky-100 mb-2">
            Bio
          </p>
          <p className="font-['Plus_Jakarta_Sans'] text-sm text-sky-600 dark:text-sky-300 leading-relaxed">
            {bioMessage}
          </p>
          {displayProfile.bio && (
            <p className="text-[10px] text-sky-500 mt-2 font-bold text-right">
              {bioLength}/{bioLimit}
            </p>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { icon: '🔥', value: displayProfile.streak, label: 'Streak' },
            { icon: '🎯', value: `${displayProfile.accuracy}%`, label: 'Accuracy' },
            { icon: '⭐', value: displayProfile.points?.toLocaleString?.() || displayProfile.points, label: 'Points' },
            { icon: '🏅', value: `#${displayProfile.rank}`, label: 'Rank' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-xl p-3 text-center">
              <p className="font-['Plus_Jakarta_Sans'] font-black text-lg text-sky-800 dark:text-sky-200">
                {stat.value}
              </p>
              <p className="font-['Plus_Jakarta_Sans'] text-[10px] text-sky-400 mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-5 mb-4">
          <p className="font-['Syne'] font-bold text-sm text-sky-900 dark:text-sky-100 mb-3">
            Recent Badges
          </p>
          <div className="flex gap-3">
            {badges.length ? badges.map((badge, i) => (
              <div key={i} className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/20 flex items-center justify-center text-2xl">
                {badge}
              </div>
            )) : (
              <div className="text-xs text-sky-500">No badges yet.</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/community/challenges/send', {
              state: { prefillFriend: displayProfile },
            })}
            className="w-full py-3.5 rounded-xl font-['Syne'] font-bold text-base text-white bg-sky-700 dark:bg-sky-500 hover:bg-sky-800 active:scale-[0.98] transition-all duration-200"
          >
            ⚔️ Challenge {displayProfile.name.split(' ')[0]}
          </button>

          {!isBuddy && (
            <button
              onClick={() => navigate('/community/buddies/find')}
              className="w-full py-3.5 rounded-xl font-['Syne'] font-bold text-base text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/30 hover:bg-sky-100 active:scale-[0.98] transition-all"
            >
              👥 Add as Study Buddy
            </button>
          )}

          <button
            onClick={() => navigate('/community/leaderboard', {
              state: { highlightUserId: displayProfile.id },
            })}
            className="w-full py-3 rounded-xl font-['Plus_Jakarta_Sans'] font-semibold text-sm text-sky-600 dark:text-sky-400 hover:underline"
          >
            View on Leaderboard
          </button>
        </div>

        {showCongrats && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-5">
            <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-8 text-center w-full max-w-sm">
              <p className="text-5xl mb-4">🎉</p>
              <h2 className="font-['Syne'] font-black text-2xl text-sky-900 dark:text-sky-50 mb-2">
                Say Congrats!
              </h2>
              <p className="font-['Plus_Jakarta_Sans'] text-sm text-sky-500 mb-6">
                {displayProfile.name} just earned a new badge!
              </p>
              <button
                onClick={() => navigate(-1)}
                className="w-full py-3 rounded-xl bg-sky-700 text-white font-['Syne'] font-bold mb-3"
              >
                🎉 Congrats {displayProfile.name.split(' ')[0]}!
              </button>
              <button
                onClick={() => navigate(-1)}
                className="font-['Plus_Jakarta_Sans'] text-sm text-sky-400"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
