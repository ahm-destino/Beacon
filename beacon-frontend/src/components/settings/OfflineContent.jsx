import React, { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Database, BookOpen, Clapperboard, FileText, 
  Trash2, Download, CheckCircle2, AlertTriangle, X 
} from 'lucide-react';

const DOWNLOADS = [
  { id: 1, name: 'Practice questions', size: '45MB', status: 'Saved', icon: BookOpen },
  { id: 2, name: 'Mathematics videos', size: '230MB', status: 'Saved', icon: Clapperboard },
  { id: 3, name: 'Physics videos', size: '180MB', status: 'Not saved', icon: Clapperboard },
  { id: 4, name: 'Chemistry videos', size: '210MB', status: 'Not saved', icon: Clapperboard },
  { id: 5, name: 'Biology videos', size: '195MB', status: 'Not saved', icon: Clapperboard },
  { id: 6, name: 'English videos', size: '120MB', status: 'Not saved', icon: Clapperboard },
  { id: 7, name: 'Formula sheets', size: '2MB', status: 'Saved', icon: FileText },
  { id: 8, name: 'Periodic table', size: '1MB', status: 'Saved', icon: FileText },
];

export default function OfflineContent() {
  const navigate = useNavigate();
  const [list, setList] = useState(DOWNLOADS);
  const [showClearModal, setShowClearModal] = useState(false);

  const toggleStatus = (id) => {
    setList(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: item.status === 'Saved' ? 'Not saved' : 'Saved' };
      }
      return item;
    }));
  };

  const handleClearAll = () => {
    setList(prev => prev.map(item => ({ ...item, status: 'Not saved' })));
    setShowClearModal(false);
    toast.success("All offline content deleted ✓");
  };

  const usedStorage = 478; // MB
  const totalStorage = 2048; // 2GB

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-20">
      <div className="px-5 pt-6 flex items-center justify-between mb-8">
        <button onClick={() => navigate('/settings')} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Offline Content</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        {/* STORAGE BAR */}
        <div className="bg-white dark:bg-[#0D1525] p-6 rounded-[2rem] border border-sky-100 dark:border-sky-900/10 shadow-sm mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[10px] font-black uppercase text-sky-600/40 tracking-widest mb-1">Storage Used</p>
              <h3 className="text-sm font-black text-[#0C4A6E] dark:text-[#F0F9FF]">{usedStorage}MB used of 2GB available</h3>
            </div>
            <Database size={20} className="text-sky-300" />
          </div>
          <div className="w-full h-3 bg-sky-50 dark:bg-sky-900/20 rounded-full overflow-hidden">
             <div className="h-full bg-sky-600 rounded-full transition-all duration-500" style={{ width: `${(usedStorage/totalStorage)*100}%` }} />
          </div>
        </div>

        {/* DOWNLOAD LIST */}
        <div className="bg-white dark:bg-[#0D1525] rounded-[2rem] border border-sky-100 dark:border-sky-900/10 overflow-hidden shadow-sm mb-12">
           {list.map((item) => (
             <div key={item.id} className="flex items-center justify-between px-6 py-4 border-b border-sky-50 dark:border-sky-900/5 last:border-b-0 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.status === 'Saved' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'bg-sky-100 text-sky-400'}`}>
                    <item.icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">{item.name}</h4>
                    <p className="text-[10px] font-bold text-sky-600/40">{item.size} · {item.status}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => toggleStatus(item.id)}
                  className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${
                    item.status === 'Saved' 
                      ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' 
                      : 'bg-sky-600 text-white shadow-lg shadow-sky-600/20 hover:scale-105'
                  }`}
                >
                  {item.status === 'Saved' ? '[Remove]' : '[Download]'}
                </button>
             </div>
           ))}
        </div>

        <button 
          onClick={() => setShowClearModal(true)}
          className="w-full py-5 bg-white dark:bg-[#0D1525] text-rose-600 border-2 border-rose-600/10 rounded-[2rem] font-black text-sm active:scale-95 transition-all mb-8"
        >
          Clear All Downloads
        </button>
      </div>

      {/* CLEAR MODAL */}
      {showClearModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="w-full max-w-xs bg-white dark:bg-[#0D1525] rounded-[2rem] p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="font-black text-lg mb-2 text-[#0C4A6E] dark:text-[#F0F9FF]">Delete All?</h3>
            <p className="text-xs text-sky-600/60 mb-6 leading-relaxed">Delete all offline content? You'll need WiFi to download again.</p>
            <div className="space-y-3">
              <button onClick={handleClearAll} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm">Clear All</button>
              <button onClick={() => setShowClearModal(false)} className="w-full py-4 bg-sky-50 dark:bg-sky-900/20 text-sky-600 rounded-2xl font-black text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
