import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, ArrowRight, Zap, Target, Book, Layout, Binary, 
  Microscope, Languages, History as HistoryIcon, Shield, 
  Clock, CheckCircle, AlertCircle, Bookmark, Grid, Settings,
  Globe, Briefcase, Landmark, BookOpen, PenTool, Lightbulb
} from 'lucide-react';
import { Practice, Users } from '../../services/api';
import { toast } from 'sonner';

const EXAMS = [
  { id: 'JAMB', name: 'JAMB UTME', desc: '4 Subjects • 180 Qs • 120 Mins', type: 'bundle' },
  { id: 'WAEC', name: 'WAEC SSCE', desc: 'Subject-based • 50 Qs • 60 Mins', type: 'single' },
  { id: 'NECO', name: 'NECO SSCE', desc: 'Subject-based • 60 Qs • 60 Mins', type: 'single' },
];

const SUBJECT_LIST = [
  { id: 'English', icon: Languages, color: 'text-indigo-500', bg: 'bg-indigo-100/50' },
  { id: 'Mathematics', icon: Binary, color: 'text-amber-500', bg: 'bg-amber-100/50' },
  { id: 'Physics', icon: Layout, color: 'text-sky-500', bg: 'bg-sky-100/50' },
  { id: 'Chemistry', icon: Microscope, color: 'text-emerald-500', bg: 'bg-emerald-100/50' },
  { id: 'Biology', icon: Book, color: 'text-rose-500', bg: 'bg-rose-100/50' },
  { id: 'Government', icon: Landmark, color: 'text-sky-700', bg: 'bg-sky-200/50' },
  { id: 'Economics', icon: Globe, color: 'text-green-600', bg: 'bg-green-100/50' },
  { id: 'Literature', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100/50' },
  { id: 'Geography', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-100/50' },
  { id: 'Commerce', icon: Briefcase, color: 'text-amber-700', bg: 'bg-amber-200/50' },
  { id: 'Agricultural Science', icon: Lightbulb, color: 'text-lime-600', bg: 'bg-lime-100/50' },
  { id: 'CRS', icon: Shield, color: 'text-yellow-600', bg: 'bg-yellow-100/50' },
];

export default function MockGenerator() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Exam, 2: Subjects, 3: Confirm
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleSubject = (id) => {
    if (id === 'English' && selectedExam?.id === 'JAMB') return; // Compulsory
    
    if (selectedSubjects.includes(id)) {
      setSelectedSubjects(prev => prev.filter(s => s !== id));
    } else {
      if (selectedExam?.id === 'JAMB' && selectedSubjects.length >= 4) {
        toast.error('JAMB requires exactly 4 subjects');
        return;
      }
      setSelectedSubjects(prev => [...prev, id]);
    }
  };

  const nextStep = () => {
    if (step === 1 && !selectedExam) {
      toast.error('Please select an examination type');
      return;
    }
    if (step === 2) {
      if (selectedExam.id === 'JAMB' && selectedSubjects.length !== 4) {
        toast.error('Please select exactly 4 subjects for JAMB');
        return;
      }
      if (selectedExam.type === 'single' && selectedSubjects.length === 0) {
        toast.error('Please select at least one subject');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  useEffect(() => {
    if (selectedExam?.id === 'JAMB') {
      setSelectedSubjects(['English']);
    } else {
      setSelectedSubjects([]);
    }
  }, [selectedExam]);

  const startSimulation = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call a specialized mock endpoint.
      // For now, we simulate by creating a session.
      // Since createJambFullSession uses user.subjects, we might need a custom flow or 
      // override user subjects temporarily if the API allows.
      
      const payload = {
        mode: 'exam',
        exam_type: selectedExam.id,
        subjects: selectedSubjects,
        time_limit: selectedExam.id === 'JAMB' ? 7200 : 3600,
        is_mock: true
      };

      // Redirect to generating screen with the config
      navigate('/practice/generating', { state: { config: payload } });
    } catch (err) {
      toast.error('Failed to initialize simulation engine');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col font-[var(--font-jakarta)]">
      {/* HEADER */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/practice')}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 dark:text-sky-400 shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-1">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 w-8 rounded-full transition-all duration-300 ${step >= i ? 'bg-sky-600' : 'bg-sky-200 dark:bg-sky-900/40'}`} />
            ))}
          </div>
        </div>
        
        <h1 className="font-[var(--font-syne)] font-black text-3xl text-[#0C4A6E] dark:text-[#F0F9FF] leading-tight">
          Exam <span className="text-sky-600">Simulator</span>
        </h1>
        <p className="text-sm text-sky-600/60 dark:text-sky-400/60 mt-2">
          {step === 1 && "Choose the official examination you want to simulate."}
          {step === 2 && `Select your ${selectedExam?.id} combinations.`}
          {step === 3 && "Review your configuration and start the clock."}
        </p>
      </div>

      <div className="flex-1 px-5 overflow-y-auto pb-32">
        {step === 1 && (
          <div className="space-y-4 pt-4">
            {EXAMS.map(exam => (
              <button
                key={exam.id}
                onClick={() => setSelectedExam(exam)}
                className={`w-full p-6 rounded-[2rem] border-2 transition-all duration-300 text-left flex items-center gap-5 ${
                  selectedExam?.id === exam.id
                    ? 'border-sky-600 bg-white dark:bg-[#0D1525] shadow-xl shadow-sky-500/10'
                    : 'border-sky-100 dark:border-sky-900/20 bg-white/50 dark:bg-[#0D1525]/50'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${selectedExam?.id === exam.id ? 'bg-sky-600 text-white' : 'bg-sky-100 dark:bg-sky-900/40 text-sky-600'}`}>
                   <Shield size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="font-[var(--font-syne)] font-bold text-lg text-[#0C4A6E] dark:text-[#F0F9FF]">{exam.name}</h3>
                  <p className="text-xs text-sky-600/70 dark:text-sky-400/70 mt-1">{exam.desc}</p>
                </div>
                {selectedExam?.id === exam.id && <CheckCircle size={24} className="text-sky-600" />}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-sky-500 uppercase tracking-widest">
                {selectedExam?.id === 'JAMB' ? `Selected (${selectedSubjects.length}/4)` : 'Select Subjects'}
              </span>
              {selectedExam?.id === 'JAMB' && (
                <span className="text-[10px] bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 px-2 py-1 rounded-full font-bold">
                  English is Compulsory
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 pb-8">
              {SUBJECT_LIST.map(sub => {
                const Icon = sub.icon;
                const isSelected = selectedSubjects.includes(sub.id);
                const isCompulsory = sub.id === 'English' && selectedExam?.id === 'JAMB';
                
                return (
                  <button
                    key={sub.id}
                    onClick={() => toggleSubject(sub.id)}
                    disabled={isCompulsory}
                    className={`p-4 rounded-3xl border-2 transition-all duration-300 flex flex-col gap-3 relative ${
                      isSelected 
                        ? 'border-sky-600 bg-white dark:bg-[#0D1525] shadow-lg shadow-sky-500/10' 
                        : 'border-sky-100 dark:border-sky-900/20 bg-white/50 dark:bg-[#0D1525]/50'
                    } ${isCompulsory ? 'opacity-80' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sub.bg} ${sub.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] text-left">
                      {sub.id}
                    </span>
                    {isSelected && <CheckCircle size={16} className="absolute top-3 right-3 text-sky-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 pt-4">
            <div className="bg-white dark:bg-[#0D1525] rounded-[2.5rem] p-8 border border-sky-100 dark:border-sky-900/20 shadow-xl shadow-sky-500/5">
              <div className="flex flex-col items-center text-center gap-4 mb-8">
                <div className="w-20 h-20 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 text-3xl">
                   ⏲️
                </div>
                <div>
                  <h3 className="font-[var(--font-syne)] font-black text-2xl text-[#0C4A6E] dark:text-[#F0F9FF]">{selectedExam?.name}</h3>
                  <p className="text-sky-500 font-bold text-sm mt-1 uppercase tracking-wider">Ready for Simulation</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-sky-50/50 dark:bg-[#080C14]/50 rounded-2xl border border-sky-100/50 dark:border-sky-900/10">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-sky-500" />
                    <span className="text-sm font-bold text-sky-700 dark:text-sky-300">Time Allocated</span>
                  </div>
                  <span className="text-sm font-black text-[#0C4A6E] dark:text-[#F0F9FF]">{selectedExam?.id === 'JAMB' ? '120 Mins' : '60 Mins'}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-sky-50/50 dark:bg-[#080C14]/50 rounded-2xl border border-sky-100/50 dark:border-sky-900/10">
                  <div className="flex items-center gap-3">
                    <Grid size={16} className="text-sky-500" />
                    <span className="text-sm font-bold text-sky-700 dark:text-sky-300">Question Volume</span>
                  </div>
                  <span className="text-sm font-black text-[#0C4A6E] dark:text-[#F0F9FF]">{selectedExam?.id === 'JAMB' ? '180 Questions' : '60 Questions'}</span>
                </div>

                <div className="p-4 bg-sky-50/50 dark:bg-[#080C14]/50 rounded-2xl border border-sky-100/50 dark:border-sky-900/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Target size={16} className="text-sky-500" />
                    <span className="text-sm font-bold text-sky-700 dark:text-sky-300">Subject Mix</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubjects.map(s => (
                      <span key={s} className="px-3 py-1 bg-white dark:bg-[#0D1525] rounded-full text-[10px] font-black text-sky-600 border border-sky-100 dark:border-sky-900/20">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/20 flex gap-4">
              <AlertCircle className="text-amber-600 shrink-0" size={20} />
              <p className="text-xs text-amber-800/80 dark:text-amber-400/80 leading-relaxed font-medium">
                Simulation will enforce real exam conditions. The timer will not stop until you submit or time runs out. Ensure you are in a quiet environment.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER ACTION */}
      <div className="fixed bottom-0 left-0 right-0 p-5 pb-10 bg-gradient-to-t from-[#F0F9FF] via-[#F0F9FF] dark:from-[#080C14] dark:via-[#080C14] to-transparent">
        <button
          onClick={step === 3 ? startSimulation : nextStep}
          disabled={loading}
          className="w-full bg-[#0369A1] dark:bg-sky-600 text-white py-5 rounded-[2rem] font-[var(--font-syne)] font-black text-lg shadow-xl shadow-sky-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? "INITIALIZING ENGINE..." : step === 3 ? "START SIMULATION" : "CONTINUE"} 
          {!loading && (step === 3 ? <Zap size={20} fill="currentColor" /> : <ArrowRight size={20} />)}
        </button>
      </div>
    </div>
  );
}
