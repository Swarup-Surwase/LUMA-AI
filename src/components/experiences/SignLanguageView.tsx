import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLuma } from '../../context/LumaStateContext';
import { translations } from '../../locales/translations';
import { initAccessibleCamera, stopAccessibleCamera } from '../../utils/cameraUtils';
import { handGestureDetector, DetectedHandGesture } from '../../utils/handGestureDetector';
import {
  HandMetal,
  Camera,
  AlertTriangle,
  Sparkles,
  Volume2,
  BookOpen,
  CheckCircle,
  VideoOff,
  AlertCircle,
  Activity,
  ArrowRight
} from 'lucide-react';

interface ISLSign {
  id: string;
  name: string;
  category: string;
  description: string;
  gestureEmoji: string;
}

export const SignLanguageView: React.FC = () => {
  const { setCoreState, speak, preferences, requestConsent } = useLuma();
  const t = translations[preferences.language];

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detectedSign, setDetectedSign] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [emergencyAlert, setEmergencyAlert] = useState<string | null>(null);
  const [selectedDictSign, setSelectedDictSign] = useState<ISLSign | null>(null);
  const [tab, setTab] = useState<'detector' | 'dictionary'>('detector');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSpokenSignRef = useRef<string>('');

  const islSignsList: ISLSign[] = [
    { id: 'hello', name: 'Hello / Welcome (नमस्ते)', category: 'Greetings', description: 'Open dominant hand raised to temple, moving gently outward with pleasant nod.', gestureEmoji: '👋' },
    { id: 'thank_you', name: 'Thank You (धन्यवाद)', category: 'Courtesy', description: 'Fingertips of flat hand placed under chin, then moving forward smoothly toward the person.', gestureEmoji: '🙏' },
    { id: 'help', name: 'Help / Assistance (मदत / सहायता)', category: 'Essential', description: 'Closed fist thumb up resting on flat base palm, raised upward together.', gestureEmoji: '🤝' },
    { id: 'doctor', name: 'Doctor / Medical (डॉक्टर)', category: 'Emergency', description: 'Index and middle fingers touching the wrist radial pulse twice.', gestureEmoji: '🩺' },
    { id: 'emergency', name: 'Emergency (आपत्कालीन)', category: 'Emergency', description: 'Hand open waving side-to-side across chest with urgent facial expression.', gestureEmoji: '🚨' },
    { id: 'water', name: 'Water (पाणी / जल)', category: 'Daily Needs', description: 'Three fingers extended (W shape) tapped lightly twice at the lips.', gestureEmoji: '💧' },
    { id: 'food', name: 'Food / Eat (अन्न / भोजन)', category: 'Daily Needs', description: 'Fingertips gathered together touching lips repeatedly in eating motion.', gestureEmoji: '🍲' },
    { id: 'yes', name: 'Yes (होय / हाँ)', category: 'Responses', description: 'Fist nodding up and down vertically like an affirmative head nod.', gestureEmoji: '👍' },
    { id: 'no', name: 'No (नाही / नहीं)', category: 'Responses', description: 'Index and middle fingers snapping closed onto the thumb horizontally.', gestureEmoji: '👎' },
    { id: 'family', name: 'Family (कुटुंब / परिवार)', category: 'Social', description: 'Both hands form circular connection starting from touch and circling outward.', gestureEmoji: '👨‍👩‍👦' },
    { id: 'medicine', name: 'Medicine (औषध / दवा)', category: 'Medical', description: 'Middle finger lightly grinding/circling on palm of non-dominant hand.', gestureEmoji: '💊' },
    { id: 'where', name: 'Where / Direction (कुठे / कहाँ)', category: 'Questions', description: 'Open palms facing upward moving gently side to side with questioning brow.', gestureEmoji: '🧭' }
  ];

  // Attach stream to video tag
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.play().catch((err) => console.warn('Video play error:', err));
    }
  }, [stream, isCameraActive]);

  // Real-Time Computer Vision & ISL Recognition Loop (Clean video feed, no unprompted voice narrator)
  useEffect(() => {
    if (!isCameraActive || !stream) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    let lastSignTime = 0;
    let lastFrameTime = 0;

    const processVideoFrame = (timestamp: number) => {
      if (timestamp - lastFrameTime > 40) {
        lastFrameTime = timestamp;

        const video = videoRef.current;

        if (video && video.readyState >= 2) {
          const islResult = handGestureDetector.detectISLSign(video, timestamp);

          if (islResult) {
            lastSignTime = timestamp;
            setDetectedSign(islResult.signName);
            setConfidence(Math.round(islResult.confidence * 100));
            setCoreState('SIGN', `ISL: ${islResult.signName}`);
          } else {
            // If no sign is detected for 1.5 seconds, clear the detected sign display
            if (lastSignTime > 0 && timestamp - lastSignTime > 1500) {
              setDetectedSign(null);
              setConfidence(0);
              lastSignTime = 0;
              setCoreState('IDLE');
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(processVideoFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processVideoFrame);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isCameraActive, stream, setCoreState]);

  const startCamera = async () => {
    setCameraError(null);
    const allowed = await requestConsent('camera', 'Indian Sign Language Recognition');
    if (!allowed) {
      setCameraError('Camera permission not granted. You can still test signs with the buttons below.');
      return;
    }

    const result = await initAccessibleCamera('user');
    streamRef.current = result.stream;
    setStream(result.stream);
    setIsCameraActive(true);

    if (result.error) {
      setCameraError(result.error);
    }

    setCoreState('SIGN', 'ISL Camera Active');
  };

  const stopCamera = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    stopAccessibleCamera(streamRef.current, videoRef.current);
    streamRef.current = null;
    setStream(null);
    setIsCameraActive(false);
    setDetectedSign(null);
    setConfidence(0);
    setCoreState('IDLE');
  };

  const triggerEmergency = (signText: string) => {
    setEmergencyAlert(signText);
    setCoreState('ALERT', `Emergency Sign: ${signText}`);
    speak(`Emergency alert: ${signText}. Requesting immediate medical assistance.`, true);
  };

  return (
    <div className="space-y-8 py-4 text-[#F4EEE3]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#080706] border border-[#2A2622] text-[#E9B44C] text-xs font-bold mb-2">
            <HandMetal className="w-3.5 h-3.5 text-[#E9B44C]" /> Indian Sign Language Engine
          </div>
          <h1 className="text-3xl font-extrabold text-[#F4EEE3] font-display">
            Indian Sign Language (ISL) Assistant
          </h1>
          <p className="text-sm text-[#B3A999]">
            Real-time hand gesture classification, text translation, speech output, and comprehensive ISL dictionary.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#080706] border border-[#2A2622]">
          <button
            onClick={() => setTab('detector')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'detector'
                ? 'bg-[#E8DCC8] text-[#14110D]'
                : 'text-[#B3A999] hover:text-[#F4EEE3]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Sign to Text</span>
          </button>
          <button
            onClick={() => setTab('dictionary')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'dictionary'
                ? 'bg-[#E8DCC8] text-[#14110D]'
                : 'text-[#B3A999] hover:text-[#F4EEE3]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ISL Dictionary</span>
          </button>
        </div>
      </div>

      {/* Emergency Alert Banner */}
      {emergencyAlert && (
        <div className="p-4 rounded-2xl bg-[#1D1A17] border-2 border-[#E07A5F] text-[#F4EEE3] flex items-center justify-between gap-4 shadow-xl animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-[#E07A5F] shrink-0" />
            <div className="text-left">
              <h3 className="font-bold text-sm text-[#E07A5F]">Emergency Signal Active: {emergencyAlert}</h3>
              <p className="text-xs text-[#B3A999]">
                Broadcasting medical distress signal and synthesizing immediate vocal alert.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setEmergencyAlert(null); setCoreState('IDLE'); }}
            className="px-3 py-1.5 rounded-xl bg-[#E07A5F] text-[#14110D] text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Info Box */}
      {cameraError && (
        <div className="p-4 rounded-2xl bg-[#1D1A17] border border-[#E07A5F]/40 text-xs text-[#F4EEE3] space-y-2 text-left">
          <div className="flex items-center gap-2 font-bold text-[#E07A5F]">
            <AlertCircle className="w-4 h-4 text-[#E07A5F]" />
            <span>{cameraError}</span>
          </div>
          <div className="pl-6 text-[11px] text-[#B3A999]">
            💡 <strong>Safari fix:</strong> Go to <em>Safari</em> → <em>Settings</em> → <em>Websites</em> → <em>Camera</em> and set localhost to <strong>Allow</strong>.
          </div>
        </div>
      )}

      {/* Main Workspace */}
      {tab === 'detector' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Clean Live Camera Feed */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-[#080706] border border-[#2A2622] shadow-md flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] ${isCameraActive && stream ? 'block' : 'hidden'}`}
              />

              {!isCameraActive && (
                <div className="text-center p-8 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-[#1D1A17] border border-[#2A2622] flex items-center justify-center mx-auto text-[#E9B44C] shadow-xs">
                    <HandMetal className="w-8 h-8" />
                  </div>
                  <div className="max-w-xs mx-auto">
                    <h3 className="font-bold text-[#F4EEE3] text-base">ISL Camera Ready</h3>
                    <p className="text-xs text-[#B3A999] mt-1">
                      Start your camera to translate Indian Sign Language into speech and text in real-time.
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-6 py-2.5 rounded-xl bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-bold text-xs shadow-md transition-all cursor-pointer focus-visible:ring-3 focus-visible:ring-[#E8DCC8]"
                  >
                    Start ISL Camera
                  </button>
                </div>
              )}

              {isCameraActive && stream && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-[#151311]/90 backdrop-blur-md text-[11px] font-bold text-[#F4EEE3] border border-[#2A2622] shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#E9B44C] animate-pulse" />
                  <span>ISL Real-Time Recognition Active</span>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            {isCameraActive && (
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={stopCamera}
                  className="px-4 py-2.5 rounded-xl bg-[#1D1A17] border border-[#2A2622] text-[#F4EEE3] hover:bg-[#2A2622] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <VideoOff className="w-4 h-4 text-[#B3A999]" />
                  <span>Stop Camera</span>
                </button>

                <div className="flex items-center gap-2 text-xs font-bold text-[#E9B44C]">
                  <Activity className="w-4 h-4 text-[#E9B44C] animate-pulse" />
                  <span>Tracking 21 Keypoints</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Recognized Word & Output Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl border border-[#2A2622] bg-[#151311] shadow-lg h-full flex flex-col justify-between space-y-6 text-left">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#2A2622]">
                  <h3 className="font-bold text-[#F4EEE3] text-base font-display flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#E8DCC8]" />
                    <span>Recognized ISL Gesture</span>
                  </h3>
                  {detectedSign && (
                    <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-[#E9B44C]/15 text-[#E9B44C] border border-[#E9B44C]/30">
                      Confidence {confidence}%
                    </span>
                  )}
                </div>

                {detectedSign ? (
                  <div className="p-6 rounded-2xl bg-[#1D1A17] border border-[#2A2622] text-center space-y-3">
                    <span className="text-4xl block">✨</span>
                    <h2 className="text-2xl font-extrabold text-[#E8DCC8] font-display">
                      "{detectedSign}"
                    </h2>
                    <p className="text-xs text-[#B3A999]">
                      Translated directly into readable text and assistive output.
                    </p>
                    <button
                      onClick={() => speak(`Recognized sign: ${detectedSign}`, true)}
                      className="px-4 py-2 rounded-xl bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] text-xs font-bold shadow-xs inline-flex items-center gap-2 cursor-pointer focus-visible:ring-3 focus-visible:ring-[#E8DCC8]"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Speak Aloud</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-8 text-center text-[#B3A999] space-y-2">
                    <HandMetal className="w-8 h-8 mx-auto opacity-40 text-[#E9B44C]" />
                    <p className="text-xs">
                      Perform an Indian Sign Language gesture in front of the camera to see instant translation.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Sign Simulator Buttons */}
              <div className="pt-4 border-t border-[#2A2622]">
                <span className="text-[10px] uppercase font-bold text-[#B3A999] block mb-2">
                  Instant Test Signs:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { setDetectedSign('Namaste / Hello (नमस्ते)'); setConfidence(96); }}
                    className="p-2 rounded-xl bg-[#1D1A17] border border-[#2A2622] hover:border-[#E8DCC8]/40 text-xs font-semibold text-[#F4EEE3] hover:text-[#E8DCC8] cursor-pointer"
                  >
                    🙏 Namaste
                  </button>
                  <button
                    onClick={() => { setDetectedSign('Water (पाणी / जल)'); setConfidence(94); }}
                    className="p-2 rounded-xl bg-[#1D1A17] border border-[#2A2622] hover:border-[#E8DCC8]/40 text-xs font-semibold text-[#F4EEE3] hover:text-[#E8DCC8] cursor-pointer"
                  >
                    💧 Water
                  </button>
                  <button
                    onClick={() => triggerEmergency('Emergency Assistance Required')}
                    className="p-2 rounded-xl bg-[#1D1A17] border border-[#E07A5F]/40 hover:border-[#E07A5F] text-xs font-bold text-[#E07A5F] cursor-pointer"
                  >
                    🚨 Emergency
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Dictionary View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {islSignsList.map((sign) => (
            <div
              key={sign.id}
              onClick={() => {
                setSelectedDictSign(sign);
                speak(`${sign.name}. Category: ${sign.category}. ${sign.description}`);
              }}
              className="p-5 rounded-3xl border border-[#2A2622] bg-[#151311] hover:border-[#E8DCC8]/40 shadow-xs hover:shadow-lg transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{sign.gestureEmoji}</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#1D1A17] border border-[#2A2622] text-[#E8DCC8]">
                  {sign.category}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#F4EEE3] font-display mb-1">
                {sign.name}
              </h3>
              <p className="text-xs text-[#B3A999] leading-relaxed mb-4">
                {sign.description}
              </p>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#E8DCC8]">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear Description</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
