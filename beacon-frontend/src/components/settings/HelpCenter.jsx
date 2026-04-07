import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Search, HelpCircle, ChevronRight, 
  MessageSquare, Book, Shield, Zap, Sparkles 
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Getting Started', icon: Zap, color: 'text-sky-500' },
  { id: 'Study Tips', icon: Book, color: 'text-emerald-500' },
  { id: 'AI Tutor', icon: Sparkles, color: 'text-purple-500' },
  { id: 'Account & Privacy', icon: Shield, color: 'text-rose-500' },
];

const FAQS = [
  {
    category: 'Getting Started',
    question: 'How do I start my first study session?',
    answer: 'Tap the "AI Tutor" tab in the bottom navigation. You can either type a question or choose from the recommended study plan blocks to begin learning.'
  },
  {
    category: 'AI Tutor',
    question: 'How accurate is the AI Tutor?',
    answer: 'Our AI is trained specifically on JAMB, WAEC, and NECO curricula. While highly accurate, we recommend cross-referencing with your textbooks for final verification.'
  },
  {
    category: 'Account & Privacy',
    question: 'How do I delete my account?',
    answer: 'Go to Settings > Account > Delete Account. Please note that this action is permanent and will erase all your study progress and streak data.'
  },
  {
    category: 'Study Tips',
    question: 'What is the Streak and how do I keep it?',
    answer: 'The Streak tracks how many consecutive days you have studied. To keep it, you must answer at least one question per day before midnight.'
  }
];

export default function HelpCenter() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const filteredFaqs = FAQS.filter(f => 
    f.question.toLowerCase().includes(search.toLowerCase()) || 
    f.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <div className="px-5 pt-6 flex items-center justify-between mb-8">
        <button onClick={() => navigate('/settings')} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Help Center</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        {/* SEARCH */}
        <div className="relative mb-10">
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for help..."
            className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-12 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] outline-none focus:border-sky-600 transition-all shadow-xl shadow-sky-600/5 placeholder:text-sky-600/20"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300" size={20} />
        </div>

        {/* CATEGORIES */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {CATEGORIES.map((cat) => (
            <button key={cat.id} className="bg-white dark:bg-[#0D1525] p-5 rounded-[2rem] border border-sky-100 dark:border-sky-900/10 shadow-sm text-center hover:scale-105 active:scale-95 transition-all">
               <div className={`w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/20 ${cat.color} flex items-center justify-center mx-auto mb-3`}>
                  <cat.icon size={24} />
               </div>
               <p className="text-[10px] font-black uppercase text-[#0C4A6E] dark:text-[#F0F9FF] tracking-widest">{cat.id}</p>
            </button>
          ))}
        </div>

        {/* FAQS */}
        <div className="space-y-4">
           <h2 className="text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">Frequently Asked</h2>
           {filteredFaqs.map((faq, idx) => (
             <div key={idx} className="bg-white dark:bg-[#0D1525] rounded-[2rem] border border-sky-100 dark:border-sky-900/10 overflow-hidden shadow-sm">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] pr-4">{faq.question}</span>
                  <ChevronRight size={18} className={`text-sky-300 transition-transform ${openFaq === idx ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-xs font-bold text-sky-600/60 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
             </div>
           ))}
        </div>

        {/* STILL NEED HELP */}
        <div className="mt-12 bg-sky-600 p-8 rounded-[2.5rem] text-center shadow-xl shadow-sky-600/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500 rounded-full blur-3xl opacity-50 -mr-16 -mt-16" />
           <div className="relative z-10">
             <MessageSquare size={32} className="text-white mx-auto mb-4" />
             <h3 className="font-[var(--font-syne)] font-black text-xl text-white mb-2">Still need help?</h3>
             <p className="text-white/60 text-xs font-bold mb-6">Our support team is ready to assist you anywhere, anytime.</p>
             <button 
              onClick={() => navigate('/settings/contact-support')}
              className="w-full py-4 bg-white text-sky-600 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all"
             >
               Contact Support
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
