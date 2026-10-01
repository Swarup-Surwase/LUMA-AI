import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LumaCore } from './LumaCore';
import { translations } from '../../locales/translations';
import { useLuma } from '../../context/LumaStateContext';
import {
  Sparkles,
  ArrowRight,
  HandMetal,
  Mic,
  Compass,
  FileText
} from 'lucide-react';

interface LumaIntroSplashProps {
  onComplete: () => void;
}

export const LumaIntroSplash: React.FC<LumaIntroSplashProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const { preferences } = useLuma();
  const t = translations[preferences.language];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background Ambient Dust Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const particles: { x: number; y: number; size: number; speedY: number; opacity: number; color: string }[] = [];
    const colors = ['#E8DCC8', '#8FB8A0', '#8FB5D6', '#E9B44C'];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 0.8,
        speedY: (Math.random() * 0.4 + 0.15) * -1,
        opacity: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.y += p.speedY;
        if (p.y < -10) {
          p.y = window.innerHeight + 10;
          p.x = Math.random() * window.innerWidth;
        }
      }
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Progression sequence
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 400);   // Core Orb Genesis
    const t2 = setTimeout(() => setStage(2), 1100);  // Title & Brand Reveal
    const t3 = setTimeout(() => setStage(3), 1900);  // 4 Core Capability Pillars
    const t4 = setTimeout(() => setStage(4), 2700);  // Enter action active

    // Progress bar ticker (auto-progresses after 5.5 seconds)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1.8;
      });
    }, 100);

    const autoFinish = setTimeout(() => {
      onComplete();
    }, 5600);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(autoFinish);
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  const pillars = [
    {
      icon: <Mic className="w-4 h-4 text-[#E8DCC8]" />,
      title: 'Voice Forms',
      desc: 'Multilingual speech',
      accent: 'border-[#E8DCC8]/30 bg-[#E8DCC8]/10'
    },
    {
      icon: <HandMetal className="w-4 h-4 text-[#E9B44C]" />,
      title: 'Sign Language',
      desc: 'Real-time ISL & SOS',
      accent: 'border-[#E9B44C]/30 bg-[#E9B44C]/10'
    },
    {
      icon: <Compass className="w-4 h-4 text-[#8FB8A0]" />,
      title: 'Hands-Free Gaze',
      desc: 'Camera eye tracking',
      accent: 'border-[#8FB8A0]/30 bg-[#8FB8A0]/10'
    },
    {
      icon: <FileText className="w-4 h-4 text-[#8FB5D6]" />,
      title: 'Simplifier',
      desc: 'Plain language AI',
      accent: 'border-[#8FB5D6]/30 bg-[#8FB5D6]/10'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#0C0B0A] text-center px-4 py-8 sm:py-12 select-none overflow-hidden text-[#F4EEE3]"
    >
      {/* Dynamic Stardust Background */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Atmospheric Ambient Glow Spheres */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{
          opacity: stage >= 1 ? 0.4 : 0,
          scale: stage >= 2 ? 1.2 : 0.8
        }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
        className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#E8DCC8]/15 via-[#8FB8A0]/10 to-[#8FB5D6]/10 blur-[120px] pointer-events-none"
      />

      {/* Top Header Tag */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-5xl px-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#8FB8A0] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#B3A999]">
            Multimodal Accessibility AI
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#151311] border border-[#2A2622] text-[11px] font-semibold text-[#E8DCC8]">
          <span>EN · हिन्दी · मराठी</span>
        </div>
      </div>

      {/* Center Cinematic Content */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl my-auto space-y-6">
        {/* Core Orb Genesis */}
        <motion.div
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{
            scale: stage >= 1 ? (stage >= 2 ? 1 : 0.6) : 0.2,
            opacity: stage >= 1 ? 1 : 0
          }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="absolute inset-0 bg-[#E8DCC8]/15 rounded-full blur-2xl scale-125 animate-pulse" />
          <LumaCore size={200} interactive={false} />
        </motion.div>

        {/* Brand & Tagline Reveal */}
        <AnimatePresence>
          {stage >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="space-y-2"
            >
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#F4EEE3] font-display">
                LUMA
              </h1>
              <p className="text-sm sm:text-base text-[#E8DCC8] font-medium tracking-wide">
                {t.brandTagline || 'AI that makes the world easier to experience.'}
              </p>
              <p className="text-xs text-[#B3A999] max-w-md mx-auto">
                Empowering independence across India through speech, sign language, and gaze tracking.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4 Pillars Stagger */}
        {stage >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full pt-2"
          >
            {pillars.map((p, idx) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`p-3 rounded-2xl border ${p.accent} backdrop-blur-md text-left space-y-1 transition-transform hover:scale-105`}
              >
                <div className="p-1.5 rounded-lg bg-[#0C0B0A]/60 w-fit">
                  {p.icon}
                </div>
                <h4 className="text-xs font-bold text-[#F4EEE3]">{p.title}</h4>
                <p className="text-[10px] text-[#B3A999] leading-tight">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Bottom Action Footer & Auto-Advance Progress */}
      <div className="relative z-10 w-full max-w-md space-y-4 px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: stage >= 4 ? 1 : 0.8, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center gap-3"
        >
          <button
            onClick={onComplete}
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-extrabold text-sm shadow-[0_0_20px_rgba(232,220,200,0.3)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-[#14110D]" />
            <span>Enter Experience</span>
            <ArrowRight className="w-4 h-4 text-[#14110D]" />
          </button>
        </motion.div>

        {/* Progress Bar & Skip hint */}
        <div className="space-y-1.5">
          <div className="w-full h-1 bg-[#1D1A17] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8FB8A0] via-[#E8DCC8] to-[#E9B44C] transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#B3A999]">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-[#151311] border border-[#2A2622] text-[#F4EEE3]">Esc</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-[#151311] border border-[#2A2622] text-[#F4EEE3]">Enter</kbd> to skip</span>
            <button
              onClick={onComplete}
              className="hover:text-[#F4EEE3] underline cursor-pointer"
            >
              Skip intro
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

