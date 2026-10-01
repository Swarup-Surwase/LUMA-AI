import React, { useState } from 'react';
import { useLuma } from '../../context/LumaStateContext';
import { translations } from '../../locales/translations';
import { LumaCore } from '../core/LumaCore';
import { ActiveModule } from '../../types/luma';
import {
  Eye,
  HandMetal,
  Compass,
  Mic,
  FileText,
  HelpCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Volume2,
  Lock,
  Globe2
} from 'lucide-react';

interface HomeDashboardViewProps {
  onOpenOnboarding: () => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  onOpenOnboarding
}) => {
  const { setActiveModule, preferences, speak, setCoreState } = useLuma();
  const t = translations[preferences.language];

  // Voice Form Live Demo State in Hero
  const [formDemoInput, setFormDemoInput] = useState<string>('');
  const [formDemoActive, setFormDemoActive] = useState<boolean>(false);
  const [activeLangTab, setActiveLangTab] = useState<'en' | 'hi' | 'mr'>('en');

  const handleSimulateVoiceFill = () => {
    setFormDemoActive(true);
    setCoreState('LISTENING', 'Simulating Voice Input');
    speak('Filling name field: Aarav Sharma');
    setTimeout(() => {
      setFormDemoInput('Aarav Sharma, Pune');
      setCoreState('RESOLVE', 'Voice Input Complete');
    }, 1200);
  };

  const productRailItems: {
    id: ActiveModule;
    title: string;
    subtitle: string;
    description: string;
    tag: string;
    icon: React.ReactNode;
    preview: React.ReactNode;
    tagColor: string;
  }[] = [
    {
      id: 'sign_language',
      title: 'Sign Language',
      subtitle: 'Indian Sign Language',
      description: 'Translates 21-point hand landmarks into spoken text and offers an emergency visual SOS broadcast.',
      tag: 'ISL Recognition',
      tagColor: 'text-[#E9B44C] bg-[#E9B44C]/14 border-[#E9B44C]/25',
      icon: <HandMetal className="w-5 h-5 text-[#E9B44C]" />,
      preview: (
        <div className="space-y-3 p-4 rounded-2xl bg-[#080706] border border-[#2A2622] text-xs">
          <div className="flex items-center justify-between text-[#B3A999] font-mono text-[10px]">
            <span>21-POINT SKELETON</span>
            <span className="text-[#E9B44C]">98% ACCURACY</span>
          </div>
          <div className="h-28 rounded-xl bg-[#151311] border border-[#2A2622] flex flex-col justify-center items-center text-center p-3">
            <span className="text-2xl mb-1">🙏</span>
            <span className="text-[#F4EEE3] font-bold text-xs">Namaste / Greeting</span>
            <span className="text-[#B3A999] text-[10px]">ISL Dictionary Matched</span>
          </div>
        </div>
      )
    },
    {
      id: 'hands_free_gaze',
      title: 'Hands-Free Gaze',
      subtitle: 'Eye Tracking Navigation',
      description: 'Control web pages, select actions, and type using camera gaze tracking and dwell clicking.',
      tag: 'Motor Accessibility',
      tagColor: 'text-[#8FB8A0] bg-[#8FB8A0]/14 border-[#8FB8A0]/25',
      icon: <Compass className="w-5 h-5 text-[#8FB8A0]" />,
      preview: (
        <div className="space-y-3 p-4 rounded-2xl bg-[#080706] border border-[#2A2622] text-xs">
          <div className="flex items-center justify-between text-[#B3A999] font-mono text-[10px]">
            <span>DWELL CLICK TIMER</span>
            <span className="text-[#8FB8A0]">1.5s LOCK</span>
          </div>
          <div className="h-28 rounded-xl bg-[#151311] border border-[#2A2622] flex items-center justify-center gap-2 p-3">
            <div className="w-12 h-12 rounded-2xl bg-[#8FB8A0]/15 border border-[#8FB8A0] flex items-center justify-center text-[#8FB8A0] font-bold">
              YES
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#1D1A17] border border-[#2A2622] flex items-center justify-center text-[#B3A999]">
              NO
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'voice_forms',
      title: 'Voice Forms',
      subtitle: 'Conversational Input',
      description: 'Fill government, hospital, and bank forms step-by-step in Hindi, Marathi, or English.',
      tag: 'Voice Assistant',
      tagColor: 'text-[#E8DCC8] bg-[#E8DCC8]/14 border-[#E8DCC8]/25',
      icon: <Mic className="w-5 h-5 text-[#E8DCC8]" />,
      preview: (
        <div className="space-y-3 p-4 rounded-2xl bg-[#080706] border border-[#2A2622] text-xs">
          <div className="flex items-center justify-between text-[#B3A999] font-mono text-[10px]">
            <span>FORM ASSISTANT</span>
            <span className="text-[#E8DCC8]">UDID & ADIP</span>
          </div>
          <div className="h-28 rounded-xl bg-[#151311] border border-[#2A2622] p-3 space-y-2 text-left">
            <span className="text-[10px] text-[#B3A999] block">Active: Full Name</span>
            <div className="px-2.5 py-1.5 rounded-lg bg-[#1D1A17] border border-[#2A2622] text-[#B3A999] font-normal text-xs">
              e.g. Aarav Sharma
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'document_simplifier',
      title: 'Document Simplifier',
      subtitle: 'Plain Language AI',
      description: 'Translates complex official legal, medical, and pension notices into simple everyday language.',
      tag: 'Cognitive Access',
      tagColor: 'text-[#E8DCC8] bg-[#E8DCC8]/14 border-[#E8DCC8]/25',
      icon: <FileText className="w-5 h-5 text-[#E8DCC8]" />,
      preview: (
        <div className="space-y-3 p-4 rounded-2xl bg-[#080706] border border-[#2A2622] text-xs">
          <div className="flex items-center justify-between text-[#B3A999] font-mono text-[10px]">
            <span>COGNITIVE SIMPLIFIER</span>
            <span className="text-[#E8DCC8]">GRADE 5 LEVEL</span>
          </div>
          <div className="h-28 rounded-xl bg-[#151311] border border-[#2A2622] p-3 space-y-1 text-left">
            <span className="text-[#E8DCC8] font-bold text-xs">✓ Plain English / Hindi</span>
            <p className="text-[#B3A999] text-[10px]">Converts 12-page legal circulars to 3 bullet takeaways.</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="w-full bg-[#0C0B0A] text-[#F4EEE3]">
      {/* ============================================================
          SECTION 1: HERO (PAGE BACKGROUND #0C0B0A, WARM BLACK + BEIGE)
         ============================================================ */}
      <section className="section-band-light pt-12 pb-28 sm:pt-20 sm:pb-36 px-6 sm:px-12 lg:px-20 min-h-[90vh] flex items-center bg-[#0C0B0A]">
        <div className="ambient-glow-teal top-1/4 left-1/3 -translate-x-1/2 opacity-70" />
        <div className="ambient-glow-sunrise bottom-10 right-10 opacity-40" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Huge Headline + One Line of Copy + 2 Buttons */}
          <div className="lg:col-span-7 space-y-8 text-left relative z-10">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#F4EEE3] font-display leading-[1.08]">
              AI that makes the world{' '}
              <span className="text-[#E8DCC8]">easier to experience.</span>
            </h1>

            <p className="text-lg sm:text-xl text-[#B3A999] max-w-xl leading-relaxed font-normal">
              An intelligent multimodal companion designed for vision, voice, gaze, and Indian Sign Language across India.
            </p>

            {/* Actions (Primary beige + Ghost) */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenOnboarding}
                className="px-8 h-14 rounded-full bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-bold text-sm sm:text-base flex items-center gap-2 shadow-[0_4px_20px_rgba(232,220,200,0.25)] transition-all cursor-pointer focus-visible:ring-3 focus-visible:ring-[#E8DCC8]"
              >
                <span>Start with LUMA</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveModule('sign_language')}
                className="px-6 h-14 rounded-full bg-transparent hover:bg-[#1D1A17] border border-[#2A2622] hover:border-[#E8DCC8]/50 text-[#F4EEE3] hover:text-[#E8DCC8] font-semibold text-sm sm:text-base transition-all cursor-pointer focus-visible:ring-3 focus-visible:ring-[#E8DCC8]"
              >
                <span>Launch Sign Language</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Orb Core */}
          <div className="lg:col-span-5 flex items-center justify-center relative z-10">
            <LumaCore size={380} showCaption={true} />
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 2: FIVE MODALITIES (SURFACE #151311, PRODUCT RAIL)
         ============================================================ */}
      <section className="section-band-dark py-28 sm:py-36 px-6 sm:px-12 lg:px-20 bg-[#151311] border-y border-[#2A2622]">
        <div className="ambient-glow-dark-teal -top-24 right-10" />

        <div className="max-w-7xl mx-auto space-y-12 relative z-10 text-left">
          {/* Section Heading */}
          <div className="max-w-xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E8DCC8]">
              Interaction Modalities
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F4EEE3] font-display tracking-tight">
              Five ways in.
            </h2>
            <p className="text-base text-[#B3A999]">
              Interact naturally with whatever sense you choose: voice, gesture, gaze, or Indian Sign Language.
            </p>
          </div>

          {/* Horizontal Snap Rail */}
          <div className="snap-rail gap-6 pb-6 -mx-6 px-6 sm:mx-0 sm:px-0">
            {productRailItems.map((item) => (
              <div
                key={item.id}
                className="snap-rail-card bg-[#1D1A17] border border-[#2A2622] hover:border-[#E8DCC8]/40 rounded-[28px] p-7 flex flex-col justify-between space-y-6 hover:translate-y-[-4px] transition-all duration-300 group shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-[#080706] border border-[#2A2622] flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${item.tagColor}`}>
                      {item.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-[#F4EEE3] font-display">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#E8DCC8] font-medium mt-0.5">
                      {item.subtitle}
                    </p>
                    <p className="text-sm text-[#B3A999] mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* UI Preview Area */}
                <div>
                  {item.preview}
                </div>

                <button
                  onClick={() => setActiveModule(item.id)}
                  className="w-full min-h-[44px] rounded-2xl bg-[#151311] hover:bg-[#E8DCC8] border border-[#2A2622] hover:border-[#E8DCC8] text-[#F4EEE3] hover:text-[#14110D] font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer focus-visible:ring-3 focus-visible:ring-[#E8DCC8]"
                >
                  <span>Open {item.title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 3: SAY IT, WE FILL IT (SURFACE #0C0B0A, VOICE FORMS)
         ============================================================ */}
      <section className="section-band-light py-28 sm:py-36 px-6 sm:px-12 lg:px-20 bg-[#0C0B0A]">
        <div className="ambient-glow-teal top-10 right-1/4 opacity-60" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Explanation */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E8DCC8]">
              Flagship Experience
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#F4EEE3] font-display tracking-tight leading-[1.12]">
              Say it, we fill it.
            </h2>
            <p className="text-base sm:text-lg text-[#B3A999] leading-relaxed">
              No tiny touchscreens or complex bureaucratic dropdowns. Speak in Marathi, Hindi, or English, and LUMA guides you through government UDID and disability pension forms one question at a time.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setActiveModule('voice_forms')}
                className="px-7 py-3.5 rounded-full bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-bold text-sm shadow-[0_4px_20px_rgba(232,220,200,0.25)] flex items-center gap-2 transition-all cursor-pointer focus-visible:ring-3 focus-visible:ring-[#E8DCC8]"
              >
                <span>Open Voice Form Assistant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Live Interactive Mock Form */}
          <div className="lg:col-span-7">
            <div className="bg-[#151311] border border-[#2A2622] rounded-[28px] p-8 sm:p-10 space-y-6 text-left shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#2A2622] pb-4">
                <div>
                  <h3 className="font-bold text-lg text-[#F4EEE3] font-display">
                    National Disability Grant Form (UDID)
                  </h3>
                  <p className="text-xs text-[#B3A999]">
                    Department of Empowerment of Persons with Disabilities
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#E8DCC8]/15 text-[#E8DCC8] border border-[#E8DCC8]/30 text-xs font-bold">
                  Step 1 of 4
                </span>
              </div>

              {/* Form Input with active Focus Highlight */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#080706] border-2 border-[#E8DCC8] shadow-sm space-y-1.5">
                  <label className="text-xs font-bold text-[#F4EEE3] block">
                    Full Name / पूरा नाम / पूर्ण नाव
                  </label>
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={formDemoInput}
                      onChange={(e) => setFormDemoInput(e.target.value)}
                      placeholder="e.g. Aarav Sharma (or tap 'Test Voice Transcription')"
                      className="w-full text-base font-semibold text-[#F4EEE3] bg-transparent outline-none placeholder:text-[#B3A999]/40"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-[#E8DCC8] font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#E8DCC8] animate-pulse" />
                      <span>Listening</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 opacity-60">
                  <div className="p-3.5 rounded-2xl bg-[#1D1A17] border border-[#2A2622] text-xs">
                    <span className="text-[10px] text-[#B3A999] block">Date of Birth</span>
                    <span className="font-semibold text-[#F4EEE3]">1998-05-14</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#1D1A17] border border-[#2A2622] text-xs">
                    <span className="text-[10px] text-[#B3A999] block">Disability Type</span>
                    <span className="font-semibold text-[#F4EEE3]">Locomotor (45%)</span>
                  </div>
                </div>
              </div>

              {/* Waveform and Action */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <button
                  onClick={handleSimulateVoiceFill}
                  className="px-4 py-2.5 rounded-xl bg-[#1D1A17] hover:bg-[#2A2622] border border-[#2A2622] text-[#F4EEE3] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer focus-visible:ring-3 focus-visible:ring-[#E8DCC8]"
                >
                  <Volume2 className="w-4 h-4 text-[#E8DCC8]" />
                  <span>Test Voice Transcription</span>
                </button>

                <div className="flex items-center gap-1">
                  {[40, 70, 30, 90, 60, 80, 45, 95, 35].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-[#E8DCC8] rounded-full transition-all duration-300"
                      style={{
                        height: formDemoActive ? `${h * 0.3}px` : '8px',
                        opacity: formDemoActive ? 1 : 0.4
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4: LANGUAGES (SURFACE #151311, MULTILINGUAL CROSSFADE)
         ============================================================ */}
      <section className="section-band-dark py-28 sm:py-36 px-6 sm:px-12 lg:px-20 text-center bg-[#151311] border-y border-[#2A2622]">
        <div className="ambient-glow-dark-teal top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-4xl mx-auto space-y-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#080706] border border-[#2A2622] text-[#E8DCC8] text-xs font-bold">
            <Globe2 className="w-3.5 h-3.5 text-[#E8DCC8]" />
            <span>Built for India’s Multilingual Reality</span>
          </div>

          {/* Language Switch Tabs */}
          <div className="flex items-center justify-center gap-2">
            {[
              { id: 'en', label: 'English' },
              { id: 'hi', label: 'हिन्दी (Hindi)' },
              { id: 'mr', label: 'मराठी (Marathi)' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveLangTab(tab.id as 'en' | 'hi' | 'mr')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeLangTab === tab.id
                    ? 'bg-[#E8DCC8] text-[#14110D] shadow-md'
                    : 'text-[#B3A999] hover:text-[#F4EEE3] bg-[#080706] border border-[#2A2622]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Crossfading Giant Sentence */}
          <div className="min-h-[160px] flex items-center justify-center px-4">
            {activeLangTab === 'en' && (
              <h3 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-[#F4EEE3] font-display tracking-tight animate-in fade-in duration-300">
                “AI that makes the world easier to experience.”
              </h3>
            )}
            {activeLangTab === 'hi' && (
              <h3 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-[#F4EEE3] font-devanagari tracking-tight animate-in fade-in duration-300 leading-relaxed">
                “एआई जो दुनिया को अनुभव करना आसान बनाता है।”
              </h3>
            )}
            {activeLangTab === 'mr' && (
              <h3 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-[#F4EEE3] font-devanagari tracking-tight animate-in fade-in duration-300 leading-relaxed">
                “तंत्रज्ञान जे जग अनुभवणे अधिक सोपे आणि सुलभ करते.”
              </h3>
            )}
          </div>

          <p className="text-sm text-[#B3A999] max-w-lg mx-auto">
            From official government notices to medicine labels, LUMA speaks and simplifies in regional languages naturally.
          </p>
        </div>
      </section>

      {/* ============================================================
          SECTION 5: TRUST & INCLUSION (SURFACE #0C0B0A, 3 CLEAN METRICS)
         ============================================================ */}
      <section className="section-band-light py-24 sm:py-32 px-6 sm:px-12 lg:px-20 bg-[#0C0B0A]">
        <div className="max-w-7xl mx-auto space-y-16 text-center">
          <div className="max-w-xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E8DCC8]">
              Human-Centric Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F4EEE3] font-display tracking-tight">
              Designed for privacy and dignity.
            </h2>
          </div>

          {/* 3 Clean Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-[#151311] border border-[#2A2622] rounded-[28px] p-8 space-y-3 shadow-lg">
              <span className="text-5xl font-extrabold text-[#E9B44C] font-display block">
                21
              </span>
              <h3 className="text-base font-bold text-[#F4EEE3]">
                Live Hand Landmarks
              </h3>
              <p className="text-xs text-[#B3A999] leading-relaxed">
                Real-time joint coordinate modeling for Indian Sign Language without external motion sensor hardware.
              </p>
            </div>

            <div className="bg-[#151311] border border-[#2A2622] rounded-[28px] p-8 space-y-3 shadow-lg">
              <span className="text-5xl font-extrabold text-[#8FB8A0] font-display block">
                100%
              </span>
              <h3 className="text-base font-bold text-[#F4EEE3]">
                Private & On-Device
              </h3>
              <p className="text-xs text-[#B3A999] leading-relaxed">
                Camera and audio streams run locally in your browser to safeguard user confidentiality.
              </p>
            </div>

            <div className="bg-[#151311] border border-[#2A2622] rounded-[28px] p-8 space-y-3 shadow-lg">
              <span className="text-5xl font-extrabold text-[#8FB5D6] font-display block">
                3
              </span>
              <h3 className="text-base font-bold text-[#F4EEE3]">
                Official Languages
              </h3>
              <p className="text-xs text-[#B3A999] leading-relaxed">
                Full neural synthesis and simplified readability in English, Hindi, and Marathi with Noto Devanagari support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 6: FINAL CTA (SURFACE #151311, SINGLE LINE + BUTTON)
         ============================================================ */}
      <section className="section-band-dark py-28 sm:py-36 px-6 sm:px-12 lg:px-20 text-center relative bg-[#151311] border-t border-[#2A2622]">
        <div className="ambient-glow-teal top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-70" />

        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-[#F4EEE3] font-display tracking-tight">
            Experience technology on your own terms.
          </h2>
          <p className="text-base text-[#B3A999] max-w-lg mx-auto">
            Choose your preferred interaction method and let LUMA adapt to you.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenOnboarding}
              className="px-9 h-14 rounded-full bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-bold text-base shadow-[0_4px_20px_rgba(232,220,200,0.25)] flex items-center gap-2 mx-auto transition-all cursor-pointer focus-visible:ring-3 focus-visible:ring-[#E8DCC8]"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
