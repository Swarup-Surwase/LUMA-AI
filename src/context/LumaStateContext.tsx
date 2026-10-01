import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  LumaCoreState,
  LumaMemoryTrace,
  MotionIntensity,
  TextScale,
  Language,
  UserPreferences,
  FeatureLens,
  ActiveModule,
} from '../types/luma';
import { speechEngine } from '../utils/speechUtils';

interface ConsentRequest {
  isOpen: boolean;
  type: 'camera' | 'mic';
  featureName: string;
  resolve?: (allowed: boolean) => void;
}

interface FocusThreadCoord {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

interface LumaContextType {
  coreState: LumaCoreState;
  setCoreState: (state: LumaCoreState, label?: string) => void;
  memoryTraces: LumaMemoryTrace[];
  featureLens: FeatureLens;
  setFeatureLens: (lens: FeatureLens) => void;
  activeModule: ActiveModule;
  setActiveModule: (module: ActiveModule) => void;
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  consentRequest: ConsentRequest | null;
  requestConsent: (type: 'camera' | 'mic', featureName: string) => Promise<boolean>;
  closeConsentModal: (allowed: boolean) => void;
  focusTarget: FocusThreadCoord | null;
  setFocusTarget: (target: FocusThreadCoord | null) => void;
  gazeActive: boolean;
  setGazeActive: (active: boolean) => void;
  gazePos: { x: number; y: number };
  setGazePos: (pos: { x: number; y: number }) => void;
  speak: (text: string, force?: boolean) => void;
  stopSpeech: () => void;
  isSpeaking: boolean;
  audioLevel: number;
  setAudioLevel: (level: number) => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  name: '',
  needs: [],
  goals: [],
  language: 'en',
  interactionMethod: 'voice',
  highContrast: false,
  textScale: 1,
  motionIntensity: 2, // Normal
  autoSpeak: false,
  dwellTimeSeconds: 1.5,
  hasCompletedOnboarding: false,
  cameraConsented: false,
  micConsented: false
};

const LumaStateContext = createContext<LumaContextType | undefined>(undefined);

export const LumaStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [coreState, setCoreStateInternal] = useState<LumaCoreState>('IDLE');
  const [memoryTraces, setMemoryTraces] = useState<LumaMemoryTrace[]>([]);
  const [featureLens, setFeatureLens] = useState<FeatureLens>(null);
  const [activeModule, setActiveModule] = useState<ActiveModule>('home');
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('luma_user_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'Shivam' || parsed.name === 'Friend' || parsed.name === 'Swarup' || parsed.name === 'Swarup Surwase') {
          parsed.name = '';
        }
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch {
      // ignore
    }
    return DEFAULT_PREFERENCES;
  });

  const [consentRequest, setConsentRequest] = useState<ConsentRequest | null>(null);
  const [focusTarget, setFocusTarget] = useState<FocusThreadCoord | null>(null);
  const [gazeActive, setGazeActive] = useState<boolean>(false);
  const [gazePos, setGazePos] = useState<{ x: number; y: number }>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Sync Preferences to DOM attributes & LocalStorage
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem('luma_user_preferences', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-contrast', preferences.highContrast ? 'high' : 'normal');
    document.documentElement.setAttribute('data-text-scale', preferences.textScale.toString());
    document.documentElement.setAttribute('data-motion', preferences.motionIntensity.toString());
    document.documentElement.setAttribute('lang', preferences.language);
  }, [preferences.highContrast, preferences.textScale, preferences.motionIntensity, preferences.language]);

  // State Transition with Memory Buffer & Natural Decay
  const setCoreState = useCallback((nextState: LumaCoreState, label?: string) => {
    setCoreStateInternal((currentState) => {
      if (currentState !== nextState && currentState !== 'IDLE' && currentState !== 'WAKE') {
        const traceLabel = label || currentState;
        const newTrace: LumaMemoryTrace = {
          id: `${currentState}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          state: currentState,
          label: traceLabel,
          timestamp: Date.now(),
          weight: 1.0
        };

        setMemoryTraces((prevTraces) => {
          // Prepend new trace, decay existing traces by factors: 100% -> 70% -> 35% -> 10% -> 0%
          const updated = [newTrace, ...prevTraces.slice(0, 3)].map((trace, idx) => {
            const weights = [1.0, 0.7, 0.35, 0.1];
            return {
              ...trace,
              weight: weights[idx] ?? 0
            };
          }).filter(t => t.weight > 0.05);

          return updated;
        });
      }
      return nextState;
    });
  }, []);

  // Plain-Language Consent Request Modal Trigger
  const requestConsent = useCallback((type: 'camera' | 'mic', featureName: string): Promise<boolean> => {
    if (type === 'camera' && preferences.cameraConsented) return Promise.resolve(true);
    if (type === 'mic' && preferences.micConsented) return Promise.resolve(true);

    return new Promise((resolve) => {
      setConsentRequest({
        isOpen: true,
        type,
        featureName,
        resolve
      });
    });
  }, [preferences.cameraConsented, preferences.micConsented]);

  const closeConsentModal = useCallback((allowed: boolean) => {
    if (consentRequest) {
      if (allowed) {
        if (consentRequest.type === 'camera') updatePreferences({ cameraConsented: true });
        if (consentRequest.type === 'mic') updatePreferences({ micConsented: true });
      }
      consentRequest.resolve?.(allowed);
      setConsentRequest(null);
    }
  }, [consentRequest, updatePreferences]);

  // Speech Helper
  const speak = useCallback((text: string, force = false) => {
    if (preferences.autoSpeak || force) {
      setIsSpeaking(true);
      speechEngine.speak(text, preferences.language, () => {
        setIsSpeaking(false);
      });
    }
  }, [preferences.autoSpeak, preferences.language]);

  const stopSpeech = useCallback(() => {
    speechEngine.stop();
    setIsSpeaking(false);
  }, []);

  return (
    <LumaContextTypeProvider
      value={{
        coreState,
        setCoreState,
        memoryTraces,
        featureLens,
        setFeatureLens,
        activeModule,
        setActiveModule,
        preferences,
        updatePreferences,
        consentRequest,
        requestConsent,
        closeConsentModal,
        focusTarget,
        setFocusTarget,
        gazeActive,
        setGazeActive,
        gazePos,
        setGazePos,
        speak,
        stopSpeech,
        isSpeaking,
        audioLevel,
        setAudioLevel
      }}
    >
      {children}
    </LumaContextTypeProvider>
  );
};

const LumaContextTypeProvider = LumaStateContext.Provider;

export const useLuma = (): LumaContextType => {
  const context = useContext(LumaStateContext);
  if (!context) {
    throw new Error('useLuma must be used within a LumaStateProvider');
  }
  return context;
};
