import React, { useState, useEffect } from 'react';
import { useLuma, LumaStateProvider } from './context/LumaStateContext';
import { Navbar } from './components/navigation/Navbar';
import { AccessibilitySheet } from './components/navigation/AccessibilitySheet';
import { EmergencyFloatingButton } from './components/navigation/EmergencyFloatingButton';
import { ConsentModal } from './components/navigation/ConsentModal';
import { LumaIntroSplash } from './components/core/LumaIntroSplash';
import { FocusThread } from './components/core/FocusThread';
import { GazeCursor } from './components/core/GazeCursor';
import { OnboardingModal } from './components/experiences/OnboardingModal';
import { HomeDashboardView } from './components/experiences/HomeDashboardView';
import { SignLanguageView } from './components/experiences/SignLanguageView';
import { HandsFreeGazeView } from './components/experiences/HandsFreeGazeView';
import { VoiceFormAssistant } from './components/experiences/VoiceFormAssistant';
import { DocumentSimplifierView } from './components/experiences/DocumentSimplifierView';
import { ShowcaseSandboxView } from './components/experiences/ShowcaseSandboxView';
import { MotionFooter } from './components/ui/motion-footer';
import { Language } from './types/luma';

const MainApp: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    preferences,
    updatePreferences,
    setCoreState,
    setGazeActive,
    setFocusTarget
  } = useLuma();

  const [isIntroComplete, setIsIntroComplete] = useState<boolean>(() => {
    return sessionStorage.getItem('luma_intro_seen') === 'true';
  });
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  const handleIntroComplete = () => {
    setIsIntroComplete(true);
    sessionStorage.setItem('luma_intro_seen', 'true');
    if (!preferences.hasCompletedOnboarding) {
      setTimeout(() => {
        setIsOnboardingOpen(true);
      }, 400);
    }
  };

  // Clean up any module overlays (focus threads / gaze dots) when switching tabs
  useEffect(() => {
    if (activeModule !== 'hands_free_gaze') {
      setGazeActive(false);
    }
    if (activeModule !== 'voice_forms') {
      setFocusTarget(null);
    }
  }, [activeModule, setGazeActive, setFocusTarget]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            e.preventDefault();
            setActiveModule('voice_forms');
            break;
          case 's':
            e.preventDefault();
            setActiveModule('sign_language');
            break;
          case 'g':
            e.preventDefault();
            setActiveModule('hands_free_gaze');
            break;
          case 'd':
            e.preventDefault();
            setActiveModule('document_simplifier');
            break;
          case 'h':
            e.preventDefault();
            setActiveModule('home');
            break;
          case 'a':
            e.preventDefault();
            setIsAccessibilityOpen((prev) => !prev);
            break;
          case 'l': {
            e.preventDefault();
            const langs: Language[] = ['en', 'hi', 'mr'];
            const nextLang = langs[(langs.indexOf(preferences.language) + 1) % langs.length];
            setCoreState('TRANSLATE', `Language: ${nextLang.toUpperCase()}`);
            updatePreferences({ language: nextLang });
            setTimeout(() => setCoreState('IDLE'), 1000);
            break;
          }
        }
      }
      if (e.key === '?' && !e.altKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          setIsAccessibilityOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preferences.language, setActiveModule, setCoreState, updatePreferences]);

  return (
    <div className={`min-h-screen relative flex flex-col bg-[#0C0B0A] text-[#F4EEE3] ${preferences.highContrast ? 'high-contrast' : ''}`}>
      {/* Skip to Content for Screen Readers & Keyboard Nav */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[#151311] text-[#E8DCC8] border border-[#2A2622] font-bold text-xs rounded-xl shadow-xl focus:ring-3 focus:ring-[#E8DCC8]"
      >
        Skip to main content
      </a>

      {/* 1. Intro Splash Arrival Sequence for first entry */}
      {!isIntroComplete && (
        <LumaIntroSplash onComplete={handleIntroComplete} />
      )}

      {/* 2. Accessibility Sheet & Modals */}
      <ConsentModal />
      <AccessibilitySheet
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
        onReplayIntro={() => setIsIntroComplete(false)}
      />
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* 3. Feature Overlays ONLY active in their respective modules */}
      {activeModule === 'voice_forms' && <FocusThread />}
      {activeModule === 'hands_free_gaze' && <GazeCursor />}

      {/* 4. Translucent Glass Navigation Bar */}
      <Navbar
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* 5. Main Application Content Container */}
      <main id="main-content" className="flex-1 w-full relative z-10">
        {activeModule === 'home' ? (
          <HomeDashboardView onOpenOnboarding={() => setIsOnboardingOpen(true)} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeModule === 'sign_language' && <SignLanguageView />}
            {activeModule === 'hands_free_gaze' && <HandsFreeGazeView />}
            {activeModule === 'voice_forms' && <VoiceFormAssistant />}
            {activeModule === 'document_simplifier' && <DocumentSimplifierView />}
            {activeModule === 'showcase' && <ShowcaseSandboxView />}
          </div>
        )}
      </main>

      {/* 6. Always-Reachable Floating Emergency SOS Button */}
      <EmergencyFloatingButton
        onTriggerEmergency={() => setActiveModule('sign_language')}
      />

      {/* 7. New Motion Footer with Warm Black & Beige Aesthetic */}
      <MotionFooter
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <LumaStateProvider>
      <MainApp />
    </LumaStateProvider>
  );
}
