import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLuma } from '../../context/LumaStateContext';
import { translations } from '../../locales/translations';
import { MotionIntensity, TextScale } from '../../types/luma';
import {
  X,
  Eye,
  Type,
  Activity,
  Volume2,
  Clock,
  Keyboard,
  ShieldCheck,
  Check
} from 'lucide-react';

interface AccessibilityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityDrawer: React.FC<AccessibilityDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const { preferences, updatePreferences, speak } = useLuma();
  const t = translations[preferences.language];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0C0B0A]/80 backdrop-blur-sm"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative z-10 w-full max-w-md bg-[#151311] border-l border-[#2A2622] p-6 overflow-y-auto shadow-2xl flex flex-col justify-between text-[#F4EEE3]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="accessibility-title"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#2A2622]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-[#E8DCC8]/15 text-[#E8DCC8] border border-[#E8DCC8]/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="accessibility-title" className="text-lg font-bold text-[#F4EEE3] font-display">
                    {t.accessibility.title}
                  </h2>
                  <p className="text-xs text-[#B3A999] font-medium">
                    Customize your comfort and interaction
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-[#1D1A17] text-[#B3A999] hover:text-[#F4EEE3] border border-[#2A2622] hover:bg-[#2A2622] transition-all cursor-pointer"
                aria-label={t.accessibility.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. High Contrast Mode */}
            <div className="p-4 rounded-2xl border border-[#2A2622] bg-[#080706]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-[#E8DCC8]" />
                  <div>
                    <span className="text-sm font-bold text-[#F4EEE3] block">
                      {t.accessibility.highContrast}
                    </span>
                    <span className="text-xs text-[#B3A999]">
                      WCAG AAA high-contrast border and text mode
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => updatePreferences({ highContrast: !preferences.highContrast })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors relative cursor-pointer ${
                    preferences.highContrast ? 'bg-[#E8DCC8]' : 'bg-[#2A2622]'
                  }`}
                  role="switch"
                  aria-checked={preferences.highContrast}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-[#14110D] transition-transform ${
                      preferences.highContrast ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 2. Text Scaling */}
            <div className="p-4 rounded-2xl border border-[#2A2622] bg-[#080706] space-y-3">
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-[#E8DCC8]" />
                <div>
                  <span className="text-sm font-bold text-[#F4EEE3] block">
                    {t.accessibility.textScale}
                  </span>
                  <span className="text-xs text-[#B3A999]">
                    Adjust comfortable reading scale
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {([1, 1.25, 1.5, 1.75] as TextScale[]).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => updatePreferences({ textScale: scale })}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      preferences.textScale === scale
                        ? 'bg-[#E8DCC8] border-[#E8DCC8] text-[#14110D] shadow-xs'
                        : 'bg-[#1D1A17] border-[#2A2622] text-[#B3A999] hover:text-[#F4EEE3] hover:bg-[#2A2622]'
                    }`}
                  >
                    {scale * 100}%
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Central Motion System Intensity */}
            <div className="p-4 rounded-2xl border border-[#2A2622] bg-[#080706] space-y-3">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-[#E8DCC8]" />
                <div>
                  <span className="text-sm font-bold text-[#F4EEE3] block">
                    {t.accessibility.motionIntensity}
                  </span>
                  <span className="text-xs text-[#B3A999]">
                    Controls orbital speed and 3D effects
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 pt-1">
                {([
                  { level: 0, label: t.accessibility.motionReduced },
                  { level: 1, label: t.accessibility.motionCalm },
                  { level: 2, label: t.accessibility.motionNormal },
                  { level: 3, label: t.accessibility.motionExpressive },
                  { level: 4, label: t.accessibility.motionShowcase }
                ] as { level: MotionIntensity; label: string }[]).map((item) => (
                  <button
                    key={item.level}
                    onClick={() => updatePreferences({ motionIntensity: item.level })}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all border cursor-pointer ${
                      preferences.motionIntensity === item.level
                        ? 'bg-[rgba(232,220,200,0.10)] border-[#E8DCC8] text-[#E8DCC8] shadow-xs'
                        : 'bg-[#1D1A17] border-[#2A2622] text-[#B3A999] hover:text-[#F4EEE3] hover:bg-[#2A2622]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {preferences.motionIntensity === item.level && (
                      <Check className="w-4 h-4 text-[#E8DCC8] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Speech Audio Readout */}
            <div className="p-4 rounded-2xl border border-[#2A2622] bg-[#080706] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-[#E8DCC8]" />
                  <div>
                    <span className="text-sm font-bold text-[#F4EEE3] block">
                      {t.accessibility.speechAudio}
                    </span>
                    <span className="text-xs text-[#B3A999]">
                      {t.accessibility.autoSpeakDesc}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => updatePreferences({ autoSpeak: !preferences.autoSpeak })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors relative cursor-pointer ${
                    preferences.autoSpeak ? 'bg-[#E8DCC8]' : 'bg-[#2A2622]'
                  }`}
                  role="switch"
                  aria-checked={preferences.autoSpeak}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-[#14110D] transition-transform ${
                      preferences.autoSpeak ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <button
                onClick={() => speak('LUMA audio speech synthesis is active and configured for your language.', true)}
                className="w-full py-2 px-3 rounded-xl bg-[#1D1A17] border border-[#2A2622] text-xs font-bold text-[#E8DCC8] hover:bg-[#E8DCC8]/10 hover:border-[#E8DCC8]/30 transition-all cursor-pointer"
              >
                Test Voice Audio
              </button>
            </div>

            {/* 5. Gaze Dwell Timer Duration */}
            <div className="p-4 rounded-2xl border border-[#2A2622] bg-[#080706] space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#E8DCC8]" />
                <div>
                  <span className="text-sm font-bold text-[#F4EEE3] block">
                    {t.accessibility.dwellTimer}
                  </span>
                  <span className="text-xs text-[#B3A999]">
                    {t.accessibility.dwellTimerDesc}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[1.0, 1.5, 2.0, 2.5].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => updatePreferences({ dwellTimeSeconds: sec })}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      preferences.dwellTimeSeconds === sec
                        ? 'bg-[#E8DCC8] border-[#E8DCC8] text-[#14110D] shadow-xs'
                        : 'bg-[#1D1A17] border-[#2A2622] text-[#B3A999] hover:text-[#F4EEE3] hover:bg-[#2A2622]'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Keyboard Shortcuts Quick Cheat-Sheet */}
            <div className="p-4 rounded-2xl border border-[#2A2622] bg-[#080706] space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Keyboard className="w-4 h-4 text-[#E8DCC8]" />
                <span className="text-xs font-bold text-[#F4EEE3] uppercase tracking-wider">
                  {t.accessibility.keyboardShortcuts}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#B3A999]">
                <div className="flex items-center justify-between bg-[#1D1A17] px-2.5 py-1.5 rounded-lg border border-[#2A2622]">
                  <span>Voice Mode</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#080706] font-mono font-bold text-[#E8DCC8] border border-[#2A2622]">Alt+V</kbd>
                </div>
                <div className="flex items-center justify-between bg-[#1D1A17] px-2.5 py-1.5 rounded-lg border border-[#2A2622]">
                  <span>Camera Vision</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#080706] font-mono font-bold text-[#E8DCC8] border border-[#2A2622]">Alt+C</kbd>
                </div>
                <div className="flex items-center justify-between bg-[#1D1A17] px-2.5 py-1.5 rounded-lg border border-[#2A2622]">
                  <span>Sign Language</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#080706] font-mono font-bold text-[#E8DCC8] border border-[#2A2622]">Alt+S</kbd>
                </div>
                <div className="flex items-center justify-between bg-[#1D1A17] px-2.5 py-1.5 rounded-lg border border-[#2A2622]">
                  <span>Gaze Tracking</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#080706] font-mono font-bold text-[#E8DCC8] border border-[#2A2622]">Alt+G</kbd>
                </div>
                <div className="flex items-center justify-between bg-[#1D1A17] px-2.5 py-1.5 rounded-lg border border-[#2A2622]">
                  <span>Language</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#080706] font-mono font-bold text-[#E8DCC8] border border-[#2A2622]">Alt+L</kbd>
                </div>
                <div className="flex items-center justify-between bg-[#1D1A17] px-2.5 py-1.5 rounded-lg border border-[#2A2622]">
                  <span>Settings</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#080706] font-mono font-bold text-[#E8DCC8] border border-[#2A2622]">Alt+A</kbd>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              {t.accessibility.close}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
