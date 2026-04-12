import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Users, BookOpen, Layers, ShieldCheck, ArrowLeft } from 'lucide-react';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Community } from '../../services/api';

export default function CreateStudyRoom() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);

  const subjects = ['Math', 'Biology', 'Chemistry', 'Physics', 'English', 'History', 'General'];

  const handleCreate = async () => {
    if (!subject) {
      toast.error('Please select a subject');
      return;
    }
    setLoading(true);
    try {
      const res = await Community.createStudySession({
        subject,
        topic: topic || 'Collaborative Study',
        limit: parseInt(limit, 10),
      });
      toast.success('Room created successfully!');
      navigate(`/community/rooms/${res.data.id}`, { state: { session: res.data } });
    } catch (e) {
      toast.error(e?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader 
        title="Start Study Session" 
        leftAction={
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400">
            <ArrowLeft size={20} />
          </button>
        }
      />
      
      <div className="px-5 pt-6 pb-24 max-w-md mx-auto space-y-6">
        <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-6 border border-sky-100 dark:border-sky-900/20 shadow-sm space-y-6">
          
          <section className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-[#0C4A6E] dark:text-[#7DD3FC] uppercase tracking-wider">
              <BookOpen size={14} className="text-sky-500" /> Select Subject
            </label>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
              {subjects.map(s => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    subject === s 
                      ? 'bg-sky-700 text-white shadow-lg shadow-sky-100 dark:shadow-none' 
                      : 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 hover:bg-sky-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-[#0C4A6E] dark:text-[#7DD3FC] uppercase tracking-wider">
              <Layers size={14} className="text-sky-500" /> Room Topic
            </label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Solving Past Questions"
              className="w-full bg-sky-50/50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800/20 rounded-2xl px-4 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/20 transition-all text-[#0C4A6E] dark:text-[#F0F9FF]"
            />
          </section>

          <section className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-[#0C4A6E] dark:text-[#7DD3FC] uppercase tracking-wider">
              <Users size={14} className="text-sky-500" /> Participant Limit
            </label>
            <div className="flex gap-3">
              {[3, 5, 10, 20].map(val => (
                <button
                  key={val}
                  onClick={() => setLimit(val)}
                  className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${
                    limit === val 
                      ? 'bg-sky-50 border-sky-300 text-sky-700 dark:bg-sky-900/40 dark:border-sky-700 dark:text-sky-300' 
                      : 'bg-transparent border-sky-100 dark:border-sky-900/20 text-sky-400'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </section>

          <div className="pt-4">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-sky-700 text-white rounded-2xl py-4 font-[var(--font-syne)] font-bold text-base shadow-xl shadow-sky-100 dark:shadow-none hover:bg-sky-800 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck size={20} />
              {loading ? 'Starting Room...' : 'Start Study Session'}
            </button>
            <p className="text-[10px] text-sky-400 dark:text-sky-600 text-center mt-4">
              Everyone online will be able to see and join your room.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

