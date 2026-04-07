import React, { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bug, Camera, Send, X, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  'App Bug (Visual/UI)',
  'AI Tutor Error',
  'Practice Question Error',
  'Payment/Subscription Issue',
  'Performance/Lag',
  'Other'
];

export default function ReportBug() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    screenshot: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    toast.success("Bug report submitted! Thank you for helping us improve Beacon ✓");
    navigate('/settings');
  };

  const isFormValid = formData.title && formData.category && formData.description;

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <div className="px-5 pt-6 flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Report a Bug</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="px-5 max-w-md mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-[2rem] bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto mb-4 text-rose-600">
            <Bug size={32} />
          </div>
          <p className="text-sm text-rose-600/60 leading-relaxed font-bold">
            Found something broken? Let us know and we'll fix it as fast as possible.
          </p>
        </div>

        <div className="space-y-6">
           <div className="group">
              <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">Subject</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] outline-none focus:border-sky-600 transition-all shadow-sm"
                placeholder="Briefly describe the issue"
              />
           </div>

           <div className="group">
              <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] outline-none focus:border-sky-600 transition-all shadow-sm appearance-none"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
           </div>

           <div className="group">
              <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">Description</label>
              <textarea 
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] outline-none focus:border-sky-600 transition-all shadow-sm resize-none"
                placeholder="Please tell us what happened..."
              />
           </div>

           <div className="group">
              <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">Screenshot (Optional)</label>
              <div 
                onClick={() => setFormData({...formData, screenshot: 'mock_screenshot.png'})}
                className={`w-full h-32 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  formData.screenshot ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/10' : 'border-sky-100 dark:border-sky-900/20 bg-white dark:bg-[#0D1525]'
                }`}
              >
                {formData.screenshot ? (
                  <>
                    <div className="relative">
                      <div className="w-16 h-10 bg-sky-200 rounded-lg" />
                      <div onClick={(e) => { e.stopPropagation(); setFormData({...formData, screenshot: null}); }} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1">
                        <X size={12} />
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-sky-600 uppercase">screenshot_01.png</p>
                  </>
                ) : (
                  <>
                    <Camera size={24} className="text-sky-300" />
                    <p className="text-[10px] font-black text-sky-600/40 uppercase tracking-widest">Tap to upload</p>
                  </>
                )}
              </div>
           </div>
        </div>

        <button 
          disabled={!isFormValid || loading}
          className="w-full mt-12 py-5 bg-sky-600 text-white rounded-[2rem] font-[var(--font-syne)] font-black text-base shadow-xl shadow-sky-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
             <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={20} />
          )}
          Submit Bug Report
        </button>

        <div className="mt-8 p-4 bg-sky-50 dark:bg-sky-900/10 rounded-2xl flex gap-3">
           <AlertCircle size={18} className="text-sky-400 shrink-0" />
           <p className="text-[10px] font-bold text-sky-600/60 leading-relaxed">
             Our team will review your report and may contact you via email if further details are needed.
           </p>
        </div>
      </form>
    </div>
  );
}
