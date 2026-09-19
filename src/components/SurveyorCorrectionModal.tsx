import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Brain, 
  Sparkles, 
  Move, 
  HelpCircle, 
  ArrowRight, 
  History, 
  ShieldCheck, 
  RefreshCw,
  X
} from 'lucide-react';
import { CadastralParcel, CorrectionReason, SurveyorCorrectionRecord } from '../types';

interface SurveyorCorrectionModalProps {
  isOpen: boolean;
  parcel: CadastralParcel | null;
  onClose: () => void;
  onSubmitCorrection: (correction: {
    displacementMeters: number;
    deltaShiftPercent: { dx: number; dy: number };
    reason: CorrectionReason;
    notes: string;
  }) => void;
}

export const SurveyorCorrectionModal: React.FC<SurveyorCorrectionModalProps> = ({
  isOpen,
  parcel,
  onClose,
  onSubmitCorrection,
}) => {
  const [displacement, setDisplacement] = useState<number>(1.5); // meters (e.g. 1.5m)
  const [shiftDirection, setShiftDirection] = useState<'east' | 'west' | 'north' | 'south'>('east');
  const [selectedReason, setSelectedReason] = useState<CorrectionReason>('shadow_false_boundary');
  const [notes, setNotes] = useState<string>('Shadow cast by adjacent canopy caused 1.5m boundary shift.');

  if (!isOpen || !parcel) return null;

  const REASON_OPTIONS: { id: CorrectionReason; label: string; desc: string; icon: string }[] = [
    {
      id: 'wall_fence_not_detected',
      label: 'Wall / fence not detected',
      desc: 'Physical perimeter wall or wire fence was missed by the edge detection model',
      icon: '🧱',
    },
    {
      id: 'shadow_false_boundary',
      label: 'Shadow caused false boundary',
      desc: 'Building or canopy shadow cast a dark linear boundary artifact',
      icon: '🌘',
    },
    {
      id: 'vegetation_blocked_boundary',
      label: 'Vegetation blocked the boundary',
      desc: 'Tree canopy, overgrown hedgerow, or crops obstructed property line',
      icon: '🌳',
    },
    {
      id: 'cadastral_record_differs',
      label: 'Existing cadastral record differs',
      desc: 'Discrepancy with municipal land registry / registered deed coordinates',
      icon: '📜',
    },
    {
      id: 'ai_segmentation_error',
      label: 'AI segmentation error',
      desc: 'Model under-segmented or merged adjoining parcel parcels',
      icon: '🤖',
    },
    {
      id: 'other',
      label: 'Other survey discrepancy',
      desc: 'Topographic elevation shift or physical marker discrepancy',
      icon: '📍',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate delta shift normalized percentages based on displacement and direction
    let dx = 0;
    let dy = 0;
    const factor = displacement * 0.8; // map 1m ~ 0.8% coordinates
    if (shiftDirection === 'east') dx = factor;
    if (shiftDirection === 'west') dx = -factor;
    if (shiftDirection === 'south') dy = factor;
    if (shiftDirection === 'north') dy = -factor;

    onSubmitCorrection({
      displacementMeters: displacement,
      deltaShiftPercent: { dx, dy },
      reason: selectedReason,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        id="dhar-nav-correction-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  DharNav AI Self-Verification Loop
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  Step 2 & 3
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Correct boundary for <strong className="text-slate-900">{parcel.code}</strong> and feed training corrections to the AI
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Step 1 Telemetry review */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 font-medium">Initial AI Confidence:</span>
              <span className={`ml-2 font-bold font-mono ${
                parcel.confidence < 75 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {parcel.confidence}% {parcel.confidence < 75 ? '⚠️ Needs Review' : '🟢 Verified'}
              </span>
            </div>
            <div className="text-slate-500">
              PIN: <span className="font-mono font-semibold text-slate-800">{parcel.pin}</span>
            </div>
          </div>

          {/* Step 2: Boundary displacement slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-blue-600" />
                <span>Surveyor Boundary Adjustment</span>
              </label>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Move by: {displacement.toFixed(1)} meters
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Adjust how far the surveyor ground truth moved the AI-predicted boundary.
            </p>
            <input
              type="range"
              min="0.2"
              max="5.0"
              step="0.1"
              value={displacement}
              onChange={(e) => setDisplacement(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            
            {/* Shift Direction */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {(['east', 'west', 'north', 'south'] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setShiftDirection(dir)}
                  className={`py-1.5 text-xs font-bold rounded-lg border capitalize transition-all ${
                    shiftDirection === dir
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Shift {dir}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: DharNav Asks: WHY was the correction needed? */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>DharNav Asks: Why was this correction needed?</span>
            </label>
            <p className="text-[11px] text-slate-500 mb-3">
              This structured feedback directly trains DharNav's Model Learning Map to prevent recurring errors.
            </p>

            <div className="space-y-2">
              {REASON_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedReason(opt.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    selectedReason === opt.id
                      ? 'border-blue-500 bg-blue-50/70 text-slate-900 ring-1 ring-blue-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-lg leading-none shrink-0">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{opt.label}</span>
                      {selectedReason === opt.id && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Field notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Surveyor Context Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Heavy tree canopy on eastern boundary caused shadow artifact..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>

            <button
              id="btn-submit-dhar-nav-correction"
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply Correction & Train DharNav</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
