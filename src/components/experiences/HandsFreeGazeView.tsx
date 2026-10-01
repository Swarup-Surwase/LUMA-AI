import React, { useState, useEffect, useRef } from 'react';
import { useLuma } from '../../context/LumaStateContext';
import { translations } from '../../locales/translations';
import { faceHeadTracker, HeadPose } from '../../utils/faceHeadTracker';
import {
  Compass,
  Camera,
  Sparkles,
  Delete,
  Volume2,
  VideoOff,
  AlertCircle,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2
} from 'lucide-react';

export const HandsFreeGazeView: React.FC = () => {
  const { gazeActive, setGazeActive, gazePos, setGazePos, preferences, speak } = useLuma();
  const t = translations[preferences.language];

  const [typedText, setTypedText] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [sensitivity, setSensitivity] = useState<number>(2.0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facePose, setFacePose] = useState<HeadPose | null>(null);
  const [dwellProgress, setDwellProgress] = useState<number>(0);
  const [hoveredElementText, setHoveredElementText] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dwellTargetRef = useRef<HTMLElement | null>(null);
  const dwellStartTimeRef = useRef<number>(0);
  const dwellTriggeredRef = useRef<boolean>(false);

  // Safely attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.play().catch((err) => {
        console.warn('Video play error:', err);
      });
    }
  }, [stream, isCameraActive]);

  // Real-Time 60fps Face / Head Motion Tracking & Dwell Click Loop
  useEffect(() => {
    if (!isCameraActive || !stream) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setDwellProgress(0);
      return;
    }

    const dwellDurationMs = (preferences.dwellTimeSeconds || 1.5) * 1000;

    const trackingLoop = (timestamp: number) => {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        const pose = faceHeadTracker.trackHead(video, sensitivity);
        setFacePose(pose);

        if (pose.faceDetected) {
          const screenX = pose.x * window.innerWidth;
          const screenY = pose.y * window.innerHeight;
          setGazePos({ x: screenX, y: screenY });

          // Dwell Target Inspection
          const el = document.elementFromPoint(screenX, screenY) as HTMLElement | null;
          const actionable = el ? (el.closest('[data-gaze-actionable="true"], button') as HTMLElement | null) : null;

          if (actionable) {
            setHoveredElementText(actionable.innerText || actionable.getAttribute('aria-label') || 'Action Target');
            if (dwellTargetRef.current === actionable) {
              if (!dwellTriggeredRef.current) {
                const elapsed = timestamp - dwellStartTimeRef.current;
                const progress = Math.min(1.0, elapsed / dwellDurationMs);
                setDwellProgress(progress);

                if (progress >= 1.0) {
                  dwellTriggeredRef.current = true;
                  actionable.click();
                  speak(actionable.innerText || 'Selected', false);
                  setTimeout(() => {
                    dwellTriggeredRef.current = false;
                    dwellStartTimeRef.current = performance.now();
                  }, 600);
                }
              }
            } else {
              dwellTargetRef.current = actionable;
              dwellStartTimeRef.current = timestamp;
              dwellTriggeredRef.current = false;
              setDwellProgress(0.05);
            }
          } else {
            dwellTargetRef.current = null;
            setDwellProgress(0);
            setHoveredElementText(null);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(trackingLoop);
    };

    animationFrameRef.current = requestAnimationFrame(trackingLoop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isCameraActive, stream, sensitivity, preferences.dwellTimeSeconds]);

  const startFaceTracking = async () => {
    setCameraError(null);

    try {
      let activeStream: MediaStream;
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
      } catch {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = activeStream;
      setStream(activeStream);
      setIsCameraActive(true);
      setGazeActive(true);
      faceHeadTracker.recalibrate();

      if (videoRef.current) {
        videoRef.current.srcObject = activeStream;
        videoRef.current.muted = true;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().catch(() => {});
      }

      speak('Hands-free head cursor activated. Tilt your head to steer the cursor and pause over any key to click.');
    } catch (err: any) {
      console.warn('Direct camera access error:', err);
      let errorMsg = 'Could not access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Safari camera permission is blocked. Please check Safari → Settings → Websites → Camera → set localhost to Allow.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No camera device found.';
      } else {
        errorMsg = err.message || 'Camera access error.';
      }
      setCameraError(errorMsg);
      setGazeActive(true);
      setIsCameraActive(true);
    }
  };

  const stopFaceTracking = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsCameraActive(false);
    setGazeActive(false);
    setDwellProgress(0);
  };

  useEffect(() => {
    return () => {
      stopFaceTracking();
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gazeActive && (!isCameraActive || !facePose?.faceDetected)) {
      setGazePos({ x: e.clientX, y: e.clientY });
    }
  };

  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'SPACE', 'BACKSPACE']
  ];

  const wordPredictions = [
    'HELP', 'YES', 'NO', 'WATER', 'DOCTOR', 'THANK YOU', 'PLEASE', 'FAMILY', 'MEDICINE'
  ];

  const handleKeyPress = (key: string) => {
    if (key === 'SPACE') {
      setTypedText((prev) => prev + ' ');
    } else if (key === 'BACKSPACE') {
      setTypedText((prev) => prev.slice(0, -1));
    } else {
      setTypedText((prev) => prev + key);
    }
  };

  const handlePredictionClick = (word: string) => {
    setTypedText((prev) => {
      const words = prev.trim().split(' ');
      words.pop();
      return [...words, word].join(' ') + ' ';
    });
  };

  return (
    <div className="space-y-8 py-4 text-[#F4EEE3]" onMouseMove={handleMouseMove}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8FB8A0]/15 border border-[#8FB8A0]/30 text-[#8FB8A0] text-xs font-bold mb-2">
            <Compass className="w-3.5 h-3.5 text-[#8FB8A0]" /> Hands-Free Gaze Navigation
          </div>
          <h1 className="text-3xl font-extrabold text-[#F4EEE3] font-display">
            Hands-Free Access & Gaze Typing
          </h1>
          <p className="text-sm text-[#B3A999]">
            Head-movement cursor, 1.5s dwell clicking, and accessible on-screen keyboard without touching physical keys.
          </p>
        </div>

        {/* State Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#151311] border border-[#2A2622] text-xs font-bold text-[#F4EEE3] shadow-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isCameraActive && facePose?.faceDetected ? 'bg-[#8FB8A0] animate-pulse' : 'bg-[#B3A999]'}`} />
            <span>{isCameraActive && facePose?.faceDetected ? 'Head Tracking Live' : gazeActive ? 'Mouse Simulation Active' : 'Cursor Standby'}</span>
          </div>
        </div>
      </div>

      {/* Safari Notice */}
      {cameraError && (
        <div className="p-4 rounded-2xl bg-[#151311] border border-[#E07A5F]/40 text-xs text-[#F4EEE3] space-y-2 text-left">
          <div className="flex items-center gap-2 font-bold text-[#E07A5F]">
            <AlertCircle className="w-4 h-4 text-[#E07A5F]" />
            <span>{cameraError}</span>
          </div>
          <div className="pl-6 text-[11px] text-[#B3A999]">
            💡 <strong>Safari Fix:</strong> In top menu bar: <em>Safari</em> → <em>Settings</em> → <em>Websites</em> → <em>Camera</em> → set <em>localhost</em> to <strong>Allow</strong>. Gaze simulation with trackpad remains active!
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Face Tracker Camera Feed */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-[#0C0B0A] border border-[#2A2622] shadow-md flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${isCameraActive && stream ? 'block' : 'hidden'}`}
            />

            {!isCameraActive && (
              <div className="text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#1D1A17] border border-[#2A2622] text-[#8FB8A0] flex items-center justify-center mx-auto shadow-xs">
                  <Compass className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-[#F4EEE3] text-sm">Face Tracking Standby</h3>
                <p className="text-[11px] text-[#B3A999]">
                  Enable camera to steer cursor with head orientation.
                </p>
                <button
                  onClick={startFaceTracking}
                  className="px-5 py-2.5 rounded-xl bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Enable Face Cursor
                </button>
              </div>
            )}

            {isCameraActive && stream && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#151311]/90 backdrop-blur-md text-[10px] font-bold text-[#F4EEE3] border border-[#2A2622] shadow-xs">
                <span className={`w-2 h-2 rounded-full ${facePose?.faceDetected ? 'bg-[#8FB8A0] animate-pulse' : 'bg-[#E07A5F]'}`} />
                <span>{facePose?.faceDetected ? 'Head Tracking Live' : 'Align face with camera'}</span>
              </div>
            )}
          </div>

          {/* Dwell Settings Card */}
          <div className="p-5 rounded-3xl border border-[#2A2622] bg-[#151311] shadow-lg space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#B3A999]">
                Gaze Controls & Tuning
              </h4>
              {isCameraActive && (
                <button
                  onClick={() => {
                    faceHeadTracker.recalibrate();
                    speak('Head position re-centered', false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#1D1A17] hover:bg-[#2A2622] border border-[#2A2622] text-[11px] text-[#8FB8A0] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Re-Center</span>
                </button>
              )}
            </div>

            {/* Sensitivity Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-[#F4EEE3]">
                <span>Head Sensitivity</span>
                <span className="text-[#8FB8A0]">{sensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="3.5"
                step="0.1"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="w-full accent-[#8FB8A0] cursor-pointer"
              />
              <p className="text-[10px] text-[#B3A999]">
                Higher values allow small head tilts to traverse the entire screen.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[#F4EEE3] mb-1">
                <span>Dwell Time</span>
                <span className="text-[#8FB8A0]">{preferences.dwellTimeSeconds || 1.5}s</span>
              </div>
              <p className="text-[11px] text-[#B3A999]">
                Pause cursor over any button to trigger an automatic click.
              </p>
            </div>

            {isCameraActive && (
              <button
                onClick={stopFaceTracking}
                className="w-full py-2.5 rounded-xl bg-[#1D1A17] hover:bg-[#2A2622] border border-[#2A2622] text-[#F4EEE3] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <VideoOff className="w-3.5 h-3.5 text-[#B3A999]" />
                <span>Turn Off Face Tracker</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Accessible On-Screen Keyboard & Dwell Target Surface */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Typed Output Bar */}
          <div className="p-5 rounded-3xl border border-[#2A2622] bg-[#151311] shadow-lg space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#B3A999] uppercase">
                Gaze Typed Sentence
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => speak(typedText, true)}
                  disabled={!typedText}
                  data-gaze-actionable="true"
                  className="px-3 py-1.5 rounded-xl bg-[#E8DCC8] hover:bg-[#F4EEE3] border border-[#E8DCC8] text-[#14110D] text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Speak</span>
                </button>
                <button
                  onClick={() => setTypedText('')}
                  disabled={!typedText}
                  data-gaze-actionable="true"
                  className="px-3 py-1.5 rounded-xl bg-[#1D1A17] hover:bg-[#2A2622] border border-[#2A2622] text-[#B3A999] text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="min-h-16 p-3.5 rounded-2xl bg-[#080706] border border-[#2A2622] text-[#F4EEE3] font-mono text-lg font-bold flex items-center">
              {typedText || <span className="text-[#B3A999]/60 font-normal">Dwell on keyboard keys below to type hands-free...</span>}
            </div>

            {/* Word Predictions */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold text-[#B3A999] uppercase mr-1">Predict:</span>
              {wordPredictions.map((word) => (
                <button
                  key={word}
                  onClick={() => handlePredictionClick(word)}
                  data-gaze-actionable="true"
                  className="px-3 py-1.5 rounded-xl bg-[#1D1A17] hover:bg-[#2A2622] border border-[#2A2622] hover:border-[#E8DCC8]/40 text-[#E8DCC8] text-xs font-bold whitespace-nowrap shadow-xs cursor-pointer"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          {/* On-Screen Tactile Keyboard with Dwell Support */}
          <div className="p-6 rounded-3xl border border-[#2A2622] bg-[#151311] shadow-lg space-y-2.5">
            {keyboardRows.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1.5 sm:gap-2">
                {row.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    data-gaze-actionable="true"
                    className={`h-12 sm:h-14 rounded-2xl font-bold font-mono transition-all text-xs sm:text-sm border shadow-xs flex items-center justify-center cursor-pointer ${
                      key === 'SPACE'
                        ? 'flex-2 bg-[#1D1A17] hover:bg-[#2A2622] border-[#2A2622] text-[#F4EEE3]'
                        : key === 'BACKSPACE'
                        ? 'flex-1.5 bg-[#E07A5F]/15 hover:bg-[#E07A5F]/25 border-[#E07A5F]/40 text-[#E07A5F]'
                        : 'flex-1 bg-[#080706] hover:bg-[#E8DCC8]/10 border-[#2A2622] hover:border-[#E8DCC8] text-[#F4EEE3]'
                    }`}
                  >
                    {key === 'BACKSPACE' ? <Delete className="w-4 h-4" /> : key}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Head-Gaze Cursor Ring Indicator with Dwell Fill Animation */}
      {gazeActive && (
        <div
          className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${gazePos.x}px`,
            top: `${gazePos.y}px`
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Outer Dwell SVG Progress Ring */}
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="rgba(143, 184, 160, 0.25)"
                strokeWidth="3"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#8FB8A0"
                strokeWidth="3.5"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 * (1 - dwellProgress)}
                strokeLinecap="round"
                className="transition-all duration-75"
              />
            </svg>

            {/* Glowing Center Focus Dot */}
            <div className={`absolute w-3.5 h-3.5 rounded-full ${dwellProgress > 0 ? 'bg-[#8FB8A0] scale-125' : 'bg-[#8FB8A0]'} shadow-[0_0_12px_#8FB8A0] transition-transform`} />

            {/* Tooltip on active hover target */}
            {hoveredElementText && (
              <div className="absolute top-14 whitespace-nowrap px-2 py-0.5 rounded-md bg-[#151311]/90 border border-[#2A2622] text-[#8FB8A0] text-[10px] font-bold shadow-md backdrop-blur-md">
                {hoveredElementText.slice(0, 16)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
