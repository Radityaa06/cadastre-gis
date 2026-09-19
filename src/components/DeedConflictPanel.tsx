import React, { useState } from 'react';
import { 
  Landmark, 
  FileCheck2, 
  AlertOctagon, 
  CheckCircle2, 
  Scale, 
  ArrowRight, 
  ShieldAlert, 
  Download,
  FileText,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  ShieldCheck,
  ListChecks
} from 'lucide-react';
import { CadastralParcel } from '../types';
import { getDeedConflictSolutions } from '../utils/deedResolutionEngine';

interface DeedConflictPanelProps {
  parcel: CadastralParcel;
  onOpenReportModal: (parcel: CadastralParcel) => void;
  onInspectDeedOverlay: (parcel: CadastralParcel) => void;
  onSnapToDeed?: (parcelId: string) => void;
  onOpenPetitionModal?: (parcel: CadastralParcel) => void;
}

export const DeedConflictPanel: React.FC<DeedConflictPanelProps> = ({
  parcel,
  onOpenReportModal,
  onInspectDeedOverlay,
  onSnapToDeed,
  onOpenPetitionModal,
}) => {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const deed = parcel.deedRecord;

  if (!deed) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs text-xs text-slate-500 text-center py-6">
        No registered revenue deed linked to this parcel PIN.
      </div>
    );
  }

  const isEncroachment = deed.encroachmentDetected;
  const resolutionReport = getDeedConflictSolutions(parcel);
  const primarySolution = resolutionReport.primaryPreferredSolution;
  const canAutoSnap = resolutionReport.canAutoSnap && onSnapToDeed;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-rose-600" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 font-display">
            Cadastral Deed & Revenue Records
          </h3>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
          isEncroachment 
            ? 'bg-rose-50 text-rose-700 border-rose-200' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {deed.revenueStatus.toUpperCase()}
        </span>
      </div>

      {/* Record Overview */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Khasra / Patta:</span>
          <span className="font-extrabold text-slate-900 font-mono">{deed.khasraPattaNumber}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Registered Owner:</span>
          <span className="font-bold text-slate-900 truncate max-w-[180px]">{deed.registeredOwner}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Registered Date:</span>
          <span className="font-mono text-slate-700">{deed.registrationDate}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Deed vs Drone Area:</span>
          <span className="font-bold font-mono text-slate-900">
            {deed.deedAreaAcres} ac (Deed) vs {parcel.acres} ac (Drone)
          </span>
        </div>
      </div>

      {/* Discrepancy & Encroachment Status */}
      <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
        isEncroachment
          ? 'bg-rose-50/80 border-rose-200 text-rose-950 ring-1 ring-rose-200'
          : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex items-center gap-2 font-bold text-xs">
          {isEncroachment ? (
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>
            {isEncroachment
              ? `Encroachment Detected (${deed.discrepancyIndexPercentage}% Discrepancy)`
              : 'Boundary Cleared: Conforms with Registered Deed'}
          </span>
        </div>

        {isEncroachment && (
          <div className="space-y-1.5 pt-1 text-[11px] text-slate-700 leading-relaxed">
            <p>
              <strong className="text-slate-900">Dispute Summary:</strong> {deed.disputeNotes}
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono text-rose-800 font-bold">
              <span>Overlapping Area:</span>
              <span>{deed.encroachmentAreaSqFt?.toLocaleString() || 0} sq ft ({deed.encroachmentAreaM2 || 0} m²)</span>
            </div>
          </div>
        )}
      </div>

      {/* Recommended Remedies & Statutory Referrals (Activated when conflict detected) */}
      {isEncroachment && (
        <div className="p-4 rounded-2xl bg-linear-to-b from-amber-50/70 via-indigo-50/30 to-white border border-amber-200/90 shadow-2xs space-y-3">
          {/* Section Heading */}
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
            <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-xs font-display">
              <Scale className="w-4 h-4 text-amber-600" />
              <span>Recommended Statutory Remedy</span>
            </div>
            <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold">
              PREFERRED
            </span>
          </div>

          {/* Primary Solution Card */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-900 text-[13px] leading-tight">
              {primarySolution.title}
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              {primarySolution.summary}
            </p>

            {/* Legal Citations and Timeline */}
            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 space-y-1.5 text-[11px]">
              <div className="flex items-start gap-1.5">
                <span className="text-slate-500 font-medium shrink-0">Statutory Provision:</span>
                <span className="font-semibold text-indigo-900 font-mono text-[10px]">
                  {primarySolution.statutoryReference}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Competent Authority:</span>
                <span className="font-bold text-slate-800">{primarySolution.competentAuthority}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Est. Resolution:</span>
                <span className="font-mono text-emerald-700 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {primarySolution.estimatedTimeline}
                </span>
              </div>
            </div>

            {/* Action Buttons for Solutions */}
            <div className="pt-2 flex flex-col gap-2">
              {canAutoSnap && (
                <button
                  id="btn-snap-boundary-to-deed"
                  onClick={() => onSnapToDeed(parcel.id)}
                  className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs group"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
                  <span>Snap Boundary to Registered Deed (Auto-Reconcile)</span>
                </button>
              )}

              {onOpenPetitionModal && (
                <button
                  id="btn-draft-rectification-petition"
                  onClick={() => onOpenPetitionModal(parcel)}
                  className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Draft Deed Rectification Petition (Form 14A)</span>
                </button>
              )}
            </div>
          </div>

          {/* Expandable Alternative Remedies */}
          {resolutionReport.alternativeSolutions.length > 0 && (
            <div className="pt-1 border-t border-slate-200/80">
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 hover:text-slate-900 py-1"
              >
                <span>Alternative Statutory Options ({resolutionReport.alternativeSolutions.length})</span>
                {showAlternatives ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {showAlternatives && (
                <div className="space-y-2 pt-2">
                  {resolutionReport.alternativeSolutions.map((alt) => (
                    <div
                      key={alt.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                    >
                      <div className="font-bold text-slate-900">{alt.title}</div>
                      <div className="text-[11px] text-slate-600">{alt.summary}</div>
                      <div className="text-[10px] text-indigo-700 font-mono">
                        Ref: {alt.statutoryReference}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Official Certificate Action */}
      <div className="pt-2 flex flex-col gap-2">
        <button
          id="btn-generate-dispute-certificate"
          onClick={() => onOpenReportModal(parcel)}
          className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs"
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Generate Official Survey Certificate</span>
        </button>
      </div>
    </div>
  );
};
