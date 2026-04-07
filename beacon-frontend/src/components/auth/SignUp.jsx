import React, { useState } from 'react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { Eye, EyeOff } from 'lucide-react';
import { Auth, setToken } from '../../services/api';

export default function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const cleanedPhone = (phone || '').replace(/\s+/g, '');
      let normalizedPhone = cleanedPhone;
      if (
        normalizedPhone &&
        !normalizedPhone.startsWith('+234') &&
        !normalizedPhone.startsWith('0')
      ) {
        normalizedPhone = `+234${normalizedPhone.replace(/^\+/, '')}`;
      }

      const res = await Auth.register({
        full_name: fullName,
        phone: normalizedPhone,
        email: email,
        password: password,
      });

      setToken(res.data.access_token);
      localStorage.setItem('beacon_signup_phone', normalizedPhone);

      // Continue onboarding immediately after account creation.
      navigate('/onboarding');
    } catch (err) {
      toast.error(err?.error || err?.data?.error || 'Sign up failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="font-[var(--font-syne)] font-bold text-2xl text-[#0C4A6E] dark:text-[#F0F9FF] text-center mb-2">Create Account</h2>
      <p className="font-[var(--font-jakarta)] text-sm text-[#0369A1] dark:text-[#7DD3FC] text-center mb-8">
        Join 15,800+ students already passing
      </p>

      <button className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl font-[var(--font-jakarta)] font-semibold text-sm bg-[#FFFFFF] dark:bg-[#0D1525] border border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] text-[#0C4A6E] dark:text-[#F0F9FF] hover:bg-[#F0F9FF] dark:hover:bg-[#111D2E]/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div className="relative flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-sky-100 dark:bg-sky-900/50" />
        <span className="font-[var(--font-jakarta)] text-xs font-medium text-sky-400 dark:text-sky-600 whitespace-nowrap px-1">
          or continue with email
        </span>
        <div className="flex-1 h-px bg-sky-100 dark:bg-sky-900/50" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF]">Full Name</label>
          <input 
            type="text" 
            placeholder="Chioma Okafor"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm bg-[#FFFFFF] dark:bg-[#0D1525] border border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] text-[#0C4A6E] dark:text-[#F0F9FF] placeholder:text-[#7DD3FC] dark:placeholder:text-[rgba(125,211,252,0.4)] outline-none transition-all duration-200 focus:border-[#7DD3FC] dark:focus:border-[rgba(14,165,233,0.30)] focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] focus:bg-[#E0F2FE] dark:focus:bg-[#111D2E]"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF]">Phone Number</label>
          <div className="flex">
            <div className="px-3 py-3 bg-[#E0F2FE] dark:bg-[#111D2E] border border-r-0 border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] rounded-l-xl text-sm text-[#0369A1] dark:text-[#7DD3FC] flex items-center gap-2 font-medium">
              🇳🇬 +234
            </div>
            <input 
              type="tel" 
              placeholder="801 234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-l-none px-4 py-3 rounded-r-xl text-sm bg-[#FFFFFF] dark:bg-[#0D1525] border border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] text-[#0C4A6E] dark:text-[#F0F9FF] placeholder:text-[#7DD3FC] dark:placeholder:text-[rgba(125,211,252,0.4)] outline-none transition-all duration-200 focus:border-[#7DD3FC] dark:focus:border-[rgba(14,165,233,0.30)] focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] focus:bg-[#E0F2FE] dark:focus:bg-[#111D2E]"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF]">Email Address</label>
          <input 
            type="email" 
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm bg-[#FFFFFF] dark:bg-[#0D1525] border border-[#BAE6FD] dark:border-[rgba(14,165,233,0.15)] text-[#0C4A6E] dark:text-[#F0F9FF] placeholder:text-[#7DD3FC] dark:placeholder:text-[rgba(125,211,252,0.4)] outline-none transition-all duration-200 focus:border-[#7DD3FC] dark:focus:border-[rgba(14,165,233,0.30)] focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] focus:bg-[#E0F2FE] dark:focus:bg-[#111D2E]"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#0C4A6E] dark:text-[#F0F9FF]">Password</label>
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
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl font-[var(--font-syne)] font-bold text-base text-white bg-[#0369A1] dark:bg-[#0EA5E9] hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] shadow-[0_8px_24px_rgba(3,105,161,0.30)] dark:shadow-[0_8px_24px_rgba(14,165,233,0.30)] hover:shadow-[0_12px_32px_rgba(3,105,161,0.40)] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] dark:focus:ring-[rgba(14,165,233,0.20)] mt-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            </>
          ) : "Create Account"}
        </button>
      </form>

      <p className="text-xs text-[#0369A1] dark:text-[#7DD3FC] text-center mt-3 font-medium">
        By creating an account, you agree to our{' '}
        <a href="#" className="text-[#0284C7] dark:text-[#38BDF8] underline hover:text-[#0C4A6E] dark:hover:text-[#F0F9FF]">Terms of Service</a> and{' '}
        <a href="#" className="text-[#0284C7] dark:text-[#38BDF8] underline hover:text-[#0C4A6E] dark:hover:text-[#F0F9FF]">Privacy Policy</a>
      </p>

      <p className="text-sm text-center text-[#0369A1] dark:text-[#7DD3FC] mt-6">
        Already have an account?{' '}
        <Link to="/auth/signin" className="font-semibold text-[#0284C7] dark:text-[#38BDF8] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
