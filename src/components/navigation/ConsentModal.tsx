import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLuma } from '../../context/LumaStateContext';
import { Camera, Mic, ShieldCheck, Lock } from 'lucide-react';

export const ConsentModal: React.FC = () => {
  const { consentRequest, closeConsentModal } = useLuma();

  if (!consentRequest || !consentRequest.isOpen) return null;

  const isCamera = consentRequest.type === 'camera';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0B0A]/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg bg-[#151311] border border-[#2A2622] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-[#F4EEE3]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="consent-title"
          aria-describedby="consent-desc"
        >
          {/* Header Icon */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E8DCC8]/15 border border-[#E8DCC8]/30 flex items-center justify-center text-[#E8DCC8] shadow-[0_0_20px_rgba(232,220,200,0.15)]">
              {isCamera ? <Camera className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#E8DCC8]">
                Privacy & Consent
              </span>
              <h3 id="consent-title" className="text-xl font-bold text-[#F4EEE3] font-display">
                Enable {isCamera ? 'Camera Access' : 'Microphone Access'}
              </h3>
            </div>
          </div>

          {/* Plain-Language Explanation */}
          <div className="space-y-3 text-sm text-[#B3A999] leading-relaxed bg-[#080706] p-4 rounded-2xl border border-[#2A2622]">
            <p id="consent-desc" className="font-medium text-[#F4EEE3]">
              LUMA needs your {isCamera ? 'camera' : 'microphone'} for{' '}
              <span className="text-[#E8DCC8] font-semibold">{consentRequest.featureName}</span>.
            </p>
            <ul className="space-y-2 text-xs text-[#B3A999]">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8FB8A0] shrink-0" />
                <span><strong className="text-[#F4EEE3]">Processed locally:</strong> Real-time feature processing.</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#8FB8A0] shrink-0" />
                <span><strong className="text-[#F4EEE3]">No surveillance:</strong> Raw video or voice is never stored on servers.</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => closeConsentModal(false)}
              className="py-3 px-4 rounded-xl bg-[#1D1A17] hover:bg-[#2A2622] text-[#B3A999] hover:text-[#F4EEE3] border border-[#2A2622] font-semibold text-sm transition-all cursor-pointer"
            >
              Not Now
            </button>
            <button
              onClick={() => closeConsentModal(true)}
              className="py-3 px-4 rounded-xl bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Allow Access
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
