import React from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Mail, Phone, ExternalLink, Clock } from 'lucide-react';

const CHANNELS = [
  {
    id: 'Live Chat',
    icon: MessageCircle,
    color: 'bg-sky-600',
    title: 'Live Chat',
    desc: 'Average response time: 2 mins',
    action: 'Start Chat',
    accent: 'sky'
  },
  {
    id: 'WhatsApp',
    icon: Phone,
    color: 'bg-emerald-600',
    title: 'WhatsApp Support',
    desc: 'Average response time: 10 mins',
    action: 'Open WhatsApp',
    accent: 'emerald'
  },
  {
    id: 'Email',
    icon: Mail,
    color: 'bg-rose-600',
    title: 'Email Support',
    desc: 'Average response time: 4 hours',
    action: 'Send Email',
    accent: 'rose'
  }
];

export default function ContactSupport() {
  const navigate = useNavigate();

  const handleAction = (channel) => {
    toast.info(`Opening ${channel}...`);
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <div className="px-5 pt-6 flex items-center justify-between mb-8">
        <button onClick={() => navigate('/settings')} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Contact Support</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-[2rem] bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center mx-auto mb-4 text-sky-600">
            <MessageCircle size={32} />
          </div>
          <p className="text-sm text-sky-600/60 dark:text-sky-400/60 leading-relaxed font-bold">
            Questions or issues? Our experts are here to help you get the best out of Beacon.
          </p>
        </div>

        <div className="space-y-6">
           {CHANNELS.map((channel) => (
             <button 
              key={channel.id}
              onClick={() => handleAction(channel.id)}
              className="w-full bg-white dark:bg-[#0D1525] p-6 rounded-[2.5rem] border border-sky-100 dark:border-sky-900/10 shadow-xl shadow-sky-600/5 flex items-center justify-between group hover:scale-[1.02] active:scale-95 transition-all"
             >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl ${channel.color} text-white flex items-center justify-center shadow-lg`}>
                    <channel.icon size={28} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-['Syne'] font-black text-base text-[#0C4A6E] dark:text-[#F0F9FF]">{channel.title}</h3>
                    <p className="text-[10px] font-bold text-sky-600/40 mt-1 flex items-center gap-1">
                      <Clock size={10} /> {channel.desc}
                    </p>
                  </div>
                </div>
                <div className="bg-sky-50 dark:bg-sky-900/20 p-2 rounded-xl text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <ExternalLink size={18} />
                </div>
             </button>
           ))}
        </div>

        <div className="mt-12 p-6 bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] border border-amber-100 dark:border-amber-900/10">
           <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2">Support Hours</h4>
           <div className="space-y-1">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Monday — Friday</p>
              <p className="text-xs font-bold text-amber-600/60">8:00 AM — 8:00 PM (GMT+1)</p>
           </div>
           <div className="mt-3 space-y-1">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Saturday</p>
              <p className="text-xs font-bold text-amber-600/60">10:00 AM — 4:00 PM (GMT+1)</p>
           </div>
        </div>
      </div>
    </div>
  );
}
