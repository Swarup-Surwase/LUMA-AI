import React, { useState, useRef, useEffect } from 'react';
import { useLuma } from '../../context/LumaStateContext';
import { translations } from '../../locales/translations';
import { initAccessibleCamera, stopAccessibleCamera } from '../../utils/cameraUtils';
import { handGestureDetector, DetectedHandGesture } from '../../utils/handGestureDetector';
import { recognizeTextFromImage } from '../../utils/ocrEngine';
import {
  Eye,
  Pill,
  FileText,
  Camera,
  Volume2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  Upload,
  VideoOff,
  HandMetal,
  Activity,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';

export const VisualNarratorView: React.FC = () => {
  const { setCoreState, speak, stopSpeech, isSpeaking, preferences, requestConsent } = useLuma();
  const t = translations[preferences.language];

  const [mode, setMode] = useState<'scene' | 'medicine' | 'ocr'>('scene');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overlay' | 'split'>('overlay');
  const [isGestureControlActive, setIsGestureControlActive] = useState<boolean>(true);
  const [currentGesture, setCurrentGesture] = useState<DetectedHandGesture | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const splitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastGestureActionRef = useRef<number>(0);
  const lastStateUpdateRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const analysisInFlightRef = useRef(false);
  const analysisRequestIdRef = useRef(0);

  const captureStillFrame = async (video: HTMLVideoElement): Promise<string> => {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('Camera frame is not ready yet. Wait a moment and try again.')), 4000);
        video.addEventListener('loadeddata', () => { window.clearTimeout(timeout); resolve(); }, { once: true });
      });
    }
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    if (!sourceWidth || !sourceHeight || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      throw new Error('The camera did not provide a valid frame. Check that camera permission is allowed, then try again.');
    }

    // Copy exactly one decoded video frame. Canvas drawing does not inherit CSS mirroring.
    const scale = Math.min(1, 1600 / sourceWidth, 1200 / sourceHeight);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not prepare the camera still for analysis.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not encode the captured still.')), 'image/jpeg', 0.84));
    const image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not prepare the captured still.'));
      reader.onerror = () => reject(new Error('Could not prepare the captured still.'));
      reader.readAsDataURL(blob);
    });
    if (!image.startsWith('data:image/jpeg;base64,') || image.length < 1000 || image.length > 8_000_000) {
      throw new Error('The captured image is invalid or too large. Adjust the camera and try again.');
    }
    return image;
  };

  const normalizeUploadedImage = async (source: string): Promise<string> => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) return reject(new Error('The selected file is not a readable image.'));
      const scale = Math.min(1, 1600 / image.naturalWidth, 1200 / image.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) return reject(new Error('Could not prepare the selected image.'));
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        if (!blob || blob.size > 6_000_000) return reject(new Error('The selected image is too large to analyze.'));
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not prepare the selected image.'));
        reader.onerror = () => reject(new Error('Could not prepare the selected image.'));
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.84);
    };
    image.onerror = () => reject(new Error('The selected file is not a readable image.'));
    image.src = source;
  });

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.play().catch((err) => console.warn('Video play error:', err));
    }
  }, [stream]);

  // Real-time Hand Gesture Tracking Loop across Camera Stream (Fluid 30fps CV)
  useEffect(() => {
    if (!isCameraActive || !stream || !isGestureControlActive) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const processFrame = (timestamp: number) => {
      // Throttle CV processing to ~30 FPS to keep camera buttery smooth and prevent CPU lag
      if (timestamp - lastFrameTimeRef.current > 32) {
        lastFrameTimeRef.current = timestamp;

        const video = videoRef.current;
        const overlay = overlayCanvasRef.current;
        const splitCanvas = splitCanvasRef.current;

        if (video && video.readyState >= 2) {
          // 1. Handle overlay canvas
          if (overlay) {
            overlay.width = video.videoWidth || 640;
            overlay.height = video.videoHeight || 480;
            const ctx = overlay.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, overlay.width, overlay.height);
              const gesture = handGestureDetector.detectGestures(video, overlay, timestamp);

              if (gesture) {
                // Draw skeleton directly on canvas at 60fps (no React re-render needed for drawing)
                handGestureDetector.drawHandLandmarks(ctx, gesture, '#8FB5D6');

                // Update React HUD state max once every 350ms to avoid camera freeze
                const now = Date.now();
                if (now - lastStateUpdateRef.current > 350) {
                  lastStateUpdateRef.current = now;
                  setCurrentGesture(gesture);
                }

                // Trigger gesture actions if held (rate-limited to 2.5 seconds for snappy real-time response)
                if (now - lastGestureActionRef.current > 2500 && !isAnalyzing) {
                  if (gesture.triggerAction === 'describe_scene' && mode !== 'scene') {
                    lastGestureActionRef.current = now;
                    setMode('scene');
                    handleCaptureAndAnalyze(undefined, 'scene');
                  } else if (gesture.triggerAction === 'read_medicine' && mode !== 'medicine') {
                    lastGestureActionRef.current = now;
                    setMode('medicine');
                    handleCaptureAndAnalyze(undefined, 'medicine');
                  } else if (gesture.triggerAction === 'read_ocr' && mode !== 'ocr') {
                    lastGestureActionRef.current = now;
                    setMode('ocr');
                    handleCaptureAndAnalyze(undefined, 'ocr');
                  }
                }
              } else {
                // No hand present - clear state if previously showing
                const now = Date.now();
                if (now - lastStateUpdateRef.current > 500) {
                  lastStateUpdateRef.current = now;
                  setCurrentGesture(null);
                }
              }
            }
          }

          // 2. Handle split canvas if in split view
          if (splitCanvas && viewMode === 'split') {
            splitCanvas.width = 640;
            splitCanvas.height = 480;
            const ctx = splitCanvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#151311';
              ctx.fillRect(0, 0, splitCanvas.width, splitCanvas.height);

              // Grid lines
              ctx.strokeStyle = '#2A2622';
              ctx.lineWidth = 1;
              for (let x = 0; x < 640; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 480);
                ctx.stroke();
              }
              for (let y = 0; y < 480; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(640, y);
                ctx.stroke();
              }

              const gesture = handGestureDetector.detectGestures(video, splitCanvas, timestamp);
              if (gesture) {
                handGestureDetector.drawHandLandmarks(ctx, gesture, '#8FB5D6');
              } else {
                ctx.fillStyle = '#B3A999';
                ctx.font = '13px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Show hand in camera to track gesture', 320, 240);
                ctx.textAlign = 'start';
              }
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isCameraActive, stream, isGestureControlActive, mode, isAnalyzing, viewMode]);

  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);
    const allowed = await requestConsent('camera', 'Visual Narrator & Hand Gesture Detection');
    if (!allowed) {
      setCameraError('Camera permission was not granted. You can still upload images or use test scans.');
      return;
    }

    const result = await initAccessibleCamera('user');
    if (!result.stream) {
      setCameraError(result.error || 'Camera could not be started. Check browser camera permission and try again.');
      return;
    }
    streamRef.current = result.stream;
    setStream(result.stream);
    setIsCameraActive(true);

    setCoreState('VISION', 'Camera & Gesture Scanner Active');
    speak('Camera and hand gesture recognition active. Point camera and show gestures to control description.');
  };

  const stopCamera = () => {
    analysisRequestIdRef.current++;
    analysisInFlightRef.current = false;
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setAnalysisError(null);
    setCapturedImage(null);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    stopAccessibleCamera(streamRef.current, videoRef.current);
    streamRef.current = null;
    setStream(null);
    setIsCameraActive(false);
    setCurrentGesture(null);
    setCoreState('IDLE');
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleCaptureAndAnalyze = async (uploadedBase64?: string, targetMode?: 'scene' | 'medicine' | 'ocr') => {
    const activeMode = targetMode || mode;
    if (analysisInFlightRef.current) return;
    analysisInFlightRef.current = true;
    const requestId = ++analysisRequestIdRef.current;
    setAnalysisError(null);
    setAnalysisResult(null);
    setCapturedImage(null);
    setIsAnalyzing(true);
    setCoreState('THINKING', 'Analyzing Visual Data');

    let base64: string;

    try {
      if (uploadedBase64) {
        if (!uploadedBase64.startsWith('data:image/')) throw new Error('Please choose a valid image file.');
        base64 = await normalizeUploadedImage(uploadedBase64);
      } else {
        const video = videoRef.current;
        if (!video || !streamRef.current?.active || !streamRef.current.getVideoTracks().some(track => track.readyState === 'live')) {
          throw new Error('The camera is not active. Start the camera and allow access before capturing a frame.');
        }
        base64 = await captureStillFrame(video);
      }
      setCapturedImage(base64);

      if (activeMode === 'ocr' || activeMode === 'medicine') {
        const ocr = await recognizeTextFromImage(base64, activeMode);
        if (requestId !== analysisRequestIdRef.current) return;
        const reliable = ocr.confidence >= 65 && ocr.text.trim().length > 0;
        if (activeMode === 'ocr') {
          const resultData = {
            extractedText: reliable ? ocr.text : '',
            summary: reliable ? `OCR confidence: ${ocr.confidence}%. Please check the text against the image.` : 'Text could not be read reliably from this frame. Try better lighting, less glare, and a steadier close-up.',
            confidence: reliable ? ocr.confidence / 100 : 0,
            uncertain: !reliable
          };
          const speech = reliable ? `Possible text read from the image. Please verify it visually: ${ocr.text}` : 'I could not read the text reliably. Please improve the lighting and hold the document steady, then try again.';
          setAnalysisResult({ mode: 'ocr', data: resultData, speechText: speech });
          setCoreState('RESOLVE', reliable ? 'Text Read with OCR' : 'OCR Uncertain');
          speak(speech);
          return;
        }
        if (!reliable) {
          const speech = 'I could not read the medicine label reliably. Please do not use this scan to make medication decisions. Try again with a clear, well-lit close-up.';
          setAnalysisResult({ mode: 'medicine', data: { medicineName: 'Label not read reliably', purpose: '', dosageInstruction: '', expiryDate: '', warnings: [], uncertaintyNotice: 'No medication details are presented because OCR confidence was low.' }, speechText: speech });
          setCoreState('RESOLVE', 'Label OCR Uncertain');
          speak(speech);
          return;
        }
        const resultData = {
          medicineName: ocr.lines[0] || 'Text detected; medicine identity uncertain',
          purpose: '',
          dosageInstruction: '',
          expiryDate: '',
          warnings: [],
          uncertaintyNotice: `OCR read ${ocr.confidence}% confidence. Verify all label text with a person or trusted source before using it.`
        };
        const speech = `Possible label text. Please verify it before relying on it: ${ocr.text}`;
        setAnalysisResult({ mode: 'medicine', data: resultData, speechText: speech, rawOcrText: ocr.text });
        setCoreState('RESOLVE', 'Label Text Read with OCR');
        speak(speech);
        return;
      }

      const res = await fetch('/api/vision/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: activeMode,
          image: base64,
          language: preferences.language
        })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Vision service returned an error (${res.status}).`);
      }
      const data = await res.json();
      if (requestId !== analysisRequestIdRef.current) return;
      let sceneOcr: { text: string; confidence: number } | null = null;
      try {
        const ocr = await recognizeTextFromImage(base64, 'scene');
        if (ocr.confidence >= 65 && ocr.text.trim()) sceneOcr = { text: ocr.text, confidence: ocr.confidence };
      } catch (ocrError) {
        console.warn('Optional scene OCR failed:', ocrError);
      }
      if (requestId !== analysisRequestIdRef.current) return;
      data.data = {
        ...data.data,
        readableText: sceneOcr?.text || '',
        readableTextConfidence: sceneOcr?.confidence || 0,
        readableTextNotice: sceneOcr ? 'OCR found text, but please verify it against the captured image.' : 'No text could be read reliably from this frame.'
      };
      setAnalysisResult(data);
      setCoreState('RESOLVE', 'Visual Interpretation Complete');

      if (data.speechText) {
        speak(data.speechText);
      }
    } catch (err) {
      console.warn('Frame analysis failed:', err);
      if (requestId === analysisRequestIdRef.current) {
        setAnalysisError(err instanceof Error ? err.message : 'Frame analysis failed. Please try again.');
        setCoreState('IDLE');
      }
    } finally {
      if (requestId === analysisRequestIdRef.current) {
        analysisInFlightRef.current = false;
        setIsAnalyzing(false);
        if (!analysisError) setCoreState(isCameraActive ? 'VISION' : 'IDLE');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 12_000_000) {
      setAnalysisResult(null);
      setCapturedImage(null);
      setAnalysisError('Choose an image file smaller than 12 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCapturedImage(base64);
      handleCaptureAndAnalyze(base64, mode);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 py-4 text-[#F4EEE3]">
      {/* Header with Mode Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8FB5D6]/15 border border-[#8FB5D6]/30 text-[#8FB5D6] text-xs font-bold mb-2">
            <Eye className="w-3.5 h-3.5" /> Camera + Hand Gesture Assistant
          </div>
          <h1 className="text-3xl font-extrabold text-[#F4EEE3] font-display">
            Visual Narrator & Live Gesture Controls
          </h1>
          <p className="text-sm text-[#B3A999]">
            Real-time scene descriptions, medicine bottle reader, and camera view with live hand landmark recognition.
          </p>
        </div>

        {/* Sensory Mode Pills */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#151311] border border-[#2A2622] shadow-xs">
          <button
            onClick={() => { setMode('scene'); setAnalysisResult(null); setAnalysisError(null); }}
            disabled={isAnalyzing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'scene'
                ? 'bg-[#E8DCC8] text-[#14110D] shadow-xs'
                : 'text-[#B3A999] hover:text-[#F4EEE3]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Describe Scene</span>
          </button>
          <button
            onClick={() => { setMode('medicine'); setAnalysisResult(null); setAnalysisError(null); }}
            disabled={isAnalyzing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'medicine'
                ? 'bg-[#E8DCC8] text-[#14110D] shadow-xs'
                : 'text-[#B3A999] hover:text-[#F4EEE3]'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Medicine Label</span>
          </button>
          <button
            onClick={() => { setMode('ocr'); setAnalysisResult(null); setAnalysisError(null); }}
            disabled={isAnalyzing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'ocr'
                ? 'bg-[#E8DCC8] text-[#14110D] shadow-xs'
                : 'text-[#B3A999] hover:text-[#F4EEE3]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document OCR</span>
          </button>
        </div>
      </div>

      {/* Helpful Permission Guidance banner */}
      {cameraError && (
        <div className="p-4 rounded-2xl bg-[#151311] border border-[#E07A5F]/40 text-xs text-[#F4EEE3] space-y-2 text-left">
          <div className="flex items-center gap-2 font-bold text-[#E07A5F]">
            <AlertCircle className="w-4 h-4 text-[#E07A5F]" />
            <span>{cameraError}</span>
          </div>
          <div className="pl-6 text-[11px] text-[#B3A999]">
            💡 <strong>Tip for Safari:</strong> Click <em>Safari (in top menu bar)</em> → <em>Settings</em> → <em>Websites</em> → <em>Camera</em> → set <em>localhost</em> to <strong>Allow</strong>.
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Camera Feed + Hand Gesture Landmark Overlay */}
        <div className="lg:col-span-7 space-y-4">
          {/* Dual Mode Selector Bar */}
          {isCameraActive && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#B3A999] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#8FB5D6]" />
                <span>Camera & Gesture Display Mode:</span>
              </span>
              <div className="flex items-center gap-1 bg-[#080706] p-1 rounded-xl border border-[#2A2622] text-xs">
                <button
                  onClick={() => setViewMode('overlay')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    viewMode === 'overlay'
                      ? 'bg-[#E8DCC8] text-[#14110D] shadow-xs'
                      : 'text-[#B3A999] hover:text-[#F4EEE3]'
                  }`}
                >
                  Unified Overlay
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    viewMode === 'split'
                      ? 'bg-[#E8DCC8] text-[#14110D] shadow-xs'
                      : 'text-[#B3A999] hover:text-[#F4EEE3]'
                  }`}
                >
                  Dual Split View
                </button>
              </div>
            </div>
          )}

          {/* Viewport Container */}
          {viewMode === 'split' && isCameraActive && stream && !capturedImage ? (
            /* Split Screen Dual Mode: Camera on Left, Hand Gesture HUD on Right */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Stream 1: Camera Feed */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#0C0B0A] border border-[#2A2622] shadow-md">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#151311]/80 backdrop-blur-md text-[10px] font-bold text-[#F4EEE3] border border-[#2A2622]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8FB5D6] animate-pulse" />
                  <span>Cam Feed: {mode.toUpperCase()}</span>
                </div>
              </div>

              {/* Stream 2: Hand Skeleton Landmark Canvas HUD */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#151311] border border-[#2A2622] shadow-md">
                <canvas
                  ref={splitCanvasRef}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#080706]/90 backdrop-blur-md text-[10px] font-bold text-[#8FB5D6] border border-[#2A2622]">
                  <HandMetal className="w-3 h-3 text-[#8FB5D6]" />
                  <span>Gesture Skeleton Analyzer</span>
                </div>
                {currentGesture && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#080706]/90 text-[11px] font-bold text-[#8FB5D6] border border-[#2A2622]">
                    <span>{currentGesture.gestureName}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Unified Overlay Mode */
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-[#0C0B0A] border border-[#2A2622] shadow-md flex items-center justify-center">
              {/* Live Camera Video */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isCameraActive && stream && !capturedImage ? 'block' : 'hidden'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Live Hand Gesture Landmark Canvas Overlay */}
              <canvas
                ref={overlayCanvasRef}
                className={`absolute inset-0 w-full h-full pointer-events-none ${isCameraActive && stream && isGestureControlActive ? 'block' : 'hidden'}`}
              />

              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured Vision Target"
                  className="w-full h-full object-cover"
                />
              )}

              {isCameraActive && (stream || capturedImage) ? (
                /* Vision Sweep Overlay Animation */
                <div className="absolute inset-0 pointer-events-none border-2 border-[#8FB5D6]/40 rounded-3xl">
                  {!capturedImage && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8FB5D6] to-transparent shadow-[0_0_15px_#8FB5D6] animate-[bounce_3s_infinite]" />
                  )}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-[#151311]/90 backdrop-blur-md text-[11px] font-bold text-[#F4EEE3] border border-[#2A2622] shadow-xs pointer-events-auto">
                    <span className={`w-2 h-2 rounded-full ${capturedImage ? 'bg-[#E07A5F]' : 'bg-[#8FB5D6] animate-pulse'}`} />
                    <span>{capturedImage ? `Captured Frame (${mode.toUpperCase()})` : `Dual Feed: Cam + Hand Tracking (${mode.toUpperCase()})`}</span>
                    {capturedImage && (
                      <button
                        onClick={() => setCapturedImage(null)}
                        className="ml-1.5 px-2 py-0.5 rounded-md bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Live Feed</span>
                      </button>
                    )}
                  </div>

                  {currentGesture && !capturedImage && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151311]/95 border border-[#2A2622] text-[#8FB5D6] text-xs font-bold shadow-sm">
                      <HandMetal className="w-3.5 h-3.5 text-[#8FB5D6]" />
                      <span>Gesture: {currentGesture.gestureName}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-[#1D1A17] border border-[#2A2622] flex items-center justify-center mx-auto text-[#8FB5D6] shadow-xs">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="max-w-xs mx-auto">
                    <h3 className="font-bold text-[#F4EEE3] text-base">Camera + Hand Gesture Ready</h3>
                    <p className="text-xs text-[#B3A999] mt-1">
                      Enable camera to see both the live visual feed and hand gesture landmark tracking.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                      onClick={startCamera}
                      className="px-6 py-2.5 rounded-xl bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      Start Camera & Gestures
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-[#1D1A17] hover:bg-[#2A2622] border border-[#2A2622] text-[#F4EEE3] text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Image</span>
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* Action Bar */}
          {isCameraActive && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={stopCamera}
                  className="px-4 py-2.5 rounded-xl bg-[#1D1A17] border border-[#2A2622] text-[#F4EEE3] hover:bg-[#2A2622] text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <VideoOff className="w-4 h-4" />
                  <span>Stop</span>
                </button>

                <button
                  onClick={() => setIsGestureControlActive(!isGestureControlActive)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isGestureControlActive
                      ? 'bg-[#8FB5D6]/15 border-[#8FB5D6] text-[#8FB5D6] shadow-xs'
                      : 'bg-[#1D1A17] border-[#2A2622] text-[#B3A999]'
                  }`}
                >
                  <HandMetal className="w-4 h-4 text-[#8FB5D6]" />
                  <span>{isGestureControlActive ? 'Hand Gestures ON' : 'Gestures OFF'}</span>
                </button>
              </div>

              <button
                onClick={() => handleCaptureAndAnalyze()}
                disabled={isAnalyzing}
                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-extrabold text-sm shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Vision...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Describe Frame ({mode.toUpperCase()})</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Gesture Commands Reference Guide */}
          <div className="p-4 rounded-2xl bg-[#151311] border border-[#2A2622] shadow-xs text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-[#B3A999] flex items-center gap-1.5">
                <HandMetal className="w-3.5 h-3.5 text-[#8FB5D6]" />
                <span>Supported Hand Gesture Triggers (or click to simulate):</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => {
                  setMode('scene');
                  handleCaptureAndAnalyze(undefined, 'scene');
                }}
                className="p-2.5 rounded-xl bg-[#1D1A17] hover:bg-[#2A2622] border border-[#2A2622] hover:border-[#8FB5D6]/40 text-[#B3A999] hover:text-[#8FB5D6] text-left transition-all cursor-pointer"
              >
                <span className="font-bold block text-[#F4EEE3]">🖐️ Open Palm / Wave</span>
                <span className="text-[11px] text-[#B3A999] block mt-0.5">Triggers Scene Description</span>
              </button>
              <button
                onClick={() => {
                  setMode('ocr');
                  handleCaptureAndAnalyze(undefined, 'ocr');
                }}
                className="p-2.5 rounded-xl bg-[#1D1A17] hover:bg-[#2A2622] border border-[#2A2622] hover:border-[#8FB5D6]/40 text-[#B3A999] hover:text-[#8FB5D6] text-left transition-all cursor-pointer"
              >
                <span className="font-bold block text-[#F4EEE3]">☝️ Pointing Index</span>
                <span className="text-[11px] text-[#B3A999] block mt-0.5">Triggers Document OCR</span>
              </button>
              <button
                onClick={() => {
                  setMode('medicine');
                  handleCaptureAndAnalyze(undefined, 'medicine');
                }}
                className="p-2.5 rounded-xl bg-[#1D1A17] hover:bg-[#2A2622] border border-[#2A2622] hover:border-[#8FB5D6]/40 text-[#B3A999] hover:text-[#8FB5D6] text-left transition-all cursor-pointer"
              >
                <span className="font-bold block text-[#F4EEE3]">🤏 Pinch / Grasp</span>
                <span className="text-[11px] text-[#B3A999] block mt-0.5">Reads Medicine Label</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Structured Result Card & Spoken Audio Output */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl border border-[#2A2622] bg-[#151311] shadow-sm h-full flex flex-col justify-between space-y-4 text-left">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#F4EEE3] text-base font-display flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8FB5D6]" />
                  <span>Narration Output</span>
                </h3>

                {analysisResult?.speechText && (
                  <button
                    onClick={() => isSpeaking ? stopSpeech() : speak(analysisResult.speechText, true)}
                    className="p-2 rounded-xl bg-[#1D1A17] border border-[#2A2622] text-[#8FB5D6] hover:bg-[#2A2622] transition-all cursor-pointer"
                    title="Speak Result"
                  >
                    <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse text-[#8FB5D6]' : ''}`} />
                  </button>
                )}
              </div>

              {/* Dynamic Content Cards based on mode */}
              {analysisResult && analysisResult.data ? (
                <div className="space-y-4 text-xs text-[#F4EEE3]">
                  {/* Medicine Mode Output */}
                  {(analysisResult.mode === 'medicine' || (!analysisResult.mode && mode === 'medicine')) && (
                    <div className="space-y-3 bg-[#080706] p-4 rounded-2xl border border-[#2A2622]">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8FB5D6]">Medicine Detected</span>
                        <h4 className="text-base font-bold text-[#F4EEE3] mt-0.5">{analysisResult.data.medicineName}</h4>
                        <p className="text-[#B3A999] mt-1">{analysisResult.data.purpose}</p>
                      </div>

                      {analysisResult.data.dosageInstruction && (
                        <div className="p-2.5 rounded-xl bg-[#1D1A17] border border-[#2A2622] font-semibold text-[#F4EEE3]">
                          {analysisResult.data.dosageInstruction}
                        </div>
                      )}

                      {analysisResult.data.expiryDate && (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-[#1D1A17] border border-[#E07A5F]/40 text-[#E07A5F] font-bold">
                          <ShieldAlert className="w-4 h-4 text-[#E07A5F]" />
                          <span>{analysisResult.data.expiryDate}</span>
                        </div>
                      )}

                      {analysisResult.data.warnings?.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#E07A5F]">Safety Precautions:</span>
                          <ul className="list-disc pl-4 space-y-0.5 text-[#E07A5F]">
                            {analysisResult.data.warnings.map((w: string, i: number) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysisResult.data.uncertaintyNotice && (
                        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-[#1D1A17] text-[11px] text-[#B3A999] border border-[#2A2622]">
                          <AlertCircle className="w-3.5 h-3.5 text-[#B3A999] shrink-0 mt-0.5" />
                          <span>{analysisResult.data.uncertaintyNotice}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* OCR Document Mode Output */}
                  {(analysisResult.mode === 'ocr' || (!analysisResult.mode && mode === 'ocr')) && (
                    <div className="space-y-3 bg-[#080706] p-4 rounded-2xl border border-[#2A2622]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-[#8FB5D6] tracking-wider">
                          {analysisResult.data.uncertain ? 'Text Could Not Be Read Reliably' : 'OCR Text — Please Verify'}
                        </span>
                        {analysisResult.data.extractedText && (
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(analysisResult.data.extractedText);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1D1A17] border border-[#2A2622] text-[#B3A999] hover:text-[#8FB5D6] text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                          >
                            {copied ? <Check className="w-3 h-3 text-[#8FB5D6]" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied' : 'Copy Text'}</span>
                          </button>
                        )}
                      </div>

                      <pre className="whitespace-pre-wrap font-mono text-[11.5px] text-[#F4EEE3] bg-[#080706] p-3.5 rounded-xl border border-[#2A2622] max-h-60 overflow-y-auto leading-relaxed shadow-2xs">
                        {analysisResult.data.extractedText}
                      </pre>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-[#B3A999]">
                        <span className="font-medium">{analysisResult.data.summary}</span>
                        {analysisResult.data.confidence >= 0.65 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#8FB5D6]/15 text-[#8FB5D6] border border-[#8FB5D6]/30 font-bold text-[10px]">
                            OCR confidence {Math.round(analysisResult.data.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Scene Mode Output */}
                  {(analysisResult.mode === 'scene' || (!analysisResult.mode && mode === 'scene')) && (
                    <div className="space-y-3 bg-[#080706] p-4 rounded-2xl border border-[#2A2622]">
                      <p className="text-sm font-medium leading-relaxed text-[#F4EEE3]">
                        {analysisResult.data.description || 'The vision service did not return a scene description.'}
                      </p>
                      {analysisResult.data.objectsDetected?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {analysisResult.data.objectsDetected.map((obj: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 rounded-full bg-[#1D1A17] border border-[#2A2622] text-[#8FB5D6] text-[10px] font-bold">
                              {obj}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="border-t border-[#2A2622] pt-3">
                        <span className="text-[10px] uppercase font-bold text-[#B3A999] tracking-wider">Readable text (OCR)</span>
                        {analysisResult.data.readableText ? (
                          <>
                            <pre className="mt-2 whitespace-pre-wrap font-mono text-[11.5px] text-[#F4EEE3] bg-[#080706] p-3 rounded-xl border border-[#2A2622]">{analysisResult.data.readableText}</pre>
                            <p className="mt-1 text-[10px] text-[#E07A5F]">{analysisResult.data.readableTextNotice}</p>
                          </>
                        ) : <p className="mt-1 text-[11px] text-[#B3A999]">{analysisResult.data.readableTextNotice || 'No text could be read reliably from this frame.'}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ) : analysisError ? (
                <div role="alert" className="p-5 rounded-2xl bg-[#151311] border border-[#E07A5F]/40 text-sm text-[#E07A5F]">
                  <div className="flex items-center gap-2 font-bold"><AlertCircle className="w-4 h-4 text-[#E07A5F]" /> Frame analysis failed</div>
                  <p className="mt-2 text-xs text-[#F4EEE3]">{analysisError}</p>
                </div>
              ) : isAnalyzing ? (
                <div role="status" aria-live="polite" className="p-8 text-center text-[#8FB5D6] space-y-3">
                  <RefreshCw className="w-7 h-7 mx-auto animate-spin" />
                  <p className="text-xs font-semibold text-[#F4EEE3]">Capturing one still frame and analyzing it…</p>
                </div>
              ) : (
                <div className="p-8 text-center text-[#B3A999] space-y-2">
                  <Eye className="w-8 h-8 mx-auto opacity-40 text-[#8FB5D6]" />
                  <p className="text-xs">
                    Start camera or click "Describe Frame" to generate instant accessible descriptions.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Demo Pre-load triggers */}
            <div className="pt-4 border-t border-[#2A2622]">
              <span className="text-[10px] uppercase font-bold text-[#B3A999] block mb-2">
                Simulate Direct Sensory Scans:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setMode('medicine'); handleCaptureAndAnalyze(undefined, 'medicine'); }}
                  className="px-2.5 py-1 rounded-lg bg-[#1D1A17] border border-[#2A2622] text-[11px] text-[#B3A999] hover:text-[#8FB5D6] hover:bg-[#2A2622] cursor-pointer transition-colors"
                >
                  Test Medicine Bottle
                </button>
                <button
                  onClick={() => { setMode('ocr'); handleCaptureAndAnalyze(undefined, 'ocr'); }}
                  className="px-2.5 py-1 rounded-lg bg-[#1D1A17] border border-[#2A2622] text-[11px] text-[#B3A999] hover:text-[#8FB5D6] hover:bg-[#2A2622] cursor-pointer transition-colors"
                >
                  Test UDID Document
                </button>
                <button
                  onClick={() => { setMode('scene'); handleCaptureAndAnalyze(undefined, 'scene'); }}
                  className="px-2.5 py-1 rounded-lg bg-[#1D1A17] border border-[#2A2622] text-[11px] text-[#B3A999] hover:text-[#8FB5D6] hover:bg-[#2A2622] cursor-pointer transition-colors"
                >
                  Test Workspace Scene
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
