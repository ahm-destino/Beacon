import React, { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { Auth } from '../../services/api';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const getStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
    if (pass.length < 8) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    const hasNumber = /\d/.test(pass);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    
    if (hasNumber && hasSymbol) return { score: 100, label: 'Very Strong', color: 'bg-emerald-500' };
    if (hasNumber) return { score: 75, label: 'Strong', color: 'bg-yellow-500' };
    return { score: 50, label: 'Fair', color: 'bg-orange-500' };
  };

  const strength = getStrength(newPass);
  const passwordsMatch = newPass && newPass === confirmPass;
  const isFormValid = currentPass && newPass.length >= 8 && passwordsMatch;

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await Auth.changePassword({
        current_password: currentPass,
        new_password: newPass
      });
      toast.success("Password changed successfully ✓");
      navigate('/settings', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-10">
      <div className="px-5 pt-6 flex items-center justify-between mb-8">
        <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0D1525] rounded-xl shadow-sm text-sky-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">Change Password</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 max-w-md mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-[2rem] bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center mx-auto mb-4 text-sky-600">
            <Lock size={32} />
          </div>
          <p className="text-sm text-sky-600/60 dark:text-sky-400/60 leading-relaxed font-bold">Choose a strong password to protect your account and data.</p>
        </div>

        <div className="space-y-6">
          {/* CURRENT PASSWORD */}
          <div className="group">
            <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">Current Password</label>
            <div className="relative">
              <input 
                type={showCurrent ? "text" : "password"}
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] outline-none focus:border-sky-600 transition-all shadow-sm pr-14"
                placeholder="Enter current password"
              />
              <button 
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-300 hover:text-sky-600 p-1"
              >
                {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* NEW PASSWORD */}
          <div className="group">
            <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">New Password</label>
            <div className="relative">
              <input 
                type={showNew ? "text" : "password"}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full bg-white dark:bg-[#0D1525] border-2 border-sky-100 dark:border-sky-900/10 rounded-2xl px-5 py-4 text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF] outline-none focus:border-sky-600 transition-all shadow-sm pr-14"
                placeholder="Minimum 8 characters"
              />
              <button 
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-300 hover:text-sky-600 p-1"
              >
                {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* STRENGTH INDICATOR */}
            <div className="mt-3 px-1">
              <div className="h-2 w-full bg-sky-100 dark:bg-sky-900/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${strength.color}`} 
                  style={{ width: `${strength.score}%` }} 
                />
              </div>
              <p className={`text-[10px] font-black uppercase mt-2 tracking-widest ${strength.score > 0 ? 'opacity-100' : 'opacity-0'}`} style={{ color: strength.color.replace('bg-', 'text-') }}>
                {strength.label}
              </p>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="group">
            <label className="block text-[10px] font-black text-sky-600/40 uppercase tracking-widest ml-1 mb-2">Confirm New Password</label>
            <div className="relative">
              <input 
                type={showConfirm ? "text" : "password"}
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className={`w-full bg-white dark:bg-[#0D1525] border-2 rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all shadow-sm pr-14 ${
                  confirmPass && !passwordsMatch ? 'border-rose-400 text-rose-600' : 'border-sky-100 dark:border-sky-900/10 text-[#0C4A6E] dark:text-[#F0F9FF] focus:border-sky-600'
                }`}
                placeholder="Must match new password"
              />
              <button 
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-300 hover:text-sky-600 p-1"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {confirmPass && !passwordsMatch && (
              <p className="text-[10px] text-rose-500 mt-2 ml-1 font-bold">Passwords do not match</p>
            )}
            {confirmPass && passwordsMatch && (
              <p className="text-[10px] text-emerald-500 mt-2 ml-1 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Passwords match
              </p>
            )}
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          className="w-full mt-12 py-5 bg-sky-600 text-white rounded-[2rem] font-[var(--font-syne)] font-black text-base shadow-xl shadow-sky-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Lock size={20} />}
          Change Password
        </button>

        <div className="mt-8 text-center">
          <Link to="/auth/forgot-password" size={18} className="text-xs font-bold text-sky-600 hover:underline">
            Forgot your current password?
          </Link>
        </div>
      </div>
    </div>
  );
}
