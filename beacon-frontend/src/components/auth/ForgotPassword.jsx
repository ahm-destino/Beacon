import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, MessageCircle, ShieldCheck, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(45);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [step, timeLeft]);

  const handleNextStep = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (step < 3) {
        setStep(step + 1);
      } else {
        navigate('/auth/signin');
      }
    }, 1500);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['Weak', 'Weak', 'Fair', 'Strong', 'Very strong ✓'];
  const strengthColors = [
    'bg-[#E0F2FE] dark:bg-[#111D2E]', // Base/Weak
    'bg-red-400',       // Weak
    'bg-amber-400',     // Fair
    'bg-sky-500',       // Strong
    'bg-green-500'      // Very Strong
  ];
  const strengthTextColors = [
    'text-red-400',
    'text-red-400',
    'text-amber-400',
    'text-[#0284C7]',
    'text-green-500'
  ];

  return (
    <div className="min-h-screen w-full bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col items-center justify-center p-5 font-[var(--font-jakarta)] selection:bg-sky-500/30">
      
      {/* Absolute Header with Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mx-auto">
        
        {/* STEP INDICATOR */}
        <div className="flex gap-2 justify-center mb-10">
          <div className={`h-2 rounded-full transition-all duration-300 ${step >= 1 ? (step === 1 ? 'w-8 bg-[#0284C7] dark:bg-[#38BDF8]' : 'w-2 bg-[#0284C7] dark:bg-[#38BDF8]') : 'w-2 bg-[#BAE6FD] dark:bg-[#111D2E]'}`} />
          <div className={`h-2 rounded-full transition-all duration-300 ${step >= 2 ? (step === 2 ? 'w-8 bg-[#0284C7] dark:bg-[#38BDF8]' : 'w-2 bg-[#0284C7] dark:bg-[#38BDF8]') : 'w-2 bg-[#BAE6FD] dark:bg-[#111D2E]'}`} />
          <div className={`h-2 rounded-full transition-all duration-300 ${step >= 3 ? (step === 3 ? 'w-8 bg-[#0284C7] dark:bg-[#38BDF8]' : 'w-2 bg-[#0284C7] dark:bg-[#38BDF8]') : 'w-2 bg-[#BAE6FD] dark:bg-[#111D2E]'}`} />
        </div>

        {/* BEACON LOGO */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="4" fill="white"/>
                <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-[var(--font-syne)] font-bold text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">BEACON</span>
          </Link>
        </div>

        {/* ICON */}
        <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-colors duration-300 ${
          step === 3 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
            : 'bg-[#E0F2FE] dark:bg-[#111D2E] text-[#0284C7] dark:text-[#38BDF8]'
        }`}>
          {step === 1 && <Lock className="w-8 h-8" />}
          {step === 2 && <MessageCircle className="w-8 h-8" />}
          {step === 3 && <ShieldCheck className="w-8 h-8" />}
        </div>

        {/* TITLE & SUBTITLE */}
        <h2 className="font-[var(--font-syne)] font-bold text-2xl text-center text-[#0C4A6E] dark:text-[#F0F9FF] mb-2">
          {step === 1 && "Reset your password"}
          {step === 2 && "Enter the code"}
          {step === 3 && "Create new password"}
        </h2>
        <p className="font-[var(--font-jakarta)] text-sm text-center text-[#0369A1] dark:text-[#7DD3FC] mt-2 mb-8">
          {step === 1 && "Enter your phone number or email address and we'll send you a reset code."}
          {step === 2 && "We sent a 6-digit code to +234 801 234 5678"}
          {step === 3 && "Make it strong — at least 8 characters with a number."}
        </p>

        {/* FORM */}
        <form onSubmit={handleNextStep} className="flex flex-col gap-6">
          
          {/* STEP 1: Email/Phone */}
          {step === 1 && (
            <div className="flex flex-col gap-1.5">
              <input 
                type="text" 
                placeholder="Phone number or email"
                className="w-full px-4 py-3 rounded-xl text-sm bg-[#FFFFFF] dark:bg-[#0D1525] border border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] text-[#0C4A6E] dark:text-[#F0F9FF] placeholder:text-[#7DD3FC] dark:placeholder:text-[rgba(125,211,252,0.4)] outline-none transition-all duration-200 focus:border-[#7DD3FC] dark:focus:border-[rgba(14,165,233,0.30)] focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] focus:bg-[#E0F2FE] dark:focus:bg-[#111D2E]"
                required
              />
            </div>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <>
              <div className="flex gap-3 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
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
            </>
          )}

          {/* STEP 3: New Password */}
          {step === 3 && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF]">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[#FFFFFF] dark:bg-[#0D1525] border border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] text-[#0C4A6E] dark:text-[#F0F9FF] placeholder:text-[#7DD3FC] dark:placeholder:text-[rgba(125,211,252,0.4)] outline-none transition-all duration-200 focus:border-[#7DD3FC] dark:focus:border-[rgba(14,165,233,0.30)] focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] focus:bg-[#E0F2FE] dark:focus:bg-[#111D2E] pr-10"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0369A1] hover:text-[#0284C7] dark:text-[#7DD3FC] dark:hover:text-[#38BDF8] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-2 mb-1">
                    <div className="flex gap-1 h-1 w-full">
                      {[1, 2, 3, 4].map((seg) => (
                        <div 
                          key={seg} 
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            strength >= seg ? strengthColors[strength] : 'bg-[#E0F2FE] dark:bg-[#111D2E]'
                          }`}
                        />
                      ))}
                    </div>
                    <div className={`text-xs font-semibold mt-1 ${strengthTextColors[strength]}`}>
                      {strengthLabels[strength]}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF]">Confirm Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[#FFFFFF] dark:bg-[#0D1525] border border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] text-[#0C4A6E] dark:text-[#F0F9FF] placeholder:text-[#7DD3FC] dark:placeholder:text-[rgba(125,211,252,0.4)] outline-none transition-all duration-200 focus:border-[#7DD3FC] dark:focus:border-[rgba(14,165,233,0.30)] focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] focus:bg-[#E0F2FE] dark:focus:bg-[#111D2E] pr-10"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0369A1] hover:text-[#0284C7] dark:text-[#7DD3FC] dark:hover:text-[#38BDF8] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={isLoading || (step === 2 && otp.some(d => !d))}
            className="w-full py-3.5 rounded-xl font-[var(--font-syne)] font-bold text-base text-white bg-[#0369A1] dark:bg-[#0EA5E9] hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] shadow-[0_8px_24px_rgba(3,105,161,0.30)] dark:shadow-[0_8px_24px_rgba(14,165,233,0.30)] hover:shadow-[0_12px_32px_rgba(3,105,161,0.40)] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                {step === 1 && "Send Reset Code →"}
                {step === 2 && "Verify Code →"}
                {step === 3 && "Set New Password →"}
              </>
            )}
          </button>
        </form>

        {step === 1 && (
          <div className="text-center mt-4">
            <Link to="/auth/signin" className="font-[var(--font-jakarta)] text-sm text-[#0284C7] dark:text-[#38BDF8] hover:text-[#0C4A6E] dark:hover:text-[#F0F9FF] font-semibold flex items-center justify-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

