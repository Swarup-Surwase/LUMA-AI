import React, { useEffect, useState } from 'react';
import { useLuma } from '../../context/LumaStateContext';

export const FocusThread: React.FC = () => {
  const { focusTarget, preferences } = useLuma();
  const [coreCenter, setCoreCenter] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const updateCorePos = () => {
      const coreElem = document.querySelector('[role="img"][aria-label*="LUMA Core"]');
      if (coreElem) {
        const rect = coreElem.getBoundingClientRect();
        setCoreCenter({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
    };

    updateCorePos();
    window.addEventListener('resize', updateCorePos);
    window.addEventListener('scroll', updateCorePos);

    return () => {
      window.removeEventListener('resize', updateCorePos);
      window.removeEventListener('scroll', updateCorePos);
    };
  }, [focusTarget]);

  if (!focusTarget || !coreCenter || preferences.motionIntensity === 0) {
    return null;
  }

  // Calculate curve control point
  const targetCenterX = focusTarget.x + focusTarget.width / 2;
  const targetCenterY = focusTarget.y + focusTarget.height / 2;

  const dx = targetCenterX - coreCenter.x;
  const dy = targetCenterY - coreCenter.y;
  const cx1 = coreCenter.x + dx * 0.2;
  const cy1 = coreCenter.y + dy * 0.8;

  const pathData = `M ${coreCenter.x} ${coreCenter.y} Q ${cx1} ${cy1} ${targetCenterX} ${targetCenterY}`;

  return (
    <svg
      className="fixed inset-0 pointer-events-none z-30 w-full h-full"
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="thread-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#86efac" stopOpacity="0.9" />
        </linearGradient>
        <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
      </defs>

      {/* Background Soft Glow Track */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(52, 211, 153, 0.2)"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Main Energy Thread */}
      <path
        d={pathData}
        fill="none"
        stroke="url(#thread-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#glow-filter)"
        strokeDasharray="6 6"
        className="animate-pulse"
      />

      {/* Target Lock Node */}
      <circle
        cx={targetCenterX}
        cy={targetCenterY}
        r="5"
        fill="#ffffff"
        stroke="#34d399"
        strokeWidth="2"
        className="animate-ping opacity-75"
      />
      <circle
        cx={targetCenterX}
        cy={targetCenterY}
        r="4"
        fill="#34d399"
      />
    </svg>
  );
};
