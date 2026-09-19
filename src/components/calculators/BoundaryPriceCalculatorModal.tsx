import React, { useState } from 'react';
import { 
  X, 
  Calculator, 
  Maximize2, 
  DollarSign, 
  ShieldCheck, 
  Layers, 
  Move, 
  FileDown, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Building2, 
  Compass, 
  Scale, 
  Sparkles,
  ArrowRight,
  Sliders
} from 'lucide-react';
import { CadastralParcel } from '../../types';
import { 
  calculateBoundaryFencingEstimate, 
  calculateLandValuation, 
  FENCING_OPTIONS, 
  FencingType,
  BoundaryDemarcationEstimate,
  LandValuationEstimate
} from '../../utils/landValuationEngine';
import { calculateRealParcelTelemetry } from '../../utils/cadastreCalculations';

interface BoundaryPriceCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcels: CadastralParcel[];
  selectedParcel: CadastralParcel | null;
  onSelectParcel?: (parcel: CadastralParcel) => void;
  defaultSubTab?: 'boundary' | 'valuation';
}

export const BoundaryPriceCalculatorModal: React.FC<BoundaryPriceCalculatorModalProps> = ({
  isOpen,
  onClose,
  parcels,
  selectedParcel,
  onSelectParcel,
  defaultSubTab = 'boundary',
}) => {
  if (!isOpen) return null;

  const currentParcel = selectedParcel || parcels[0] || null;
  const [activeParcelId, setActiveParcelId] = useState<string>(currentParcel?.id || (parcels[0]?.id ?? ''));
  const activeParcel = parcels.find((p) => p.id === activeParcelId) || currentParcel;

  // Derive real telemetry if available
  const liveTelemetry = activeParcel 
    ? calculateRealParcelTelemetry(activeParcel.boundaryPoints, activeParcel.originalAiBoundaryPoints, activeParcel.acres)
    : null;

  // Sub-tab: 'boundary' (Perimeter & Fencing Estimation) vs 'valuation' (Land Price & Amount Calculator)
  const [subTab, setSubTab] = useState<'boundary' | 'valuation'>(defaultSubTab);

  // -------------------------------------------------------------
  // Boundary Fencing State
  // -------------------------------------------------------------
  const [perimeterMeters, setPerimeterMeters] = useState<number>(liveTelemetry?.perimeterMeters || 420);
  const [fencingType, setFencingType] = useState<FencingType>('precast_concrete');
  const [gateCount, setGateCount] = useState<number>(2);
  const [includeDgps, setIncludeDgps] = useState<boolean>(true);

  // -------------------------------------------------------------
  // Land Price & Valuation State
  // -------------------------------------------------------------
  const [acres, setAcres] = useState<number>(activeParcel?.acres || 4.82);
  const [baseMarketRate, setBaseMarketRate] = useState<number>(32.5); // $32.50 per sqft
  const [circleRate, setCircleRate] = useState<number>(22.5); // $22.50 per sqft
  const [roadFrontageFeet, setRoadFrontageFeet] = useState<number>(180);
  const [isCornerLot, setIsCornerLot] = useState<boolean>(true);
  const [hasHighwayAccess, setHasHighwayAccess] = useState<boolean>(true);
  const [topography, setTopography] = useState<'flat_prime' | 'moderate_slope' | 'wetland_buffer'>('flat_prime');
  const [titleTier, setTitleTier] = useState<'A_unencumbered' | 'B_minor_encroachment' | 'C_disputed'>(
    activeParcel?.deedRecord?.encroachmentDetected ? 'C_disputed' : 'A_unencumbered'
  );

  const sqft = Math.round(acres * 43560);

  // Synchronize when switching parcels
  const handleParcelSelect = (id: string) => {
    setActiveParcelId(id);
    const target = parcels.find((p) => p.id === id);
    if (target) {
      setAcres(target.acres);
      const tele = calculateRealParcelTelemetry(target.boundaryPoints, target.originalAiBoundaryPoints, target.acres);
      setPerimeterMeters(tele.perimeterMeters);
      if (target.deedRecord?.encroachmentDetected) {
        setTitleTier('C_disputed');
      } else {
        setTitleTier('A_unencumbered');
      }
      if (onSelectParcel) onSelectParcel(target);
    }
  };

  // Perform Real-Time Calculations
  const boundaryEstimate: BoundaryDemarcationEstimate = calculateBoundaryFencingEstimate(
    perimeterMeters,
    fencingType,
    gateCount,
    includeDgps
  );

  const valuationEstimate: LandValuationEstimate = calculateLandValuation({
    acres,
    sqft,
    baseMarketRatePerSqFt: baseMarketRate,
    circleRatePerSqFt: circleRate,
    roadFrontageFeet,
    isCornerLot,
    hasDirectHighwayAccess: hasHighwayAccess,
    soilOrTopographyCondition: topography,
    clearTitleTier: titleTier,
  });

  const handleExportSummary = () => {
    const data = {
      parcelCode: activeParcel?.code,
      pin: activeParcel?.pin,
      exportDate: new Date().toISOString(),
      boundaryEstimate,
      valuationEstimate,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `valuation-boundary-${activeParcel?.code || 'report'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="boundary-price-calculator-modal"
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden font-sans"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between border-b border-teal-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600/80 border border-teal-400/40 flex items-center justify-center text-teal-200 shadow-inner">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight font-display">
                  Boundary Estimation & Land Price Valuation
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30">
                  Perimeter & Market Capitalization
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Calculate boundary demarcation fencing costs, linear footage, and fair market parcel valuation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sub-Tab Navigation */}
            <div className="bg-white/10 p-1 rounded-xl border border-white/15 flex items-center text-xs">
              <button
                onClick={() => setSubTab('boundary')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  subTab === 'boundary'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Boundary Fencing</span>
              </button>
              <button
                onClick={() => setSubTab('valuation')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  subTab === 'valuation'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Land Price Calc</span>
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Source Parcel Sync Strip */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Active Lot:
              </span>
              <select
                value={activeParcelId}
                onChange={(e) => handleParcelSelect(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                {parcels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.acres} ac ({p.address})
                  </option>
                ))}
              </select>
            </div>

            {activeParcel && (
              <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
                <span>Perimeter: <strong className="text-slate-900">{boundaryEstimate.perimeterMeters}m ({boundaryEstimate.perimeterLinearFeet} ft)</strong></span>
                <span>Zoning: <strong className="text-slate-900">{activeParcel.zoning}</strong></span>
              </div>
            )}
          </div>

          {/* TAB 1: BOUNDARY DEMARCATION & FENCING ESTIMATION */}
          {subTab === 'boundary' && (
            <div className="space-y-6">
              {/* Levers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* 1. Perimeter Length */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                    Total Boundary Perimeter
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="5"
                      min="20"
                      value={perimeterMeters}
                      onChange={(e) => setPerimeterMeters(Math.max(10, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden pr-8 font-mono"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-bold text-slate-400">m</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between font-mono">
                    <span>{boundaryEstimate.perimeterLinearFeet.toLocaleString()} linear ft</span>
                    <span>~{boundaryEstimate.cornerPillarsCount} boundary corners</span>
                  </div>
                </div>

                {/* 2. Commercial Gate Count */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                    Heavy Vehicular Access Gates
                  </label>
                  <select
                    value={gateCount}
                    onChange={(e) => setGateCount(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value={1}>1 Main Commercial Entry Gate (20ft)</option>
                    <option value={2}>2 Gates (Main + Emergency / Logistics)</option>
                    <option value={3}>3 Gates (Multi-Axis Perimeter Access)</option>
                    <option value={4}>4 Gates (All-Quadrant Access)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    ${boundaryEstimate.gateUnitCost.toLocaleString()} per commercial sliding/swing steel gate unit.
                  </p>
                </div>

                {/* 3. DGPS Survey Verification Toggle */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                    Cadastral Verification
                  </label>
                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeDgps}
                        onChange={(e) => setIncludeDgps(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Include DGPS Field Demarcation
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                      Statutory benchmark monumentation & surveyor field stamp verification ($450 baseline).
                    </p>
                  </div>
                </div>
              </div>

              {/* Fencing Material Selection Cards */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Select Boundary Wall / Fencing Architecture
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(FENCING_OPTIONS) as FencingType[]).map((key) => {
                    const opt = FENCING_OPTIONS[key];
                    const isSelected = fencingType === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setFencingType(key)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/60 shadow-xs ring-2 ring-teal-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-extrabold text-xs text-slate-900">{opt.name}</h4>
                            <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded">
                              ${opt.materialCostPerMeter + opt.laborCostPerMeter}/m
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            {opt.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Lifespan: {opt.estimatedLifespanYears} yrs</span>
                          <span className="text-slate-600 font-sans font-medium">{opt.recommendedZoning}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Boundary Cost Breakdown Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-3.5 bg-gradient-to-r from-slate-900 to-teal-950 text-white flex items-center justify-between text-xs">
                  <span className="font-extrabold tracking-wider uppercase">
                    Boundary Demarcation Estimation Schedule
                  </span>
                  <span className="font-mono text-teal-300 text-[11px] font-bold">
                    Est. Timeline: {boundaryEstimate.estimatedCompletionDays} Business Days
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs font-mono">
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 font-sans">
                        Fencing Materials ({boundaryEstimate.selectedFencing.name})
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {boundaryEstimate.perimeterMeters}m @ ${boundaryEstimate.selectedFencing.materialCostPerMeter}/m
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">${boundaryEstimate.materialCost.toLocaleString()}</div>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 font-sans">Labor, Trenching & Post Foundation</div>
                      <div className="text-[10px] text-slate-500">
                        Site alignment, excavation & concrete footing @ ${boundaryEstimate.selectedFencing.laborCostPerMeter}/m
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">${boundaryEstimate.laborCost.toLocaleString()}</div>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 font-sans">
                        Commercial Gate Assembly ({boundaryEstimate.gateCount} Gates)
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Heavy galvanized sliding track with motorized lock preparation
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">${boundaryEstimate.gateTotalCost.toLocaleString()}</div>
                  </div>

                  {includeDgps && (
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 font-sans">
                          Cadastral DGPS Demarcation & Monumentation Fee
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Field GIS surveyor calibration & benchmark stone monuments
                        </div>
                      </div>
                      <div className="font-bold text-slate-900">${boundaryEstimate.dgpsSurveyVerificationFee.toLocaleString()}</div>
                    </div>
                  )}

                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 font-sans">Municipal Permits & Contingency (5%)</div>
                      <div className="text-[10px] text-slate-500">Statutory boundary clearance & material contingencies</div>
                    </div>
                    <div className="font-bold text-slate-900">${boundaryEstimate.contingencyAndPermits.toLocaleString()}</div>
                  </div>

                  <div className="p-4 bg-teal-50 border-t-2 border-teal-200 flex items-center justify-between font-sans">
                    <div>
                      <div className="font-black text-sm text-teal-950">TOTAL ESTIMATED BOUNDARY COST</div>
                      <div className="text-[10px] text-teal-700">
                        Total turnkey cost for {boundaryEstimate.perimeterMeters}m ({boundaryEstimate.perimeterLinearFeet} ft)
                      </div>
                    </div>
                    <div className="text-2xl font-black text-teal-700 font-mono">
                      ${boundaryEstimate.totalBoundaryCost.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LAND AMOUNT & MARKET PRICE CALCULATOR */}
          {subTab === 'valuation' && (
            <div className="space-y-6">
              {/* Levers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* 1. Base Market Rate */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                    Base Market Rate ($/sqft)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={baseMarketRate}
                      onChange={(e) => setBaseMarketRate(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden pl-6 font-mono"
                    />
                    <span className="absolute left-2.5 top-2 text-[11px] font-bold text-slate-400">$</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Comparable baseline transactions in this sector.
                  </p>
                </div>

                {/* 2. Road Frontage */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                    Primary Road Frontage (Feet)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={roadFrontageFeet}
                      onChange={(e) => setRoadFrontageFeet(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden pr-8 font-mono"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-bold text-slate-400">ft</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Yields +6% to +18% frontage valuation premium.
                  </p>
                </div>

                {/* 3. Topography & Soil */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                    Topography & Buildable Footprint
                  </label>
                  <select
                    value={topography}
                    onChange={(e) => setTopography(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="flat_prime">Flat 100% Prime Buildable (0% adj)</option>
                    <option value="moderate_slope">Moderate Slope / Grading (-6%)</option>
                    <option value="wetland_buffer">Wetland / Stream Setback (-15%)</option>
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Adjusts for sitework grading and environmental buffers.
                  </p>
                </div>
              </div>

              {/* Title & Multiplier Toggles Strip */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCornerLot}
                      onChange={(e) => setIsCornerLot(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-slate-800">Corner Lot Bonus (+10%)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasHighwayAccess}
                      onChange={(e) => setHasHighwayAccess(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-slate-800">Direct Highway Access (+15%)</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Title Clearance:</span>
                  <select
                    value={titleTier}
                    onChange={(e) => setTitleTier(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800"
                  >
                    <option value="A_unencumbered">Tier A: 100% Clean Title</option>
                    <option value="B_minor_encroachment">Tier B: Minor Encroachment (-8%)</option>
                    <option value="C_disputed">Tier C: Active Dispute (-22%)</option>
                  </select>
                </div>
              </div>

              {/* 3-KPI Valuation Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-emerald-200 shadow-xs space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Net Fair Market Price</span>
                  </span>
                  <div className="text-2xl font-black text-emerald-700 font-display">
                    ${valuationEstimate.netEstimatedMarketPrice.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    ${valuationEstimate.effectivePricePerSqFt}/sqft (${valuationEstimate.effectivePricePerAcre.toLocaleString()}/acre)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-100 shadow-xs space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Circle Guidance Base</span>
                  </span>
                  <div className="text-2xl font-black text-slate-900 font-display">
                    ${valuationEstimate.circleGuidanceValuation.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Government guidance value @ ${circleRate}/sqft
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/40 border border-amber-200 shadow-xs space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Market Premium Gap</span>
                  </span>
                  <div className="text-2xl font-black text-amber-600 font-display">
                    +{valuationEstimate.governmentCircleGapPercentage}%
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Market valuation over government circle floor
                  </div>
                </div>
              </div>

              {/* Valuation Breakdown & Recommendation */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                  Adjustments & Premium Analysis
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400">Frontage Premium</div>
                    <div className="font-bold text-emerald-600">+${valuationEstimate.roadFrontagePremium.toLocaleString()}</div>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400">Corner & Highway</div>
                    <div className="font-bold text-emerald-600">+${(valuationEstimate.cornerLotBonus + valuationEstimate.highwayAccessBonus).toLocaleString()}</div>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400">Topography Adj.</div>
                    <div className={`font-bold ${valuationEstimate.topographyAdjustment < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {valuationEstimate.topographyAdjustment < 0 ? '-' : ''}${Math.abs(valuationEstimate.topographyAdjustment).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400">Title Risk Adj.</div>
                    <div className={`font-bold ${valuationEstimate.titleClearanceAdjustment < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {valuationEstimate.titleClearanceAdjustment < 0 ? '-' : ''}${Math.abs(valuationEstimate.titleClearanceAdjustment).toLocaleString()}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 italic bg-white p-3 rounded-xl border border-slate-200 leading-snug">
                  💡 {valuationEstimate.recommendationNote}
                </p>
              </div>
            </div>
          )}

          {/* Action Bottom Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Calibrated against State Cadastral Geodesic Standards</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSummary}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export Report JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
