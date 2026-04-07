import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Scale, ShieldCheck, FileText, ExternalLink } from 'lucide-react';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <div className="px-5 pt-6 flex items-center justify-between mb-8">
        <button onClick={() => navigate('/settings')} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Terms of Service</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        <div className="bg-white dark:bg-[#0D1525] p-8 rounded-[2.5rem] border border-sky-100 dark:border-sky-900/10 shadow-xl shadow-sky-600/5 mb-8">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 flex items-center justify-center">
                 <Scale size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-sky-600/40 tracking-widest">Last Updated</p>
                <p className="text-sm font-black text-[#0C4A6E] dark:text-[#F0F9FF]">March 12, 2024</p>
              </div>
           </div>

           <div className="prose prose-sky dark:prose-invert max-w-none space-y-6">
              <section>
                <h3 className="text-sm font-black text-sky-600 uppercase tracking-widest mb-2">1. Acceptance of Terms</h3>
                <p className="text-xs font-bold text-sky-600/60 leading-relaxed">
                  By accessing or using Beacon, you agree to be bound by these Terms of Service and all applicable laws and regulations in Nigeria.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-black text-sky-600 uppercase tracking-widest mb-2">2. Use License</h3>
                <p className="text-xs font-bold text-sky-600/60 leading-relaxed">
                  Beacon grants you a personal, non-exclusive, non-transferable license to use the app for personal, non-commercial educational purposes.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-black text-sky-600 uppercase tracking-widest mb-2">3. Prohibited Conduct</h3>
                <p className="text-xs font-bold text-sky-600/60 leading-relaxed">
                  You may not use the app to distribute illegal content, harass others, or attempt to reverse engineer our proprietary AI models.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-black text-sky-600 uppercase tracking-widest mb-2">4. Subscription & Payments</h3>
                <p className="text-xs font-bold text-sky-600/60 leading-relaxed">
                  Subscription fees are non-refundable unless required by Nigerian consumer protection laws. You can cancel your subscription at any time.
                </p>
              </section>
           </div>
        </div>

        <button 
          onClick={() => window.open('https://beacon.ng/legal/terms', '_blank')}
          className="w-full py-4 bg-sky-50 dark:bg-sky-900/20 text-sky-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          View Full Document <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
}
