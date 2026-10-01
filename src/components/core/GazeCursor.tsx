import React, { useEffect, useState, useRef } from 'react';
import { useLuma } from '../../context/LumaStateContext';

export const GazeCursor: React.FC = () => {
  const { gazeActive, gazePos, preferences } = useLuma();
  const [dwellProgress, setDwellProgress] = useState<number>(0);
  const [isHoveringActionable, setIsHoveringActionable] = useState<boolean>(false);
  const currentTargetRef = useRef<HTMLElement | null>(null);
  const dwellStartTimeRef = useRef<number | null>(null);
  const dwellDuration = (preferences.dwellTimeSeconds || 1.5) * 1000;

  useEffect(() => {
    if (!gazeActive) {
      setDwellProgress(0);
      setIsHoveringActionable(false);
      return;
    }

    let animationFrameId: number;

    const checkHoverAndDwell = () => {
      const elem = document.elementFromPoint(gazePos.x, gazePos.y) as HTMLElement | null;
      
      const isActionable = Boolean(
        elem && (
          elem.tagName === 'BUTTON' ||
          elem.tagName === 'A' ||
          elem.tagName === 'INPUT' ||
          elem.tagName === 'TEXTAREA' ||
          elem.getAttribute('role') === 'button' ||
          elem.closest('button') ||
          elem.closest('a') ||
          elem.classList.contains('cursor-pointer') ||
          elem.classList.contains('glass-card')
        )
      );

      const actionableElem = elem?.closest('button') || elem?.closest('a') || (isActionable ? elem : null);

      if (actionableElem) {
        setIsHoveringActionable(true);
        if (currentTargetRef.current !== actionableElem) {
          currentTargetRef.current = actionableElem as HTMLElement;
          dwellStartTimeRef.current = performance.now();
          setDwellProgress(0);
        } else if (dwellStartTimeRef.current) {
          const elapsed = performance.now() - dwellStartTimeRef.current;
          const progress = Math.min(1.0, elapsed / dwellDuration);
          setDwellProgress(progress);

          if (progress >= 1.0) {
            // Trigger Click!
            (actionableElem as HTMLElement).click();
            try {
              // Soft haptic/sound feedback
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(640, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.15);
            } catch {
              // ignore
            }

            // Reset dwell
            dwellStartTimeRef.current = performance.now() + 600; // brief cooldown
            setDwellProgress(0);
          }
        }
      } else {
        currentTargetRef.current = null;
        dwellStartTimeRef.current = null;
        setDwellProgress(0);
        setIsHoveringActionable(false);
      }

      animationFrameId = requestAnimationFrame(checkHoverAndDwell);
    };

    animationFrameId = requestAnimationFrame(checkHoverAndDwell);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gazeActive, gazePos, dwellDuration]);

  if (!gazeActive) return null;

  const radius = isHoveringActionable ? 26 : 14;
  const circumference = 2 * Math.PI * (radius - 3);
  const strokeDashoffset = circumference - (dwellProgress * circumference);

  return (
    <div
      className="gaze-cursor"
      style={{
        left: `${gazePos.x}px`,
        top: `${gazePos.y}px`
      }}
      aria-hidden="true"
    >
      <svg
        width={radius * 2}
        height={radius * 2}
        className="transform -rotate-90 overflow-visible filter drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]"
      >
        {/* Background Track */}
        <circle
          cx={radius}
          cy={radius}
          r={radius - 3}
          fill="rgba(7, 13, 10, 0.4)"
          stroke="rgba(52, 211, 153, 0.25)"
          strokeWidth="2.5"
        />

        {/* Dwell Progress Indicator */}
        {isHoveringActionable && (
          <circle
            cx={radius}
            cy={radius}
            r={radius - 3}
            fill="none"
            stroke="#34d399"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        )}

        {/* Center Target Dot */}
        <circle
          cx={radius}
          cy={radius}
          r={isHoveringActionable ? 5 : 3.5}
          fill={isHoveringActionable ? '#ffffff' : '#34d399'}
          className={isHoveringActionable ? 'animate-pulse' : ''}
        />
      </svg>
    </div>
  );
};
