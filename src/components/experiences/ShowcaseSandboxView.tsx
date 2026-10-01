import React, { useState, useEffect } from 'react';
import { useLuma } from '../../context/LumaStateContext';
import { LumaCore } from '../core/LumaCore';
import { LumaCoreState, FeatureLens } from '../../types/luma';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Mic,
  Eye,
  HandMetal,
  Languages,
  FileText,
  Compass,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const ShowcaseSandboxView: React.FC = () => {
  const { setCoreState, setFeatureLens, speak } = useLuma();
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPlayingAuto, setIsPlayingAuto] = useState<boolean>(false);

  const showcaseSteps: {
    state: LumaCoreState;
    lens: FeatureLens;
    title: string;
    description: string;
    audioText: string;
    icon: React.ReactNode;
  }[] = [
    {
      state: 'IDLE',
      lens: null,
      title: '1. LUMA Heartbeat (Resting State)',
      description: 'LUMA breathes softly with subtle internal pearl light and calm orbital threads, communicating constant readiness without visual exhaustion.',
      audioText: 'LUMA Heartbeat is active. The interface breathes calmly in its natural resting state.',
      icon: <Sparkles className="w-5 h-5 text-[#E8DCC8]" />
    },
    {
      state: 'LISTENING',
      lens: 'voice',
      title: '2. Voice Bloom (Speech Reactivity)',
      description: 'Microphone activation triggers organic flowing audio ribbons, fluid acceleration, and audio-reactive particle oscillations.',
      audioText: 'Voice Bloom active. Audio energy directly animates the core.',
      icon: <Mic className="w-5 h-5 text-[#8FB5D6]" />
    },
    {
      state: 'VISION',
      lens: 'vision',
      title: '3. Vision Sweep (Camera & OCR)',
      description: 'Camera scanning activates radial sweeps, scan rings, and target markers that funnel visual data into the intelligence core.',
      audioText: 'Vision Sweep active. Scanning surroundings and medicine labels.',
      icon: <Eye className="w-5 h-5 text-[#8FB5D6]" />
    },
    {
      state: 'SIGN',
      lens: 'sign',
      title: '4. Sign Collapse (Hand Landmark Recognition)',
      description: 'MediaPipe hand landmarks connect with elegant energy threads, recognizing Indian Sign Language gestures and collapsing into translated words.',
      audioText: 'Sign Collapse active. Hand gestures recognized with high confidence.',
      icon: <HandMetal className="w-5 h-5 text-[#E9B44C]" />
    },
    {
      state: 'THINKING',
      lens: null,
      title: '5. LUMA Think (Inward Vortex)',
      description: 'Neural threads activate, particles spiral inward, and the core gathers information for processing.',
      audioText: 'LUMA Think active. Processing multimodal data.',
      icon: <Sparkles className="w-5 h-5 text-[#E8DCC8]" />
    },
    {
      state: 'RESOLVE',
      lens: null,
      title: '6. LUMA Resolve (Harmonic Result Bloom)',
      description: 'A controlled outward bloom releases the final understanding with radiant clarity, then seamlessly settles back to heartbeat.',
      audioText: 'LUMA Resolve active. Result understood and presented.',
      icon: <Sparkles className="w-5 h-5 text-[#8FB8A0]" />
    },
    {
      state: 'TRANSLATE',
      lens: 'language',
      title: '7. Language Bloom (Multilingual Transformation)',
      description: 'Subtle text transformation connects English, Hindi, and Marathi in identical spatial coordinates without layout disruption.',
      audioText: 'Language Bloom active. Translating seamlessly across English, Hindi, and Marathi.',
      icon: <Languages className="w-5 h-5 text-[#E8DCC8]" />
    },
    {
      state: 'FORM_ASSIST',
      lens: 'form',
      title: '8. Focus Thread (Guided Form Travel)',
      description: 'An energy thread connects the LUMA Core to the active form input, guiding the conversation step by step.',
      audioText: 'Focus Thread active. Guiding conversational form input.',
      icon: <FileText className="w-5 h-5 text-[#E8DCC8]" />
    },
    {
      state: 'ALERT',
      lens: null,
      title: '9. LUMA Signal (Emergency Alert)',
      description: 'Important warnings and emergency signs trigger an amber pulse without flashing aggressively, prioritizing user safety.',
      audioText: 'LUMA Signal active. High priority alert.',
      icon: <ShieldAlert className="w-5 h-5 text-[#E07A5F]" />
    }
  ];

  const currentStep = showcaseSteps[activeStepIndex];

  const applyStep = (index: number) => {
    setActiveStepIndex(index);
    const step = showcaseSteps[index];
    setCoreState(step.state, step.title);
    setFeatureLens(step.lens);
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlayingAuto) {
      timer = setInterval(() => {
        setActiveStepIndex((prev) => {
          const next = (prev + 1) % showcaseSteps.length;
          applyStep(next);
          return next;
        });
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isPlayingAuto, showcaseSteps.length]);

  return (
    <div className="space-y-8 py-4 text-[#F4EEE3]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151311] border border-[#2A2622] text-[#E8DCC8] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#E8DCC8]" /> Interactive Design System
          </div>
          <h1 className="text-3xl font-extrabold text-[#F4EEE3] font-display">
            LUMA Core & Multimodal Showcase
          </h1>
          <p className="text-sm text-[#B3A999]">
            Inspect each state-driven behavior and motion signature of the LUMA intelligence core.
          </p>
        </div>

        {/* Auto Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlayingAuto(!isPlayingAuto)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isPlayingAuto
                ? 'bg-[#E07A5F] text-[#14110D]'
                : 'bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D]'
            }`}
          >
            {isPlayingAuto ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlayingAuto ? 'Pause Walkthrough' : 'Auto Tour'}</span>
          </button>
          <button
            onClick={() => {
              setIsPlayingAuto(false);
              applyStep(0);
            }}
            className="p-2.5 rounded-2xl bg-[#151311] hover:bg-[#1D1A17] border border-[#2A2622] text-[#F4EEE3] shadow-xs cursor-pointer"
            title="Reset to Heartbeat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Dual Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Interactive LUMA Core Stage */}
        <div className="lg:col-span-6 p-10 rounded-3xl border border-[#2A2622] flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden bg-[#151311] shadow-xl">
          <div className="relative z-10">
            <LumaCore size={300} interactive={true} />
          </div>

          <div className="mt-6 text-center z-10">
            <span className="text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-[#080706] border border-[#2A2622] text-[#E8DCC8]">
              State: {currentStep.state} {currentStep.lens ? `(${currentStep.lens.toUpperCase()} LENS)` : ''}
            </span>
          </div>
        </div>

        {/* Right: Step Details & Interactive Selector */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-3xl border border-[#2A2622] bg-[#151311] shadow-lg space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#080706] border border-[#2A2622]">
                {currentStep.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F4EEE3] font-display">
                  {currentStep.title}
                </h3>
                <p className="text-xs text-[#E8DCC8] font-semibold">
                  Multimodal Signature Motion
                </p>
              </div>
            </div>

            <p className="text-sm text-[#B3A999] leading-relaxed">
              {currentStep.description}
            </p>

            <button
              onClick={() => speak(currentStep.audioText)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(232,220,200,0.10)] hover:bg-[rgba(232,220,200,0.18)] border border-[#E8DCC8]/30 text-xs font-bold text-[#E8DCC8] transition-all cursor-pointer"
            >
              <span>Listen to Narration</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grid of Steps */}
          <div className="grid grid-cols-3 gap-2">
            {showcaseSteps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsPlayingAuto(false);
                  applyStep(idx);
                }}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  activeStepIndex === idx
                    ? 'bg-[#1D1A17] border-[#E8DCC8] text-[#E8DCC8] shadow-xs'
                    : 'bg-[#151311] border-[#2A2622] hover:bg-[#1D1A17] text-[#B3A999]'
                }`}
              >
                <span className="text-[11px] font-bold block truncate">{step.title}</span>
                <span className="text-[10px] text-[#B3A999]/60 uppercase">{step.state}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
