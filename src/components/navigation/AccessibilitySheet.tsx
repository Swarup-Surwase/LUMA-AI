import React from 'react';
import { useLuma } from '../../context/LumaStateContext';
import { TextScale, MotionIntensity, Language } from '../../types/luma';
import {
  X,
  Eye,
  Sliders,
  Type,
  Zap,
  Globe,
  Check,
  RotateCcw
} from 'lucide-react';

interface AccessibilitySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onReplayIntro?: () => void;
}

export const AccessibilitySheet: React.FC<AccessibilitySheetProps> = ({
  isOpen,
  onClose,
  onReplayIntro
}) => {
  const { preferences, updatePreferences, speak } = useLuma();

  if (!isOpen) return null;

  const handleTextScale = (scale: TextScale) => {
    updatePreferences({ textScale: scale });
  };

  const handleContrastToggle = () => {
    const next = !preferences.highContrast;
    updatePreferences({ highContrast: next });
    speak(next ? 'High contrast mode enabled' : 'Standard contrast mode restored');
  };

  const handleMotionChange = (intensity: MotionIntensity) => {
    updatePreferences({ motionIntensity: intensity });
    speak(intensity === 0 ? 'Reduced motion enabled' : 'Motion restored');
  };

  const handleLanguageChange = (lang: Language) => {
    updatePreferences({ language: lang });
    const langNames: Record<Language, string> = {
      en: 'English selected',
      hi: 'हिंदी चुनी गई',
      mr: 'मराठी निवडली'
    };
    speak(langNames[lang]);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end transition-all">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#0C0B0A]/80 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-out Glass Sheet */}
      <div
        role="dialog"
        aria-label="Accessibility & Comfort Settings"
        aria-modal="true"
        className="relative z-10 w-full max-w-md h-full bg-[#151311] border-l border-[#2A2622] shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto text-[#F4EEE3]"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#2A2622]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#E8DCC8]/15 text-[#E8DCC8] border border-[#E8DCC8]/30 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#F4EEE3] font-display">
                  Accessibility Sheet
                </h2>
                <p className="text-xs text-[#B3A999]">
                  Custom controls for vision, hearing, and motion
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#1D1A17] hover:bg-[#2A2622] flex items-center justify-center text-[#B3A999] hover:text-[#F4EEE3] transition-colors cursor-pointer"
              aria-label="Close accessibility sheet"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 1. Text Size Scaling */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#F4EEE3] flex items-center gap-2">
                <Type className="w-4 h-4 text-[#E8DCC8]" />
                <span>Text Size</span>
              </span>
              <span className="text-xs font-semibold text-[#E8DCC8]">
                {Math.round(preferences.textScale * 100)}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 1.25, 1.5, 1.75].map((scale) => (
                <button
                  key={scale}
                  onClick={() => handleTextScale(scale as TextScale)}
                  className={`min-h-[48px] rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    preferences.textScale === scale
                      ? 'bg-[#E8DCC8] text-[#14110D] shadow-xs'
                      : 'bg-[#1D1A17] text-[#B3A999] hover:text-[#F4EEE3] border border-[#2A2622]'
                  }`}
                >
                  {scale === 1 ? 'Default' : `${Math.round(scale * 100)}%`}
                </button>
              ))}
            </div>
          </div>

          {/* 2. High Contrast Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#F4EEE3] flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#E8DCC8]" />
                <span>High Contrast Mode</span>
              </span>
            </div>
            <button
              onClick={handleContrastToggle}
              className={`w-full min-h-[52px] px-4 rounded-2xl border font-bold text-sm flex items-center justify-between transition-all cursor-pointer ${
                preferences.highContrast
                  ? 'bg-[#E8DCC8] text-[#14110D] border-[#E8DCC8] shadow-md'
                  : 'bg-[#1D1A17] text-[#F4EEE3] border-[#2A2622] hover:border-[#E8DCC8]/40'
              }`}
            >
              <span>{preferences.highContrast ? 'High Contrast Active' : 'Standard Contrast'}</span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${preferences.highContrast ? 'bg-[#14110D] text-[#E8DCC8]' : 'bg-[#2A2622]'}`}>
                {preferences.highContrast ? <Check className="w-3.5 h-3.5" /> : null}
              </span>
            </button>
          </div>

          {/* 3. Reduced Motion */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#F4EEE3] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#E8DCC8]" />
                <span>Motion & Animations</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleMotionChange(0)}
                className={`min-h-[48px] rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                  preferences.motionIntensity === 0
                    ? 'bg-[#E8DCC8] text-[#14110D] shadow-xs'
                    : 'bg-[#1D1A17] text-[#B3A999] hover:text-[#F4EEE3] border border-[#2A2622]'
                }`}
              >
                Reduced Motion
              </button>
              <button
                onClick={() => handleMotionChange(2)}
                className={`min-h-[48px] rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                  preferences.motionIntensity !== 0
                    ? 'bg-[#E8DCC8] text-[#14110D] shadow-xs'
                    : 'bg-[#1D1A17] text-[#B3A999] hover:text-[#F4EEE3] border border-[#2A2622]'
                }`}
              >
                Fluid Motion
              </button>
            </div>
          </div>

          {/* 4. Language Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#F4EEE3] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#E8DCC8]" />
                <span>Preferred Language</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'en', label: 'English', sub: 'EN' },
                { code: 'hi', label: 'हिंदी', sub: 'HI' },
                { code: 'mr', label: 'मराठी', sub: 'MR' }
              ].map((item) => (
                <button
                  key={item.code}
                  onClick={() => handleLanguageChange(item.code as Language)}
                  className={`min-h-[54px] rounded-2xl flex flex-col items-center justify-center p-2 font-bold transition-all cursor-pointer ${
                    preferences.language === item.code
                      ? 'bg-[#E8DCC8] text-[#14110D] shadow-xs'
                      : 'bg-[#1D1A17] text-[#B3A999] hover:text-[#F4EEE3] border border-[#2A2622]'
                  }`}
                >
                  <span className="text-sm">{item.label}</span>
                  <span className="text-[10px] opacity-75 font-mono">{item.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info & Replay Intro */}
        <div className="pt-6 border-t border-[#2A2622] space-y-2">
          {onReplayIntro && (
            <button
              onClick={() => {
                onClose();
                onReplayIntro();
              }}
              className="w-full min-h-[44px] rounded-2xl bg-[#E8DCC8]/15 hover:bg-[#E8DCC8]/25 text-[#E8DCC8] border border-[#E8DCC8]/30 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Replay Intro Experience</span>
            </button>
          )}
          <button
            onClick={() => {
              updatePreferences({
                textScale: 1,
                highContrast: false,
                motionIntensity: 2,
                language: 'en'
              });
              speak('Accessibility preferences reset to default');
            }}
            className="w-full min-h-[44px] rounded-2xl bg-[#1D1A17] hover:bg-[#2A2622] text-[#B3A999] hover:text-[#F4EEE3] border border-[#2A2622] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};
