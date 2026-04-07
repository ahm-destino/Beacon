import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, AlertTriangle, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';

const REASONS = [
  'I finished my exams',
  'Too expensive',
  'AI Tutor is not accurate enough',
  'App is too slow/laggy',
  'I don\'t use it anymore',
  'Found a better alternative',
  'Privacy concerns',
  'Other'
];

export default function DeleteAccount() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  const handleReasonSubmit = () => {
    if (reason) setStep(2);
  };

  const handleFinalConfirm = () => {
     setStep(3);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
    
    if (newOtp.every(d => d !== '') && index === 5) {
      handleDelete(newOtp.join(''));
    }
  };

  const handleDelete = async (code) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    toast.warning("Account deleted permanently. We're sorry to see you go!");
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] px-5 pt-6 pb-20">
      <button 
        onClick={() => step === 1 ? navigate('/settings') : setStep(step - 1)} 
        className="mb-8 w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600"
      >
        <ChevronLeft size={24} />
      </button>

      <div className="max-w-md mx-auto">
        {step === 1 && (
          <div className="animate-in slide-in-from-right duration-300">
             <div className="text-center mb-10">
                <div className="w-20 h-20 rounded-[2rem] bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto mb-4 text-rose-600">
                  <Trash2 size={32} />
                </div>
                <h1 className="font-[var(--font-syne)] font-black text-2xl text-[#0C4A6E] dark:text-[#F0F9FF]">Delete Account</h1>
                <p className="text-sm text-rose-600/60 leading-relaxed font-bold mt-2">
                  We're sorry to see you go. Please tell us why you're leaving.
                </p>
             </div>

             <div className="space-y-3 mb-12">
                {REASONS.map(r => (
                  <button 
                    key={r}
                    onClick={() => setReason(r)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                      reason === r ? 'border-sky-600 bg-sky-50/50 dark:bg-sky-900/10 text-sky-600' : 'border-sky-100 dark:border-sky-900/10 text-sky-600/40 hover:border-sky-200'
                    }`}
                  >
                    <span className="text-sm font-black">{r}</span>
                  </button>
                ))}
             </div>

             <button 
              disabled={!reason}
              onClick={handleReasonSubmit}
              className="w-full py-5 bg-sky-600 text-white rounded-[2rem] font-black text-base shadow-xl shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-30"
             >
               Continue
             </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right duration-300">
             <div className="text-center mb-10">
                <div className="w-20 h-20 rounded-[2rem] bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <AlertTriangle size={32} />
                </div>
                <h1 className="font-[var(--font-syne)] font-black text-2xl text-[#0C4A6E] dark:text-[#F0F9FF]">Are you sure?</h1>
                <p className="text-sm text-rose-600/80 leading-relaxed font-bold mt-2">
                  This action is permanent. You will lose:
                </p>
             </div>

             <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-[2rem] border border-rose-200 dark:border-rose-900/20 space-y-4 mb-12">
                <div className="flex items-center gap-3 text-rose-600 font-bold text-sm">
                   <AlertTriangle size={18} /> All study history & stats
                </div>
                <div className="flex items-center gap-3 text-rose-600 font-bold text-sm">
                   <AlertTriangle size={18} /> Your 142-day study streak
                </div>
                <div className="flex items-center gap-3 text-rose-600 font-bold text-sm">
                   <AlertTriangle size={18} /> Premium subscription access
                </div>
                <div className="flex items-center gap-3 text-rose-600 font-bold text-sm">
                   <AlertTriangle size={18} /> All downloaded resources
                </div>
             </div>

             <div className="space-y-4">
                <button 
                  onClick={handleFinalConfirm}
                  className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black text-base shadow-xl shadow-rose-600/20 active:scale-95 transition-all"
                >
                  Yes, Delete My Account
                </button>
                <button 
                  onClick={() => navigate('/settings')}
                  className="w-full py-5 bg-sky-50 dark:bg-sky-900/20 text-sky-600 rounded-[2rem] font-black text-base"
                >
                  I've Changed My Mind
                </button>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in slide-in-from-right duration-300">
             <div className="text-center mb-10">
                <div className="w-20 h-20 rounded-[2rem] bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center mx-auto mb-4 text-sky-600">
                  <ShieldCheck size={32} />
                </div>
                <h1 className="font-[var(--font-syne)] font-black text-2xl text-[#0C4A6E] dark:text-[#F0F9FF]">Verification</h1>
                <p className="text-sm text-sky-600/60 leading-relaxed font-bold mt-2">
                  To confirm deletion, enter the 6-digit code sent to your email.
                </p>
             </div>

             <div className="flex justify-between gap-2 max-w-[280px] mx-auto mb-12">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyUp={(e) => {
                    if (e.key === 'Backspace' && !digit && i > 0) {
                      otpRefs.current[i-1].focus();
                    }
                  }}
                  className="w-10 h-14 bg-white dark:bg-[#0D1525] border-2 border-sky-100 rounded-2xl text-center font-black text-xl outline-none focus:border-sky-600 text-[#0C4A6E] dark:text-[#F0F9FF] shadow-sm"
                />
              ))}
            </div>

            <div className="text-center">
              <button className="flex items-center gap-2 mx-auto text-sm font-black text-sky-600 hover:scale-105 active:scale-95 transition-all">
                <RefreshCw size={16} /> Resend code
              </button>
            </div>

            {loading && (
              <div className="mt-8 flex flex-col items-center gap-4">
                 <Loader2 className="animate-spin text-rose-600" size={32} />
                 <p className="text-xs font-black text-rose-600 uppercase tracking-widest">Finalizing Deletion...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
