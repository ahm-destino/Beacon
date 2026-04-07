import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';
import { Star, Clock, CheckCircle, MessageCircle, Calendar, Video, Award, BookOpen, Bookmark } from 'lucide-react';
import { Community } from '../../services/api';
import { toast } from 'sonner';

export default function TutorProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [tutor, setTutor] = useState(location.state?.tutor || null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('About');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await Community.getTutor(id);
        if (cancelled) return;
        const data = res?.data || {};
        setTutor(data.tutor || null);
        setReviews(data.reviews || []);
      } catch (_) {
        if (!cancelled) toast.error('Failed to load tutor profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const displayName = tutor?.full_name || tutor?.name || 'Tutor';
  const verified = ['verified', 'trusted', 'elite'].includes((tutor?.verification_level || '').toLowerCase()) || tutor?.verified;
  const price = tutor?.hourly_rate ? `₦${Number(tutor.hourly_rate).toLocaleString()}/hr` : (tutor?.price || 'Negotiable');
  const subjects = tutor?.subjects || [];
  const initials = useMemo(() => {
    if (!displayName) return 'TU';
    return displayName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }, [displayName]);
  const ratingValue = Number(tutor?.average_rating || tutor?.rating || 0);
  const reviewCount = Number(tutor?.total_reviews || tutor?.reviews || 0);

  const saveTutor = () => {
    const saved = JSON.parse(localStorage.getItem('savedTutors') || '[]');
    if (!tutor) return;
    if (!saved.find(t => String(t.id) === String(tutor.id))) {
      saved.push({
        id: tutor.id,
        full_name: displayName,
        bio: tutor.bio,
        subjects,
        hourly_rate: tutor.hourly_rate,
        verification_level: tutor.verification_level,
        profile_photo: tutor.profile_photo,
        average_rating: ratingValue,
        total_reviews: reviewCount,
      });
      localStorage.setItem('savedTutors', JSON.stringify(saved));
    }
  };

  const submitRating = async () => {
    if (!tutor) return;
    if (!rating) {
      toast.error('Select a rating');
      return;
    }
    setSubmitting(true);
    try {
      await Community.rateTutor(tutor.id, { rating, comment });
      const res = await Community.getTutor(tutor.id);
      setTutor(res?.data?.tutor || tutor);
      setReviews(res?.data?.reviews || []);
      setComment('');
      toast.success('Rating submitted');
    } catch (_) {
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !tutor) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center">
        <p className="text-sm text-sky-500">Loading tutor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader 
        title="Tutor Profile" 
        rightAction={<button onClick={saveTutor}><Bookmark size={20} className="text-sky-600 dark:text-sky-400" /></button>} 
      />

      <div className="bg-white dark:bg-[#0D1525] pb-6 rounded-b-3xl shadow-sm border-b border-sky-100 dark:border-sky-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100 dark:bg-sky-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 dark:bg-indigo-900/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="pt-6 px-5 flex flex-col items-center text-center relative z-10">
          <div className="relative mb-4">
            {tutor?.profile_photo ? (
              <img
                src={tutor.profile_photo}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-[#0D1525]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg ring-4 ring-white dark:ring-[#0D1525]">
                {initials}
              </div>
            )}
            {verified && (
              <div className="absolute bottom-0 right-0 bg-white dark:bg-[#0D1525] rounded-full p-1 shadow-md">
                <CheckCircle size={20} className="text-sky-500 fill-sky-500" />
              </div>
            )}
          </div>
          
          <h1 className="font-[var(--font-syne)] font-bold text-2xl text-[#0C4A6E] dark:text-[#F0F9FF] mb-1">{displayName}</h1>
          <p className="text-sm text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 mb-4">{tutor?.bio || 'Experienced tutor'}</p>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex flex-col items-center">
              <span className="font-[var(--font-syne)] font-bold text-lg text-[#0369A1] dark:text-[#0EA5E9] flex items-center gap-1">
                {ratingValue.toFixed(1)} <Star size={16} className="text-yellow-500 fill-yellow-500" />
              </span>
              <span className="text-[10px] text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 uppercase tracking-widest font-bold">{reviewCount} Reviews</span>
            </div>
            <div className="w-px h-8 bg-sky-100 dark:bg-sky-900/30" />
            <div className="flex flex-col items-center">
              <span className="font-[var(--font-syne)] font-bold text-lg text-[#0369A1] dark:text-[#0EA5E9]">{price}</span>
              <span className="text-[10px] text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60 uppercase tracking-widest font-bold">Per Hour</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {subjects.map(sub => (
              <span key={sub} className="bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 text-xs font-semibold px-3 py-1 rounded-lg border border-sky-100 dark:border-sky-800/30">
                {sub}
              </span>
            ))}
          </div>

          <div className="flex gap-3 w-full">
            <button className="flex-1 bg-[#0369A1] dark:bg-[#0EA5E9] text-white rounded-xl py-3.5 font-[var(--font-syne)] font-bold text-sm hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] active:scale-[0.98] transition-all duration-200 shadow-md flex items-center justify-center gap-2">
              <Calendar size={18} /> Book Session
            </button>
            <button className="w-14 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-xl flex items-center justify-center hover:bg-sky-200 dark:hover:bg-sky-900/50 active:scale-[0.98] transition-all duration-200">
              <MessageCircle size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 mb-6">
        <div className="flex bg-white dark:bg-[#0D1525] rounded-xl p-1 shadow-sm border border-sky-100 dark:border-sky-900/20">
          {['About', 'Reviews', 'Availability'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-[var(--font-syne)] font-bold rounded-lg transition-all duration-200 ${
                activeTab === tab 
                  ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 shadow-sm' 
                  : 'text-sky-400 dark:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'About' && (
        <div className="px-5 space-y-6 pb-8">
          <div>
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-3">Bio</h2>
            <p className="text-sm text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80 leading-relaxed">
              {tutor?.bio || `Hi! I'm ${displayName}. I focus on making complex concepts intuitive and help you build problem-solving skills.`}
            </p>
          </div>

          <div>
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-3">Education & Verify</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Award size={16} />
                </div>
                <div>
                  <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">Verified Tutor <CheckCircle size={12} className="inline text-green-500" /></h3>
                  <p className="text-xs text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60">Experienced and vetted</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF]">Specialties</h3>
                  <p className="text-xs text-[#0C4A6E]/60 dark:text-[#F0F9FF]/60">{subjects.join(', ') || 'General tutoring'}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-[var(--font-syne)] font-bold text-base text-[#0369A1] dark:text-[#0EA5E9] mb-3">Session Details</h2>
            <div className="bg-white dark:bg-[#0D1525] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/20 shadow-sm space-y-3">
              <div className="flex items-center gap-3 text-sm text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80">
                <Video size={18} className="text-sky-500" /> Online via Zoom / Google Meet
              </div>
              <div className="flex items-center gap-3 text-sm text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80">
                <Clock size={18} className="text-sky-500" /> 60-minute sessions
              </div>
              <div className="flex items-center gap-3 text-sm text-[#0C4A6E]/80 dark:text-[#F0F9FF]/80">
                <MessageCircle size={18} className="text-sky-500" /> Free 15-min consultation
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Reviews' && (
        <div className="px-5 space-y-6 pb-10">
          <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-4 space-y-3">
            <p className="text-sm font-bold text-[#0369A1] dark:text-[#0EA5E9]">Rate this tutor</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => setRating(val)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    rating >= val ? 'bg-amber-400 text-white border-amber-400' : 'border-sky-200 text-sky-400'
                  }`}
                >
                  <Star size={14} className={rating >= val ? 'fill-white' : ''} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full h-24 rounded-xl border border-sky-100 dark:border-sky-900/20 p-3 text-sm bg-white dark:bg-[#0D1525]"
              placeholder="Leave a quick review (optional)"
            />
            <button
              onClick={submitRating}
              disabled={submitting}
              className="w-full bg-sky-700 dark:bg-sky-600 text-white py-3 rounded-xl font-[var(--font-syne)] font-bold disabled:opacity-60"
            >
              Submit Rating
            </button>
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-sky-500">No reviews yet.</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">
                    {rev.user?.full_name || 'Student'}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                    <Star size={12} className="fill-amber-400 text-amber-400" /> {rev.rating}
                  </div>
                </div>
                {rev.comment && (
                  <p className="text-xs text-sky-600/80 dark:text-sky-400/80 mt-2">{rev.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Availability' && (
        <div className="px-5 space-y-4 pb-10">
          <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-4 space-y-2 text-sm text-sky-700 dark:text-sky-300">
            <p><strong>Mode:</strong> {(tutor?.mode || []).join(', ') || 'Online'}</p>
            <p><strong>Location:</strong> {tutor?.location || tutor?.state || 'Not specified'}</p>
            <p><strong>Contact:</strong> {tutor?.whatsapp || tutor?.phone || 'Available after booking'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
