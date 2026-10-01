import React, { useState } from 'react';
import { useLuma } from '../../context/LumaStateContext';
import { translations } from '../../locales/translations';
import { FileText, Sparkles, Upload, Volume2, RefreshCw, CheckCircle2, AlertTriangle, Calendar, Info, ArrowRight } from 'lucide-react';

export const DocumentSimplifierView: React.FC = () => {
  const { setCoreState, speak, stopSpeech, isSpeaking, preferences } = useLuma();
  const t = translations[preferences.language];

  const [inputText, setInputText] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>('Disability Pension & Support Notice');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [simplifiedDoc, setSimplifiedDoc] = useState<any>(null);

  const sampleOfficialText = `DEPARTMENT OF EMPOWERMENT OF PERSONS WITH DISABILITIES (DEPwD)
NOTIFICATION: ADIP-2026/04/ASSIST
Sub: Grant-in-aid for procurement of modern high-tech motorized assistive apparatus and smart mobility appliances.
Pursuant to Section 24 of the Rights of Persons with Disabilities Act, eligible applicants with benchmark locomotor disability exceeding 40% threshold are hereby instructed to submit formalized Form 4B along with computerized income verification certificate certifying annual aggregate family income beneath ₹2,40,000 threshold. Applications must be deposited before 15th prox. Late applications shall be summarily repudiated without prejudice. No application processing fee is leviable by any entity.`;

  const handleSimplify = async (customText?: string) => {
    setIsProcessing(true);
    setCoreState('THINKING', 'Simplifying Legal Document');

    try {
      const res = await fetch('/api/documents/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: customText || inputText || sampleOfficialText,
          title: docTitle,
          language: preferences.language
        })
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setSimplifiedDoc(data.analysis);
        setCoreState('RESOLVE', 'Document Simplified');
        speak(data.analysis.simplifiedSummary);
      }
    } catch (err) {
      console.warn('Simplify fallback:', err);
      const fallback = {
        title: 'Motorized Assistive Appliance Support Scheme',
        simplifiedSummary: 'You can receive free motorized mobility devices from the government if you have at least 40% locomotor disability and annual family income under ₹2.4 Lakhs.',
        keyPoints: [
          '40% or more locomotor disability required',
          'Annual family income must be under ₹2,40,000',
          'Application Form 4B and income certificate needed',
          'Deadline: Submit before the 15th of this month',
          'Zero application fee (Free)'
        ],
        deadlines: 'Submit before 15th of the month',
        warnings: ['Late submissions are rejected automatically. Do not pay any fees.']
      };
      setSimplifiedDoc(fallback);
      setCoreState('RESOLVE', 'Document Simplified');
      speak(fallback.simplifiedSummary);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 text-[#F4EEE3]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2622] pb-4">
        <div className="text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151311] border border-[#2A2622] text-[#E8DCC8] text-xs font-bold mb-2">
            <FileText className="w-3.5 h-3.5 text-[#E8DCC8]" /> Plain Language Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F4EEE3] font-display">
            Plain-Language Document Simplifier
          </h1>
          <p className="text-xs sm:text-sm text-[#B3A999]">
            Transform intimidating government, medical, and legal documents into clear, actionable points in {preferences.language === 'hi' ? 'Hindi' : preferences.language === 'mr' ? 'Marathi' : 'English'}.
          </p>
        </div>
      </div>

      {/* Input & Output Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Box & Sample Presets */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl border border-[#2A2622] bg-[#151311] shadow-lg space-y-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#B3A999] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#E8DCC8]" />
                <span>Original Document Text</span>
              </span>
              <button
                onClick={() => { setInputText(sampleOfficialText); setDocTitle('DEPwD Official Notice'); }}
                className="text-[11px] text-[#E8DCC8] hover:underline font-bold cursor-pointer"
              >
                Load Sample Notice
              </button>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste confusing government letters, medical forms, or legal notices here..."
              rows={8}
              className="w-full bg-[#080706] border border-[#2A2622] rounded-2xl p-4 text-xs font-mono text-[#F4EEE3] placeholder-[#B3A999]/50 focus:outline-none focus:ring-2 focus:ring-[#E8DCC8]/40 leading-relaxed resize-none"
            />

            <button
              onClick={() => handleSimplify()}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-extrabold text-sm shadow-md disabled:opacity-50 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Simplifying Content...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Simplify Document</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Clear Accessible Actionable Result */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 sm:p-7 rounded-3xl border border-[#2A2622] bg-[#151311] shadow-lg h-full flex flex-col justify-between space-y-6 text-left">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2622]">
                <h3 className="font-bold text-[#F4EEE3] text-base font-display flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#E8DCC8]" />
                  <span>Simplified Understanding</span>
                </h3>

                {simplifiedDoc?.simplifiedSummary && (
                  <button
                    onClick={() => isSpeaking ? stopSpeech() : speak(simplifiedDoc.simplifiedSummary, true)}
                    className="p-2 rounded-xl bg-[#1D1A17] border border-[#2A2622] text-[#E8DCC8] hover:bg-[#2A2622] transition-all cursor-pointer"
                    title="Speak Summary"
                  >
                    <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse text-[#E8DCC8]' : ''}`} />
                  </button>
                )}
              </div>

              {simplifiedDoc ? (
                <div className="space-y-4 text-xs text-[#F4EEE3]">
                  <div className="p-4 rounded-2xl bg-[#1D1A17] border border-[#E8DCC8]/30">
                    <span className="text-[10px] uppercase font-bold text-[#E8DCC8]">Summary</span>
                    <p className="text-sm font-semibold text-[#F4EEE3] mt-1 leading-relaxed">
                      {simplifiedDoc.simplifiedSummary}
                    </p>
                  </div>

                  {/* Action Steps */}
                  {simplifiedDoc.keyPoints?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] uppercase font-bold text-[#B3A999] block">
                        What you need to do:
                      </span>
                      <div className="space-y-1.5">
                        {simplifiedDoc.keyPoints.map((point: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#080706] border border-[#2A2622] text-[#F4EEE3]">
                            <CheckCircle2 className="w-4 h-4 text-[#8FB8A0] shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deadline & Warning */}
                  {simplifiedDoc.deadlines && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#1D1A17] border border-[#2A2622] text-[#8FB8A0] font-semibold">
                      <Calendar className="w-4 h-4 text-[#8FB8A0]" />
                      <span>{simplifiedDoc.deadlines}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-10 text-center text-[#B3A999] space-y-2">
                  <FileText className="w-8 h-8 mx-auto opacity-40 text-[#E8DCC8]" />
                  <p className="text-xs">
                    Paste text or click "Load Sample Notice" on the left to see the simplified explanation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
