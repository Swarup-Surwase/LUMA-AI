import React, { useState, useEffect, useRef } from 'react';
import { useLuma } from '../../context/LumaStateContext';
import { Language, ActiveModule } from '../../types/luma';
import {
  Sliders,
  ChevronDown,
  Menu,
  X,
  FileText,
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface NavbarProps {
  onOpenAccessibility: () => void;
  onOpenOnboarding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAccessibility,
  onOpenOnboarding
}) => {
  const {
    activeModule,
    setActiveModule,
    preferences,
    updatePreferences,
    setCoreState
  } = useLuma();

  const [isScrolled, setIsScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setCoreState('TRANSLATE', `Language: ${lang.toUpperCase()}`);
    updatePreferences({ language: lang });
    setTimeout(() => {
      setCoreState('IDLE');
    }, 1000);
  };

  const primaryNavItems: { id: ActiveModule; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'sign_language', label: 'Sign Language' },
    { id: 'hands_free_gaze', label: 'Hands-Free' },
    { id: 'voice_forms', label: 'Voice Forms' }
  ];

  const moreNavItems: { id: ActiveModule; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'document_simplifier',
      label: 'Document Simplifier',
      desc: 'Simplify legal and official notices into plain language',
      icon: <FileText className="w-4 h-4 text-[#E8DCC8]" />
    },
    {
      id: 'showcase',
      label: 'Showcase Sandbox',
      desc: 'Interactive 3D orb states and system capabilities',
      icon: <Sparkles className="w-4 h-4 text-[#E8DCC8]" />
    }
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0C0B0A]/90 backdrop-blur-2xl border-b border-[#2A2622] shadow-[0_4px_24px_rgba(0,0,0,0.8)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo Left */}
        <button
          onClick={() => setActiveModule('home')}
          className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#E8DCC8] rounded-2xl p-1 cursor-pointer"
          aria-label="LUMA Home"
        >
          <div className="w-9 h-9 rounded-2xl bg-[#E8DCC8] text-[#14110D] flex items-center justify-center shadow-[0_0_15px_rgba(232,220,200,0.25)] group-hover:scale-105 transition-transform duration-200">
            <span className="font-display font-extrabold text-base tracking-tight text-[#14110D]">L</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-[#F4EEE3] font-display">
            LUMA
          </span>
        </button>

        {/* Centered Navigation Items */}
        <nav className="hidden lg:flex items-center gap-1.5 p-1.5 rounded-full bg-[#151311] border border-[#2A2622] shadow-lg backdrop-blur-xl">
          {primaryNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                activeModule === item.id
                  ? 'bg-[#E8DCC8] text-[#14110D] shadow-[0_0_12px_rgba(232,220,200,0.2)]'
                  : 'text-[#B3A999] hover:text-[#F4EEE3] hover:bg-[#1D1A17]'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* "More" Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                ['document_simplifier', 'showcase'].includes(activeModule)
                  ? 'bg-[#E8DCC8] text-[#14110D] shadow-[0_0_12px_rgba(232,220,200,0.2)]'
                  : 'text-[#B3A999] hover:text-[#F4EEE3] hover:bg-[#1D1A17]'
              }`}
              aria-expanded={moreOpen}
            >
              <span>More</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 p-2 rounded-[24px] bg-[#151311] backdrop-blur-2xl border border-[#2A2622] shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {moreNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setMoreOpen(false);
                    }}
                    className={`w-full p-3 rounded-2xl text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      activeModule === item.id
                        ? 'bg-[#1D1A17] text-[#E8DCC8] border border-[#E8DCC8]/30'
                        : 'hover:bg-[#1D1A17] text-[#F4EEE3]'
                    }`}
                  >
                    <div className="mt-0.5">{item.icon}</div>
                    <div>
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className={`text-[11px] leading-tight ${activeModule === item.id ? 'text-[#E8DCC8]/80' : 'text-[#B3A999]'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right Side: Language Switcher, Accessibility Sheet & Primary Action */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Language Switcher Pill */}
          <div className="flex items-center p-1 rounded-full bg-[#080706] border border-[#2A2622] shadow-xs">
            {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  preferences.language === lang
                    ? 'bg-[#E8DCC8] text-[#14110D] shadow-xs'
                    : 'text-[#B3A999] hover:text-[#F4EEE3]'
                }`}
                title={lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
              >
                {lang === 'en' ? 'EN' : lang === 'hi' ? 'हि' : 'म'}
              </button>
            ))}
          </div>

          {/* Accessibility Side Sheet Trigger */}
          <button
            onClick={onOpenAccessibility}
            className="w-10 h-10 rounded-full bg-[#151311] hover:bg-[#1D1A17] border border-[#2A2622] flex items-center justify-center text-[#F4EEE3] hover:text-[#E8DCC8] shadow-xs transition-colors cursor-pointer focus-visible:ring-3 focus-visible:ring-[#E8DCC8]"
            title="Accessibility & Comfort Settings"
            aria-label="Open accessibility settings sheet"
          >
            <Sliders className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Primary Action Button: "Try LUMA" */}
          <button
            onClick={onOpenOnboarding}
            className="px-5 py-2 rounded-full bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-bold text-xs shadow-[0_0_15px_rgba(232,220,200,0.25)] transition-all cursor-pointer focus-visible:ring-3 focus-visible:ring-[#E8DCC8]"
          >
            <span>Try LUMA</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={onOpenAccessibility}
            className="w-9 h-9 rounded-full bg-[#151311] border border-[#2A2622] flex items-center justify-center text-[#F4EEE3]"
            aria-label="Accessibility settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 rounded-full bg-[#151311] border border-[#2A2622] flex items-center justify-center text-[#F4EEE3]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#2A2622] bg-[#151311]/95 backdrop-blur-2xl p-6 space-y-4 shadow-2xl">
          <div className="space-y-1">
            {[...primaryNavItems, ...moreNavItems].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveModule(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full min-h-[48px] px-4 rounded-2xl text-left font-bold text-sm flex items-center justify-between transition-colors ${
                  activeModule === item.id
                    ? 'bg-[#E8DCC8] text-[#14110D]'
                    : 'text-[#F4EEE3] hover:bg-[#1D1A17]'
                }`}
              >
                <span>{item.label}</span>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-[#2A2622] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    preferences.language === lang
                      ? 'bg-[#E8DCC8] text-[#14110D]'
                      : 'bg-[#080706] text-[#B3A999] border border-[#2A2622]'
                  }`}
                >
                  {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                onOpenOnboarding();
                setMobileMenuOpen(false);
              }}
              className="px-4 py-2 rounded-full bg-[#E8DCC8] text-[#14110D] font-bold text-xs"
            >
              Try LUMA
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
