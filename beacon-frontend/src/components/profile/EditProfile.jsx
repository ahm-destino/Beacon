import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronLeft, Save, X, Check, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Users } from '../../services/api';
import { toast } from 'sonner';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'
];

const EXAM_TYPES = ['JAMB', 'WAEC', 'NECO', 'JUPEB', 'Post-UTME'];

const UNIVERSITIES = [
  'University of Lagos (UNILAG)', 'University of Ibadan (UI)', 'Obafemi Awolowo University (OAU)',
  'University of Nigeria Nsukka (UNN)', 'Ahmadu Bello University (ABU)', 'University of Benin (UNIBEN)',
  'Lagos State University (LASU)', 'Covenant University', 'Babcock University'
];

function BottomSheet({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#0D1525] rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-sky-100 dark:bg-sky-900/30 rounded-full mx-auto mb-6" onClick={onClose} />
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">{title}</h3>
          <button onClick={onClose} className="p-2 bg-sky-50 dark:bg-sky-900/20 rounded-xl text-sky-400">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  
  const [showPhotoActions, setShowPhotoActions] = useState(false);
  const [showCropTool, setShowCropTool] = useState(false);
  const [showStateSheet, setShowStateSheet] = useState(false);
  const [showExamSheet, setShowExamSheet] = useState(false);
  const [showUniSheet, setShowUniSheet] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    state: '',
    school_name: '',
    bio: '',
    primary_exam: 'JAMB',
    exam_date: '',
    target_course: '',
    target_university: ''
  });

  // Load user data on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await Users.getMe();
        const user = res?.data;
        if (user) {
          setFormData({
            full_name: user.full_name || '',
            phone: user.phone || '',
            email: user.email || '',
            state: user.state || '',
            school_name: user.school_name || '',
            bio: user.bio || '',
            primary_exam: user.primary_exam || 'JAMB',
            exam_date: user.exam_date ? user.exam_date.slice(0, 7) : '',
            target_course: user.target_course || '',
            target_university: user.target_university || ''
          });
        }
      } catch (err) {
        toast.error('Failed to load profile');
      }
    };
    loadUser();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Map form data to API fields
      const updateData = {
        full_name: formData.full_name,
        phone: formData.phone,
        bio: formData.bio,
        state: formData.state,
        school_name: formData.school_name,
        primary_exam: formData.primary_exam,
        exam_date: formData.exam_date ? formData.exam_date + '-01' : null,
        target_course: formData.target_course,
        target_university: formData.target_university
      };
      
      await Users.updateMe(updateData);
      toast.success('Profile updated successfully!');
      setHasChanges(false);
      navigate('/settings');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      setShowDiscardDialog(true);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-32">
      <div className="px-5 pt-6 flex items-center justify-between mb-8">
        <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Edit Profile</h1>
        <div className="w-10" />
      </div>

      <div className="px-5">
        {/* AVATAR SECTION */}
        <div className="text-center mb-10">
          <div className="relative inline-block">
            <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-sky-400 to-sky-700 p-1 shadow-2xl shadow-sky-500/20">
              <div className="w-full h-full rounded-[2.3rem] bg-white dark:bg-[#0D1525] flex items-center justify-center overflow-hidden">
                <span className="text-3xl font-black text-sky-600">TO</span>
              </div>
            </div>
            <button 
              onClick={() => setShowPhotoActions(true)}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-sky-600 text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-[#F0F9FF] dark:border-[#080C14]"
            >
              <Camera size={18} />
            </button>
          </div>
        </div>

        {/* FORM FIELDS */}
        <div className="space-y-6">
          <div className="group">
            <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">Full Name</label>
            <input 
              type="text" 
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] outline-none focus:border-sky-600 transition-all shadow-sm"
              placeholder="Minimum 2 characters"
            />
          </div>

          <div className="group">
            <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">Phone Number</label>
            <div className="flex gap-3">
              <div className="px-4 py-4 bg-sky-50 dark:bg-sky-900/20 rounded-2xl text-sm font-black text-sky-600 flex items-center gap-2">
                🇳🇬 +234
              </div>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="flex-1 bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] outline-none focus:border-sky-600 transition-all shadow-sm"
                placeholder="801 234 5678"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">Email Address</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] outline-none focus:border-sky-600 transition-all shadow-sm"
            />
            <p className="text-[10px] text-sky-600/40 mt-2 ml-1 font-bold">Changing email requires verification</p>
          </div>

          <div className="group" onClick={() => setShowStateSheet(true)}>
            <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">State</label>
            <div className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] flex justify-between items-center shadow-sm">
              {formData.state}
              <ChevronLeft size={18} className="rotate-[270deg] text-sky-200" />
            </div>
          </div>

          <div className="group">
            <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">School Name (Optional)</label>
            <input 
              type="text" 
              value={formData.school_name}
              onChange={(e) => handleChange('school_name', e.target.value)}
              className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] outline-none focus:border-sky-600 transition-all shadow-sm"
            />
          </div>

          <div className="group">
            <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">Bio (Optional)</label>
            <textarea
              rows={4}
              maxLength={200}
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] outline-none focus:border-sky-600 transition-all shadow-sm resize-none"
              placeholder="Tell people a little about your goals or study style."
            />
            <p className="text-[10px] text-sky-600/40 mt-2 ml-1 font-bold">{formData.bio.length}/200</p>
          </div>

          <div className="group" onClick={() => setShowExamSheet(true)}>
            <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">Exam Type</label>
            <div className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] flex justify-between items-center shadow-sm">
              {formData.primary_exam}
              <ChevronLeft size={18} className="rotate-[270deg] text-sky-200" />
            </div>
          </div>

          <div className="group">
            <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">Exam Date</label>
            <input 
              type="month" 
              value={formData.exam_date}
              onChange={(e) => handleChange('exam_date', e.target.value)}
              className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] outline-none focus:border-sky-600 transition-all shadow-sm"
            />
          </div>

          <div className="group">
            <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">Target Course</label>
            <input 
              type="text" 
              value={formData.target_course}
              onChange={(e) => handleChange('target_course', e.target.value)}
              className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] outline-none focus:border-sky-600 transition-all shadow-sm"
              placeholder="e.g. Medicine, Engineering"
            />
          </div>

          <div className="group" onClick={() => setShowUniSheet(true)}>
            <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">Target University</label>
            <div className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] flex justify-between items-center shadow-sm">
              {formData.target_university}
              <ChevronLeft size={18} className="rotate-[270deg] text-sky-200" />
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="mt-12">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full py-5 bg-sky-600 text-white rounded-[2rem] font-[var(--font-syne)] font-black text-base shadow-xl shadow-sky-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* BOTTOM SHEETS */}
      <BottomSheet isOpen={showPhotoActions} onClose={() => setShowPhotoActions(false)} title="Profile Photo">
        <div className="space-y-3">
          <button 
            onClick={() => { setShowPhotoActions(false); setShowCropTool(true); }}
            className="w-full flex items-center gap-4 p-5 bg-sky-50 dark:bg-sky-900/20 rounded-2xl text-sky-600 font-bold"
          >
            <Camera size={20} /> [📷 Take Photo]
          </button>
          <button 
            onClick={() => { setShowPhotoActions(false); setShowCropTool(true); }}
            className="w-full flex items-center gap-4 p-5 bg-sky-50 dark:bg-sky-900/20 rounded-2xl text-sky-600 font-bold"
          >
            <X size={20} className="rotate-45" /> [🖼️ Choose from Gallery]
          </button>
          <button 
            onClick={() => setShowPhotoActions(false)}
            className="w-full flex items-center gap-4 p-5 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-600 font-bold"
          >
            <Trash2 size={20} /> [🗑️ Remove Photo]
          </button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showCropTool} onClose={() => setShowCropTool(false)} title="Crop Photo">
        <div className="flex flex-col items-center">
          <div className="w-48 h-48 rounded-full border-4 border-dashed border-sky-300 mb-8 flex items-center justify-center bg-sky-50">
            <span className="text-sky-300 font-bold">Crop Area</span>
          </div>
          <button 
            onClick={() => setShowCropTool(false)}
            className="w-full py-4 bg-sky-600 text-white rounded-2xl font-black"
          >
            Save
          </button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showStateSheet} onClose={() => setShowStateSheet(false)} title="Select State">
        <div className="grid grid-cols-1 gap-1">
          {NIGERIAN_STATES.map(state => (
            <button 
              key={state}
              onClick={() => { handleChange('state', state); setShowStateSheet(false); }}
              className={`w-full text-left p-4 rounded-xl font-bold transition-all ${
                formData.state === state ? 'bg-sky-600 text-white' : 'text-[#0C4A6E] dark:text-[#F0F9FF] hover:bg-sky-50'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showExamSheet} onClose={() => setShowExamSheet(false)} title="Exam Type">
        <div className="space-y-2">
          {EXAM_TYPES.map(type => (
            <button 
              key={type}
              onClick={() => handleChange('primary_exam', type)}
              className={`w-full flex items-center justify-between p-5 rounded-2xl font-black transition-all ${
                formData.primary_exam === type ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'bg-sky-50 dark:bg-sky-900/20 text-sky-400'
              }`}
            >
              {type}
              {formData.primary_exam === type && <Check size={20} />}
            </button>
          ))}
          <button 
            onClick={() => setShowExamSheet(false)}
            className="w-full mt-4 py-4 bg-[#0D1525] text-white rounded-2xl font-black"
          >
            Done
          </button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showUniSheet} onClose={() => setShowUniSheet(false)} title="Target University">
        <div className="space-y-1">
          {UNIVERSITIES.map(uni => (
            <button 
              key={uni}
              onClick={() => { handleChange('target_university', uni); setShowUniSheet(false); }}
              className={`w-full text-left p-4 rounded-xl font-bold transition-all ${
                formData.target_university === uni ? 'bg-sky-600 text-white' : 'text-[#0C4A6E] dark:text-[#F0F9FF] hover:bg-sky-50'
              }`}
            >
              {uni}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* DISCARD DIALOG */}
      {showDiscardDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="w-full max-w-xs bg-white dark:bg-[#0D1525] rounded-[2rem] p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="font-black text-lg mb-2 text-[#0C4A6E] dark:text-[#F0F9FF]">Discard Changes?</h3>
            <p className="text-xs text-sky-600/60 mb-6">You have unsaved changes. Are you sure you want to leave?</p>
            <div className="space-y-3">
              <button onClick={() => navigate(-1)} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm">Discard Changes</button>
              <button onClick={() => setShowDiscardDialog(false)} className="w-full py-4 bg-sky-50 dark:bg-sky-900/20 text-sky-600 rounded-2xl font-black text-sm">Keep Editing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
