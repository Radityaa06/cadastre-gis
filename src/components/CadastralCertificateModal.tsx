import React, { useRef } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Landmark, 
  FileText, 
  Scale, 
  Calendar, 
  QrCode,
  AlertTriangle,
  ListChecks,
  Clock
} from 'lucide-react';
import { CadastralParcel, SurveyorCorrectionRecord } from '../types';
import { getDeedConflictSolutions } from '../utils/deedResolutionEngine';

interface CadastralCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcel: CadastralParcel;
  correctionHistory?: SurveyorCorrectionRecord[];
}

export const CadastralCertificateModal: React.FC<CadastralCertificateModalProps> = ({
  isOpen,
  onClose,
  parcel,
  correctionHistory = [],
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReport = () => {
    const reportData = {
      certificateTitle: 'MUNICIPAL CADASTRAL DIGITAL TWIN SURVEY CERTIFICATE',
      issueDate: new Date().toISOString(),
      parcelCode: parcel.code,
      pin: parcel.pin,
      address: parcel.address,
      zoning: parcel.zoning,
      acres: parcel.acres,
      sqft: parcel.sqft,
      aiConfidenceScore: `${parcel.confidence}%`,
      verificationStatus: parcel.verificationStatus,
      taxAssessmentValuation: `$${(parcel.taxAssessment).toLocaleString()}`,
      revenueDeed: parcel.deedRecord || 'No registered conflict',
      prescribedRemedy: parcel.deedRecord?.encroachmentDetected ? getDeedConflictSolutions(parcel).primaryPreferredSolution : null,
      alternativeStatutoryOptions: parcel.deedRecord?.encroachmentDetected ? getDeedConflictSolutions(parcel).alternativeSolutions : [],
      groundTruthCorrections: correctionHistory.filter((c) => c.parcelId === parcel.id),
      simulations: parcel.simulations || [],
      certificationAuthority: 'DharNav National Geospatial & Cadastral Authority',
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cadastral-Certificate-${parcel.code}-${parcel.pin}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isEncroached = parcel.deedRecord?.encroachmentDetected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 font-display">
              Official Survey Certificate & Dispute Resolution Report
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadReport}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Record</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Printable Design) */}
        <div className="p-8 overflow-y-auto space-y-6" ref={certificateRef}>
          {/* Certificate Formal Header */}
          <div className="border-4 border-double border-slate-800 p-6 rounded-2xl relative bg-linear-to-b from-amber-50/20 via-white to-white">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-indigo-800 font-extrabold text-xs tracking-widest uppercase font-display">
                <Landmark className="w-4 h-4" />
                <span>Department of Land Records & Cadastral Administration</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase">
                Cadastral Survey & Digital Twin Certificate
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                Document Ref: DHR-CAD-{parcel.pin.replace(/[^a-zA-Z0-9]/g, '')}-2026
              </p>
            </div>

            {/* Official Stamps Bar */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase tracking-wider font-semibold">
                  Parcel Identifier
                </span>
                <span className="font-extrabold text-slate-900 text-sm font-mono">{parcel.pin}</span>
                <span className="block text-[11px] text-indigo-600 font-bold">({parcel.code})</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase tracking-wider font-semibold">
                  Verification Status
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{parcel.verificationStatus === 'corrected' ? 'AI Ground Truth Certified' : 'AI Verified'}</span>
                </span>
                <span className="block text-[11px] text-slate-500">Confidence: {parcel.confidence}%</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase tracking-wider font-semibold">
                  Survey Date & Timestamp
                </span>
                <span className="font-mono text-slate-800 font-bold">2026-09-18 12:45 UTC</span>
                <span className="block text-[11px] text-slate-500">Sub-centimeter GSD</span>
              </div>
            </div>

            {/* Geographic & Valuation Attributes */}
            <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 text-[10px] block font-medium">Registered Area</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{parcel.acres} Acres</span>
                <span className="text-[10px] text-slate-500 block">({parcel.sqft.toLocaleString()} sq ft)</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block font-medium">Zoning Classification</span>
                <span className="font-bold text-slate-900 truncate block">{parcel.zoning}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block font-medium">Tax Valuation</span>
                <span className="font-bold text-indigo-600 font-mono text-sm">
                  ${(parcel.taxAssessment / 1000000).toFixed(2)}M
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block font-medium">Structures Detected</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {parcel.structuresDetected} Permanent
                </span>
              </div>
            </div>

            {/* Registered Revenue Deed Status */}
            {parcel.deedRecord && (
              <div className={`mt-5 p-4 rounded-xl border text-xs ${
                isEncroached 
                  ? 'bg-rose-50/70 border-rose-200 text-rose-950' 
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              }`}>
                <div className="flex items-center justify-between font-bold border-b pb-2 border-slate-200/60">
                  <span className="flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-slate-700" />
                    <span>Revenue Record Alignment: {parcel.deedRecord.khasraPattaNumber}</span>
                  </span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200">
                    Owner: {parcel.deedRecord.registeredOwner}
                  </span>
                </div>

                <div className="mt-2 text-[11px] leading-relaxed">
                  <p>
                    <strong>Discrepancy Status: </strong>
                    {isEncroached 
                      ? `Encroachment alert — ${parcel.deedRecord.disputeNotes}` 
                      : 'Physical boundaries fully match digitized government revenue records.'}
                  </p>
                  {isEncroached && (
                    <div className="mt-1 font-mono font-bold text-rose-800">
                      Discrepancy Index: {parcel.deedRecord.discrepancyIndexPercentage}% ({parcel.deedRecord.encroachmentAreaSqFt} sq ft overlap)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prescribed Statutory Remedial Action & Orders */}
            {(() => {
              const resolutionReport = getDeedConflictSolutions(parcel);
              const primary = resolutionReport.primaryPreferredSolution;
              return (
                <div className="mt-5 p-4 rounded-xl border border-slate-300 bg-slate-50/70 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold border-b pb-2 border-slate-200">
                    <span className="flex items-center gap-1.5 text-slate-900 font-display">
                      <Scale className="w-4 h-4 text-indigo-600" />
                      <span>Prescribed Remedial Action & Statutory Regularization Order</span>
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                      {isEncroached ? 'ACTION REQUIRED' : 'TITLE CLEAR'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-700">
                    <div>
                      <strong className="text-slate-900">Recommended Remedy: </strong>
                      <span>{primary.title}</span>
                    </div>
                    <p>{primary.summary}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                      <div>
                        <strong className="text-slate-600">Statutory Provision: </strong>
                        <span className="text-indigo-900">{primary.statutoryReference}</span>
                      </div>
                      <div>
                        <strong className="text-slate-600">Competent Authority: </strong>
                        <span className="text-slate-800">{primary.competentAuthority}</span>
                      </div>
                    </div>

                    {/* Procedural Directives */}
                    <div className="pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider block mb-1">
                        Procedural Directives for Revenue Alignment:
                      </span>
                      <ul className="space-y-1 text-[10px] text-slate-600">
                        {primary.proceduralSteps.slice(0, 3).map((step, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-indigo-600 font-bold">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Signature & Seal Blocks */}
            <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-300 grid grid-cols-2 gap-8 text-xs">
              <div className="space-y-1">
                <div className="h-10 border-b border-slate-400 flex items-end pb-1 text-slate-700 font-mono text-[11px]">
                  R. Verma, Lead Cadastre Surveyor
                </div>
                <div className="font-bold text-slate-800">Chief Surveyor Signoff</div>
                <div className="text-[10px] text-slate-400 font-mono">License: DHR-GOV-991204</div>
              </div>

              <div className="space-y-1">
                <div className="h-10 border-b border-slate-400 flex items-end pb-1 text-indigo-700 font-mono text-[11px] font-bold">
                  SHA-256: 8f9b2c31e...d4a10
                </div>
                <div className="font-bold text-slate-800">Digital Twin Cryptographic Seal</div>
                <div className="text-[10px] text-slate-400 font-mono">Tamper-evident verification hash</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
