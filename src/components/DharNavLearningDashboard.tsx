import React, { useState } from 'react';
import { 
  Brain, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  TrendingUp,
  History,
  ShieldCheck,
  Filter,
  Download,
  Search,
  ExternalLink,
  Layers,
  BarChart3,
  Sliders,
  FileCheck
} from 'lucide-react';
import { CadastralParcel, SurveyorCorrectionRecord } from '../types';

interface DharNavLearningDashboardProps {
  parcels: CadastralParcel[];
  correctionRecords: SurveyorCorrectionRecord[];
  onSelectParcel: (parcel: CadastralParcel) => void;
  onOpenCorrectionModal: (parcel: CadastralParcel) => void;
  onRetrainModelWeights?: () => void;
  onClearLearnedRecords?: () => void;
  onExportLearningData?: () => void;
}

export const DharNavLearningDashboard: React.FC<DharNavLearningDashboardProps> = ({
  parcels,
  correctionRecords,
  onSelectParcel,
  onOpenCorrectionModal,
  onRetrainModelWeights,
  onClearLearnedRecords,
  onExportLearningData,
}) => {
  // Filter state for Learning Map & Parcels table
  const [tierFilter, setTierFilter] = useState<'all' | 'high' | 'occasional' | 'frequent_error'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [retrainSuccessNotice, setRetrainSuccessNotice] = useState<string | null>(null);

  // Filter for correction log
  const [reasonFilter, setReasonFilter] = useState<string>('all');

  // Compute counts for the Model Learning Map
  const highParcels = parcels.filter(
    (p) => p.aiReliabilityTier === 'high' || p.confidence >= 90
  );
  const occasionalParcels = parcels.filter(
    (p) => (p.aiReliabilityTier === 'occasional' || (p.confidence >= 70 && p.confidence < 90)) && p.verificationStatus !== 'corrected'
  );
  const frequentErrorParcels = parcels.filter(
    (p) => p.aiReliabilityTier === 'frequent_error' || p.confidence < 70
  );
  const correctedCount = parcels.filter((p) => p.verificationStatus === 'corrected').length;

  // Filtered parcels based on search and selected tier
  const filteredParcels = parcels.filter((p) => {
    const matchesSearch = 
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (tierFilter === 'all') return true;
    if (tierFilter === 'high') return p.aiReliabilityTier === 'high' || p.confidence >= 90;
    if (tierFilter === 'occasional') {
      return (p.aiReliabilityTier === 'occasional' || (p.confidence >= 70 && p.confidence < 90)) && p.verificationStatus !== 'corrected';
    }
    if (tierFilter === 'frequent_error') {
      return p.aiReliabilityTier === 'frequent_error' || p.confidence < 70;
    }
    return true;
  });

  // Filtered feedback logs
  const filteredRecords = reasonFilter === 'all' 
    ? correctionRecords 
    : correctionRecords.filter((r) => r.primaryReason === reasonFilter);

  // Trigger manual simulation of DharNav weight retraining
  const handleTriggerRetrain = () => {
    setIsRetraining(true);
    setRetrainSuccessNotice(null);
    setTimeout(() => {
      setIsRetraining(false);
      setRetrainSuccessNotice('DharNav Edge Weights Updated: Shadow threshold increased by +12%, vegetation penetration filter recalibrated.');
      if (onRetrainModelWeights) {
        onRetrainModelWeights();
      }
    }, 1200);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: Core Unique Idea Header */}
      <div className="bg-linear-to-r from-blue-50 via-indigo-50 to-white p-6 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold uppercase tracking-wider mb-2 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Self-Verification Loop</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            DharNav: Self-Improving Cadastral AI
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            <strong className="text-slate-800">One-Line USP:</strong> “DharNav is a self-improving cadastral AI where every verified surveyor correction becomes structured feedback for improving future mapping accuracy.”
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-dharnav-recalibrate"
            onClick={handleTriggerRetrain}
            disabled={isRetraining}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
            <span>{isRetraining ? 'Recalibrating Model...' : 'Re-Calibrate Model Weights'}</span>
          </button>

          {onExportLearningData && (
            <button
              id="btn-export-learning-data"
              onClick={onExportLearningData}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Export structured JSON feedback records"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export Feedback</span>
            </button>
          )}
        </div>
      </div>

      {/* Retrain Alert Notification */}
      {retrainSuccessNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{retrainSuccessNotice}</span>
          </div>
          <button 
            onClick={() => setRetrainSuccessNotice(null)}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 5-Step Visual Pipeline Representation (Interactive Steps) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            The DharNav Closed Verification Loop
          </h3>
          <span className="text-[11px] font-medium text-slate-400">
            5-Stage Automated Feedback Cycle
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-center transition-all hover:bg-blue-50/50">
            <span className="text-xs font-bold text-blue-600 mb-1">1. Drone & AI</span>
            <span className="text-[11px] text-slate-700 font-medium">Extracts Boundary</span>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">Conf: 72% ⚠️</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-center transition-all hover:bg-amber-50/50">
            <span className="text-xs font-bold text-amber-600 mb-1">2. Self-Check</span>
            <span className="text-[11px] text-slate-700 font-medium">Flags Ambiguity</span>
            <span className="text-[10px] text-slate-500 mt-1">Under 75% Threshold</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-center transition-all hover:bg-purple-50/50">
            <span className="text-xs font-bold text-purple-600 mb-1">3. Surveyor</span>
            <span className="text-[11px] text-slate-700 font-medium">Adjusts Vector</span>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">Moves +1.5m</span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-center flex flex-col items-center justify-center ring-1 ring-blue-400">
            <span className="text-xs font-bold text-blue-700 mb-1">4. AI Learns</span>
            <span className="text-[11px] text-blue-900 font-bold">Why Was It Moved?</span>
            <span className="text-[10px] text-blue-600 mt-1">Shadow / Veg / Fence</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-emerald-700 mb-1">5. Final Map</span>
            <span className="text-[11px] text-emerald-900 font-bold">Re-Checked & Ver.</span>
            <span className="text-[10px] text-emerald-600 mt-1 font-mono">99.8% Confirmed</span>
          </div>
        </div>
      </div>

      {/* Model Learning Map Tiers (Clickable Filters) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span>Model Learning Map</span>
              <span className="text-[10px] font-normal text-slate-400">
                (Click any tier card to filter parcels below)
              </span>
            </h3>
          </div>
          {tierFilter !== 'all' && (
            <button
              onClick={() => setTierFilter('all')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 self-start sm:self-auto"
            >
              Clear Filter (Show All)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tier 1: 🟢 High Reliability */}
          <div 
            id="card-tier-high"
            onClick={() => setTierFilter(tierFilter === 'high' ? 'all' : 'high')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              tierFilter === 'high'
                ? 'bg-emerald-100/70 border-emerald-500 ring-2 ring-emerald-400 shadow-xs'
                : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                🟢 High AI Reliability
              </span>
              <span className="text-xs font-mono font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                {highParcels.length} Parcels
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-2 leading-relaxed">
              Clear physical fences, asphalt road curbstones, high-contrast wall borders. No corrections needed.
            </p>
          </div>

          {/* Tier 2: 🟡 Needs Occasional Correction */}
          <div 
            id="card-tier-occasional"
            onClick={() => setTierFilter(tierFilter === 'occasional' ? 'all' : 'occasional')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              tierFilter === 'occasional'
                ? 'bg-amber-100/70 border-amber-500 ring-2 ring-amber-400 shadow-xs'
                : 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                🟡 Occasional Correction
              </span>
              <span className="text-xs font-mono font-extrabold text-amber-700 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                {occasionalParcels.length} Parcels
              </span>
            </div>
            <p className="text-[11px] text-amber-700 mt-2 leading-relaxed">
              Tree canopy shadows, transitional gravel aprons, ambiguous lot extensions requiring surveyor confirmation.
            </p>
          </div>

          {/* Tier 3: 🔴 Frequently Incorrect */}
          <div 
            id="card-tier-frequent"
            onClick={() => setTierFilter(tierFilter === 'frequent_error' ? 'all' : 'frequent_error')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              tierFilter === 'frequent_error'
                ? 'bg-rose-100/70 border-rose-500 ring-2 ring-rose-400 shadow-xs'
                : 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                🔴 Frequently Incorrect
              </span>
              <span className="text-xs font-mono font-extrabold text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                {frequentErrorParcels.length} Parcels
              </span>
            </div>
            <p className="text-[11px] text-rose-700 mt-2 leading-relaxed">
              Dense foliage blocking boundary, missing physical fences, or municipal deed line divergences.
            </p>
          </div>
        </div>
      </div>

      {/* Action Table: Review and Correct Parcels */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Survey Parcels & Verification Status ({filteredParcels.length})
            </h3>
            {tierFilter !== 'all' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Filter: {tierFilter}
              </span>
            )}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PIN or Code..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Parcel / PIN</th>
                <th className="py-3 px-4">AI Confidence</th>
                <th className="py-3 px-4">Reliability Tier</th>
                <th className="py-3 px-4">Loop Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredParcels.map((parcel) => (
                <tr key={parcel.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{parcel.code}</span>
                      <span className="text-[10px] font-normal text-slate-500">({parcel.acres}ac)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{parcel.pin}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span className={`font-mono font-bold ${
                      parcel.confidence < 75 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {parcel.confidence.toFixed(1)}%
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {parcel.aiReliabilityTier === 'high' || parcel.confidence >= 90 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold">
                        🟢 High Reliability
                      </span>
                    ) : parcel.aiReliabilityTier === 'occasional' || parcel.confidence >= 70 ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-bold">
                        🟡 Occasional
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-bold">
                        🔴 Frequent Error
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {parcel.verificationStatus === 'corrected' ? (
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-bold border border-blue-200">
                        <Sparkles className="w-3 h-3" />
                        AI Learned & Corrected
                      </span>
                    ) : parcel.confidence < 75 ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        Self-Check Flagged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        AI Verified
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      id={`btn-review-parcel-${parcel.id}`}
                      onClick={() => {
                        onSelectParcel(parcel);
                        onOpenCorrectionModal(parcel);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                    >
                      {parcel.verificationStatus === 'corrected' ? 'Adjust / Re-Check' : 'Surveyor Review'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stored Feedback Training Log (Filterable) */}
      {correctionRecords.length > 0 && (
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                DharNav Learned Feedback Records ({correctionRecords.length})
              </h3>
            </div>

            {/* Filter by Reason */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Filter Reason:</span>
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Reasons ({correctionRecords.length})</option>
                <option value="shadow_false_boundary">Shadow False Boundary</option>
                <option value="vegetation_blocked_boundary">Vegetation Blocked</option>
                <option value="wall_fence_not_detected">Wall / Fence Not Detected</option>
                <option value="cadastral_record_differs">Deed Record Differs</option>
                <option value="ai_segmentation_error">AI Segmentation Error</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{rec.parcelCode}</span>
                    <span className="text-[10px] text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Shifted +{rec.displacementMeters}m
                    </span>
                    <span className="font-semibold text-slate-700">{rec.reasonLabel}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{rec.notes}</div>
                </div>

                <div className="sm:text-right">
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Model Weights Updated
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">{rec.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
