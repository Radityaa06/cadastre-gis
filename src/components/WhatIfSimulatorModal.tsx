import React, { useState } from 'react';
import { 
  Building2, 
  Sparkles, 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Ruler, 
  Route, 
  Trees, 
  Move, 
  Layers, 
  FileText,
  HelpCircle,
  Eye
} from 'lucide-react';
import { 
  CadastralParcel, 
  SimulatedConstruction, 
  SimulationBuildingType, 
  DigitalTwinImpactAnalysis 
} from '../types';
import { 
  calculateMetersPerPercent, 
  calculateBuildingSetback, 
  isPointInsidePolygon,
  calculateSunShadow 
} from '../utils/cadastreCalculations';

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  parcel: CadastralParcel | null;
  onClose: () => void;
  onApplySimulation: (simulation: SimulatedConstruction) => void;
}

export const WhatIfSimulatorModal: React.FC<WhatIfSimulatorModalProps> = ({
  isOpen,
  parcel,
  onClose,
  onApplySimulation,
}) => {
  const [buildingType, setBuildingType] = useState<SimulationBuildingType>('warehouse');
  const [buildingName, setBuildingName] = useState<string>('Annex Storage & Light Assembly Bay');
  const [widthMeters, setWidthMeters] = useState<number>(35);
  const [lengthMeters, setLengthMeters] = useState<number>(45);
  const [heightStories, setHeightStories] = useState<number>(2);

  // Position offset relative to parcel center (-10 to +10 percentage)
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);

  if (!isOpen || !parcel) return null;

  // Calculate parcel centroid
  const avgX = parcel.boundaryPoints.reduce((sum, p) => sum + p.x, 0) / parcel.boundaryPoints.length;
  const avgY = parcel.boundaryPoints.reduce((sum, p) => sum + p.y, 0) / parcel.boundaryPoints.length;

  // Calibrate physical meters to normalized percentage coordinates
  const { metersPerPercentX, metersPerPercentY } = calculateMetersPerPercent(
    parcel.boundaryPoints,
    parcel.sqft
  );

  // Compute footprint bounding box strictly based on real physical meters
  const halfW = Math.max(1, (widthMeters / 2) / Math.max(0.8, metersPerPercentX));
  const halfL = Math.max(1, (lengthMeters / 2) / Math.max(0.8, metersPerPercentY));

  const centerX = avgX + offsetX;
  const centerY = avgY + offsetY;

  const footprint = [
    { x: Math.round((centerX - halfW) * 10) / 10, y: Math.round((centerY - halfL) * 10) / 10 },
    { x: Math.round((centerX + halfW) * 10) / 10, y: Math.round((centerY - halfL) * 10) / 10 },
    { x: Math.round((centerX + halfW) * 10) / 10, y: Math.round((centerY + halfL) * 10) / 10 },
    { x: Math.round((centerX - halfW) * 10) / 10, y: Math.round((centerY + halfL) * 10) / 10 },
  ];

  // Point-in-polygon containment check (Ray-Casting Algorithm)
  const cornersInside = footprint.map((pt) => isPointInsidePolygon(pt, parcel.boundaryPoints));
  const fitsInsideParcel = cornersInside.every(Boolean);
  const crossesBoundary = !fitsInsideParcel;

  // Accurate Physical Setback Calculation
  const setbackAnalysis = calculateBuildingSetback(
    footprint,
    parcel.boundaryPoints,
    metersPerPercentX
  );

  // Compute Real Areas & Coverage
  const simulatedSqMeters = widthMeters * lengthMeters;
  const simulatedSqFt = Math.round(simulatedSqMeters * 10.7639);
  const existingSqFt = Math.round(
    parcel.sqft * Math.min(0.35, Math.max(0.1, parcel.structuresDetected * 0.08))
  );
  const proposedTotalSqFt = existingSqFt + simulatedSqFt;
  const proposedBuiltUpPercentage = Math.min(
    99,
    Math.round((proposedTotalSqFt / Math.max(1, parcel.sqft)) * 100)
  );

  const maxPermissibleCoverage = parcel.zoning.includes('Industrial')
    ? 70
    : parcel.zoning.includes('Agriculture')
    ? 35
    : 55;
  const coverageExceeded = proposedBuiltUpPercentage > maxPermissibleCoverage;

  // Road access & setback status
  const roadAccessStatus: 'clear' | 'impacted' | 'blocked' = crossesBoundary
    ? 'blocked'
    : !setbackAnalysis.isCompliant
    ? 'impacted'
    : 'clear';

  const roadAccessNotes = 
    roadAccessStatus === 'blocked'
      ? 'Structure violates parcel boundary and extends into adjacent property line'
      : roadAccessStatus === 'impacted'
      ? `Setback clearance is ${setbackAnalysis.minSetbackMeters}m (< ${setbackAnalysis.requiredSetbackMeters}m municipal requirement)`
      : `Maintains compliant ${setbackAnalysis.minSetbackMeters}m setback clearance (> ${setbackAnalysis.requiredSetbackMeters}m code requirement)`;

  // Affected features evaluation
  const affectedFeatures: {
    featureName: string;
    category: string;
    severity: 'low' | 'moderate' | 'critical';
    details: string;
  }[] = [];

  if (crossesBoundary) {
    affectedFeatures.push({
      featureName: 'Perimeter Boundary Lot Line',
      category: 'boundary',
      severity: 'critical' as const,
      details: 'Building footprint crosses external property line into adjacent parcel.',
    });
  }
  if (!setbackAnalysis.isCompliant && !crossesBoundary) {
    affectedFeatures.push({
      featureName: 'Municipal Setback Easement',
      category: 'boundary',
      severity: 'moderate' as const,
      details: `Building is within ${setbackAnalysis.minSetbackMeters}m of perimeter line (minimum 4.5m required).`,
    });
  }
  if (coverageExceeded) {
    affectedFeatures.push({
      featureName: 'Permissible Lot Coverage Limit',
      category: 'infrastructure',
      severity: 'moderate' as const,
      details: `Combined coverage (${proposedBuiltUpPercentage}%) exceeds zoning threshold (${maxPermissibleCoverage}%).`,
    });
  }

  const boundaryConflict = crossesBoundary;
  const overallVerdict: 'approved' | 'conditional_warning' | 'rejected_conflict' = 
    boundaryConflict
      ? 'rejected_conflict'
      : coverageExceeded || !setbackAnalysis.isCompliant
      ? 'conditional_warning'
      : 'approved';

  const recommendations: string[] = [];
  if (boundaryConflict) recommendations.push('Shift footprint inwards towards center of parcel to eliminate boundary crossing.');
  if (!setbackAnalysis.isCompliant && !boundaryConflict) recommendations.push(`Adjust position to maintain at least ${setbackAnalysis.requiredSetbackMeters}m boundary setback.`);
  if (coverageExceeded) recommendations.push(`Reduce building dimensions to remain under municipal ${maxPermissibleCoverage}% lot coverage.`);
  if (recommendations.length === 0) recommendations.push('Proposed design conforms fully with local zoning setbacks and structural building codes.');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();

    const analysis: DigitalTwinImpactAnalysis = {
      fitsInsideParcel,
      crossesBoundary,
      roadAccessStatus,
      roadAccessNotes,
      currentBuiltUpPercentage: 35,
      proposedBuiltUpPercentage,
      maxPermissibleCoverage,
      coverageExceeded,
      boundaryConflict,
      affectedFeatures,
      overallVerdict,
      recommendations,
    };

    const newSim: SimulatedConstruction = {
      id: `sim-${Date.now()}`,
      parcelId: parcel.id,
      name: buildingName,
      type: buildingType,
      footprintPoints: footprint,
      widthMeters,
      lengthMeters,
      estimatedSqFt: simulatedSqFt,
      heightStories,
      status: 'active',
      impactAnalysis: analysis,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onApplySimulation(newSim);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        id="what-if-simulation-dialog"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Cadastral Digital Twin: What-If Simulator
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                  Proposed Changes
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Simulate spatial impact of new construction on <strong className="text-slate-900">{parcel.code}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleApply} className="p-6 overflow-y-auto space-y-6">
          {/* Step 1: Building Parameters */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span>1. Proposed Construction Specs</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Structure Name
                </label>
                <input
                  type="text"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="e.g. Warehouse Annex, Retail Expansion"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Building Archetype
                </label>
                <select
                  value={buildingType}
                  onChange={(e) => setBuildingType(e.target.value as SimulationBuildingType)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="warehouse">Industrial Logistics Warehouse</option>
                  <option value="commercial_office">Commercial Multi-Story Office</option>
                  <option value="residential_duplex">Residential Residential Unit</option>
                  <option value="solar_array">Ground Solar Canopy Farm</option>
                  <option value="paved_parking">Paved Heavy Vehicle Yard</option>
                </select>
              </div>
            </div>

            {/* Sliders: Width, Length, Stories */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Width</span>
                  <span className="font-mono text-indigo-600">{widthMeters} m</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="70"
                  value={widthMeters}
                  onChange={(e) => setWidthMeters(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Length</span>
                  <span className="font-mono text-indigo-600">{lengthMeters} m</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={lengthMeters}
                  onChange={(e) => setLengthMeters(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Stories</span>
                  <span className="font-mono text-indigo-600">{heightStories} F</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={heightStories}
                  onChange={(e) => setHeightStories(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            {/* Placement Adjuster (XY Shift within parcel) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Parcel Placement Offset (Simulate Moving Location)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  X: {offsetX > 0 ? `+${offsetX}` : offsetX}%, Y: {offsetY > 0 ? `+${offsetY}` : offsetY}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">West ⟷ East</span>
                  <input
                    type="range"
                    min="-8"
                    max="8"
                    step="0.5"
                    value={offsetX}
                    onChange={(e) => setOffsetX(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">North ⟷ South</span>
                  <input
                    type="range"
                    min="-8"
                    max="8"
                    step="0.5"
                    value={offsetY}
                    onChange={(e) => setOffsetY(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Instant Real-time Spatial Impact Analysis */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span>2. AI Spatial Impact Analysis</span>
              </h4>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                overallVerdict === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : overallVerdict === 'conditional_warning'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {overallVerdict === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {overallVerdict === 'conditional_warning' && <AlertTriangle className="w-3.5 h-3.5" />}
                {overallVerdict === 'rejected_conflict' && <XCircle className="w-3.5 h-3.5" />}
                <span>
                  {overallVerdict === 'approved'
                    ? 'Permissible / Approved'
                    : overallVerdict === 'conditional_warning'
                    ? 'Conditional Warning'
                    : 'Cadastral Boundary Conflict'}
                </span>
              </span>
            </div>

            {/* Metric Checks Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Check 1: Boundary Fit */}
              <div className={`p-3 rounded-xl border ${
                fitsInsideParcel ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
              }`}>
                <div className="text-[10px] uppercase font-bold text-slate-500">Boundary</div>
                <div className="flex items-center gap-1.5 mt-1">
                  {fitsInsideParcel ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span className={`text-xs font-bold ${fitsInsideParcel ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {fitsInsideParcel ? 'Inside Parcel' : 'Crosses Lot'}
                  </span>
                </div>
              </div>

              {/* Check 2: Road Access */}
              <div className={`p-3 rounded-xl border ${
                roadAccessStatus === 'clear' 
                  ? 'bg-emerald-50/60 border-emerald-200' 
                  : roadAccessStatus === 'impacted' 
                  ? 'bg-amber-50/60 border-amber-200' 
                  : 'bg-rose-50/60 border-rose-200'
              }`}>
                <div className="text-[10px] uppercase font-bold text-slate-500">Road Access</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Route className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-bold text-slate-900 capitalize">
                    {roadAccessStatus === 'clear' ? 'Clear' : roadAccessStatus === 'impacted' ? 'Impacted' : 'Blocked'}
                  </span>
                </div>
              </div>

              {/* Check 3: Parcel Coverage */}
              <div className={`p-3 rounded-xl border ${
                coverageExceeded ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-[10px] uppercase font-bold text-slate-500">Lot Coverage</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-xs font-mono font-bold ${coverageExceeded ? 'text-amber-700' : 'text-slate-900'}`}>
                    {proposedBuiltUpPercentage}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (Max: {maxPermissibleCoverage}%)
                  </span>
                </div>
              </div>

              {/* Check 4: Setback Clearance */}
              <div className={`p-3 rounded-xl border ${
                setbackAnalysis.isCompliant ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'
              }`}>
                <div className="text-[10px] uppercase font-bold text-slate-500">Setback Clearance</div>
                <div className="flex items-center gap-1 mt-1">
                  <Ruler className="w-4 h-4 text-slate-700 shrink-0" />
                  <span className={`text-xs font-mono font-bold ${setbackAnalysis.isCompliant ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {setbackAnalysis.minSetbackMeters}m
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    (&gt;{setbackAnalysis.requiredSetbackMeters}m)
                  </span>
                </div>
              </div>

              {/* Check 5: Footprint Sq Ft */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">New Footprint</div>
                <div className="text-xs font-mono font-bold text-indigo-600 mt-1">
                  {simulatedSqFt.toLocaleString()} sq ft
                </div>
              </div>
            </div>

            {/* Detailed Conflicts / Warnings List */}
            {affectedFeatures.length > 0 && (
              <div className="space-y-1.5 mt-2">
                <div className="text-[11px] font-bold text-slate-600">
                  Detected Spatial Impacts ({affectedFeatures.length}):
                </div>
                {affectedFeatures.map((af, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-xl text-xs flex items-start gap-2 border ${
                      af.severity === 'critical'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    {af.severity === 'critical' ? (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold">{af.featureName}: </span>
                      <span className="text-[11px]">{af.details}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>

            <button
              id="btn-apply-what-if-simulation"
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply Simulation to Digital Twin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
