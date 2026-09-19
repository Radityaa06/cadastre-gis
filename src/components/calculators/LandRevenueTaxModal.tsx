import React, { useState } from 'react';
import { 
  X, 
  Landmark, 
  Calculator, 
  FileText, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Scale, 
  Building, 
  QrCode, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { CadastralParcel } from '../../types';
import { 
  calculateLandRevenueTax, 
  generateTaxChallan, 
  LandRevenueParams,
  TaxAssessmentChallan 
} from '../../utils/landValuationEngine';

interface LandRevenueTaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcels: CadastralParcel[];
  selectedParcel: CadastralParcel | null;
  onSelectParcel?: (parcel: CadastralParcel) => void;
}

export const LandRevenueTaxModal: React.FC<LandRevenueTaxModalProps> = ({
  isOpen,
  onClose,
  parcels,
  selectedParcel,
  onSelectParcel,
}) => {
  if (!isOpen) return null;

  const currentParcel = selectedParcel || parcels[0] || null;
  const [activeParcelId, setActiveParcelId] = useState<string>(currentParcel?.id || (parcels[0]?.id ?? ''));
  const activeParcel = parcels.find((p) => p.id === activeParcelId) || currentParcel;

  // Form State
  const [acres, setAcres] = useState<number>(activeParcel?.acres || 4.82);
  const [circleRate, setCircleRate] = useState<number>(22.5); // $22.50 per sqft circle rate
  const [marketRate, setMarketRate] = useState<number>(31.0); // $31.00 per sqft market rate
  const [zoning, setZoning] = useState<LandRevenueParams['zoning']>(
    activeParcel?.zoning.toLowerCase().includes('com') ? 'commercial' :
    activeParcel?.zoning.toLowerCase().includes('ind') ? 'industrial' :
    activeParcel?.zoning.toLowerCase().includes('agri') ? 'agricultural' : 'residential'
  );
  const [municipalTier, setMunicipalTier] = useState<LandRevenueParams['municipalZoneTier']>('Tier 2 Urban');
  const [hasLateFiling, setHasLateFiling] = useState<boolean>(false);

  // Tab: 'calculator' vs 'challan'
  const [viewMode, setViewMode] = useState<'calculator' | 'challan'>('calculator');
  const [generatedChallan, setGeneratedChallan] = useState<TaxAssessmentChallan | null>(null);

  const sqft = Math.round(acres * 43560);

  // Calculate live breakdown
  const taxBreakdown = calculateLandRevenueTax({
    zoning,
    acres,
    sqft,
    circleRatePerSqFt: circleRate,
    marketRatePerSqFt: marketRate,
    municipalZoneTier: municipalTier,
    hasLateFiling,
  });

  // Handle parcel change from selector
  const handleParcelChange = (id: string) => {
    setActiveParcelId(id);
    const target = parcels.find((p) => p.id === id);
    if (target) {
      setAcres(target.acres);
      const targetZoning: LandRevenueParams['zoning'] = 
        target.zoning.toLowerCase().includes('com') ? 'commercial' :
        target.zoning.toLowerCase().includes('ind') ? 'industrial' :
        target.zoning.toLowerCase().includes('agri') ? 'agricultural' : 'residential';
      setZoning(targetZoning);
      if (onSelectParcel) onSelectParcel(target);
    }
  };

  // Generate official tax challan
  const handleGenerateChallan = () => {
    if (!activeParcel) return;
    const challan = generateTaxChallan(
      {
        pin: activeParcel.pin,
        code: activeParcel.code,
        address: activeParcel.address,
        zoning: activeParcel.zoning,
        acres,
        sqft,
        deedRecord: activeParcel.deedRecord,
      },
      {
        circleRatePerSqFt: circleRate,
        municipalZoneTier: municipalTier,
        hasLateFiling,
      }
    );
    setGeneratedChallan(challan);
    setViewMode('challan');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="land-revenue-tax-modal"
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden font-sans"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/80 border border-indigo-400/40 flex items-center justify-center text-amber-300 shadow-inner">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight font-display">
                  Land Revenue & Statutory Tax Generator
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Fiscal 2026-27
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Guideline circle rates, municipal development cess, and official tax notice generation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Pill */}
            <div className="bg-white/10 p-1 rounded-xl border border-white/15 flex items-center text-xs">
              <button
                onClick={() => setViewMode('calculator')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'calculator'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                <span>Calculator</span>
              </button>
              <button
                onClick={() => {
                  if (!generatedChallan) handleGenerateChallan();
                  else setViewMode('challan');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'challan'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>Tax Challan</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {viewMode === 'calculator' ? (
            <div className="space-y-6">
              {/* Parcel Selector Strip */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Source Parcel:
                  </span>
                  <select
                    value={activeParcelId}
                    onChange={(e) => handleParcelChange(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {parcels.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.acres} ac ({p.zoning}) - {p.pin}
                      </option>
                    ))}
                  </select>
                </div>

                {activeParcel && (
                  <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
                    <span>PIN: <strong className="text-slate-900">{activeParcel.pin}</strong></span>
                    <span>Deed: <strong className="text-slate-900">{activeParcel.deedRecord?.khasraPattaNumber || 'Khasra #142/8'}</strong></span>
                  </div>
                )}
              </div>

              {/* Levers & Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                {/* 1. Zoning */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                    Land Zoning Classification
                  </label>
                  <select
                    value={zoning}
                    onChange={(e) => setZoning(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="industrial">Industrial (Heavy / Logistics)</option>
                    <option value="commercial">Commercial (Retail / Office)</option>
                    <option value="residential">Residential (Urban Lot)</option>
                    <option value="agricultural">Agricultural (Farmland / Rural)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Determines statutory base millage rate from 0.08% to 0.65%.
                  </p>
                </div>

                {/* 2. Acreage / Area */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                    Parcel Area (Acres)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={acres}
                      onChange={(e) => setAcres(Math.max(0.01, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden pr-8"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-bold text-slate-400">ac</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {sqft.toLocaleString()} sq ft
                  </p>
                </div>

                {/* 3. Circle Rate */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                    Govt Circle Rate ($/sqft)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={circleRate}
                      onChange={(e) => setCircleRate(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden pl-6"
                    />
                    <span className="absolute left-2.5 top-2 text-[11px] font-bold text-slate-400">$</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Official Revenue Department guidance rate for tax baseline.
                  </p>
                </div>

                {/* 4. Municipal Tier & Penalty */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                    Municipal Zone Tier
                  </label>
                  <select
                    value={municipalTier}
                    onChange={(e) => setMunicipalTier(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Tier 1 Metro">Tier 1 Metro (+30% cess)</option>
                    <option value="Tier 2 Urban">Tier 2 Urban (+10% cess)</option>
                    <option value="Tier 3 Peri-Urban">Tier 3 Peri-Urban (-10%)</option>
                    <option value="Rural / Gram Panchayat">Rural Panchayat (-40%)</option>
                  </select>
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id="late-filing-chk"
                      checked={hasLateFiling}
                      onChange={(e) => setHasLateFiling(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="late-filing-chk" className="text-[10px] font-bold text-slate-600 cursor-pointer">
                      Late filing surcharge (+10%)
                    </label>
                  </div>
                </div>
              </div>

              {/* High-Impact Calculation Summary Deck */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Taxable Valuation Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-100 shadow-xs space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Statutory Taxable Base</span>
                  </span>
                  <div className="text-2xl font-black text-slate-900 font-display">
                    ${(taxBreakdown.circleValuation).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Calculated on {sqft.toLocaleString()} sq ft @ ${circleRate}/sqft
                  </div>
                </div>

                {/* 2. Annual Land Revenue Tax */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200 shadow-xs space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Total Annual Tax Payable</span>
                  </span>
                  <div className="text-2xl font-black text-emerald-700 font-display">
                    ${taxBreakdown.totalAnnualTaxPayable.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Includes Municipal, Drainage & Education Cess
                  </div>
                </div>

                {/* 3. Transfer & Stamp Duty Estimate */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/40 border border-amber-200 shadow-xs space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" />
                    <span>Deed Transfer & Stamp Duty</span>
                  </span>
                  <div className="text-2xl font-black text-slate-900 font-display">
                    ${taxBreakdown.totalTransferDuty.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Stamp duty (${taxBreakdown.stampDutyEstimate.toLocaleString()}) + 1% Registry
                  </div>
                </div>
              </div>

              {/* Itemized Statutory Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800 uppercase tracking-wider">
                    Statutory Revenue Schedule & Cess Breakdown
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    Authority: State Land Revenue Code Sec. 104-B
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs font-mono">
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 font-sans">Annual Land Revenue Base Millage</div>
                      <div className="text-[10px] text-slate-500">Base rate applied to registered circle valuation</div>
                    </div>
                    <div className="font-bold text-slate-900">${taxBreakdown.annualLandRevenueTax.toLocaleString()}</div>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 font-sans">Municipal Development Surcharge (15%)</div>
                      <div className="text-[10px] text-slate-500">Local municipal road & public utility development fund</div>
                    </div>
                    <div className="font-bold text-slate-900">${taxBreakdown.municipalDevelopmentCess.toLocaleString()}</div>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 font-sans">Drainage & Sanitation Surcharge (8%)</div>
                      <div className="text-[10px] text-slate-500">Stormwater drainage and industrial effluent network</div>
                    </div>
                    <div className="font-bold text-slate-900">${taxBreakdown.drainageAndSanitationCess.toLocaleString()}</div>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 font-sans">Education & Civic Infrastructure Cess (7%)</div>
                      <div className="text-[10px] text-slate-500">Regional state educational development levy</div>
                    </div>
                    <div className="font-bold text-slate-900">${taxBreakdown.educationAndInfrastructureCess.toLocaleString()}</div>
                  </div>

                  {hasLateFiling && (
                    <div className="p-3 flex items-center justify-between bg-rose-50/50">
                      <div>
                        <div className="font-bold text-rose-800 font-sans flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Delinquency & Late Filing Penalty (10% + fee)</span>
                        </div>
                        <div className="text-[10px] text-rose-600 font-sans">Statutory interest for overdue assessment period</div>
                      </div>
                      <div className="font-bold text-rose-700">${taxBreakdown.lateFilingPenalty.toLocaleString()}</div>
                    </div>
                  )}

                  <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between font-sans">
                    <div className="font-extrabold text-sm">Total Annual Tax Amount Due</div>
                    <div className="font-black text-lg text-emerald-400 font-mono">
                      ${taxBreakdown.totalAnnualTaxPayable.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bottom Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Computed per State Cadastral GIS & Land Revenue Statutory Guidelines</span>
                </div>

                <button
                  id="btn-generate-official-challan"
                  onClick={handleGenerateChallan}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-102"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Official Tax Assessment Challan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* OFFICIAL TAX ASSESSMENT CHALLAN VIEW */
            <div className="space-y-6">
              {generatedChallan && (
                <div 
                  id="printable-tax-challan"
                  className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-300 shadow-xl space-y-6 relative overflow-hidden"
                >
                  {/* Watermark */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center font-black text-9xl text-slate-900 select-none rotate-[-25deg]">
                    DHARNAV REVENUE
                  </div>

                  {/* Official Government Header */}
                  <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-amber-400 font-black text-xl shadow-xs">
                        <Landmark className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                          State Department of Revenue & Land Administration
                        </div>
                        <h3 className="text-lg font-black text-slate-950 tracking-tight font-display">
                          ANNUAL CADASTRAL LAND REVENUE ASSESSMENT NOTICE
                        </h3>
                        <p className="text-xs text-slate-600">
                          Form 9B — Official Statutory Demand & Tax Payment Challan
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs space-y-1">
                      <div>Challan No: <strong className="text-indigo-700 font-bold">{generatedChallan.challanNumber}</strong></div>
                      <div>Assessment Year: <strong className="text-slate-900">{generatedChallan.assessmentYear}</strong></div>
                      <div>Issued: <strong className="text-slate-700">{generatedChallan.issuedDate}</strong></div>
                      <div className="text-rose-700 font-extrabold">Pay Before: {generatedChallan.dueDate}</div>
                    </div>
                  </div>

                  {/* Parcel & Owner Identification Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Parcel PIN</span>
                      <div className="font-extrabold text-slate-900 font-mono mt-0.5">{generatedChallan.parcelPin}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{generatedChallan.parcelCode}</div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Registered Assessee</span>
                      <div className="font-bold text-slate-900 mt-0.5 truncate">{generatedChallan.registeredOwner}</div>
                      <div className="text-[10px] text-slate-500">{generatedChallan.zoning}</div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Assessed Area</span>
                      <div className="font-bold text-slate-900 font-mono mt-0.5">
                        {generatedChallan.landAreaAcres} ac ({generatedChallan.landAreaSqFt.toLocaleString()} sq ft)
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">@ ${generatedChallan.circleRatePerSqFt}/sqft Circle</div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Circle Guidance Base</span>
                      <div className="font-extrabold text-indigo-700 font-mono mt-0.5 text-sm">
                        ${generatedChallan.taxableValuation.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">Clear Title Confirmed</div>
                    </div>
                  </div>

                  {/* Schedule of Taxes Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3">Statutory Head / Levy Description</th>
                          <th className="p-3">Millage / Surcharge Basis</th>
                          <th className="p-3 text-right">Assessed Amount ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        <tr>
                          <td className="p-3 font-sans font-medium text-slate-900">Annual Basic Land Revenue Tax</td>
                          <td className="p-3 text-slate-500 font-sans">Statutory Rate on Guidance Value</td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            ${generatedChallan.taxBreakdown.annualLandRevenueTax.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-sans font-medium text-slate-900">Municipal Urban Development Cess</td>
                          <td className="p-3 text-slate-500 font-sans">15% on Basic Revenue Tax</td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            ${generatedChallan.taxBreakdown.municipalDevelopmentCess.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-sans font-medium text-slate-900">Stormwater Drainage & Industrial Surcharge</td>
                          <td className="p-3 text-slate-500 font-sans">8% Civic Network Surcharge</td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            ${generatedChallan.taxBreakdown.drainageAndSanitationCess.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-sans font-medium text-slate-900">Education & Infrastructure Cess</td>
                          <td className="p-3 text-slate-500 font-sans">7% State Infrastructure Fund</td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            ${generatedChallan.taxBreakdown.educationAndInfrastructureCess.toLocaleString()}
                          </td>
                        </tr>
                        {generatedChallan.taxBreakdown.lateFilingPenalty > 0 && (
                          <tr className="bg-rose-50/70 text-rose-900">
                            <td className="p-3 font-sans font-bold">Late Assessment Penalty Surcharge</td>
                            <td className="p-3 font-sans">Statutory Interest for Delayed Period</td>
                            <td className="p-3 text-right font-bold text-rose-700">
                              ${generatedChallan.taxBreakdown.lateFilingPenalty.toLocaleString()}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-slate-900 text-white text-sm font-sans font-bold">
                          <td className="p-3.5" colSpan={2}>
                            TOTAL STATUTORY REVENUE DUE & PAYABLE:
                          </td>
                          <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-base">
                            ${generatedChallan.taxBreakdown.totalAnnualTaxPayable.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* QR Code & Verification Signature Row */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center text-slate-700">
                        <QrCode className="w-10 h-10" />
                      </div>
                      <div>
                        <div className="font-mono text-[10px] text-slate-400">Digital Tax Receipt Hash:</div>
                        <div className="font-mono text-[11px] font-bold text-indigo-700">{generatedChallan.verificationHash}</div>
                        <div className="text-[10px] text-slate-500">Scan via State Revenue Portal for Instant Online Settlement</div>
                      </div>
                    </div>

                    <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="font-mono text-[11px] font-extrabold text-slate-800">CADASTRAL REVENUE AUTHORITY</div>
                      <div className="text-[10px] text-slate-500">Digitally Certified & Authenticated</div>
                      <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Valid for Revenue Clearance</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Challan Controls */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setViewMode('calculator')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                >
                  ← Edit Tax Parameters
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Notice / PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
