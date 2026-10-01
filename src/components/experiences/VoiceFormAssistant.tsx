import React, { useState, useEffect, useRef } from 'react';
import { useLuma } from '../../context/LumaStateContext';
import { translations } from '../../locales/translations';
import { speechEngine } from '../../utils/speechUtils';
import { audioAnalyzer } from '../../utils/audioAnalyzer';
import {
  Mic,
  MicOff,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  User,
  Calendar,
  Phone,
  MapPin,
  FileCheck,
  Check,
  Volume2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FormQuestion {
  key: 'name' | 'dob' | 'phone' | 'address';
  label: string;
  type: string;
  icon: React.ReactNode;
  prompt: Record<string, string>;
  placeholder: string;
}

interface ValidationResult {
  valid: boolean;
  formatted: string;
  error?: string;
}

// Convert spoken number words into digit characters
const spokenNumberWordsToDigits = (text: string): string => {
  const map: Record<string, string> = {
    zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9',
    shunya: '0', ek: '1', do: '2', doin: '2', teen: '3', char: '4', paanch: '5', pach: '5', che: '6', chhah: '6', saat: '7', aath: '8', nau: '9', nav: '9',
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
    शून्य: '0', एक: '1', दोन: '2', दो: '2', तीन: '3', चार: '4', पाच: '5', पांच: '5', सहा: '6', छह: '6', सात: '7', आठ: '8', नऊ: '9', नौ: '9'
  };

  let lower = text.toLowerCase();
  for (const [w, d] of Object.entries(map)) {
    const reg = new RegExp(`\\b${w}\\b`, 'gi');
    lower = lower.replace(reg, d);
  }
  return lower;
};

// Validate and parse Date
const validateDateInput = (raw: string, _lang?: string): ValidationResult => {
  if (!raw || !raw.trim()) {
    return { valid: false, formatted: '', error: 'Date of birth is required. Try again.' };
  }

  const text = spokenNumberWordsToDigits(raw.trim());

  // Month mapping
  const months: Record<string, number> = {
    jan: 1, january: 1, janvari: 1, जानेवारी: 1, जनवरी: 1,
    feb: 2, february: 2, farvari: 2, फेब्रुवारी: 2, फ़रवरी: 2,
    mar: 3, march: 3, मार्च: 3,
    apr: 4, april: 4, epril: 4, एप्रिल: 4, अप्रैल: 4,
    may: 5, me: 5, मे: 5, मई: 5,
    jun: 6, june: 6, जून: 6,
    jul: 7, july: 7, जुलै: 7, जुलाई: 7,
    aug: 8, august: 8, ogast: 8, ऑगस्ट: 8, अगस्त: 8,
    sep: 9, sept: 9, september: 9, सप्टेंबर: 9, सितंबर: 9,
    oct: 10, october: 10, ऑक्टोबर: 10, अक्टूबर: 10,
    nov: 11, november: 11, नोव्हेंबर: 11, नवंबर: 11,
    dec: 12, december: 12, डिसेंबर: 12, दिसंबर: 12
  };

  // Check YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = text.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= new Date().getFullYear()) {
      const formatted = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
      return { valid: true, formatted };
    }
  }

  // Check DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = text.match(/^(\d{1,2})[-\/\.\s]+(\d{1,2})[-\/\.\s]+(\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= new Date().getFullYear()) {
      const formatted = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
      return { valid: true, formatted };
    }
  }

  // Check "15 August 1995" or "15th of August 1995"
  const wordMatch = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([A-Za-z\u0900-\u097F]+)\s+(\d{4})/i);
  if (wordMatch) {
    const d = parseInt(wordMatch[1], 10);
    const mName = wordMatch[2].toLowerCase();
    const y = parseInt(wordMatch[3], 10);
    const m = months[mName];
    if (m && d >= 1 && d <= 31 && y >= 1900 && y <= new Date().getFullYear()) {
      const formatted = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
      return { valid: true, formatted };
    }
  }

  // Check "August 15, 1995"
  const monthFirstMatch = text.match(/([A-Za-z\u0900-\u097F]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i);
  if (monthFirstMatch) {
    const mName = monthFirstMatch[1].toLowerCase();
    const d = parseInt(monthFirstMatch[2], 10);
    const y = parseInt(monthFirstMatch[3], 10);
    const m = months[mName];
    if (m && d >= 1 && d <= 31 && y >= 1900 && y <= new Date().getFullYear()) {
      const formatted = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
      return { valid: true, formatted };
    }
  }

  return {
    valid: false,
    formatted: raw,
    error: 'Unsupported format. Please provide a valid date (e.g. DD/MM/YYYY or 15 August 1995). Try again.'
  };
};

// Validate and parse Phone
const validatePhoneInput = (raw: string): ValidationResult => {
  if (!raw || !raw.trim()) {
    return { valid: false, formatted: '', error: 'Mobile number is required. Try again.' };
  }

  const text = spokenNumberWordsToDigits(raw);
  const digitsOnly = text.replace(/\D/g, '');

  let cleanDigits = digitsOnly;
  if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
    cleanDigits = cleanDigits.slice(2);
  } else if (cleanDigits.length === 11 && cleanDigits.startsWith('0')) {
    cleanDigits = cleanDigits.slice(1);
  }

  if (cleanDigits.length === 10) {
    return { valid: true, formatted: cleanDigits };
  }

  return {
    valid: false,
    formatted: raw,
    error: 'Unsupported format. Please provide a 10-digit mobile number (e.g. 9876543210). Try again.'
  };
};

// Validate Name
const validateNameInput = (raw: string): ValidationResult => {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 2) {
    return { valid: false, formatted: '', error: 'Unsupported format. Full name must have at least 2 characters. Try again.' };
  }
  if (/^\d+$/.test(trimmed)) {
    return { valid: false, formatted: '', error: 'Unsupported format. Name cannot be only numbers. Try again.' };
  }
  return { valid: true, formatted: trimmed };
};

// Validate Address
const validateAddressInput = (raw: string): ValidationResult => {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 2) {
    return { valid: false, formatted: '', error: 'Unsupported format. Please enter your city and district. Try again.' };
  }
  return { valid: true, formatted: trimmed };
};

export const VoiceFormAssistant: React.FC = () => {
  const { setCoreState, setFocusTarget, preferences, speak, setAudioLevel } = useLuma();
  const t = translations[preferences.language];

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [formData, setFormData] = useState<Record<string, string>>({
    name: preferences.name && !['Shivam', 'Friend', 'Swarup', 'Swarup Surwase'].includes(preferences.name) ? preferences.name : '',
    dob: '',
    phone: '',
    address: ''
  });

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isFormComplete, setIsFormComplete] = useState<boolean>(false);

  const activeFieldRef = useRef<HTMLInputElement | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  const formQuestions: FormQuestion[] = [
    {
      key: 'name',
      label: 'Full Name / पूरा नाम / पूर्ण नाव',
      type: 'text',
      icon: <User className="w-4 h-4 text-[#E8DCC8]" />,
      prompt: {
        en: 'What is your full name?',
        hi: 'आपका पूरा नाम क्या है?',
        mr: 'आपले पूर्ण नाव काय आहे?'
      },
      placeholder: 'e.g. Aarav Sharma'
    },
    {
      key: 'dob',
      label: 'Date of Birth / जन्म तिथि / जन्मतारीख',
      type: 'text',
      icon: <Calendar className="w-4 h-4 text-[#E8DCC8]" />,
      prompt: {
        en: 'What is your date of birth?',
        hi: 'आपकी जन्म तिथि क्या है?',
        mr: 'आपली जन्मतारीख काय आहे?'
      },
      placeholder: 'e.g. 15/08/1995 or 15 August 1995'
    },
    {
      key: 'phone',
      label: 'Mobile Number / मोबाइल नंबर / मोबाईल नंबर',
      type: 'tel',
      icon: <Phone className="w-4 h-4 text-[#E8DCC8]" />,
      prompt: {
        en: 'What is your mobile number?',
        hi: 'आपका मोबाइल नंबर क्या है?',
        mr: 'आपला मोबाईल नंबर काय आहे?'
      },
      placeholder: 'e.g. 9876543210'
    },
    {
      key: 'address',
      label: 'City & District / शहर व जिला / शहर व जिल्हा',
      type: 'text',
      icon: <MapPin className="w-4 h-4 text-[#E8DCC8]" />,
      prompt: {
        en: 'What is your city or district?',
        hi: 'आपका शहर या जिला क्या है?',
        mr: 'आपले शहर किंवा जिल्हा काय आहे?'
      },
      placeholder: 'e.g. Pune, Maharashtra'
    }
  ];

  const validateField = (key: string, value: string): ValidationResult => {
    switch (key) {
      case 'name':
        return validateNameInput(value);
      case 'dob':
        return validateDateInput(value, preferences.language);
      case 'phone':
        return validatePhoneInput(value);
      case 'address':
        return validateAddressInput(value);
      default:
        return { valid: true, formatted: value };
    }
  };

  // Update Focus Thread target bounds whenever active input changes
  useEffect(() => {
    if (activeFieldRef.current && !isFormComplete) {
      const rect = activeFieldRef.current.getBoundingClientRect();
      setFocusTarget(rect);
    } else {
      setFocusTarget(null);
    }
  }, [currentStepIndex, isFormComplete, setFocusTarget]);

  // Read the active field prompt when changing step
  useEffect(() => {
    if (isFormComplete) return;

    setFieldError(null);
    const q = formQuestions[currentStepIndex];
    if (q) {
      const promptText = q.prompt[preferences.language] || q.prompt.en;
      speak(promptText);
      setCoreState('FORM_ASSIST', `Field: ${q.key.toUpperCase()}`);
    }

    return () => {
      stopVoiceInput();
    };
  }, [currentStepIndex, preferences.language, isFormComplete]);

  const startVoiceInput = async () => {
    stopVoiceInput();
    setFieldError(null);
    setIsListening(true);
    setCoreState('LISTENING', 'Listening for Voice Input');

    try {
      await audioAnalyzer.start((level) => {
        setAudioLevel(level);
      });
    } catch (e) {
      console.warn('Audio analyzer init:', e);
    }

    const currentKey = formQuestions[currentStepIndex].key;

    stopListeningRef.current = speechEngine.startListening(
      preferences.language,
      (transcript, isFinal) => {
        setInterimTranscript(transcript);

        if (isFinal && transcript.trim()) {
          const valRes = validateField(currentKey, transcript.trim());
          if (valRes.valid) {
            setFormData((prev) => ({
              ...prev,
              [currentKey]: valRes.formatted
            }));
            setFieldError(null);
            setInterimTranscript('');
            setCoreState('RESOLVE', 'Input Recorded');
            speak(`Recorded: ${valRes.formatted}`);
          } else {
            setFieldError(valRes.error || 'Unsupported format. Please try again.');
            setInterimTranscript('');
            setCoreState('ALERT', 'Unsupported Format');
            speak('Unsupported format. Please try again.');
          }
        }
      },
      (error) => {
        console.warn('Speech error:', error);
        setIsListening(false);
        setCoreState('FORM_ASSIST');
      }
    );
  };

  const stopVoiceInput = () => {
    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
    }
    audioAnalyzer.stop();
    setAudioLevel(0);
    setIsListening(false);
    setInterimTranscript('');
  };

  const handleNextStep = () => {
    stopVoiceInput();
    const currentKey = formQuestions[currentStepIndex].key;
    const currentValue = formData[currentKey] || '';
    
    const valRes = validateField(currentKey, currentValue);
    if (!valRes.valid) {
      setFieldError(valRes.error || 'Unsupported format for this field. Please try again.');
      setCoreState('ALERT', 'Unsupported Format');
      speak('Unsupported format for this field. Please try again.');
      return;
    }

    setFormData((prev) => ({ ...prev, [currentKey]: valRes.formatted }));
    setFieldError(null);

    if (currentStepIndex < formQuestions.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsFormComplete(true);
      setCoreState('RESOLVE', 'Form Complete');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      speak('Form completed successfully. All details have been verified.');
    }
  };

  const handlePrevStep = () => {
    stopVoiceInput();
    setFieldError(null);
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 text-[#F4EEE3]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2622] pb-4">
        <div className="text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E8DCC8]">
            Guided Accessibility Assistance
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F4EEE3] font-display">
            Voice-First Guided Form Assistant
          </h1>
          <p className="text-xs sm:text-sm text-[#B3A999]">
            A guided conversational form that fills fields with your voice and moves forward at your own pace.
          </p>
        </div>

        {/* Progress Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151311] border border-[#2A2622] text-xs font-bold text-[#E8DCC8]">
          <Sparkles className="w-4 h-4 text-[#E8DCC8]" />
          <span>Step {Math.min(currentStepIndex + 1, formQuestions.length)} of {formQuestions.length}</span>
        </div>
      </div>

      {/* Main Guided Form Container */}
      {!isFormComplete ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Conversational Question Card */}
          <div className="lg:col-span-7 space-y-5">
            <div className="p-6 sm:p-8 rounded-3xl border border-[#2A2622] bg-[#151311] shadow-xl space-y-6 text-left">
              {/* Question Banner */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-[#E8DCC8] tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>LUMA Voice Question</span>
                </span>
                <h2 className="text-2xl font-bold text-[#F4EEE3] font-display">
                  {formQuestions[currentStepIndex]?.prompt[preferences.language] || formQuestions[currentStepIndex]?.prompt.en}
                </h2>
              </div>

              {/* Active Input Element */}
              <div className="space-y-2">
                <label htmlFor="active-form-field" className="text-xs font-bold text-[#B3A999] block flex items-center gap-2">
                  {formQuestions[currentStepIndex]?.icon}
                  <span>{formQuestions[currentStepIndex]?.label}</span>
                </label>
                <input
                  id="active-form-field"
                  ref={activeFieldRef}
                  type={formQuestions[currentStepIndex]?.type}
                  value={isListening && interimTranscript ? interimTranscript : (formData[formQuestions[currentStepIndex]?.key] || '')}
                  onChange={(e) => setFormData({ ...formData, [formQuestions[currentStepIndex].key]: e.target.value })}
                  placeholder={formQuestions[currentStepIndex]?.placeholder}
                  className={`w-full bg-[#080706] border-2 rounded-2xl px-5 py-4 text-[#F4EEE3] text-lg placeholder-[#B3A999]/50 focus:outline-none focus:ring-4 focus:ring-[#E8DCC8]/20 shadow-sm font-medium transition-all ${
                    isListening ? 'border-[#E8DCC8] bg-[rgba(232,220,200,0.06)] ring-2 ring-[#E8DCC8]' : 'border-[#2A2622] focus:border-[#E8DCC8]'
                  }`}
                />
                {fieldError && (
                  <div className="p-3.5 rounded-2xl bg-[#E07A5F]/15 border border-[#E07A5F]/40 text-[#E07A5F] flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fieldError}</span>
                  </div>
                )}
                {isListening && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8FB5D6] pt-1">
                    <span className="w-2 h-2 rounded-full bg-[#8FB5D6] animate-ping" />
                    <span>Listening live... {interimTranscript ? `"${interimTranscript}"` : 'Speak now'}</span>
                  </div>
                )}
              </div>

              {/* Mic Action Bar & Voice Feedback */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={isListening ? stopVoiceInput : startVoiceInput}
                  className={`flex-1 min-w-[160px] flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                    isListening
                      ? 'bg-[#E8DCC8] text-[#14110D] animate-pulse'
                      : 'bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D]'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-5 h-5" />
                      <span>Listening... (Tap to Pause)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>Speak Answer</span>
                    </>
                  )}
                </button>

                {/* Previous Step Button */}
                {currentStepIndex > 0 && (
                  <button
                    onClick={handlePrevStep}
                    className="p-4 rounded-2xl bg-[#1D1A17] hover:bg-[#2A2622] border border-[#2A2622] text-[#F4EEE3] transition-all cursor-pointer"
                    title="Previous Field"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Manual Confirm & Next Button */}
                <button
                  onClick={handleNextStep}
                  className="flex items-center gap-2 py-4 px-6 rounded-2xl bg-[#1D1A17] hover:bg-[#2A2622] border border-[#2A2622] hover:border-[#E8DCC8]/40 text-[#F4EEE3] hover:text-[#E8DCC8] font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  <span>{currentStepIndex === formQuestions.length - 1 ? 'Finish Form' : 'Next Field'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Live speech transcription text preview */}
              {interimTranscript && (
                <p className="text-xs text-[#E8DCC8] font-mono italic">
                  Hearing: "{interimTranscript}"
                </p>
              )}
            </div>
          </div>

          {/* Form Overview Summary */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl border border-[#2A2622] bg-[#151311] shadow-lg space-y-4 text-left">
              <h3 className="font-bold text-[#F4EEE3] text-base font-display flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#E8DCC8]" />
                <span>Form Progress Overview</span>
              </h3>

              <div className="space-y-2.5">
                {formQuestions.map((q, idx) => (
                  <div
                    key={q.key}
                    onClick={() => { stopVoiceInput(); setCurrentStepIndex(idx); }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      idx === currentStepIndex
                        ? 'bg-[#1D1A17] border-[#E8DCC8] text-[#E8DCC8] font-bold shadow-xs'
                        : formData[q.key]
                        ? 'bg-[#080706] border-[#2A2622] text-[#F4EEE3]'
                        : 'bg-[#080706]/60 border-[#2A2622] text-[#B3A999]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {q.icon}
                      <span className="text-xs">{q.key.toUpperCase()}</span>
                    </div>
                    {formData[q.key] ? (
                      <div className="flex items-center gap-1.5 text-xs text-[#8FB8A0]">
                        <span className="truncate max-w-[120px] font-semibold text-[#F4EEE3]">{formData[q.key]}</span>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      </div>
                    ) : (
                      <span className="text-[10px] uppercase font-semibold text-[#B3A999]">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Form Complete Success Confirmation Card */
        <div className="p-8 sm:p-10 rounded-3xl border border-[#2A2622] bg-[#151311] text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-[#8FB8A0]/15 border border-[#8FB8A0]/30 flex items-center justify-center mx-auto text-[#8FB8A0] shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F4EEE3] font-display">
              Form Completed Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-[#B3A999] mt-1">
              Your information has been captured and verified.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-[#080706] p-5 rounded-2xl border border-[#2A2622] text-left space-y-2 text-xs font-mono text-[#F4EEE3]">
            <div><strong className="text-[#E8DCC8]">Name:</strong> {formData.name}</div>
            <div><strong className="text-[#E8DCC8]">Date of Birth:</strong> {formData.dob || '1998-05-12'}</div>
            <div><strong className="text-[#E8DCC8]">Phone:</strong> {formData.phone || '9876543210'}</div>
            <div><strong className="text-[#E8DCC8]">Location:</strong> {formData.address || 'Pune, Maharashtra'}</div>
          </div>

          <button
            onClick={() => { setIsFormComplete(false); setCurrentStepIndex(0); }}
            className="px-6 py-3 rounded-2xl bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-bold text-xs shadow-md cursor-pointer"
          >
            Start New Voice Form
          </button>
        </div>
      )}
    </div>
  );
};
