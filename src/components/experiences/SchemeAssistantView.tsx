import React, { useState, useEffect } from 'react';
import { useLuma } from '../../context/LumaStateContext';
import { translations } from '../../locales/translations';
import { HelpCircle, CheckCircle, ShieldCheck, Sparkles, ExternalLink, Volume2, RefreshCw, ArrowRight } from 'lucide-react';

export const SchemeAssistantView: React.FC = () => {
  const { setCoreState, speak, preferences } = useLuma();
  const t = translations[preferences.language];

  const [disabilityType, setDisabilityType] = useState<string>('Locomotor');
  const [ageGroup, setAgeGroup] = useState<string>('18-45');
  const [incomeBand, setIncomeBand] = useState<string>('Below 2.5 Lakhs');
  const [hasUDID, setHasUDID] = useState<boolean>(true);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchSchemes = async () => {
    setIsLoading(true);
    setCoreState('THINKING', 'Evaluating Welfare Schemes');

    try {
      const res = await fetch('/api/schemes/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disabilityType,
          age: ageGroup,
          incomeCategory: incomeBand,
          hasUDID,
          language: preferences.language
        })
      });

      const data = await res.json();
      if (data.success && data.schemes) {
        setSchemes(data.schemes);
        setCoreState('RESOLVE', 'Schemes Evaluated');
        speak(`Found ${data.schemes.length} matching government schemes and grant opportunities.`);
      }
    } catch (err) {
      console.warn('Schemes mock fallback:', err);
      setSchemes([
        {
          id: 'adip',
          name: 'ADIP Scheme (Assistance to Disabled Persons)',
          ministry: 'Ministry of Social Justice & Empowerment',
          benefits: '100% grant for motorized tricycles, smart canes, wheelchairs, and hearing aids.',
          eligibility: '40%+ benchmark disability with annual income under ₹2.5 Lakhs',
          steps: ['Fill Form 4B', 'Submit UDID copy', 'Collect equipment from ALIMCO center']
        },
        {
          id: 'udid',
          name: 'Unique Disability ID (UDID) National Card',
          ministry: 'Department of Persons with Disabilities',
          benefits: 'Single unified national card for transport concessions, scholarships, and hospital priority.',
          eligibility: 'All Indian citizens with certified disability',
          steps: ['Apply online at swavlambancard.gov.in', 'Medical board verification', 'Digital card issue']
        }
      ]);
      setCoreState('RESOLVE', 'Schemes Evaluated');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [preferences.language]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 text-[#F4EEE3]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2622] pb-4">
        <div className="text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8FB8A0]/15 border border-[#8FB8A0]/30 text-[#8FB8A0] text-xs font-bold mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-[#8FB8A0]" /> Welfare & Grants Guide
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F4EEE3] font-display">
            Scheme Eligibility & Benefits Assistant
          </h1>
          <p className="text-xs sm:text-sm text-[#B3A999]">
            Personalized guidance for Indian government assistive device grants (ADIP), UDID cards, and welfare schemes.
          </p>
        </div>
      </div>

      {/* Filter Options Bar */}
      <div className="p-6 rounded-3xl border border-[#2A2622] bg-[#151311] shadow-lg space-y-4 text-left">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8FB8A0]">
          Personalize Eligibility Criteria:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Disability Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#B3A999]">Disability Type</label>
            <select
              value={disabilityType}
              onChange={(e) => setDisabilityType(e.target.value)}
              className="w-full bg-[#080706] border border-[#2A2622] rounded-xl px-3 py-2 text-xs font-semibold text-[#F4EEE3] focus:outline-none focus:ring-2 focus:ring-[#8FB8A0]/40"
            >
              <option value="Locomotor">Locomotor / Orthopedic</option>
              <option value="Visual">Visual Impairment / Blindness</option>
              <option value="Hearing">Hearing & Speech</option>
              <option value="Multiple">Multiple Disabilities</option>
            </select>
          </div>

          {/* Age Group */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#B3A999]">Age Band</label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="w-full bg-[#080706] border border-[#2A2622] rounded-xl px-3 py-2 text-xs font-semibold text-[#F4EEE3] focus:outline-none focus:ring-2 focus:ring-[#8FB8A0]/40"
            >
              <option value="Below 18">Child (Under 18)</option>
              <option value="18-45">Adult (18 - 45)</option>
              <option value="Above 45">Senior (45+)</option>
            </select>
          </div>

          {/* Income */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#B3A999]">Annual Family Income</label>
            <select
              value={incomeBand}
              onChange={(e) => setIncomeBand(e.target.value)}
              className="w-full bg-[#080706] border border-[#2A2622] rounded-xl px-3 py-2 text-xs font-semibold text-[#F4EEE3] focus:outline-none focus:ring-2 focus:ring-[#8FB8A0]/40"
            >
              <option value="Below 2.5 Lakhs">Below ₹2.5 Lakhs (Full Grant)</option>
              <option value="2.5 - 5 Lakhs">₹2.5 - 5 Lakhs (50% Subsidy)</option>
              <option value="Above 5 Lakhs">Above ₹5 Lakhs</option>
            </select>
          </div>

          {/* Action */}
          <div className="flex items-end">
            <button
              onClick={fetchSchemes}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#E8DCC8] hover:bg-[#F4EEE3] text-[#14110D] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Find Matches</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scheme Cards Grid */}
      <div className="space-y-4">
        {schemes.map((scheme, idx) => (
          <div
            key={scheme.id || idx}
            className="p-6 sm:p-7 rounded-3xl border border-[#2A2622] bg-[#151311] shadow-lg space-y-4 text-left"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#2A2622]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8FB8A0]">
                  {scheme.ministry || 'Government Welfare Grant'}
                </span>
                <h3 className="text-lg font-bold text-[#F4EEE3] font-display">
                  {scheme.name}
                </h3>
              </div>
              <button
                onClick={() => speak(`${scheme.name}. Benefits: ${scheme.benefits}`)}
                className="p-2 rounded-xl bg-[#1D1A17] border border-[#2A2622] text-[#8FB8A0] hover:bg-[#2A2622] self-start sm:self-auto cursor-pointer transition-colors"
                title="Read scheme details"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#F4EEE3] leading-relaxed font-medium">
              {scheme.benefits}
            </p>

            <div className="p-3 rounded-2xl bg-[#080706] border border-[#2A2622] text-xs text-[#B3A999]">
              <strong className="text-[#8FB8A0]">Eligibility:</strong> {scheme.eligibility}
            </div>

            {scheme.steps?.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] uppercase font-bold text-[#B3A999]">How to claim:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {scheme.steps.map((step: string, sIdx: number) => (
                    <div key={sIdx} className="p-2.5 rounded-xl bg-[#1D1A17] border border-[#2A2622] text-xs text-[#F4EEE3] flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#8FB8A0]/15 text-[#8FB8A0] font-bold text-[10px] flex items-center justify-center shrink-0">
                        {sIdx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
