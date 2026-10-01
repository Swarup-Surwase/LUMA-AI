import React, { useRef, useEffect, useState } from 'react';
import { useLuma } from '../../context/LumaStateContext';
import { LumaCoreState, FeatureLens } from '../../types/luma';

interface LumaCoreProps {
  size?: number;
  className?: string;
  showCaption?: boolean;
  interactive?: boolean;
}

export const LumaCore: React.FC<LumaCoreProps> = ({
  size = 360,
  className = '',
  showCaption = true,
  interactive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mouseOffset, setMouseOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const { coreState, featureLens, preferences, audioLevel } = useLuma();
  const stateRef = useRef({ coreState, featureLens, audioLevel, motionIntensity: preferences.motionIntensity });

  useEffect(() => {
    stateRef.current = { coreState, featureLens, audioLevel, motionIntensity: preferences.motionIntensity };
  }, [coreState, featureLens, audioLevel, preferences.motionIntensity]);

  // Subtle cursor parallax (max 12px)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (preferences.motionIntensity === 0 || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = ((e.clientX - centerX) / (rect.width / 2)) * 12;
    const dy = ((e.clientY - centerY) / (rect.height / 2)) * 12;
    setMouseOffset({ x: dx, y: dy });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const getStatePalette = (state: LumaCoreState, lens: FeatureLens) => {
      if (lens === 'voice' || state === 'LISTENING') {
        return {
          primary: '#8FB5D6', // sky
          secondary: '#E8DCC8', // beige
          glow: 'rgba(143, 181, 214, 0.35)',
          nucleus: '#F1E6D0',
          speed: 1.5,
          scale: 1.05 + (stateRef.current.audioLevel * 0.15)
        };
      }
      if (lens === 'sign' || state === 'SIGN') {
        return {
          primary: '#E9B44C', // amber
          secondary: '#F1E6D0', // champagne
          glow: 'rgba(233, 180, 76, 0.32)',
          nucleus: '#F1E6D0',
          speed: 1.2,
          scale: 1.03
        };
      }
      if (lens === 'gaze' || state === 'VISION') {
        return {
          primary: '#8FB8A0', // sage
          secondary: '#E8DCC8', // beige
          glow: 'rgba(143, 184, 160, 0.32)',
          nucleus: '#F1E6D0',
          speed: 1.3,
          scale: 1.03
        };
      }
      if (state === 'ALERT') {
        return {
          primary: '#E07A5F', // terracotta
          secondary: '#F1E6D0',
          glow: 'rgba(224, 122, 95, 0.38)',
          nucleus: '#F1E6D0',
          speed: 1.8,
          scale: 1.06
        };
      }
      // IDLE Resting State (Warm champagne core with faint sage and sky halo accents)
      return {
        primary: '#F1E6D0',
        secondary: '#8FB8A0',
        glow: 'rgba(232, 220, 200, 0.22)',
        nucleus: '#F4EEE3',
        speed: 0.8,
        scale: 1.0
      };
    };

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const palette = getStatePalette(stateRef.current.coreState, stateRef.current.featureLens);
      const motion = stateRef.current.motionIntensity === 0 ? 0 : 1;

      time += 0.015 * palette.speed * motion;

      const baseRadius = (size * 0.32) * palette.scale;

      // 1. Soft Outermost Ambient Glow Aura
      const outerGlow = ctx.createRadialGradient(cx, cy, baseRadius * 0.6, cx, cy, baseRadius * 1.55);
      outerGlow.addColorStop(0, palette.glow);
      outerGlow.addColorStop(0.6, 'rgba(232, 220, 200, 0.05)');
      outerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 1.55, 0, Math.PI * 2);
      ctx.fill();

      // 2. Orbital Light Rings (Thin Intelligence Arcs)
      const numArcs = 3;
      for (let i = 0; i < numArcs; i++) {
        const arcRadius = baseRadius * (1.12 + i * 0.12);
        const arcAngle = time * (0.8 + i * 0.3) * (i % 2 === 0 ? 1 : -1);
        const arcLen = Math.PI * (0.65 + Math.sin(time + i) * 0.2);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(arcAngle);
        ctx.beginPath();
        ctx.arc(0, 0, arcRadius, 0, arcLen);
        ctx.strokeStyle = i === 0 ? palette.primary : palette.secondary;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.shadowColor = palette.primary;
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.6 + Math.sin(time * 2 + i) * 0.2;
        ctx.stroke();
        ctx.restore();
      }

      // 3. Pearlescent Glass Core Sphere (Warm Champagne with Sage & Sky Halo Accents)
      const sphereGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.3,
        cy - baseRadius * 0.35,
        baseRadius * 0.1,
        cx,
        cy,
        baseRadius
      );
      sphereGrad.addColorStop(0, '#FFFFFF');
      sphereGrad.addColorStop(0.35, 'rgba(244, 238, 227, 0.95)');
      sphereGrad.addColorStop(0.7, 'rgba(29, 26, 23, 0.85)');
      sphereGrad.addColorStop(0.9, 'rgba(143, 184, 160, 0.40)'); // faint sage
      sphereGrad.addColorStop(1, 'rgba(143, 181, 214, 0.45)'); // faint sky

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 14;
      ctx.fill();

      // 4. Glass Rim Light
      ctx.strokeStyle = 'rgba(244, 238, 227, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 5. Inner Optical Nucleus
      const innerNucleusGrad = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        baseRadius * 0.45
      );
      innerNucleusGrad.addColorStop(0, palette.primary);
      innerNucleusGrad.addColorStop(0.6, 'rgba(143, 227, 214, 0.4)');
      innerNucleusGrad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = innerNucleusGrad;
      ctx.globalAlpha = 0.5 + Math.sin(time * 1.5) * 0.2;
      ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [size]);

  // Current State Label for single glass caption
  const getCaptionText = () => {
    switch (coreState) {
      case 'LISTENING':
        return 'Listening for Voice Input...';
      case 'VISION':
        return 'Camera & Vision Scanner Active';
      case 'SIGN':
        return 'Indian Sign Language Tracking';
      case 'THINKING':
        return 'Interpreting Accessibility Data...';
      case 'RESOLVE':
        return 'Task Complete & Verified';
      case 'FORM_ASSIST':
        return 'Conversational Form Assistant';
      case 'ALERT':
        return 'Emergency Distress Signal Active';
      default:
        return 'LUMA Core — Ready';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      style={{
        transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)`,
        transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)'
      }}
    >
      {/* Background Soft Glow Field */}
      <div className="ambient-glow-teal -top-12 -left-12 opacity-80" />
      <div className="ambient-glow-sunrise -bottom-10 -right-10 opacity-50" />

      {/* Breathing Canvas Core */}
      <div className="animate-orb-breathe relative z-10 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          style={{ width: `${size}px`, height: `${size}px` }}
          className="pointer-events-none"
        />
      </div>

      {/* Single Restrained Glass Caption Pill */}
      {showCaption && (
        <div className="relative z-20 -mt-3">
          <div className="px-5 py-2 rounded-full bg-[#151311] border border-[#2A2622] flex items-center gap-2.5 text-xs font-semibold text-[#F4EEE3] shadow-lg">
            <span
              className={`w-2 h-2 rounded-full ${
                coreState === 'ALERT'
                  ? 'bg-[#E07A5F] animate-ping'
                  : coreState === 'LISTENING'
                  ? 'bg-[#8FB5D6] animate-pulse'
                  : 'bg-[#E8DCC8]'
              }`}
            />
            <span>{getCaptionText()}</span>
          </div>
        </div>
      )}
    </div>
  );
};
