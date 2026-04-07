import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { Users } from '../../services/api';

export default function ChangeEmail() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);
  const [error, setError] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendCode = async () => {
    setLoading(true);
    try {
      // Update email via API
      await Users.updateMe({ email: newEmail });
      setStep(2);
      setTimer(45);
      toast.success('Verification email sent!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(false);

    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
    
    if (newOtp.every(d => d !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleVerify = async (code) => {
    // In a real implementation, this would verify the OTP
    // For now, we just navigate back since email was already updated
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    toast.success("Email updated successfully ✓");
    navigate(-1);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] px-5 pt-6">
      <button onClick={handleBack} className="mb-8 w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
        <ChevronLeft size={24} />
      </button>

      <div className="max-w-md mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-[2rem] bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center mx-auto mb-4 text-sky-600">
            <Mail size={32} />
          </div>
          <h1 className="font-[var(--font-syne)] font-black text-2xl text-[#0C4A6E] dark:text-[#F0F9FF]">Change Email</h1>
          <p className="text-sm text-sky-600/60 dark:text-sky-400/60 leading-relaxed font-bold mt-2">
            {step === 1 ? "Enter your new email address to receive a verification code." : `We sent a 6-digit code to ${newEmail}`}
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-8">
            <div className="group">
              <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">New Email Address</label>
              <input 
                type="email" 
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] outline-none focus:border-sky-600 transition-all shadow-sm"
                placeholder="example@email.com"
              />
            </div>
            <button 
              onClick={handleSendCode}
              disabled={!newEmail || loading}
              className="w-full py-5 bg-sky-600 text-white rounded-[2rem] font-[var(--font-syne)] font-black text-base shadow-xl shadow-sky-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
              Send Verification Code
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="flex justify-between gap-2 max-w-[280px] mx-auto">
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
                  className={`w-10 h-14 bg-white dark:bg-[#0D1525] border-2 rounded-2xl text-center font-black text-xl outline-none transition-all shadow-sm ${
                    error ? 'border-rose-400 text-rose-600 animate-shake' : digit ? 'border-sky-600 text-sky-600' : 'border-sky-100 dark:border-sky-900/10 text-sky-600'
                  }`}
                />
              ))}
            </div>

            {error && <p className="text-center text-xs font-bold text-rose-500">Incorrect code. Please try again.</p>}

            <div className="text-center">
              <p className="text-xs font-bold text-sky-600/40 mb-4">Didn't receive code?</p>
              <button 
                disabled={timer > 0 || loading}
                onClick={handleSendCode}
                className={`flex items-center gap-2 mx-auto text-sm font-black transition-all ${timer > 0 ? 'text-sky-200' : 'text-sky-600 hover:scale-105'}`}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {timer > 0 ? `Resend in 00:${timer.toString().padStart(2, '0')}` : "Resend code"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
