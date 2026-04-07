import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, Users, Lock, CheckCircle2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Users as UsersAPI } from '../../services/api';

const OPTIONS = [
  {
    id: 'Everyone',
    icon: Eye,
    title: 'Everyone',
    desc: 'Your profile, badges, and streak are public. Anyone can find you.',
    recommended: true
  },
  {
    id: 'Friends Only',
    icon: Users,
    title: 'Friends Only',
    desc: 'Only your study buddies can see your full profile and activity.',
  },
  {
    id: 'Only Me',
    icon: Lock,
    title: 'Only Me',
    desc: 'Your profile is private. You won\'t appear on public leaderboards.',
  }
];

const BIO_VISIBILITY = [
  { id: 'public', title: 'Everyone', desc: 'Anyone viewing your profile can see your bio.' },
  { id: 'friends', title: 'Friends Only', desc: 'Only study buddies can see your bio.' },
  { id: 'private', title: 'Only Me', desc: 'Hide your bio from everyone else.' },
];

export default function ProfileVisibility() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('Everyone');
  const [bioVisibility, setBioVisibility] = useState('public');
  const [bioModerationStatus, setBioModerationStatus] = useState('approved');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await UsersAPI.getMe();
        if (cancelled) return;
        const data = res?.data || {};
        setBioVisibility((data.bio_visibility || 'public').toLowerCase());
        setBioModerationStatus((data.bio_moderation_status || 'approved').toLowerCase());
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await UsersAPI.updateMe({
        bio_visibility: bioVisibility,
        bio_moderation_status: bioModerationStatus,
      });
      toast.success('Visibility updated');
      navigate('/settings');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update visibility');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <div className="px-5 pt-6 flex items-center justify-between mb-8">
        <button onClick={() => navigate('/settings')} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Visibility</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        <p className="text-sm font-bold text-sky-600/60 dark:text-sky-400/60 mb-8 text-center leading-relaxed">
          Control who can see your profile and study activity on Beacon.
        </p>

        <div className="space-y-4 mb-12">
          {OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={`relative w-full text-left p-6 rounded-[2.5rem] border-2 transition-all duration-300 flex items-start gap-4 ${
                selected === opt.id 
                  ? 'border-sky-600 bg-white dark:bg-[#0D1525] shadow-xl shadow-sky-600/10 scale-[1.02]' 
                  : 'border-transparent bg-white dark:bg-[#0D1525] opacity-60'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${selected === opt.id ? 'bg-sky-600 text-white' : 'bg-sky-50 dark:bg-sky-900/20 text-sky-400'}`}>
                <opt.icon size={24} />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-['Syne'] font-black text-base text-[#0C4A6E] dark:text-[#F0F9FF]">{opt.id}</h3>
                  {selected === opt.id && <CheckCircle2 size={18} className="text-sky-600" />}
                </div>
                <p className="text-[11px] font-bold text-sky-600/80 dark:text-sky-400/80 leading-relaxed">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-['Syne'] font-black text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">Bio Visibility</h3>
              <p className="text-[11px] font-bold text-sky-500/80 dark:text-sky-400/80">
                Choose who can read your bio on your public profile.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {BIO_VISIBILITY.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setBioVisibility(opt.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  bioVisibility === opt.id
                    ? 'border-sky-600 bg-sky-50 dark:bg-sky-900/20'
                    : 'border-sky-100 dark:border-sky-900/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-[#0C4A6E] dark:text-[#F0F9FF]">{opt.title}</h4>
                  {bioVisibility === opt.id && <CheckCircle2 size={16} className="text-sky-600" />}
                </div>
                <p className="text-[11px] font-bold text-sky-500/80 dark:text-sky-400/80 mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-5 mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-['Syne'] font-black text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">Bio Moderation</h3>
              <p className="text-[11px] font-bold text-sky-500/80 dark:text-sky-400/80">
                Require review before your bio is shown to others.
              </p>
            </div>
            <button
              onClick={() => setBioModerationStatus(bioModerationStatus === 'approved' ? 'pending' : 'approved')}
              className={`w-12 h-6 rounded-full flex items-center p-1 transition-all ${
                bioModerationStatus === 'approved' ? 'bg-emerald-400 justify-end' : 'bg-sky-200 dark:bg-sky-900/40'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-sky-500/80 dark:text-sky-400/80">
            {bioModerationStatus === 'approved' ? (
              <>
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Bio is approved and visible (based on visibility setting).</span>
              </>
            ) : (
              <>
                <ShieldAlert size={14} className="text-amber-500" />
                <span>Bio is under review and hidden from others.</span>
              </>
            )}
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full py-5 bg-sky-600 text-white rounded-[2.5rem] font-[var(--font-syne)] font-black text-base shadow-xl shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Visibility'}
        </button>
      </div>
    </div>
  );
}
