import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Printer, 
  Download, 
  Landmark, 
  Scale, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  ExternalLink,
  Sparkles,
  Zap,
  ListChecks,
  AlertOctagon
} from 'lucide-react';
import { CadastralParcel, DeedProblemSolution } from '../types';
import { generatePetitionDraftText, getDeedConflictSolutions } from '../utils/deedResolutionEngine';

interface DeedRectificationPetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcel: CadastralParcel | null;
  onSnapToDeed?: (parcelId: string) => void;
}

export const DeedRectificationPetitionModal: React.FC<DeedRectificationPetitionModalProps> = ({
  isOpen,
  onClose,
  parcel,
  onSnapToDeed,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'petition' | 'checklist' | 'coordinates'>('petition');

  if (!isOpen || !parcel) return null;

  const resolutionReport = getDeedConflictSolutions(parcel);
  const primarySol = resolutionReport.primaryPreferredSolution;
  const petitionText = generatePetitionDraftText(parcel, primarySol);

  const handleCopy = () => {
    navigator.clipboard.writeText(petitionText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const blob = new Blob([petitionText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Deed-Rectification-Petition-${parcel.code}-${parcel.pin}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 font-display">
                  Statutory Deed Rectification & Dispute Resolution
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {parcel.deedRecord?.revenueStatus || 'Disputed'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {parcel.code} • PIN: {parcel.pin} • {parcel.deedRecord?.khasraPattaNumber || 'Khasra Deed'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-copy-petition"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Petition</span>
                </>
              )}
            </button>

            <button
              id="btn-print-petition"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              id="btn-download-petition"
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Brief</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preferred Solution Summary Banner */}
        <div className="px-6 py-3 bg-linear-to-r from-amber-50 via-indigo-50/50 to-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500 text-white tracking-wider">
                Recommended Statutory Remedy
              </span>
              <span className="font-bold text-slate-900">{primarySol.title}</span>
            </div>
            <p className="text-[11px] text-slate-600">
              <strong className="text-slate-800">Legal Provision:</strong> {primarySol.statutoryReference} • <strong className="text-slate-800">Authority:</strong> {primarySol.competentAuthority}
            </p>
          </div>

          {resolutionReport.canAutoSnap && onSnapToDeed && (
            <button
              id="btn-modal-auto-snap"
              onClick={() => {
                onSnapToDeed(parcel.id);
                onClose();
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Snap Boundary to Deed (Auto-Reconcile)</span>
            </button>
          )}
        </div>

        {/* Nav Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('petition')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'petition'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Formal Court Petition (Form 14A)</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Procedural Roadmap & Checklist</span>
          </button>

          <button
            onClick={() => setActiveTab('coordinates')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'coordinates'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Cadastral Coordinate Comparison</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'petition' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span>
                  Ready for filing before the Revenue Court under <strong>{primarySol.statutoryReference}</strong>
                </span>
                <span className="font-mono text-slate-700">Est. Timeline: {primarySol.estimatedTimeline}</span>
              </div>

              <pre className="bg-slate-950 text-slate-200 p-6 rounded-2xl font-mono text-xs leading-relaxed overflow-x-auto selection:bg-indigo-600 whitespace-pre-wrap border border-slate-800 shadow-inner">
                {petitionText}
              </pre>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-5">
              {/* Primary Solution Procedural Steps */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-display flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span>Statutory Procedural Steps for {primarySol.title}</span>
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {primarySol.estimatedTimeline}
                  </span>
                </div>

                <div className="space-y-2">
                  {primarySol.proceduralSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2.5"
                    >
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="leading-snug">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Documents Checklist */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-display flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>Mandatory Statutory Documents Checklist</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {primarySol.requiredDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alternative Solutions */}
              {resolutionReport.alternativeSolutions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider font-display">
                    Alternative Statutory Options & Referrals
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {resolutionReport.alternativeSolutions.map((alt) => (
                      <div
                        key={alt.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
                      >
                        <div className="font-bold text-slate-900">{alt.title}</div>
                        <p className="text-slate-600 text-[11px] leading-snug">{alt.summary}</p>
                        <div className="text-[10px] text-indigo-700 font-mono font-medium pt-1">
                          Ref: {alt.statutoryReference}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'coordinates' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Physical Drone Survey Boundary</span>
                    <span className="font-mono text-rose-600">{parcel.acres} Acres</span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-slate-600">
                    {parcel.boundaryPoints.map((pt, i) => (
                      <div key={i} className="flex justify-between py-0.5 border-b border-slate-200/60">
                        <span>Vertex #{i + 1}:</span>
                        <span>X: {pt.x}%, Y: {pt.y}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-950 flex items-center justify-between">
                    <span>Registered Revenue Deed Boundary</span>
                    <span className="font-mono text-emerald-700">{parcel.deedRecord?.deedAreaAcres} Acres</span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-emerald-800">
                    {(parcel.deedRecord?.deedBoundaryPoints || parcel.boundaryPoints).map((pt, i) => (
                      <div key={i} className="flex justify-between py-0.5 border-b border-emerald-200/60">
                        <span>Deed Marker #{i + 1}:</span>
                        <span>X: {pt.x}%, Y: {pt.y}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 flex items-center justify-between">
                <div>
                  <strong className="block">Discrepancy Index: {parcel.deedRecord?.discrepancyIndexPercentage}%</strong>
                  <span className="text-[11px] text-amber-800">
                    Overlapping difference: {parcel.deedRecord?.encroachmentAreaSqFt?.toLocaleString() || 0} sq ft
                  </span>
                </div>
                {resolutionReport.canAutoSnap && onSnapToDeed && (
                  <button
                    onClick={() => {
                      onSnapToDeed(parcel.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-2xs"
                  >
                    Snap Coordinates to Deed
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
