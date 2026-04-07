import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Auth } from '../../services/api';

export default function OTPVerification() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);
  const signupPhone = localStorage.getItem('beacon_signup_phone') || '';

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const handleChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signupPhone) {
      window.alert('Phone number missing. Please sign up again.');
      return;
    }

    setIsLoading(true);
    try {
      const otpValue = otp.join('');
      const res = await Auth.verifyOtp({ phone: signupPhone, otp: otpValue });
      navigate('/onboarding');
    } catch (err) {
      window.alert(err?.error || err?.data?.error || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AuthLayout>
      <button 
        onClick={() => navigate(-1)}
        className="font-[var(--font-jakarta)] text-sm text-[#0284C7] hover:text-[#0C4A6E] dark:text-[#38BDF8] dark:hover:text-[#F0F9FF] flex items-center gap-2 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="w-16 h-16 rounded-2xl mx-auto mb-6 bg-[#E0F2FE] dark:bg-sky-900/30 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
        <MessageCircle className="w-8 h-8" />
      </div>

      <h2 className="font-[var(--font-syne)] font-bold text-2xl text-center text-[#0C4A6E] dark:text-[#F0F9FF] mb-2">
        Check your phone
      </h2>
      <p className="font-[var(--font-jakarta)] text-sm text-center text-[#0369A1] dark:text-[#7DD3FC] mt-2 mb-8">
        We sent a 6-digit code to <br/>
        <span className="font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">
          {signupPhone || '+234 ...'}
        </span>
        <br/><br/>
        <button onClick={() => navigate(-1)} className="hover:underline">Wrong number? Go back</button>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex gap-3 justify-center">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-12 h-14 md:w-14 md:h-16 text-center rounded-xl font-['Plus_Jakarta_Sans'] text-2xl font-bold border-2 outline-none transition-all duration-200 text-[#0C4A6E] dark:text-[#F0F9FF] focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] ${
                digit 
                  ? 'border-[#7DD3FC] dark:border-[rgba(14,165,233,0.30)] bg-[#E0F2FE] dark:bg-[#111D2E]' 
                  : 'bg-[#FFFFFF] dark:bg-[#0D1525] border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] focus:border-[#7DD3FC] dark:focus:border-[rgba(14,165,233,0.30)] focus:bg-[#E0F2FE] dark:focus:bg-[#111D2E]'
              }`}
            />
          ))}
        </div>

        <div className="text-center mt-2">
          <span className="text-sm text-[#0369A1] dark:text-[#7DD3FC]">Didn't receive it? </span>
          {timeLeft > 0 ? (
            <span className="text-sm text-[#7DD3FC] dark:text-[rgba(125,211,252,0.4)] cursor-not-allowed">
              Resend in <span className="font-['Plus_Jakarta_Sans']">{formatTime(timeLeft)}</span>
            </span>
          ) : (
            <button 
              type="button" 
              onClick={() => setTimeLeft(45)}
              className="text-sm text-[#0284C7] dark:text-[#38BDF8] hover:text-[#0C4A6E] dark:hover:text-[#F0F9FF] font-semibold underline cursor-pointer transition-colors"
            >
              Resend code
            </button>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isLoading || otp.some(d => !d)}
          className="w-full py-3.5 rounded-xl font-[var(--font-syne)] font-bold text-base text-white bg-[#0369A1] dark:bg-[#0EA5E9] hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] shadow-[0_8px_24px_rgba(3,105,161,0.30)] dark:shadow-[0_8px_24px_rgba(14,165,233,0.30)] hover:shadow-[0_12px_32px_rgba(3,105,161,0.40)] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </>
          ) : "Verify Code"}
        </button>
      </form>
    </AuthLayout>
  );
}

