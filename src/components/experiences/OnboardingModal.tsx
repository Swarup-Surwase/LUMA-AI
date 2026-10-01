import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLuma } from '../../context/LumaStateContext';
import { translations } from '../../locales/translations';
import { AccessibilityNeed, Language, InteractionMethod } from '../../types/luma';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Eye,
  HandMetal,
  Compass,
  Languages,
  BookOpen,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Mic,
  MousePointer,
  Keyboard,
  Camera
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose
}) => {
  const { preferences, updatePreferences, setCoreState, speak } = useLuma();
  const [step, setStep] = useState<number>(1);
  const t = translations[preferences.language];

  const [tempName, setTempName] = useState<string>(
    preferences.name && !['Shivam', 'Friend', 'Swarup', 'Swarup Surwase'].includes(preferences.name)
      ? preferences.name
      : ''
  );
  const [tempEmail, setTempEmail] = useState<string>(preferences.email || '');
  const [tempPassword, setTempPassword] = useState<string>('');
  const [isSignedInWithGoogle, setIsSignedInWithGoogle] = useState<boolean>(false);
  const [tempNeeds, setTempNeeds] = useState<AccessibilityNeed[]>(preferences.needs || []);
  const [tempGoals, setTempGoals] = useState<string[]>(preferences.goals || []);
  const [tempLang, setTempLang] = useState<Language>(preferences.language);
  const [tempMethod, setTempMethod] = useState<InteractionMethod>(preferences.interactionMethod);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    setIsSignedInWithGoogle(true);
    const gName = tempName || 'Aarav Sharma';
    const gEmail = tempEmail || 'aarav.sharma@gmail.com';
    setTempName(gName);
    setTempEmail(gEmail);
    setCoreState('RESOLVE', 'Signed in with Google');
    speak(`Signed in with Google as ${gName}`);
  };

  const toggleNeed = (need: AccessibilityNeed) => {
    setTempNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const toggleGoal = (goal: string) => {
    setTempGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleFinish = () => {
    updatePreferences({
      name: tempName.trim(),
      email: tempEmail.trim() || undefined,
      needs: tempNeeds,
      goals: tempGoals,
      language: tempLang,
      interactionMethod: tempMethod,
      hasCompletedOnboarding: true
    });

    setCoreState('RESOLVE', `Adapted for ${tempName || 'User'}`);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    speak(`Welcome to LUMA${tempName ? `, ${tempName}` : ''}. Your adaptive interface is ready.`);
    onClose();
  };

  const needsList: { id: AccessibilityNeed; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'vision',
      label: 'Low Vision / Blindness',
      desc: 'Screen descriptions, document narration, large text & high contrast',
      icon: <Eye className="w-5 h-5 text-[#8FB5D6]" />
    },
    {
      id: 'hearing',
      label: 'Deaf / Hard of Hearing',
      desc: 'Indian Sign Language, live captions, text alternatives',
      icon: <HandMetal className="w-5 h-5 text-[#E9B44C]" />
    },
    {
      id: 'motor',
      label: 'Motor Mobility Needs',
      desc: 'Hands-free gaze tracking, dwell clicking, switch keys',
      icon: <Compass className="w-5 h-5 text-[#8FB8A0]" />
    },
    {
      id: 'digital_literacy',
      label: 'Cognitive & Simple Steps',
      desc: 'Plain language simplification, guided single-question workflows',
      icon: <BookOpen className="w-5 h-5 text-[#E8DCC8]" />
    },
    {
      id: 'language',
      label: 'Regional Language Needs',
      desc: 'Voice forms and simplification in Hindi, Marathi, or English',
      icon: <Languages className="w-5 h-5 text-[#E8DCC8]" />
    }
  ];

  const goalsList = [
    'Fill Government & Medical Forms by Voice',
    'Read Medicine Bottles & Prescription Dates',
    'Translate Indian Sign Language (ISL)',
    'Hands-Free Gaze Navigation & Typing',
    'Understand Legal Documents & Notices in Simple Words',
    'Find & Check Eligibility for Disability Grants (ADIP)'
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#0C0B0A]/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.25 }}
          className="relative z-10 w-full max-w-2xl p-6 sm:p-8 rounded-3xl border border-[#2A2622] shadow-2xl bg-[#151311] space-y-6 max-h-[90vh] overflow-y-auto text-left text-[#F4EEE3]"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#2A2622]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E8DCC8]">
                LUMA Personalization Guide • Step {step} of 5
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#1D1A17] text-[#B3A999] hover:text-[#F4EEE3] border border-[#2A2622] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Steps Content */}
          <div className="min-h-[260px] flex flex-col justify-center">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-2xl font-bold text-[#F4EEE3] font-display">
                    {t.onboarding.step1Title}
                  </h3>
                  <p className="text-sm text-[#B3A999] mt-1">
                    Sign in with Google or your email to sync your preferences, or continue directly.
                  </p>
                </div>

                {/* Sign in with Google Feature */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border font-bold text-sm transition-all cursor-pointer shadow-sm ${
                    isSignedInWithGoogle
                      ? 'bg-[#8FB8A0]/15 border-[#8FB8A0] text-[#8FB8A0]'
                      : 'bg-[#F4EEE3] hover:bg-[#FFFFFF] text-[#14110D] border-transparent hover:scale-[1.01]'
                  }`}
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isSignedInWithGoogle ? `Signed in with Google as ${tempName || 'User'}` : 'Sign in with Google'}</span>
                </button>

                {/* Divider */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[#2A2622]"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-bold text-[#B3A999] uppercase tracking-wider">
                    or continue with email & pass
                  </span>
                  <div className="flex-grow border-t border-[#2A2622]"></div>
                </div>

                {/* Name, Email, Password Inputs */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-[#B3A999] block mb-1">
                      What should LUMA call you? (Name)
                    </label>
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder={t.onboarding.namePlaceholder}
                      className="w-full px-4 py-3 rounded-2xl bg-[#080706] border border-[#2A2622] text-[#F4EEE3] placeholder-[#B3A999]/50 font-semibold focus:outline-none focus:ring-2 focus:ring-[#E8DCC8] text-sm"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#B3A999] block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={tempEmail}
                        onChange={(e) => setTempEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-4 py-3 rounded-2xl bg-[#080706] border border-[#2A2622] text-[#F4EEE3] placeholder-[#B3A999]/50 font-semibold focus:outline-none focus:ring-2 focus:ring-[#E8DCC8] text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#B3A999] block mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-2xl bg-[#080706] border border-[#2A2622] text-[#F4EEE3] placeholder-[#B3A999]/50 font-semibold focus:outline-none focus:ring-2 focus:ring-[#E8DCC8] text-sm"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-2xl font-bold text-[#F4EEE3] font-display">
                    {t.onboarding.step2Title}
                  </h3>
                  <p className="text-sm text-[#B3A999] mt-1">
                    {t.onboarding.step2Subtitle}
                  </p>
                </div>
                <div className="space-y-2">
                  {needsList.map((need) => (
                    <button
                      key={need.id}
                      onClick={() => toggleNeed(need.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                        tempNeeds.includes(need.id)
                          ? 'bg-[rgba(232,220,200,0.10)] border-[#E8DCC8] text-[#E8DCC8] shadow-xs'
                          : 'bg-[#1D1A17] border-[#2A2622] text-[#B3A999] hover:text-[#F4EEE3] hover:bg-[#2A2622]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[#080706] border border-[#2A2622]">
                          {need.icon}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-[#F4EEE3] block">
                            {need.label}
                          </span>
                          <span className="text-xs text-[#B3A999]">
                            {need.desc}
                          </span>
                        </div>
                      </div>
                      {tempNeeds.includes(need.id) && (
                        <div className="w-6 h-6 rounded-full bg-[#E8DCC8] text-[#14110D] flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 font-bold" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-2xl font-bold text-[#F4EEE3] font-display">
                    {t.onboarding.step3Title}
                  </h3>
                  <p className="text-sm text-[#B3A999] mt-1">
                    {t.onboarding.step3Subtitle}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {goalsList.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`p-3.5 rounded-2xl text-xs font-semibold text-left border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        tempGoals.includes(goal)
                          ? 'bg-[rgba(232,220,200,0.10)] border-[#E8DCC8] text-[#E8DCC8] shadow-xs'
                          : 'bg-[#1D1A17] border-[#2A2622] text-[#B3A999] hover:text-[#F4EEE3] hover:bg-[#2A2622]'
                      }`}
                    >
                      <span>{goal}</span>
                      {tempGoals.includes(goal) && (
                        <Check className="w-4 h-4 text-[#E8DCC8] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-2xl font-bold text-[#F4EEE3] font-display">
                    {t.onboarding.step4Title}
                  </h3>
                  <p className="text-sm text-[#B3A999] mt-1">
                    LUMA supports full spoken and written interface adaptation.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    { id: 'en', title: 'English', desc: 'Universal accessible English with voice synthesis' },
                    { id: 'hi', title: 'हिन्दी (Hindi)', desc: 'हिंदी में पूर्ण आवाज एवं अनुवाद समर्थन' },
                    { id: 'mr', title: 'मराठी (Marathi)', desc: 'मराठी भाषा संवाद व सोप्या दस्तऐवज पद्धती' }
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setTempLang(l.id as Language)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                        tempLang === l.id
                          ? 'bg-[rgba(232,220,200,0.10)] border-[#E8DCC8] text-[#E8DCC8] shadow-xs'
                          : 'bg-[#1D1A17] border-[#2A2622] text-[#B3A999] hover:text-[#F4EEE3] hover:bg-[#2A2622]'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-base text-[#F4EEE3] block font-display">
                          {l.title}
                        </span>
                        <span className="text-xs text-[#B3A999]">
                          {l.desc}
                        </span>
                      </div>
                      {tempLang === l.id && (
                        <div className="w-6 h-6 rounded-full bg-[#E8DCC8] text-[#14110D] flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 font-bold" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-2xl font-bold text-[#F4EEE3] font-display">
                    {t.onboarding.step5Title}
                  </h3>
                  <p className="text-sm text-[#B3A999] mt-1">
                    {t.onboarding.step5Subtitle}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'voice', label: 'Voice First', icon: <Mic className="w-5 h-5 text-[#8FB5D6]" /> },
                    { id: 'gaze', label: 'Hands-Free Gaze', icon: <Compass className="w-5 h-5 text-[#8FB8A0]" /> },
                    { id: 'sign', label: 'Indian Sign Language', icon: <HandMetal className="w-5 h-5 text-[#E9B44C]" /> },
                    { id: 'touch', label: 'Standard Touch / Mouse', icon: <MousePointer className="w-5 h-5 text-[#E8DCC8]" /> }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setTempMethod(method.id as InteractionMethod)}
                      className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between min-h-[100px] cursor-pointer ${
                        tempMethod === method.id
                          ? 'bg-[rgba(232,220,200,0.10)] border-[#E8DCC8] text-[#E8DCC8] shadow-xs'
                          : 'bg-[#1D1A17] border-[#2A2622] text-[#B3A999] hover:text-[#F4EEE3] hover:bg-[#2A2622]'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-[#080706] w-fit border border-[#2A2622]">
                        {method.icon}
                      </div>
                      <span className="font-bold text-xs mt-2 block text-[#F4EEE3]">{method.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#2A2622]">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#B3A999] hover:text-[#F4EEE3] hover:bg-[#1D1A17] transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="text-xs font-semibold text-[#B3A999] hover:text-[#F4EEE3] hover:underline cursor-pointer"
              >
                Skip for now
              </button>
            )}

            {step < 5 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-7 py-3 rounded-2xl bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-extrabold text-sm shadow-md transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Save & Launch LUMA</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
