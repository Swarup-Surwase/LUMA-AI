import React, { useState } from 'react';
import { useLuma } from '../../context/LumaStateContext';
import { ShieldAlert, AlertTriangle, PhoneCall } from 'lucide-react';

interface EmergencyFloatingButtonProps {
  onTriggerEmergency?: () => void;
}

export const EmergencyFloatingButton: React.FC<EmergencyFloatingButtonProps> = ({
  onTriggerEmergency
}) => {
  const { setCoreState, speak } = useLuma();
  const [isHovered, setIsHovered] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);

  const handleClick = () => {
    setIsTriggered(true);
    setCoreState('ALERT', 'Emergency SOS Activated');
    speak('Emergency alert activated. Broadcasting visual distress signal and Indian Sign Language assistance.');
    onTriggerEmergency?.();

    setTimeout(() => {
      setIsTriggered(false);
    }, 4000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        aria-label="Emergency SOS and Indian Sign Language Distress Signal"
        className={`group flex items-center gap-2 p-3 rounded-full transition-all duration-300 cursor-pointer shadow-xl ${
          isTriggered
            ? 'bg-[#E07A5F] text-[#14110D] scale-105 ring-4 ring-[#E07A5F]/40 animate-pulse'
            : 'bg-[#151311]/90 hover:bg-[#1D1A17] text-[#E07A5F] hover:text-[#F4EEE3] border border-[#E07A5F]/40 hover:border-[#E07A5F]/70 backdrop-blur-xl'
        }`}
        style={{
          boxShadow: isHovered
            ? '0 12px 32px -4px rgba(224, 122, 95, 0.45), 0 0 0 1px rgba(224, 122, 95, 0.3)'
            : '0 8px 24px -4px rgba(224, 122, 95, 0.25)'
        }}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
          <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
        </div>

        <span
          className={`overflow-hidden whitespace-nowrap font-bold text-xs pr-3 transition-all duration-300 ${
            isHovered || isTriggered ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0'
          }`}
        >
          {isTriggered ? 'SOS Broadcasting' : 'Emergency Sign SOS'}
        </span>
      </button>
    </div>
  );
};
