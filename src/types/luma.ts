// Core State Machine
export type LumaCoreState =
  | 'IDLE'
  | 'WAKE'
  | 'LISTENING'
  | 'VISION'
  | 'SIGN'
  | 'THINKING'
  | 'RESOLVE'
  | 'TRANSLATE'
  | 'FORM_ASSIST'
  | 'ALERT'
  | 'SLEEP'
  | 'TRANSITION';

// Motion Intensity: 0=Reduced Motion, 1=Calm, 2=Normal, 3=Expressive, 4=Showcase
export type MotionIntensity = 0 | 1 | 2 | 3 | 4;

// Text Scaling
export type TextScale = 1 | 1.25 | 1.5 | 1.75;

// Supported Languages
export type Language = 'en' | 'hi' | 'mr';

// Accessibility Needs
export type AccessibilityNeed =
  | 'vision'
  | 'hearing'
  | 'motor'
  | 'language'
  | 'digital_literacy';

// Preferred Interaction
export type InteractionMethod =
  | 'voice'
  | 'camera'
  | 'gesture'
  | 'keyboard'
  | 'sign'
  | 'touch';

// Visual Memory Trace
export interface LumaMemoryTrace {
  id: string;
  state: LumaCoreState;
  label: string;
  timestamp: number;
  weight: number; // 1.0 down to 0.0
}

// User Profile & Preferences
export interface UserPreferences {
  name: string;
  email?: string;
  needs: AccessibilityNeed[];
  goals: string[];
  language: Language;
  interactionMethod: InteractionMethod;
  highContrast: boolean;
  textScale: TextScale;
  motionIntensity: MotionIntensity;
  autoSpeak: boolean;
  dwellTimeSeconds: number; // default 1.5
  hasCompletedOnboarding: boolean;
  cameraConsented: boolean;
  micConsented: boolean;
}

// Active Feature Lens Preview
export type FeatureLens =
  | null
  | 'voice'
  | 'vision'
  | 'sign'
  | 'form'
  | 'language'
  | 'gaze';

// Navigation Tab
export type ActiveModule =
  | 'home'
  | 'dashboard'
  | 'sign_language'
  | 'hands_free_gaze'
  | 'voice_forms'
  | 'document_simplifier'
  | 'showcase';
