import React from 'react';
import { 
  Building2, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Route, 
  Layers, 
  Download, 
  Trash2, 
  Plus, 
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  MapPin,
  Plane,
  Repeat
} from 'lucide-react';
import { CadastralParcel, SimulatedConstruction } from '../types';

interface DigitalTwinSimulatorViewProps {
  parcels: CadastralParcel[];
  selectedParcel: CadastralParcel | null;
  onSelectParcel: (parcel: CadastralParcel) => void;
  onOpenWhatIfModal: (parcel: CadastralParcel) => void;
  onRemoveSimulation: (parcelId: string, simId: string) => void;
  onExportReport: (parcel: CadastralParcel) => void;
  onViewOnDroneMap?: (parcel: CadastralParcel) => void;
}

export const DigitalTwinSimulatorView: React.FC<DigitalTwinSimulatorViewProps> = ({
  parcels,
  selectedParcel,
  onSelectParcel,
  onOpenWhatIfModal,
  onRemoveSimulation,
  onExportReport,
  onViewOnDroneMap,
}) => {
  const activeParcel = selectedParcel || parcels[0];
  const activeSimulations = activeParcel?.simulations || [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: Digital Twin USP */}
      <div className="bg-linear-to-r from-indigo-50/80 via-purple-50/60 to-white p-6 sm:p-7 rounded-2xl border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-extrabold uppercase tracking-wider mb-2.5 shadow-2xs">
            <Building2 className="w-3.5 h-3.5" />
            <span>Cadastral Digital Twin + What-If Simulator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-display">
            Spatial Impact & Future Scenario Analysis
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            <strong className="text-slate-800">One-Line USP:</strong> “DharNav transforms cadastral mapping from a static land record into an interactive digital twin that can evaluate the spatial impact of proposed changes.”
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            id="btn-trigger-what-if-main"
            onClick={() => activeParcel && onOpenWhatIfModal(activeParcel)}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Simulate New Construction</span>
          </button>
        </div>
      </div>

      {/* Parcel Selection Carousel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Select Parcel Target for What-If Simulation
          </h3>
          <span className="text-[11px] font-medium text-slate-400">
            {parcels.length} Registered Land Parcels
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {parcels.map((p) => {
            const isSelected = activeParcel?.id === p.id;
            const simCount = (p.simulations || []).length;
            return (
              <div
                key={p.id}
                onClick={() => onSelectParcel(p)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between group ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {p.code}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {p.acres} ac
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 truncate">{p.address}</div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Simulations:</span>
                  <span className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${
                    simCount > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {simCount > 0 ? `${simCount} Active` : 'None'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current vs Proposed Impact Breakdown */}
      {activeParcel && (
        <div className="border border-slate-200/80 rounded-2xl p-6 bg-slate-50/50 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 font-display">
                  {activeParcel.code} — Digital Twin Evaluation
                </h3>
                <span className="text-xs text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  {activeParcel.pin}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {activeParcel.address} • <span className="font-semibold text-slate-700">Zoning:</span> {activeParcel.zoning}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onViewOnDroneMap && (
                <button
                  onClick={() => onViewOnDroneMap(activeParcel)}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Plane className="w-4 h-4 text-indigo-600" />
                  <span>Inspect On Drone Map</span>
                </button>
              )}

              <button
                onClick={() => onExportReport(activeParcel)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Download Simulation Report</span>
              </button>
            </div>
          </div>

          {/* Current vs Proposed Side-by-Side Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CURRENT STATE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Current State (Survey Baseline)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    Existing Baseline
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Existing Structures:</span>
                    <span className="font-bold text-slate-900">{activeParcel.structuresDetected} Detected</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Built-Up Footprint:</span>
                    <span className="font-bold text-slate-900 font-mono">35% Coverage</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Boundary Integrity:</span>
                    <span className="font-bold text-emerald-600 font-mono">100% Valid (Sub-cm)</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500 font-medium">Access Easements:</span>
                    <span className="font-bold text-slate-900">Unobstructed arterial road</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3 rounded-xl bg-slate-50 text-[11px] text-slate-500 border border-slate-100">
                Current baseline certified by district cadastre survey telemetry.
              </div>
            </div>

            {/* PROPOSED STATE (SIMULATED) */}
            <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-xs flex flex-col justify-between ring-1 ring-indigo-100">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                      Proposed Digital Twin (Simulated)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {activeSimulations.length > 0 ? `${activeSimulations.length} Sim Active` : 'Ready to Test'}
                  </span>
                </div>

                {activeSimulations.length === 0 ? (
                  <div className="py-8 text-center">
                    <Building2 className="w-10 h-10 text-indigo-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 font-medium max-w-xs mx-auto leading-relaxed">
                      No simulations applied yet to this parcel. Click below to test new building footprints, setback violations, and lot coverage.
                    </p>
                    <button
                      onClick={() => onOpenWhatIfModal(activeParcel)}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Building Footprint</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeSimulations.map((sim) => (
                      <div key={sim.id} className="space-y-3 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span className="text-indigo-600 font-extrabold text-sm">{sim.name}</span>
                          <button
                            onClick={() => onRemoveSimulation(activeParcel.id, sim.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove Simulation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Impact Summary Pill Matrix */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 text-[10px] block font-medium">Boundary Fit</span>
                            <span className={`font-bold flex items-center gap-1 mt-0.5 ${
                              sim.impactAnalysis.fitsInsideParcel ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {sim.impactAnalysis.fitsInsideParcel ? '✅ Valid / Inside' : '❌ Crosses Line'}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 text-[10px] block font-medium">Road Access</span>
                            <span className="font-bold text-slate-800 capitalize flex items-center gap-1 mt-0.5">
                              {sim.impactAnalysis.roadAccessStatus === 'clear' ? '✅ Clear' : '⚠️ Impacted'}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 text-[10px] block font-medium">Parcel Coverage</span>
                            <span className={`font-bold mt-0.5 block ${
                              sim.impactAnalysis.coverageExceeded ? 'text-amber-700' : 'text-slate-900'
                            }`}>
                              {sim.impactAnalysis.proposedBuiltUpPercentage}% ({sim.impactAnalysis.maxPermissibleCoverage}% max)
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 text-[10px] block font-medium">Simulated Footprint</span>
                            <span className="font-bold text-indigo-600 mt-0.5 block font-mono">
                              {sim.estimatedSqFt.toLocaleString()} sq ft
                            </span>
                          </div>
                        </div>

                        {/* Verdict Banner */}
                        <div className={`p-3.5 rounded-xl border text-xs ${
                          sim.impactAnalysis.overallVerdict === 'approved'
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                            : 'bg-amber-50/80 border-amber-200 text-amber-900'
                        }`}>
                          <div className="font-bold flex items-center gap-1.5">
                            {sim.impactAnalysis.overallVerdict === 'approved' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                            <span>
                              {sim.impactAnalysis.overallVerdict === 'approved'
                                ? 'Simulation Verdict: Code Compliant & Permissible'
                                : 'Simulation Verdict: Requires Zoning / Setback Adjustments'}
                            </span>
                          </div>
                          <div className="text-[11px] mt-1.5 leading-relaxed text-slate-700">
                            {sim.impactAnalysis.roadAccessNotes}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {activeSimulations.length > 0 && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Real-time ray-casting collision verification active
                  </span>
                  <button
                    onClick={() => onOpenWhatIfModal(activeParcel)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>Modify Dimensions / Re-simulate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
