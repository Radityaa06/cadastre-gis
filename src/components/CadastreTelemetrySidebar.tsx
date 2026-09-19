import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Building, 
  DollarSign, 
  MapPin, 
  Maximize2, 
  Compass, 
  Layers, 
  CheckCircle2, 
  ChevronRight, 
  FileDown,
  AlertTriangle,
  Brain,
  Sparkles,
  Building2,
  Plus,
  Repeat,
  Landmark,
  FileText,
  Box,
  Move,
  Zap,
  Scale,
  Crosshair,
  Sliders,
  Check,
  TrendingUp,
  Award
} from 'lucide-react';
import { CadastralParcel } from '../types';
import { 
  calculateRealParcelTelemetry 
} from '../utils/cadastreCalculations';
import { getDeedConflictSolutions } from '../utils/deedResolutionEngine';

interface CadastreTelemetrySidebarProps {
  parcels: CadastralParcel[];
  selectedParcel: CadastralParcel | null;
  onSelectParcel: (parcel: CadastralParcel) => void;
  onExportGeoJson: () => void;
  onOpenCorrectionModal: (parcel: CadastralParcel) => void;
  onOpenWhatIfModal: (parcel: CadastralParcel) => void;
  onOpenCertificateModal: (parcel: CadastralParcel) => void;
  onSnapToDeed?: (parcelId: string) => void;
  onOpenPetitionModal?: (parcel: CadastralParcel) => void;
  isVertexEditMode?: boolean;
  onToggleVertexEdit?: () => void;
  totalAreaAcres: number;
  segmentationIoU: number;
}

export const CadastreTelemetrySidebar: React.FC<CadastreTelemetrySidebarProps> = ({
  parcels,
  selectedParcel,
  onSelectParcel,
  onExportGeoJson,
  onOpenCorrectionModal,
  onOpenWhatIfModal,
  onOpenCertificateModal,
  onSnapToDeed,
  onOpenPetitionModal,
  isVertexEditMode = false,
  onToggleVertexEdit,
  totalAreaAcres,
  segmentationIoU,
}) => {
  const activeParcel = selectedParcel || parcels[0] || null;
  const simCount = (activeParcel?.simulations || []).length;
  const isEncroached = activeParcel?.deedRecord?.encroachmentDetected;

  // Active feature tab: 'deed' | 'twin' | 'surveyor' | 'features'
  const [activeFeatureTab, setActiveFeatureTab] = useState<'deed' | 'twin' | 'surveyor' | 'features'>(
    isEncroached ? 'deed' : simCount > 0 ? 'twin' : 'deed'
  );

  // Automatically show deed resolution if selecting an encroached / disputed parcel
  useEffect(() => {
    if (isEncroached) {
      setActiveFeatureTab('deed');
    }
  }, [activeParcel?.id, isEncroached]);

  // Real-time geometric telemetry derived from active polygon vertices
  const liveTelemetry = activeParcel
    ? calculateRealParcelTelemetry(
        activeParcel.boundaryPoints,
        activeParcel.originalAiBoundaryPoints,
        activeParcel.acres
      )
    : null;

  return (
    <div className="w-full lg:w-96 flex flex-col gap-3.5 font-sans">
      {/* Executive Cadastre Telemetry Card */}
      <div 
        id="cadastre-telemetry-panel"
        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
      >
        {/* Top Header Strip */}
        <div className="p-3.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
              Cadastral Telemetry
            </h3>
          </div>

          {activeParcel?.verificationStatus === 'corrected' ? (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              AI LEARNED
            </span>
          ) : activeParcel && activeParcel.confidence < 75 ? (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              SELF-CHECK
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              AI VERIFIED
            </span>
          )}
        </div>

        {activeParcel ? (
          <div className="p-3.5 space-y-3">
            {/* Active Parcel ID & Location */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900 tracking-tight font-display">
                    {activeParcel.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {activeParcel.pin}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[220px]">{activeParcel.address}</span>
                </p>
              </div>

              <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shrink-0">
                {activeParcel.zoning}
              </span>
            </div>

            {/* High-Density 4-KPI Metric Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Parcel Area</span>
                <div className="text-base font-black text-slate-900 mt-0.5 font-display">
                  {activeParcel.acres} <span className="text-xs font-normal text-slate-500">ac</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {activeParcel.sqft.toLocaleString()} sq ft
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Perimeter (Real)</span>
                <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
                  {liveTelemetry?.perimeterMeters || 420} <span className="text-xs font-normal text-slate-500">m</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {activeParcel.boundaryPoints.length} boundary nodes
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Confidence</span>
                <div className={`text-base font-black mt-0.5 font-mono ${
                  activeParcel.confidence < 75 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {activeParcel.confidence.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-400">
                  {activeParcel.confidence < 75 ? 'Boundary ambiguity' : 'IoU sub-cm fixed'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tax Valuation</span>
                <div className="text-base font-black text-indigo-600 mt-0.5 font-mono">
                  ${(activeParcel.taxAssessment / 1000000).toFixed(2)}M
                </div>
                <div className="text-[10px] text-slate-400">
                  {activeParcel.structuresDetected} Structures found
                </div>
              </div>
            </div>

            {/* Quick Action Dock */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                id="btn-sidebar-view-certificate"
                onClick={() => onOpenCertificateModal(activeParcel)}
                className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                title="View printable official municipal survey certificate"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Certificate</span>
              </button>

              {onToggleVertexEdit && (
                <button
                  id="btn-sidebar-toggle-vertex-drag"
                  onClick={onToggleVertexEdit}
                  className={`py-1.5 px-2.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all border shadow-2xs ${
                    isVertexEditMode
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300/40'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                  title="Toggle interactive node dragging on drone canvas"
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>{isVertexEditMode ? 'Nodes: ON' : 'Nodes'}</span>
                </button>
              )}
            </div>

            {/* Segmented Feature Navigation Tabs */}
            <div className="pt-2 border-t border-slate-100">
              <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200 grid grid-cols-4 gap-0.5 text-xs">
                <button
                  onClick={() => setActiveFeatureTab('deed')}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                    activeFeatureTab === 'deed'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Deed Alignment & Statutory Remedies"
                >
                  <Landmark className="w-3.5 h-3.5 text-rose-600" />
                  <span>Deed</span>
                  {isEncroached && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setActiveFeatureTab('twin')}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                    activeFeatureTab === 'twin'
                      ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Digital Twin What-If Simulator"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>3D Twin</span>
                  {simCount > 0 && (
                    <span className="px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 text-[9px] font-mono font-bold">
                      {simCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveFeatureTab('surveyor')}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                    activeFeatureTab === 'surveyor'
                      ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Surveyor Feedback & Review Loop"
                >
                  <Brain className="w-3.5 h-3.5 text-blue-600" />
                  <span>AI Loop</span>
                  {activeParcel.confidence < 75 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setActiveFeatureTab('features')}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                    activeFeatureTab === 'features'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Identified Structures and Features"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                  <span>Features</span>
                </button>
              </div>
            </div>

            {/* TAB 1: DEED RESOLUTION & STATUTORY REMEDIES */}
            {activeFeatureTab === 'deed' && activeParcel.deedRecord && (() => {
              const solutions = isEncroached ? getDeedConflictSolutions(activeParcel) : null;
              const primaryRemedy = solutions?.primaryPreferredSolution;
              return (
                <div className={`p-3.5 rounded-xl border flex flex-col gap-2.5 text-xs animate-in fade-in duration-150 ${
                  isEncroached 
                    ? 'bg-rose-50/70 border-rose-200' 
                    : 'bg-emerald-50/60 border-emerald-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Landmark className="w-4 h-4 text-rose-600" />
                      <span>Deed: {activeParcel.deedRecord.khasraPattaNumber}</span>
                    </span>
                    <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      isEncroached ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {activeParcel.deedRecord.revenueStatus}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {isEncroached
                      ? `⚠️ ${activeParcel.deedRecord.disputeNotes}`
                      : 'Physical property boundary lines conform fully with digitized state revenue records (0.0% discrepancy).'}
                  </p>

                  {/* Recommended Solution Card */}
                  {isEncroached && primaryRemedy && (
                    <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-white flex items-center gap-1">
                          <Scale className="w-3 h-3" />
                          <span>Recommended Remedy</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {primaryRemedy.estimatedTimeline}
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 text-xs leading-tight">
                        {primaryRemedy.title}
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug">
                        {primaryRemedy.summary}
                      </p>

                      <div className="text-[10px] font-mono text-indigo-700 font-semibold bg-indigo-50/70 p-1.5 rounded-lg border border-indigo-100">
                        {primaryRemedy.statutoryReference}
                      </div>

                      {/* Direct Action Buttons */}
                      <div className="pt-1 flex flex-col gap-1.5">
                        {solutions.canAutoSnap && onSnapToDeed && (
                          <button
                            id="btn-sidebar-snap-to-deed"
                            onClick={() => onSnapToDeed(activeParcel.id)}
                            className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all hover:scale-101 active:scale-99"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            <span>Snap Boundary to Deed (Auto-Reconcile)</span>
                          </button>
                        )}
                        {onOpenPetitionModal && (
                          <button
                            id="btn-sidebar-draft-petition"
                            onClick={() => onOpenPetitionModal(activeParcel)}
                            className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all hover:scale-101 active:scale-99"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Draft Deed Rectification Petition (Form 14A)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* TAB 2: DIGITAL TWIN (3D) */}
            {activeFeatureTab === 'twin' && (
              <div className="p-3.5 rounded-xl border bg-indigo-50/70 border-indigo-200 flex flex-col gap-2.5 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Digital Twin: 3D Volumetric</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {simCount > 0 ? `${simCount} Active Sim` : 'Ready'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-snug">
                  Model proposed construction structures, test solar shadows, and calculate boundary setback compliance.
                </p>

                {simCount > 0 && (
                  <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-indigo-100 text-[11px]">
                    <span className="font-bold text-slate-800">Active Proposed Simulations:</span>
                    {activeParcel.simulations!.map((sim, i) => (
                      <div key={sim.id || i} className="flex items-center justify-between font-mono text-slate-600 pt-1 border-t border-slate-100">
                        <span>{sim.name || `Structure #${i + 1}`}</span>
                        <span className="font-bold text-indigo-700">{sim.heightStories || 1} Fl ({sim.volumetric3D?.heightMeters ?? ((sim.heightStories || 1) * 3.5)}m)</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  id="btn-sidebar-what-if-simulate"
                  onClick={() => onOpenWhatIfModal(activeParcel)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs mt-0.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simulate Proposed Construction</span>
                </button>
              </div>
            )}

            {/* TAB 3: DHARNAV AI SELF-VERIFICATION LOOP */}
            {activeFeatureTab === 'surveyor' && (
              <div className={`p-3.5 rounded-xl border flex flex-col gap-2.5 text-xs animate-in fade-in duration-150 ${
                activeParcel.confidence < 75 && activeParcel.verificationStatus !== 'corrected'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-blue-50/50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <span>DharNav Feedback Loop</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {activeParcel.verificationStatus === 'corrected' ? 'Corrected' : 'Surveyor Check'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-snug">
                  {activeParcel.confidence < 75
                    ? 'AI flagged boundary ambiguity due to edge tree shadows or physical fence deviation. Review and refine coordinates.'
                    : 'Surveyor corrections train DharNav with structured ground-truth learning data.'}
                </p>

                <button
                  id="btn-trigger-surveyor-correction"
                  onClick={() => onOpenCorrectionModal(activeParcel)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs mt-0.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {activeParcel.verificationStatus === 'corrected'
                      ? 'Adjust / Re-Check Boundary'
                      : 'Surveyor Review & Correction'}
                  </span>
                </button>
              </div>
            )}

            {/* TAB 4: IDENTIFIED FEATURES & CENTROID */}
            {activeFeatureTab === 'features' && (
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800">
                    Identified Features ({(activeParcel.identifiedFeatures || []).length})
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    Centroid: {liveTelemetry?.centroid.x}%, {liveTelemetry?.centroid.y}%
                  </span>
                </div>

                {activeParcel.identifiedFeatures && activeParcel.identifiedFeatures.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {activeParcel.identifiedFeatures.map((feat) => (
                      <div
                        key={feat.id}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-xs"
                      >
                        <div className="font-bold text-slate-800 flex items-center justify-between">
                          <span>{feat.name}</span>
                          <span className="text-[10px] text-emerald-600 font-mono font-extrabold">
                            {feat.confidence}%
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{feat.details}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    No physical structures or natural buffers identified inside this lot.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No parcel selected. Click on a boundary polygon on the drone map.
          </div>
        )}
      </div>

      {/* Select Sector Parcels List Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display flex items-center gap-1.5">
            <span>Sector Parcels</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
              {parcels.length}
            </span>
          </h3>

          <span className="text-[10px] text-slate-400 font-medium">Click to Inspect</span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {parcels.map((parcel) => {
            const isSelected = activeParcel?.id === parcel.id;
            const parcelSims = (parcel.simulations || []).length;
            const parcelEncroached = parcel.deedRecord?.encroachmentDetected;
            return (
              <button
                key={parcel.id}
                id={`btn-select-parcel-${parcel.id}`}
                onClick={() => onSelectParcel(parcel)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/60 shadow-2xs ring-1 ring-indigo-500/20'
                    : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-md shrink-0 border shadow-2xs"
                    style={{ backgroundColor: parcel.colorTheme, borderColor: parcel.colorTheme }}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                      <span>{parcel.code}</span>
                      <span className="text-[10px] font-normal text-slate-500">({parcel.acres}ac)</span>
                      {parcelEncroached && (
                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-rose-100 text-rose-700 font-bold">
                          Dispute
                        </span>
                      )}
                      {parcelSims > 0 && (
                        <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold">
                          {parcelSims} sim
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                      {parcel.address}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    parcel.confidence < 75 
                      ? 'text-amber-700 bg-amber-50' 
                      : 'text-emerald-600 bg-emerald-50'
                  }`}>
                    {parcel.confidence.toFixed(0)}%
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Export Vector GeoJSON Button */}
        <button
          id="btn-export-geojson"
          onClick={onExportGeoJson}
          className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors mt-1"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>Export Vector GeoJSON</span>
        </button>
      </div>
    </div>
  );
};
