import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Play, Check, ArrowRight, Twitter, Instagram, MessageCircle } from 'lucide-react';
import ThemeToggle from './components/ThemeToggle';
import { isLoggedIn } from './services/api';

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const getStartedPath = isLoggedIn() ? '/dashboard' : '/auth/signup';
  const getStartedLabel = isLoggedIn() ? 'Go to Dashboard' : 'Get Started Free';
  const startStudyingLabel = isLoggedIn() ? 'Go to Dashboard' : 'Start Studying Free';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            entry.target.classList.remove('opacity-0', 'translate-y-4');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.scroll-animate').forEach(el => {
      el.classList.add('opacity-0', 'translate-y-4', 'transition-all', 'duration-700', 'ease-out');
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-[rgba(14,165,233,0.1)] shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-5 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="4" fill="white"/>
                <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-[var(--font-syne)] font-bold text-lg tracking-tight text-sky-900 dark:text-sky-50">BEACON</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            {['Home', 'Features', 'Pricing', 'Testimonials'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-sky-700 hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-100 transition-all duration-200 hover:font-semibold hover:underline underline-offset-4">{item}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link to="/auth/signin" className="text-sm font-semibold px-4 py-2 rounded-lg text-sky-700 border border-sky-200 hover:bg-sky-50 dark:text-sky-300 dark:border-sky-800 dark:hover:bg-sky-900/30 transition-all duration-200 active:scale-95 focus:ring-2 focus:ring-sky-500/50">Sign In</Link>
            <Link to={getStartedPath} className="font-[var(--font-syne)] text-sm font-bold px-5 py-2 rounded-lg bg-sky-700 text-white hover:bg-sky-600 shadow-[0_4px_16px_rgba(3,105,161,0.3)] dark:bg-sky-500 dark:hover:bg-sky-400 dark:shadow-[0_4px_16px_rgba(14,165,233,0.3)] transition-all duration-200 active:scale-95 focus:ring-2 focus:ring-sky-500/50">{getStartedLabel}</Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button className="text-sky-900 dark:text-sky-50 p-2" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setMobileMenuOpen(false)}>
        <div className={`absolute right-0 top-0 bottom-0 w-64 bg-white dark:bg-[#0D1525] p-5 shadow-2xl transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="flex justify-end mb-8">
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-sky-900 dark:text-sky-50"><X size={24} /></button>
          </div>
          <div className="flex flex-col gap-6">
            {['Home', 'Features', 'Pricing', 'Testimonials'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-sky-700 dark:text-sky-300">{item}</a>
            ))}
            <div className="h-px bg-sky-100 dark:bg-sky-800/50 my-2"></div>
            <Link to="/auth/signin" className="w-full text-center text-sm font-semibold px-4 py-3 rounded-lg text-sky-700 border border-sky-200 hover:bg-sky-50 dark:text-sky-300 dark:border-sky-800 dark:hover:bg-sky-900/30 transition-all duration-200">Sign In</Link>
            <Link to={getStartedPath} className="w-full text-center font-[var(--font-syne)] text-sm font-bold px-5 py-3 rounded-lg bg-sky-700 text-white hover:bg-sky-600 shadow-[0_4px_16px_rgba(3,105,161,0.3)] dark:bg-sky-500 dark:hover:bg-sky-400 dark:shadow-[0_4px_16px_rgba(14,165,233,0.3)] transition-all duration-200">{getStartedLabel}</Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen pt-24 pb-16 md:pt-32 flex items-center">
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.15),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.08),transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-5 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 relative z-10">
          {/* Left Column */}
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800/50 w-fit mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-xs font-bold">Stop fearing the exam. Start owning it.</span>
            </div>
            
            <h1 className="font-[var(--font-syne)] font-bold text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-sky-900 dark:text-sky-50 mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
              Don't sit at home next year.<br/>
              <span className="text-sky-500 dark:text-sky-400">Secure your admission now.</span>
            </h1>
            
            <p className="text-lg text-sky-700/80 dark:text-sky-300/80 max-w-md leading-relaxed mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
              Throw away the overwhelming textbooks. Master your weak subjects for JAMB, WAEC, NECO, Post-UTME, and JUPEB with a personalized AI tutor that explains exactly what you don't understand, tracks your speed, and guarantees your success.
            </p>
            
            <div className="flex flex-wrap items-center gap-3 mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
              <Link to={getStartedPath} className="group flex items-center gap-2 font-[var(--font-syne)] font-bold text-base px-7 py-3.5 rounded-xl bg-sky-700 text-white hover:bg-sky-600 shadow-[0_8px_24px_rgba(3,105,161,0.35)] hover:shadow-[0_12px_32px_rgba(3,105,161,0.45)] dark:bg-sky-500 dark:hover:bg-sky-400 dark:shadow-[0_8px_24px_rgba(14,165,233,0.30)] transition-all duration-200 active:scale-95 focus:ring-2 focus:ring-sky-500/50">
                {startStudyingLabel}
                <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <button className="flex items-center gap-2 font-semibold text-base px-7 py-3.5 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800/50 dark:hover:bg-sky-900/50 transition-all duration-200 active:scale-95 focus:ring-2 focus:ring-sky-500/50">
                <Play size={16} fill="currentColor" />
                See How It Works
              </button>
            </div>

            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
              <div className="flex">
                {['bg-sky-600', 'bg-sky-500', 'bg-amber-500', 'bg-sky-700'].map((color, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full ring-2 ring-white ${color} ${i === 0 ? '' : '-ml-2'} flex items-center justify-center`}
                  >
                    <span className="text-white text-[10px] font-bold">
                      {['CO', 'TO', 'ZM', 'AO'][i]}
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex text-amber-400 text-xs mb-0.5">⭐⭐⭐⭐⭐</div>
                <p className="text-sm font-medium text-sky-600 dark:text-sky-400">4,800+ students already studying</p>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative flex justify-center items-center lg:justify-end animate-in fade-in zoom-in-95 duration-1000 delay-500 fill-mode-both">
            <div className="relative w-full max-w-sm mx-auto animate-float">
              {/* Main Phone Mockup */}
              <div className="bg-white dark:bg-[#0D1525] rounded-3xl p-5 shadow-[0_32px_80px_rgba(14,165,233,0.2)] dark:shadow-[0_32px_80px_rgba(14,165,233,0.15)] border border-sky-100 dark:border-[rgba(14,165,233,0.2)] flex flex-col gap-4 relative z-10">
                
                {/* Streak Card */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-100 dark:border-orange-700/30 rounded-2xl p-4">
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl">🔥</span>
                    <span className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-orange-500 leading-none">22</span>
                    <span className="text-xs text-orange-600 dark:text-orange-400 mb-0.5">Day Streak</span>
                  </div>
                  <div className="w-full h-1.5 bg-orange-200/50 dark:bg-orange-900/50 rounded-full overflow-hidden">
                    <div className="w-[70%] h-full bg-orange-500 rounded-full"></div>
                  </div>
                </div>

                {/* Score Prediction */}
                <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/30 rounded-2xl p-4">
                  <p className="text-xs text-sky-600 dark:text-sky-400 mb-1">📈 Predicted JAMB Score</p>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="font-['Plus_Jakarta_Sans'] text-3xl font-black text-sky-700 dark:text-sky-300">306</span>
                    <span className="text-xs text-sky-500 dark:text-sky-500">/ 400</span>
                  </div>
                  <div className="w-full h-2 bg-sky-200/50 dark:bg-sky-800/50 rounded-full overflow-hidden">
                    <div className="w-[76%] h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full"></div>
                  </div>
                </div>

                {/* Question Preview */}
                <div className="bg-white dark:bg-[#111D2E] border border-sky-100 dark:border-sky-900/30 rounded-2xl p-4">
                  <p className="text-xs text-sky-800 dark:text-sky-100 mb-3 font-medium">In which organelle does cellular respiration occur?</p>
                  <div className="flex flex-col gap-2">
                    <div className="bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 text-xs p-2.5 rounded-xl border border-sky-100 dark:border-sky-800/30">A. Nucleus</div>
                    <div className="bg-sky-600 text-white text-xs p-2.5 rounded-xl shadow-sm flex justify-between items-center">
                      <span>B. Mitochondria</span>
                      <Check size={14} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badges */}
              <div className="absolute -right-4 top-8 bg-white dark:bg-[#0D1525] shadow-lg border border-sky-100 dark:border-sky-800/30 rounded-xl px-3 py-2 text-xs z-20 animate-float-delayed">
                🏆 #234 Global
              </div>
              <div className="absolute -left-4 bottom-16 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 text-green-600 dark:text-green-400 rounded-xl px-3 py-2 text-xs z-20 animate-float-slow">
                ✅ 78% Accuracy
              </div>
              <div className="absolute -left-2 top-20 bg-amber-400 dark:bg-amber-500 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold z-20 animate-bounce" style={{ animationDuration: '3s' }}>
                ⚡ +470 pts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white dark:bg-[#0D1525] border-y border-sky-100 dark:border-[rgba(14,165,233,0.1)] shadow-sm scroll-animate">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { num: "10,000+", label: "Past Questions" },
              { num: "5,000+", label: "Video Explanations" },
              { num: "4,800+", label: "Active Students" },
              { num: "95%", label: "Improved Their Score" }
            ].map((stat, i) => (
              <div
                key={i}
                className={`py-8 px-4 text-center ${i !== 3 ? 'border-r border-sky-100 dark:border-sky-800/20' : ''}`}
              >
                <div className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-sky-700 dark:text-sky-300">{stat.num}</div>
                <div className="text-sm font-medium text-sky-500 dark:text-sky-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-20 px-5 max-w-7xl mx-auto">
        <div className="text-center mb-12 scroll-animate">
          <h2 className="font-[var(--font-syne)] text-3xl font-bold mb-3 text-sky-900 dark:text-sky-50">We know exactly how it feels.</h2>
          <p className="text-base text-sky-700/80 dark:text-sky-300/80 max-w-xl mx-auto">Preparing for exams in Nigeria carries too much pressure. We built Beacon to solve the silent fears every student goes through.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "📚",
              color: "bg-sky-100 dark:bg-sky-900/30",
              title: "Drowning in textbooks",
              desc: "The syllabus is massive, time is running out, and staring at giant textbooks just gives you a headache. You need a straight line to exactly what will come out in the exam."
            },
            {
              icon: "🧠",
              color: "bg-orange-100 dark:bg-orange-900/30",
              title: "Cramming but forgetting",
              desc: "You spend hours reading, but the moment you face the CBT test, your mind goes completely blank. You're trying to force it into memory, instead of truly understanding."
            },
            {
              icon: "⏳",
              color: "bg-teal-100 dark:bg-teal-900/30",
              title: "The terrifying fear of rewriting",
              desc: "Watching your friends pack for university while you stay back home for another year is the worst feeling. You just want to make your parents proud on your first try."
            }
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-[rgba(14,165,233,0.12)] rounded-2xl p-6 shadow-[0_4px_20px_rgba(14,165,233,0.08)] hover:shadow-[0_8px_32px_rgba(14,165,233,0.15)] hover:border-sky-200 dark:hover:border-[rgba(14,165,233,0.25)] transition-all duration-300 hover:-translate-y-1 scroll-animate" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center mb-5 text-2xl`}>
                {card.icon}
              </div>
              <h3 className="font-[var(--font-syne)] font-bold text-xl mb-3 text-sky-900 dark:text-sky-50">{card.title}</h3>
              <p className="text-sm leading-relaxed text-sky-700/80 dark:text-sky-300/80">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-5 max-w-6xl mx-auto">
        <div className="text-center mb-20 scroll-animate">
          <h2 className="font-[var(--font-syne)] text-4xl font-bold mb-4 text-sky-900 dark:text-sky-50">Your unfair advantage for JAMB & WAEC</h2>
          <p className="text-lg text-sky-700/80 dark:text-sky-300/80 max-w-2xl mx-auto">Everything you need to score 300+ and clear your papers in one sitting.</p>
        </div>

        <div className="flex flex-col gap-24">
          {/* Feature 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center scroll-animate">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 text-xs font-bold mb-4">Your Personal Guide</div>
              <h3 className="font-[var(--font-syne)] text-3xl font-bold mb-4 text-sky-900 dark:text-sky-50">A study plan that knows exactly what you don't know</h3>
              <p className="text-base leading-relaxed text-sky-700/80 dark:text-sky-300/80 max-w-md mb-6">
                Beacon tracks your weak points every single day and tells you exactly what to study. Stop wasting time reading things you already know, and never guess what might come out in the exam again.
              </p>
              <ul className="space-y-3">
                {['Updates every day based on your progress', 'Prioritizes topics most likely on your exam', 'Adjusts when you fall behind or surge ahead'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-sky-800 dark:text-sky-200">
                    <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white dark:bg-[#0D1525] rounded-2xl shadow-xl border border-sky-100 dark:border-sky-800/20 p-6">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-sky-900 dark:text-sky-50">This Week's Plan</h4>
                <span className="text-xs text-sky-500">72% Complete</span>
              </div>
              <div className="space-y-4">
                {[
                  { day: 'Mon', subject: 'Physics', topic: 'Motion', done: true },
                  { day: 'Tue', subject: 'Chemistry', topic: 'Organic', done: true },
                  { day: 'Wed', subject: 'Biology', topic: 'Genetics', done: false, active: true },
                  { day: 'Thu', subject: 'Math', topic: 'Calculus', done: false }
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 p-3 rounded-xl border ${
                      row.active ? 'border-sky-300 bg-sky-50 dark:bg-sky-900/30' : 'border-sky-100 dark:border-sky-800/30'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        row.done
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-sky-100 text-sky-600 dark:bg-sky-800/60 dark:text-sky-300'
                      }`}
                    >
                      {row.done ? <Check size={14} /> : <div className="w-2 h-2 rounded-full bg-current"></div>}
                    </div>
                    <div className="w-10 text-xs font-bold text-sky-500">{row.day}</div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-sky-900 dark:text-sky-50">{row.subject}</div>
                      <div className="text-xs text-sky-500">{row.topic}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center scroll-animate">
            <div className="order-2 lg:order-1 bg-white dark:bg-[#0D1525] rounded-2xl shadow-xl border border-sky-100 dark:border-sky-800/20 p-6">
               <div className="mb-4 flex justify-between items-center">
                 <span className="text-xs font-bold text-sky-500">Question 42 of 50</span>
                 <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded">Medium</span>
               </div>
               <p className="text-sm font-medium mb-6 text-sky-900 dark:text-sky-50">Calculate the work done when a force of 20N moves a body through a distance of 5m in the direction of the force.</p>
               <div className="space-y-3 mb-6">
                 {['A. 100 J', 'B. 4 J', 'C. 25 J', 'D. 15 J'].map((opt, i) => (
                   <div
                     key={i}
                     className={`p-3 rounded-xl border text-sm transition-colors ${
                       i === 0
                         ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                         : 'border-sky-100 dark:border-sky-800/30 text-sky-700 dark:text-sky-200'
                     }`}
                   >
                     {opt}
                   </div>
                 ))}
               </div>
               <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4 border border-sky-100 dark:border-sky-800/30 flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-sky-200 dark:bg-sky-800 flex items-center justify-center shrink-0">
                   <Play size={14} className="text-sky-700 dark:text-sky-300 ml-0.5" fill="currentColor" />
                 </div>
                 <div>
                   <p className="text-xs font-bold text-sky-800 dark:text-sky-50 mb-1">Video Explanation</p>
                   <p className="text-xs text-sky-600 dark:text-sky-400">Watch tutor explain the formula W = F × d</p>
                 </div>
               </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-block px-3 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 text-xs font-bold mb-4">10,000+ Questions</div>
              <h3 className="font-[var(--font-syne)] text-3xl font-bold mb-4 text-sky-900 dark:text-sky-50">Every real past question. Explained.</h3>
              <p className="text-base leading-relaxed text-sky-700/80 dark:text-sky-300/80 max-w-md mb-6">
                Practice the exact questions that have appeared on JAMB, WAEC, NECO and JUPEB from 1989 to 2024. Every single question has a step-by-step video explanation so you understand, not just memorize.
              </p>
              <ul className="space-y-3">
                {['Organized by exam, year, subject and topic', 'Difficulty rated Easy, Medium, Hard', 'Video explanation for every question'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-sky-800 dark:text-sky-200">
                    <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center scroll-animate">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 text-xs font-bold mb-4">Stay Consistent</div>
              <h3 className="font-[var(--font-syne)] text-3xl font-bold mb-4 text-sky-900 dark:text-sky-50">Studying that actually feels addictive</h3>
              <p className="text-base leading-relaxed text-sky-700/80 dark:text-sky-300/80 max-w-md mb-6">
                It's hard to read when your friends are playing. Our fire streak tracks your daily hustle. Miss a day, and you lose your fire. Students who build a 30-day streak literally never fail their exams.
              </p>
              <ul className="space-y-3">
                {['Daily streak with fire animation', 'Milestone badges at 7, 14, 30, 60, 100 days', 'Friend leaderboards for competition'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-sky-800 dark:text-sky-200">
                    <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white dark:bg-[#0D1525] rounded-2xl shadow-xl border border-sky-100 dark:border-sky-800/20 p-8 text-center">
               <div className="text-6xl mb-4 animate-bounce" style={{animationDuration: '2s'}}>🔥</div>
               <div className="font-['Plus_Jakarta_Sans'] text-5xl font-black text-orange-500 mb-2">22</div>
               <div className="text-sm font-bold text-orange-600 dark:text-orange-400 mb-8">DAY STREAK</div>
               
               <div className="grid grid-cols-7 gap-2 mb-6">
                 {['M','T','W','T','F','S','S'].map((d,i) => <div key={i} className="text-xs font-bold text-sky-400">{d}</div>)}
                 {Array.from({ length: 21 }).map((_, i) => (
                   <div
                     key={i}
                     className={`aspect-square rounded-full ${
                       i < 12
                         ? 'bg-orange-500'
                         : i === 12
                         ? 'bg-orange-200 dark:bg-orange-900/40'
                         : 'bg-sky-100 dark:bg-sky-900/30'
                     }`}
                   />
                 ))}
               </div>
               
               <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-100 dark:border-orange-800/30 flex justify-between items-center">
                 <span className="text-xs font-bold text-orange-600 dark:text-orange-400">Next Milestone: 30 Days</span>
                 <span className="text-xs bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-lg">8 days left</span>
               </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center scroll-animate">
            <div className="order-2 lg:order-1 bg-white dark:bg-[#0D1525] rounded-2xl shadow-xl border border-sky-100 dark:border-sky-800/20 p-6">
               <div className="flex gap-2 mb-6">
                 <div className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs px-3 py-1 rounded-full font-bold">Basic</div>
                 <div className="bg-sky-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm">Normal</div>
                 <div className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs px-3 py-1 rounded-full font-bold">Deep</div>
               </div>
               
               <div className="space-y-4">
                 <div className="flex justify-end">
                   <div className="bg-sky-50 dark:bg-sky-900/20 text-sky-800 dark:text-sky-200 p-3 rounded-2xl rounded-tr-sm text-sm border border-sky-100 dark:border-sky-800/30 max-w-[85%]">
                     I don't understand osmosis. Can you explain it simply?
                   </div>
                 </div>
                 <div className="flex justify-start">
                   <div className="bg-sky-600 text-white p-3 rounded-2xl rounded-tl-sm text-sm shadow-md max-w-[85%]">
                     Imagine you have a pot of egusi soup that's too salty. If you add more water, the water moves in to balance the saltiness. Osmosis is just water moving across a barrier to balance things out
                   </div>
                 </div>
               </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-block px-3 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 text-xs font-bold mb-4">Your Smartest Friend</div>
              <h3 className="font-[var(--font-syne)] text-3xl font-bold mb-4 text-sky-900 dark:text-sky-50">A tutor that actually speaks your language</h3>
              <p className="text-base leading-relaxed text-sky-700/80 dark:text-sky-300/80 max-w-md mb-6">
                Ask any question and get an explanation that uses Nigerian examples (like Egusi soup or Danfo buses). Available at 2 AM the night before your exam when no human lesson teacher is awake.
              </p>
              <ul className="space-y-3">
                {['3 explanation levels you control', 'Nigerian analogies (egusi soup, NEPA, danfo)', 'Photo scan — point camera at any question'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-sky-800 dark:text-sky-200">
                    <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center scroll-animate">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 text-xs font-bold mb-4">AI Prediction</div>
              <h3 className="font-[var(--font-syne)] text-3xl font-bold mb-4 text-sky-900 dark:text-sky-50">Know your JAMB score before the exam</h3>
              <p className="text-base leading-relaxed text-sky-700/80 dark:text-sky-300/80 max-w-md mb-6">
                Beacon's AI analyses your accuracy, speed, topic coverage and mock exam performance to predict your actual JAMB score. Updated daily. Students whose prediction hit 300+ all passed.
              </p>
              <ul className="space-y-3">
                {['Updated daily as you practice', 'Shows what to fix to increase score', '89% prediction accuracy'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-sky-800 dark:text-sky-200">
                    <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white dark:bg-[#0D1525] rounded-2xl shadow-xl border border-sky-100 dark:border-sky-800/20 p-6">
               <div className="text-center mb-6">
                 <p className="text-sm font-bold text-sky-500 mb-2">CURRENT PREDICTION</p>
                 <div className="font-['Plus_Jakarta_Sans'] text-6xl font-black text-sky-700 dark:text-sky-300 mb-2">306</div>
                 <div className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-100 dark:border-green-800/30">
                   <span>↑</span> +12 points this week
                 </div>
               </div>
               
               <div className="space-y-4">
                 {[
                   { sub: 'Use of English', score: 82, color: 'bg-sky-500' },
                   { sub: 'Physics', score: 76, color: 'bg-amber-500' },
                   { sub: 'Chemistry', score: 68, color: 'bg-orange-500' },
                   { sub: 'Biology', score: 80, color: 'bg-sky-400' }
                 ].map((s, i) => (
                   <div key={i}>
                     <div className="flex justify-between text-xs font-bold mb-1">
                       <span className="text-sky-800 dark:text-sky-200">{s.sub}</span>
                       <span className="text-sky-600 dark:text-sky-400">{s.score}%</span>
                     </div>
                     <div className="w-full h-2 bg-sky-100 dark:bg-sky-900/30 rounded-full overflow-hidden">
                       <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.score}%` }}></div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-5 bg-sky-50/50 dark:bg-[#0A101D]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="font-[var(--font-syne)] text-4xl font-bold mb-4 text-sky-900 dark:text-sky-50">Get started in 3 minutes</h2>
            <p className="text-lg text-sky-700/80 dark:text-sky-300/80">No textbooks. No confusion. Just results.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {[
              {
                num: "1",
                title: "Create your account",
                desc: "Sign up in 30 seconds and take a 10-question diagnostic test. Beacon immediately understands your level."
              },
              {
                num: "2",
                title: "Get your personal study plan",
                desc: "AI builds a custom daily plan based on your diagnostic results, exam date, and subjects. Ready in seconds."
              },
              {
                num: "3",
                title: "Practice and watch your score climb",
                desc: "Follow your plan, practice daily, watch your predicted score rise. Students improve by 50+ points on average."
              }
            ].map((step, i) => (
              <div
                key={i}
                className="relative text-center scroll-animate"
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="w-14 h-14 rounded-full mx-auto mb-5 bg-sky-700 dark:bg-sky-600 text-white flex items-center justify-center font-bold text-xl relative z-10">
                  {step.num}
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 bg-gradient-to-r from-sky-300 to-sky-300 dark:from-sky-800 dark:to-sky-800 z-0"></div>
                )}
                <h3 className="font-[var(--font-syne)] font-bold text-xl mt-4 mb-2 text-sky-900 dark:text-sky-50">{step.title}</h3>
                <p className="text-sm text-sky-700/80 dark:text-sky-300/80 max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-5 max-w-7xl mx-auto">
        <div className="text-center mb-16 scroll-animate">
          <h2 className="font-[var(--font-syne)] text-4xl font-bold mb-4 text-sky-900 dark:text-sky-50">Real students. Real results.</h2>
          <p className="text-lg text-sky-700/80 dark:text-sky-300/80">These are actual Beacon students. Their scores speak for themselves.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "Beacon's AI tutor explained organic chemistry in a way my teacher never could. Went from failing to A1 in 8 weeks. I still can't believe it.",
              name: "Chioma Okafor",
              meta: "Lagos | WAEC 2024 | Score: A1",
              badge: "WAEC A1 ✓",
              initials: "CO"
            },
            {
              quote: "The streak system changed everything. I studied every single day for 45 days. My consistency jumped from 3 days a week to 7 days. 318 on JAMB.",
              name: "Tunde Olawale",
              meta: "Ibadan | JAMB 2024 | Score: 318",
              badge: "JAMB 318 ✓",
              initials: "TO"
            },
            {
              quote: "I stopped buying 5 different apps. Beacon is the only one that actually explains WHY an answer is correct. Passed WAEC with straight As.",
              name: "Zainab Mohammed",
              meta: "Kano | WAEC 2024 | Score: A1",
              badge: "WAEC A1 ✓",
              initials: "ZM"
            }
          ].map((t, i) => (
            <div key={i} className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-[rgba(14,165,233,0.12)] rounded-2xl p-6 shadow-[0_4px_20px_rgba(14,165,233,0.06)] flex flex-col justify-between scroll-animate" style={{ transitionDelay: `${i * 150}ms` }}>
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="text-amber-400 text-base">⭐⭐⭐⭐⭐</div>
                  <div className="bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30 font-['Plus_Jakarta_Sans'] font-bold text-xs px-2 py-1 rounded-full">
                    {t.badge}
                  </div>
                </div>
                <p className="text-base leading-relaxed italic text-sky-800 dark:text-sky-200 mb-8">"{t.quote}"</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {t.initials}
                </div>
                <div>
                  <h4 className="font-[var(--font-syne)] font-bold text-sm text-sky-900 dark:text-sky-50">{t.name}</h4>
                  <p className="text-xs text-sky-600 dark:text-sky-400">{t.meta}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-5 max-w-7xl mx-auto">
        <div className="text-center mb-12 scroll-animate">
          <h2 className="font-[var(--font-syne)] text-4xl font-bold mb-4 text-sky-900 dark:text-sky-50">Simple pricing. Full value.</h2>
          <p className="text-lg text-sky-700/80 dark:text-sky-300/80 mb-8">Less than one hour of private tuition. More than everything else combined.</p>
          
          <div className="inline-flex items-center p-1 rounded-full bg-sky-100 dark:bg-sky-900/30">
            <button 
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${!isAnnual ? 'bg-white dark:bg-sky-700 shadow-sm text-sky-900 dark:text-white' : 'text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200'}`}
            >
              Monthly
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${isAnnual ? 'bg-white dark:bg-sky-700 shadow-sm text-sky-900 dark:text-white' : 'text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200'}`}
              >
                Annual
              </button>
              <span className="absolute -top-3 -right-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap">Save 17%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {[
            {
              name: "SEEKER",
              price: "Free",
              features: ["500 practice questions", "Limited AI tutor (5/day)", "Basic streak system", "Global leaderboard"],
              missing: ["No personalized plan", "No score prediction"],
              cta: "Start Free",
              popular: false
            },
            {
              name: "BEACON",
              price: isAnnual ? "₦2,499" : "₦2,999",
              features: ["All 10,000+ questions", "All 5,000+ videos", "Unlimited AI tutor", "Personalized study plan", "Score prediction", "All 4 leaderboards", "Mock exams (unlimited)", "Offline downloads", "No ads"],
              cta: "Try 7 Days Free",
              popular: true
            },
            {
              name: "LUMINARY",
              price: isAnnual ? "₦4,999" : "₦5,999",
              features: ["Everything in Beacon", "PDF document learning", "Peer tutoring access", "Priority support", "Advanced analytics", "Export reports"],
              cta: "Try 7 Days Free",
              popular: false
            },
            {
              name: "NORTH STAR",
              price: isAnnual ? "₦8,299" : "₦9,999",
              features: ["Everything in Luminary", "Family plan (3 users)", "Custom mock exams", "24/7 phone support", "Handwriting recognition", "Math camera solver", "Verified certificate"],
              cta: "Try 3 Days Free",
              popular: false
            }
          ].map((tier, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-7 transition-all duration-300 scroll-animate ${
                tier.popular
                  ? 'bg-sky-700 text-white shadow-[0_16px_40px_rgba(3,105,161,0.4)] dark:bg-sky-600 dark:shadow-[0_16px_40px_rgba(14,165,233,0.3)] z-10'
                  : 'bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-[rgba(14,165,233,0.12)]'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-xs font-bold font-[var(--font-syne)] rounded-full px-4 py-1 whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <h3 className="font-[var(--font-syne)] font-bold text-lg mb-4 text-inherit">{tier.name}</h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="font-['Plus_Jakarta_Sans'] text-3xl font-black">{tier.price}</span>
                {tier.price !== "Free" && <span className="text-sm opacity-60">/month</span>}
              </div>
              <ul className="space-y-3 mb-8">
                {tier.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm leading-relaxed">
                    <Check size={16} className={`shrink-0 mt-0.5 ${tier.popular ? 'text-sky-300' : 'text-green-500'}`} />
                    <span>{f}</span>
                  </li>
                ))}
                {tier.missing && tier.missing.map((m, j) => (
                  <li key={`m${j}`} className="flex items-start gap-2 text-sm leading-relaxed opacity-50">
                    <X size={16} className="shrink-0 mt-0.5" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 ${tier.popular ? 'bg-white text-sky-800 hover:bg-sky-50' : tier.price === 'Free' ? 'bg-transparent border border-sky-200 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-900/30' : 'bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-900/50 dark:text-sky-200 dark:hover:bg-sky-800/50'}`}>
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 px-5 bg-gradient-to-br from-sky-700 via-sky-800 to-sky-900 dark:from-sky-900 dark:via-[#080C14] dark:to-[#0C4A6E] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05),transparent_50%)]"></div>
        <div className="relative z-10 max-w-3xl mx-auto text-center scroll-animate">
          <h2 className="font-[var(--font-syne)] text-4xl md:text-5xl font-bold text-white dark:text-sky-50 mb-4 leading-tight">
            Your exam is coming.<br/>Are you ready?
          </h2>
          <p className="text-lg text-sky-200 max-w-xl mx-auto mb-10">
            4,800+ students are studying smarter with Beacon right now. Join them before your exam date. It takes 3 minutes to get started.
          </p>
          <Link to={getStartedPath} className="group inline-flex items-center gap-2 bg-white text-sky-800 hover:bg-sky-50 font-[var(--font-syne)] font-bold text-lg px-10 py-4 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 focus:ring-4 focus:ring-white/30">
            {startStudyingLabel}
            <ArrowRight size={20} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <p className="text-sm text-sky-300 mt-4">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sky-900 dark:bg-[#050810] pt-16 pb-8 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="4" fill="#0369A1"/>
                    <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="#0369A1" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="font-[var(--font-syne)] font-bold text-white tracking-tight">BEACON</span>
              </div>
              <p className="text-sm text-sky-300 mb-2">Your path to exam success</p>
              <p className="text-xs text-sky-400 leading-relaxed max-w-xs mb-6">
                Built specifically for Nigerian students preparing for JAMB, WAEC, NECO, Post-UTME and JUPEB.
              </p>
              <div className="flex gap-3">
                {[Twitter, Instagram, MessageCircle].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-9 h-9 rounded-lg bg-sky-800 hover:bg-sky-700 flex items-center justify-center transition-colors"
                  >
                    <Icon size={16} className="text-sky-300" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-[var(--font-syne)] font-bold text-sm text-sky-200 mb-4">Product</h4>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'How it Works', 'Download App'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-sky-400 hover:text-sky-200 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-[var(--font-syne)] font-bold text-sm text-sky-200 mb-4">Company</h4>
              <ul className="space-y-3">
                {['About', 'Blog', 'Careers', 'Contact Us'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-sky-400 hover:text-sky-200 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-[var(--font-syne)] font-bold text-sm text-sky-200 mb-4">Legal</h4>
              <ul className="space-y-3">
                {['Privacy Policy', 'Terms of Service', 'Refund Policy', 'Cookie Policy'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-sky-400 hover:text-sky-200 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-sky-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-sky-500">© 2025 Beacon. All rights reserved.</p>
            <p className="text-xs text-sky-500">Developed by <a href="https://kingsleydestiny.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-white underline underline-offset-2 transition-colors">Destiny Kingsley</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}

