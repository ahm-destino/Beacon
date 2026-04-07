import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Database, Download, FileArchive, Clock, Loader2, CheckCircle2 } from 'lucide-react';

export default function DownloadData() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle, processing, ready
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (status === 'processing') {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setStatus('ready');
            return 100;
          }
          return prev + 2;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleRequest = () => {
    setStatus('processing');
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <div className="px-5 pt-6 flex items-center justify-between mb-8">
        <button onClick={() => navigate('/settings')} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Download Data</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-[2rem] bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center mx-auto mb-4 text-sky-600">
            <Database size={32} />
          </div>
          <p className="text-sm text-sky-600/60 dark:text-sky-400/60 leading-relaxed font-bold">
            Get a copy of your study history, chat logs, and performance data in a ZIP archive.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0D1525] p-8 rounded-[2.5rem] border border-sky-100 dark:border-sky-900/10 shadow-xl shadow-sky-600/5 mb-8 text-center">
            {status === 'idle' && (
              <div className="space-y-6">
                 <div className="flex flex-col items-center gap-2">
                   <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-sky-400 flex items-center justify-center">
                      <FileArchive size={24} />
                   </div>
                   <p className="text-xs font-bold text-sky-600/40">No active request</p>
                 </div>
                 <button 
                  onClick={handleRequest}
                  className="w-full py-5 bg-sky-600 text-white rounded-[2rem] font-black text-base shadow-lg shadow-sky-600/20 active:scale-95 transition-all"
                 >
                   Request My Data
                 </button>
              </div>
            )}

            {status === 'processing' && (
              <div className="space-y-6 py-4">
                 <Loader2 className="animate-spin mx-auto text-sky-600" size={32} />
                 <div>
                    <h3 className="font-black text-[#0C4A6E] dark:text-[#F0F9FF] text-lg">Processing Archive...</h3>
                    <p className="text-xs font-bold text-sky-600/40 mt-1">Gathering your data. This takes a few seconds.</p>
                 </div>
                 <div className="w-full h-3 bg-sky-50 dark:bg-sky-900/20 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                 </div>
                 <p className="font-black text-sky-600">{progress}%</p>
              </div>
            )}

            {status === 'ready' && (
              <div className="space-y-6">
                 <div className="flex flex-col items-center gap-2">
                   <div className="w-16 h-16 rounded-[2rem] bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/10">
                      <Download size={32} />
                   </div>
                   <div className="mt-2">
                     <h3 className="font-black text-[#0C4A6E] dark:text-[#F0F9FF] text-lg">Archive Ready!</h3>
                     <p className="text-xs font-bold text-emerald-600/60 mt-1 flex items-center justify-center gap-1">
                       <CheckCircle2 size={12} /> Valid for 7 days
                     </p>
                   </div>
                 </div>
                 <div className="p-4 bg-sky-50 dark:bg-sky-900/10 rounded-2xl">
                    <p className="text-xs font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">beacon_data_tunde_2024.zip</p>
                    <p className="text-[10px] font-bold text-sky-600/40 mt-1">File size: 12.4 MB</p>
                 </div>
                 <button 
                  onClick={() => alert("Download started ✓")}
                  className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-base shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                   <Download size={20} /> Download Archive
                 </button>
                 <button 
                  onClick={() => setStatus('idle')}
                  className="text-xs font-black text-sky-600/40 uppercase tracking-widest"
                 >
                   Request New Archive
                 </button>
              </div>
            )}
        </div>

        <div className="bg-sky-50 dark:bg-sky-900/10 p-6 rounded-2xl flex gap-4">
           <Clock size={20} className="text-sky-400 shrink-0" />
           <p className="text-[10px] font-bold text-sky-600/60 leading-relaxed">
             Once you request your data, we gather everything from your study sessions, practice scores, and AI tutor logs. This archive is private and can only be accessed by you.
           </p>
        </div>
      </div>
    </div>
  );
}
