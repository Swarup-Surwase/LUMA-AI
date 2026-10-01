import React, { useState, useEffect, useRef } from 'react';
import { useLuma } from '../../context/LumaStateContext';
import { Language } from '../../types/luma';
import {
  ArrowRight,
  Hand,
  ArrowUp,
  Heart,
  Sliders
} from 'lucide-react';

interface MotionFooterProps {
  onOpenAccessibility: () => void;
  onOpenOnboarding: () => void;
}

export const MotionFooter: React.FC<MotionFooterProps> = ({
  onOpenAccessibility,
  onOpenOnboarding
}) => {
  const { setActiveModule, preferences, updatePreferences } = useLuma();
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLElement | null>(null);

  const lang = preferences.language;
  const isHighContrast = preferences.highContrast;
  const isReducedMotion = preferences.motionIntensity === 0;

  // Parallax on Giant Background Typography
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (isReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x: x * 20, y: y * 12 });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: isReducedMotion ? 'auto' : 'smooth'
    });
    // Move focus to skip target
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.tabIndex = -1;
      mainContent.focus({ preventScroll: true });
    }
  };

  // Translations for Footer
  const footerContent = {
    en: {
      headline: "Ready to begin?",
      subcopy: "Speak, sign, or look. LUMA does the rest.",
      startBtn: "Start with LUMA",
      emergencyBtn: "Emergency Sign",
      marqueeItems: [
        "VOICE FORMS",
        "INDIAN SIGN LANGUAGE",
        "HANDS-FREE ACCESS",
        "VISUAL NARRATOR",
        "DOCUMENT SIMPLIFIER",
        "EN · हिन्दी · मराठी",
        "BUILT FOR EVERYONE"
      ],
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      support: "Support",
      accessibility: "Accessibility Statement",
      preferences: "Preferences",
      copyright: `© ${new Date().getFullYear()} LUMA. ALL RIGHTS RESERVED.`,
      crafted: "CRAFTED WITH",
      team: "BY LUMA TEAM",
      backToTop: "Back to top"
    },
    hi: {
      headline: "शुरू करने के लिए तैयार?",
      subcopy: "बोलें, संकेत करें या देखें। LUMA बाकी सब संभालता है।",
      startBtn: "LUMA शुरू करें",
      emergencyBtn: "आपातकालीन संकेत",
      marqueeItems: [
        "ध्वनि प्रपत्र",
        "भारतीय सांकेतिक भाषा",
        "हैंड्स-फ्री एक्सेस",
        "विजुअल नेरेटर",
        "दस्तावेज़ सरलीकरण",
        "EN · हिन्दी · मराठी",
        "सभी के लिए निर्मित"
      ],
      privacy: "गोपनीयता नीति",
      terms: "सेवा की शर्तें",
      support: "सहायता",
      accessibility: "सुलभता विवरण",
      preferences: "प्राथमिकताएं",
      copyright: `© ${new Date().getFullYear()} LUMA. सर्वाधिकार सुरक्षित।`,
      crafted: "स्नेह से निर्मित",
      team: "LUMA टीम द्वारा",
      backToTop: "शीर्ष पर जाएं"
    },
    mr: {
      headline: "सुरू करायला तयार?",
      subcopy: "बोला, खूण करा किंवा पहा. LUMA सर्व काही सुलभ करते.",
      startBtn: "LUMA सुरू करा",
      emergencyBtn: "आपत्कालीन खूण",
      marqueeItems: [
        "व्हॉइस फॉर्म",
        "भारतीय सांकेतिक भाषा",
        "हँड्स-फ्री ॲक्सेस",
        "व्हिज्युअल नरेटर",
        "दस्तऐवज सुलभीकरण",
        "EN · हिन्दी · मराठी",
        "सर्वांसाठी समर्पित"
      ],
      privacy: "गोपनीयता धोरण",
      terms: "सेवा अटी",
      support: "मदत",
      accessibility: "सुलभता विधान",
      preferences: "पसंती",
      copyright: `© ${new Date().getFullYear()} LUMA. सर्व हक्क राखीव.`,
      crafted: "आपुलकीने निर्मित",
      team: "LUMA टीम द्वारे",
      backToTop: "वर जा"
    }
  }[lang];

  const starColors = ['#E8DCC8', '#8FB8A0', '#8FB5D6', '#E9B44C'];

  return (
    <footer
      role="contentinfo"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full bg-[#0C0B0A] text-[#F4EEE3] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      {/* Outer Large Rounded Frame Container */}
      <div
        className={`max-w-7xl mx-auto rounded-[32px] relative overflow-hidden transition-all duration-300 ${
          isHighContrast
            ? 'bg-[#000000] border-2 border-[#FFFFFF]'
            : 'bg-[#0C0B0A] border border-[#2A2622] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.95)]'
        }`}
      >
        {/* ============================================================
            1. BACKGROUND DECORATIVE LAYERS (ARIA-HIDDEN)
           ============================================================ */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {/* Faint 64px Grid Texture with Radial Edge Fade */}
          {!isHighContrast && (
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(244, 238, 227, 0.04) 1px, transparent 1px),
                                  linear-gradient(to bottom, rgba(244, 238, 227, 0.04) 1px, transparent 1px)`,
                backgroundSize: '64px 64px',
                maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)'
              }}
            />
          )}

          {/* Soft Warm Champagne Radial Glow Behind Hero Headline */}
          {!isHighContrast && (
            <div
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full filter blur-[90px] opacity-70"
              style={{
                background: 'radial-gradient(circle, rgba(232, 220, 200, 0.10) 0%, rgba(143, 184, 160, 0.03) 45%, transparent 70%)'
              }}
            />
          )}

          {/* Giant Outlined Display Typography "LUMA" */}
          <div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center whitespace-nowrap transition-transform duration-500 ease-out will-change-transform"
            style={{
              transform: `translate(calc(-50% + ${mousePos.x}px), ${mousePos.y}px)`,
              fontSize: 'min(28vw, 360px)',
              lineHeight: '0.8',
              fontWeight: '900',
              fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
              letterSpacing: '-0.04em',
              color: 'transparent',
              WebkitTextStroke: isHighContrast ? '2px #FFFFFF' : '1px rgba(244, 238, 227, 0.07)'
            }}
          >
            LUMA
          </div>
        </div>

        {/* ============================================================
            2. TILTED MARQUEE BAND (TOP)
           ============================================================ */}
        <div
          className="relative z-10 w-full overflow-hidden border-b border-[#2A2622] bg-[#F4EEE3]/[0.03] backdrop-blur-[12px] py-4"
          style={{
            transform: 'rotate(-2deg) scale(1.04)',
            marginTop: '-6px',
            marginBottom: '16px'
          }}
          aria-label="LUMA capabilities"
        >
          <div className="flex w-max select-none animate-marquee hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
            {/* First Set of Tilted Items */}
            <div className="flex items-center gap-8 px-4 text-xs sm:text-sm font-semibold tracking-[0.25em] text-[#B3A999] uppercase font-display">
              {footerContent.marqueeItems.map((item, idx) => (
                <React.Fragment key={`marquee-1-${idx}`}>
                  <span>{item}</span>
                  <span
                    className="inline-block text-xs transition-transform duration-300 opacity-80"
                    style={{ color: starColors[idx % starColors.length] }}
                  >
                    ✦
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Duplicate Set for Seamless Infinite Scroll (Aria-Hidden) */}
            <div
              aria-hidden="true"
              className="flex items-center gap-8 px-4 text-xs sm:text-sm font-semibold tracking-[0.25em] text-[#B3A999] uppercase font-display"
            >
              {footerContent.marqueeItems.map((item, idx) => (
                <React.Fragment key={`marquee-2-${idx}`}>
                  <span>{item}</span>
                  <span
                    className="inline-block text-xs opacity-80"
                    style={{ color: starColors[idx % starColors.length] }}
                  >
                    ✦
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================
            3. HERO BLOCK (CENTERED)
           ============================================================ */}
        <div className="relative z-10 px-6 sm:px-12 lg:px-16 pt-12 sm:pt-16 pb-12 text-center space-y-8">
          {/* Main Headline */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h2
              className={`text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight font-display ${
                isHighContrast
                  ? 'text-[#FFFFFF]'
                  : 'bg-gradient-to-b from-[#F4EEE3] via-[#E8DCC8] to-[#A89E8C] bg-clip-text text-transparent'
              }`}
            >
              {footerContent.headline}
            </h2>
            <p className="text-base sm:text-lg text-[#B3A999] max-w-xl mx-auto font-normal leading-relaxed">
              {footerContent.subcopy}
            </p>
          </div>

          {/* Two Primary Action Pill Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 max-w-md mx-auto sm:max-w-none">
            {/* Button A: "Start with LUMA" */}
            <button
              onClick={onOpenOnboarding}
              className="w-full sm:w-auto h-16 px-8 rounded-full bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-bold text-base flex items-center justify-center gap-3 transition-all duration-200 hover:-translate-y-1 shadow-[0_4px_20px_rgba(232,220,200,0.25)] focus-visible:ring-3 focus-visible:ring-[#E8DCC8] cursor-pointer"
            >
              <span>{footerContent.startBtn}</span>
              <ArrowRight className="w-5 h-5 text-[#14110D]" />
            </button>

            {/* Button B: "Emergency Sign" */}
            <button
              onClick={() => setActiveModule('sign_language')}
              className="w-full sm:w-auto h-16 px-8 rounded-full bg-[#1D1A17] hover:bg-[#2A2622] border border-[#E07A5F] text-[#E07A5F] hover:text-[#F4EEE3] font-bold text-base flex items-center justify-center gap-3 transition-all duration-200 hover:-translate-y-1 shadow-lg focus-visible:ring-3 focus-visible:ring-[#E07A5F] cursor-pointer"
            >
              <Hand className="w-5 h-5 text-[#E07A5F]" />
              <span>{footerContent.emergencyBtn}</span>
            </button>
          </div>

          {/* ============================================================
              4. PILL LINKS ROW (CENTERED, WRAPS)
             ============================================================ */}
          <nav aria-label="Footer" className="pt-8 max-w-4xl mx-auto">
            <ul className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              {[
                { label: footerContent.privacy, href: '#privacy' },
                { label: footerContent.terms, href: '#terms' },
                { label: footerContent.support, href: '#support' },
                { label: footerContent.accessibility, href: '#accessibility' },
                {
                  label: footerContent.preferences,
                  onClick: onOpenAccessibility,
                  icon: <Sliders className="w-4 h-4 text-[#E8DCC8]" />
                }
              ].map((link, idx) => (
                <li key={idx}>
                  {link.onClick ? (
                    <button
                      onClick={link.onClick}
                      className="h-12 px-6 rounded-full bg-[#151311] hover:bg-[#1D1A17] border border-[#2A2622] hover:border-[#E8DCC8] text-xs sm:text-sm font-medium text-[#D8CFBF] hover:text-[#F4EEE3] flex items-center gap-2 transition-all duration-200 cursor-pointer focus-visible:ring-3 focus-visible:ring-[#E8DCC8]"
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </button>
                  ) : (
                    <a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        onOpenAccessibility();
                      }}
                      className="h-12 px-6 rounded-full bg-[#151311] hover:bg-[#1D1A17] border border-[#2A2622] hover:border-[#E8DCC8] text-xs sm:text-sm font-medium text-[#D8CFBF] hover:text-[#F4EEE3] flex items-center transition-all duration-200 focus-visible:ring-3 focus-visible:ring-[#E8DCC8]"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}

              {/* Language Switcher Pill */}
              <li>
                <div className="h-12 px-3 rounded-full bg-[#151311] border border-[#2A2622] flex items-center gap-1">
                  {(['en', 'hi', 'mr'] as Language[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => updatePreferences({ language: l })}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        preferences.language === l
                          ? 'bg-[#E8DCC8] text-[#14110D]'
                          : 'text-[#B3A999] hover:text-[#F4EEE3]'
                      }`}
                      aria-label={`Switch language to ${l === 'en' ? 'English' : l === 'hi' ? 'Hindi' : 'Marathi'}`}
                    >
                      {l === 'en' ? 'EN' : l === 'hi' ? 'हि' : 'म'}
                    </button>
                  ))}
                </div>
              </li>
            </ul>
          </nav>

          {/* ============================================================
              5. BOTTOM BAR (3 COLUMNS DESKTOP, STACKED MOBILE)
             ============================================================ */}
          <div className="pt-10 mt-8 border-t border-[#2A2622] flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#B3A999]">
            {/* Left: Copyright */}
            <div className="tracking-wider uppercase font-mono text-[11px] text-center md:text-left">
              {footerContent.copyright}
            </div>

            {/* Center: Team Attribution with Heart */}
            <div className="h-10 px-5 rounded-full bg-[#151311] border border-[#2A2622] flex items-center gap-2 font-semibold text-[11px] tracking-wide text-[#D8CFBF]">
              <span>{footerContent.crafted}</span>
              <Heart className="w-3.5 h-3.5 fill-[#E07A5F] text-[#E07A5F]" aria-hidden="true" />
              <span className="sr-only">love</span>
              <span>{footerContent.team}</span>
            </div>

            {/* Right: Round 56px Back-to-Top Button */}
            <button
              onClick={handleScrollToTop}
              className="w-14 h-14 rounded-full bg-[#1D1A17] hover:bg-[#2A2622] border border-[#2A2622] hover:border-[#E8DCC8] text-[#F4EEE3] hover:text-[#E8DCC8] flex items-center justify-center transition-all duration-200 hover:-translate-y-1 shadow-md focus-visible:ring-3 focus-visible:ring-[#E8DCC8] cursor-pointer"
              aria-label={footerContent.backToTop}
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
