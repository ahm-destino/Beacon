import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Lock, Mail, Phone, Bell, Moon, Clock, Brain, Target, 
  Globe, Bot, Wifi, Download, Sun, Type, Eye, Share2, 
  ShieldCheck, HelpCircle, MessageSquare, Bug, Star, FileText, 
  LogOut, Trash2, ChevronRight, X, AlertTriangle 
} from 'lucide-react';
import SubScreenHeader from '../shared/SubScreenHeader';
import { clearToken, Users } from '../../services/api';

function SettingRow({ icon: Icon, label, sub, right, to, onClick, danger }) {
  const base =
    'w-full flex items-center gap-4 px-5 py-4 border-b border-sky-50 dark:border-sky-900/10 last:border-b-0 text-left hover:bg-sky-50/50 dark:hover:bg-sky-900/10 active:scale-[0.99] transition-all duration-200';
  
  const content = (
    <>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
        danger ? 'bg-rose-100 text-rose-600' : 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400'
      }`}>
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <div className={`text-sm font-bold ${danger ? 'text-rose-600' : 'text-[#0C4A6E] dark:text-[#F0F9FF]'}`}>{label}</div>
        {sub && <div className="text-[10px] font-bold text-sky-600/40 dark:text-sky-400/40 uppercase tracking-wider mt-0.5">{sub}</div>}
      </div>
      {right || <ChevronRight size={18} className="text-sky-200 dark:text-sky-800" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={base}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={base}>
      {content}
    </button>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="mt-8 mb-3 px-2 font-[var(--font-syne)] font-black text-[10px] text-sky-600/30 dark:text-sky-400/30 uppercase tracking-[0.2em]">
      {children}
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8 sm:items-center">
      <div 
        className="w-full max-w-sm bg-white dark:bg-[#0D1525] rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-[var(--font-syne)] font-black text-xl text-[#0C4A6E] dark:text-[#F0F9FF]">{title}</h3>
          <button onClick={onClose} className="p-2 bg-sky-50 dark:bg-sky-900/20 rounded-xl text-sky-400">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function SettingsMain() {
  const navigate = useNavigate();
  const [theme, setThemeState] = useState('Light');
  const [fontSize, setFontSizeState] = useState('Medium');
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Load user settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await Users.getMe();
        if (res?.data) {
          if (res.data.theme) setThemeState(res.data.theme);
          if (res.data.font_size) setFontSizeState(res.data.font_size);
        }
      } catch (err) {
        // Silent fail
      }
    };
    loadSettings();
  }, []);

  // Save theme to backend and apply to UI
  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    
    // Apply theme immediately to UI
    if (newTheme === 'Dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'Light') {
      document.documentElement.classList.remove('dark');
    } else if (newTheme === 'System') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    try {
      await Users.updateMe({ theme: newTheme.toLowerCase() });
      toast.success(`Theme set to ${newTheme}`);
    } catch (err) {
      toast.error('Failed to save theme');
    }
  };

  // Save font size to backend and apply
  const setFontSize = async (newSize) => {
    setFontSizeState(newSize);
    
    // Apply font size to root element
    const sizeMap = { Small: '14px', Medium: '16px', Large: '18px' };
    document.documentElement.style.fontSize = sizeMap[newSize] || '16px';
    
    try {
      await Users.updateMe({ font_size: newSize.toLowerCase() });
      toast.success(`Font size set to ${newSize}`);
    } catch (err) {
      toast.error('Failed to save font size');
    }
  };

  const handleLogout = () => {
    // Close modal first
    setShowLogoutModal(false);
    
    // Clear auth token and all localStorage
    clearToken();
    localStorage.clear();
    
    // Show success message
    toast.success('Logged out successfully');
    
    // Navigate to sign in with replace to prevent going back
    setTimeout(() => {
      navigate('/auth/signin', { replace: true });
    }, 100);
  };

  const handle2FAToggle = () => {
    if (tfaEnabled) {
      // Confirm disable
      const confirm = window.confirm("Disable Two-Factor Authentication? This makes your account less secure.");
      if (confirm) {
        setTfaEnabled(false);
        toast.success("Two-factor authentication disabled ✓");
      }
    } else {
      setShow2FAModal(true);
    }
  };

  const verify2FA = () => {
    setTfaEnabled(true);
    setShow2FAModal(false);
    toast.success("Two-factor authentication enabled ✓");
  };

  const handleShare = async () => {
    const text = "I've been using Beacon to prepare for JAMB. AI tutor, 10,000+ past questions, streak system. Try it free 👇 [app link]";
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Beacon', text: text, url: window.location.origin });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      toast.info("Sharing: " + text);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] pb-32">
      <SubScreenHeader title="Settings" backPath="/profile" />

      <div className="px-5">
        
        {/* SECTION 1: ACCOUNT */}
        <SectionTitle>Account</SectionTitle>
        <div className="bg-white dark:bg-[#0D1525] rounded-[2rem] border border-sky-100 dark:border-sky-900/20 overflow-hidden shadow-sm">
          <SettingRow icon={User} label="Edit Profile" to="/settings/edit-profile" />
          <SettingRow icon={Lock} label="Change Password" to="/settings/change-password" />
          <SettingRow icon={Mail} label="Change Email" to="/settings/change-email" sub="john@email.com" />
          <SettingRow icon={Phone} label="Change Phone" to="/settings/change-phone" sub="+234 801 234 5678" />
        </div>

        {/* SECTION 2: NOTIFICATIONS */}
        <SectionTitle>Notifications</SectionTitle>
        <div className="bg-white dark:bg-[#0D1525] rounded-[2rem] border border-sky-100 dark:border-sky-900/20 overflow-hidden shadow-sm">
          <SettingRow icon={Bell} label="Notification Preferences" to="/settings/notifications" />
          <SettingRow icon={Moon} label="Do Not Disturb" to="/settings/do-not-disturb" />
          <SettingRow icon={Clock} label="Study Reminder" to="/settings/study-reminder" sub="6:00 PM" />
        </div>

        {/* SECTION 3: STUDY PREFERENCES */}
        <SectionTitle>Study Preferences</SectionTitle>
        <div className="bg-white dark:bg-[#0D1525] rounded-[2rem] border border-sky-100 dark:border-sky-900/20 overflow-hidden shadow-sm">
          <SettingRow icon={Brain} label="Explanation Level" to="/settings/explanation-level" sub="Normal ⚡" />
          <SettingRow icon={Target} label="Daily Question Target" to="/settings/daily-target" sub="45 questions" />
          <SettingRow icon={Globe} label="Language" to="/settings/language" sub="English" />
          <SettingRow icon={Bot} label="AI Teaching Style" to="/settings/teaching-style" sub="Guided" />
        </div>

        {/* SECTION 4: APP */}
        <SectionTitle>App</SectionTitle>
        <div className="bg-white dark:bg-[#0D1525] rounded-[2rem] border border-sky-100 dark:border-sky-900/20 overflow-hidden shadow-sm">
          <SettingRow icon={Wifi} label="Data Usage" to="/settings/data-usage" sub="Standard" />
          <SettingRow icon={Download} label="Offline Content" to="/settings/offline-content" sub="478MB used" />
          
          <div className="px-5 py-5 border-b border-sky-50 dark:border-sky-900/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400">
                <Sun size={18} />
              </div>
              <div className="text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">Theme</div>
            </div>
            <div className="grid grid-cols-3 gap-2 ml-13">
              {['Light', 'Dark', 'System'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    theme === t 
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' 
                      : 'bg-sky-50 dark:bg-sky-900/20 text-sky-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400">
                <Type size={18} />
              </div>
              <div className="text-sm font-bold text-[#0C4A6E] dark:text-[#F0F9FF]">Font Size</div>
            </div>
            <div className="grid grid-cols-3 gap-2 ml-13 mb-3">
              {['Small', 'Medium', 'Large'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFontSize(s)}
                  className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    fontSize === s 
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' 
                      : 'bg-sky-50 dark:bg-sky-900/20 text-sky-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="ml-13 text-center transition-all bg-sky-50 dark:bg-sky-900/10 py-2 rounded-lg text-sky-600/60 dark:text-sky-400/40 font-bold" style={{ 
              fontSize: fontSize === 'Small' ? '10px' : fontSize === 'Medium' ? '13px' : '16px' 
            }}>
              This is how text looks
            </p>
          </div>
        </div>

        {/* SECTION 5: PRIVACY */}
        <SectionTitle>Privacy</SectionTitle>
        <div className="bg-white dark:bg-[#0D1525] rounded-[2rem] border border-sky-100 dark:border-sky-900/20 overflow-hidden shadow-sm">
          <SettingRow icon={Eye} label="Profile Visibility" to="/settings/profile-visibility" />
          <SettingRow icon={Share2} label="Data Sharing" to="/settings/data-sharing" />
          <SettingRow 
            icon={ShieldCheck} 
            label="Two-Factor Auth" 
            onClick={handle2FAToggle}
            right={
              <div className={`w-11 h-6 rounded-full transition-colors duration-300 flex items-center px-1 ${tfaEnabled ? 'bg-sky-600' : 'bg-sky-100 dark:bg-sky-900/40'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${tfaEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            }
          />
          <SettingRow icon={Download} label="Download My Data" to="/settings/download-data" />
        </div>

        {/* SECTION 6: SUPPORT */}
        <SectionTitle>Support</SectionTitle>
        <div className="bg-white dark:bg-[#0D1525] rounded-[2rem] border border-sky-100 dark:border-sky-900/20 overflow-hidden shadow-sm">
          <SettingRow icon={HelpCircle} label="Help Center" to="/settings/help" />
          <SettingRow icon={MessageSquare} label="Contact Support" to="/settings/contact" />
          <SettingRow icon={Bug} label="Report a Bug" to="/settings/report-bug" />
          <SettingRow icon={Star} label="Rate Beacon" onClick={() => toast.info("Triggering Native OS Rating Dialog...")} />
          <SettingRow icon={Share2} label="Share Beacon" onClick={handleShare} />
        </div>

        {/* SECTION 7: LEGAL */}
        <SectionTitle>Legal</SectionTitle>
        <div className="bg-white dark:bg-[#0D1525] rounded-[2rem] border border-sky-100 dark:border-sky-900/20 overflow-hidden shadow-sm">
          <SettingRow icon={FileText} label="Terms of Service" to="/settings/terms" />
          <SettingRow icon={ShieldCheck} label="Privacy Policy" to="/settings/privacy" />
        </div>

        {/* DANGER ZONE */}
        <SectionTitle>Danger Zone</SectionTitle>
        <div className="bg-white dark:bg-[#0D1525] rounded-[2rem] border border-sky-100 dark:border-sky-900/20 overflow-hidden shadow-sm mb-12">
          <SettingRow 
            icon={LogOut} 
            label="Log Out" 
            danger 
            onClick={() => setShowLogoutModal(true)} 
          />
          <SettingRow 
            icon={Trash2} 
            label="Delete Account" 
            danger 
            to="/settings/delete-account" 
          />
        </div>

        <div className="text-center pb-10">
           <p className="text-[10px] font-black uppercase text-sky-600/30 tracking-[0.3em]">Beacon v1.5.0</p>
        </div>
      </div>

      {/* MODALS */}
      <Modal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)}
        title="🚪 Log Out"
      >
        <p className="text-sky-600/60 dark:text-sky-400/60 mb-8 leading-relaxed">Are you sure you want to log out of your account?</p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleLogout}
            className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-rose-600/20"
          >
            Log Out
          </button>
          <button 
            onClick={() => setShowLogoutModal(false)}
            className="w-full bg-sky-50 dark:bg-sky-900/20 text-sky-600 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        title="🔐 Enable 2FA"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-[1.5rem] bg-sky-600 text-white flex items-center justify-center mb-4 shadow-xl shadow-sky-600/20">
            <ShieldCheck size={32} />
          </div>
          <p className="text-sm text-[#0C4A6E] dark:text-[#F0F9FF] font-bold mb-2">Secure your account</p>
          <p className="text-xs text-sky-600/60 dark:text-sky-400/60 mb-6">
            We'll send a verification code to your phone <span className="text-sky-600 font-bold">+234 801 234 5678</span> every time you sign in.
          </p>
          
          <div className="flex gap-2 mb-8">
            {otp.map((digit, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const newOtp = [...otp];
                  newOtp[i] = e.target.value;
                  setOtp(newOtp);
                  if (e.target.value && i < 5) {
                    document.getElementById(`otp-${i+1}`).focus();
                  }
                }}
                id={`otp-${i}`}
                className="w-10 h-12 bg-sky-50 dark:bg-sky-900/20 border-2 border-transparent focus:border-sky-600 rounded-xl text-center font-black text-sky-600 outline-none transition-all"
              />
            ))}
          </div>

          <button 
            onClick={verify2FA}
            className="w-full bg-sky-700 dark:bg-sky-600 text-white py-4 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-sky-600/20"
          >
            Enable 2FA
          </button>
        </div>
      </Modal>
    </div>
  );
}
