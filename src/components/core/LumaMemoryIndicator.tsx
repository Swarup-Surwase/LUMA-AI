import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLuma } from '../../context/LumaStateContext';
import { Mic, Eye, HandMetal, FileText, Languages, MousePointer } from 'lucide-react';
import { LumaCoreState } from '../../types/luma';

export const LumaMemoryIndicator: React.FC = () => {
  const { memoryTraces } = useLuma();

  if (!memoryTraces.length) return null;

  const getIcon = (state: LumaCoreState) => {
    switch (state) {
      case 'LISTENING':
        return <Mic className="w-3.5 h-3.5 text-[#8FB5D6]" />;
      case 'VISION':
        return <Eye className="w-3.5 h-3.5 text-[#8FB5D6]" />;
      case 'SIGN':
        return <HandMetal className="w-3.5 h-3.5 text-[#E9B44C]" />;
      case 'FORM_ASSIST':
        return <FileText className="w-3.5 h-3.5 text-[#E8DCC8]" />;
      case 'TRANSLATE':
        return <Languages className="w-3.5 h-3.5 text-[#E8DCC8]" />;
      default:
        return <MousePointer className="w-3.5 h-3.5 text-[#B3A999]" />;
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#151311]/80 border border-[#2A2622] backdrop-blur-md shadow-xs">
      <span className="text-[10px] uppercase tracking-wider font-bold text-[#B3A999] mr-1">
        Memory
      </span>
      <div className="flex items-center gap-1.5">
        <AnimatePresence>
          {memoryTraces.map((trace) => (
            <motion.div
              key={trace.id}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{
                scale: 0.85 + trace.weight * 0.15,
                opacity: 0.35 + trace.weight * 0.65
              }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.35 }}
              title={`Recent context: ${trace.label}`}
              className="flex items-center justify-center p-1.5 rounded-full bg-[#1D1A17] border border-[#2A2622] shadow-xs"
              style={{
                filter: `blur(${(1 - trace.weight) * 0.5}px)`
              }}
            >
              {getIcon(trace.state)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

