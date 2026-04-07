import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Lock, EyeOff, FileText, ExternalLink } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <div className="px-5 pt-6 flex items-center justify-between mb-8">
        <button onClick={() => navigate('/settings')} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Privacy Policy</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        <div className="bg-white dark:bg-[#0D1525] p-8 rounded-[2.5rem] border border-sky-100 dark:border-sky-900/10 shadow-xl shadow-sky-600/5 mb-8">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 flex items-center justify-center">
                 <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-sky-600/40 tracking-widest">Last Updated</p>
                <p className="text-sm font-black text-[#0C4A6E] dark:text-[#F0F9FF]">March 12, 2024</p>
              </div>
           </div>

           <div className="prose prose-sky dark:prose-invert max-w-none space-y-6">
              <section>
                <h3 className="text-sm font-black text-sky-600 uppercase tracking-widest mb-2">1. Information We Collect</h3>
                <p className="text-xs font-bold text-sky-600/60 leading-relaxed">
                  We collect your profile information, study habits, and AI Tutor logs to provide a personalized learning experience.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-black text-sky-600 uppercase tracking-widest mb-2">2. How We Use Data</h3>
                <p className="text-xs font-bold text-sky-600/60 leading-relaxed">
                  Your data is used to calculate score predictions, suggest study plans, and improve our AI Tutor accuracy.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-black text-sky-600 uppercase tracking-widest mb-2">3. Cookies & Tracking</h3>
                <p className="text-xs font-bold text-sky-600/60 leading-relaxed">
                  We use essential cookies to keep you logged in and analytics cookies to understand how the app is used.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-black text-sky-600 uppercase tracking-widest mb-2">4. Your Rights</h3>
                <p className="text-xs font-bold text-sky-600/60 leading-relaxed">
                  Under NDPA, you have the right to access, export, or delete your personal data at any time via the Settings menu.
                </p>
              </section>
           </div>
        </div>

        <button 
          onClick={() => window.open('https://beacon.ng/legal/privacy', '_blank')}
          className="w-full py-4 bg-sky-50 dark:bg-sky-900/20 text-sky-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          View Full Document <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
}
