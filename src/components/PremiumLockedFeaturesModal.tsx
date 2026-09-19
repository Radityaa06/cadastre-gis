import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  Lock, 
  ShieldCheck, 
  Radio, 
  Layers, 
  FileText, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  Building2,
  ExternalLink
} from 'lucide-react';

interface PremiumLockedFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumLockedFeaturesModal: React.FC<PremiumLockedFeaturesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [requestSent, setRequestSent] = useState(false);

  const lockedFeatures = [
    {
      id: 'rtk',
      title: 'Sub-Centimeter RTK Drone Stream',
      tier: 'Enterprise Geodesy',
      desc: 'Live carrier-phase differential GPS RTK telemetry (1.2 cm CEP accuracy) with dual-frequency L1/L2 base station synchronization.',
      icon: Radio,
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      id: 'khasra_sync',
      title: 'Automated State Khasra Registry Sync',
      tier: 'Government Survey',
      desc: 'Direct live API bridge to the State Revenue Department GIS database for instant Patta registration deed title reconciliation.',
      icon: Database,
      badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
    {
      id: 'lidar_3d',
      title: '3D LiDAR Volumetric & Point Cloud Pipeline',
      tier: 'Pro Tier',
      desc: 'Full 500 pts/m² LiDAR classification, Digital Terrain Modeling (DTM), bare-earth extraction, and vegetation canopy penetration.',
      icon: Layers,
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
    },
    {
      id: 'court_affidavit',
      title: 'Court-Admissible Legal Affidavit & Title Insurance',
      tier: 'Enterprise Legal',
      desc: 'Statutory Form 18 deed indemnity bonds, revenue court litigation briefs, and certified boundary dispute regularizations.',
      icon: FileText,
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
    },
    {
      id: 'cad_batch',
      title: 'Multi-Sector CAD / GIS Batch Exporter',
      tier: 'Pro Tier',
      desc: 'Automated 1-click batch compilation to Autodesk Civil 3D DWG/DXF, ESRI Shapefiles (.shp), and OpenGIS GeoPackage formats.',
      icon: Building2,
      badgeColor: 'text-teal-700 bg-teal-50 border-teal-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="premium-locked-features-modal"
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden font-sans"
      >
        {/* Header with Gold/Amber Accent */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight font-display text-white">
                  DharNav Enterprise & Premium Features
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  LOCKED
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Statutory municipal geodesy, real-time revenue integration, and automated legal packages
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl flex items-start gap-3 text-xs">
            <div className="p-1.5 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-2xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-amber-950">
                Enterprise & Professional License Required
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                These advanced spatial modules are restricted to authorized cadastral surveying authorities, municipal corporations, and certified title attorneys.
              </p>
            </div>
          </div>

          {/* Locked Features List */}
          <div className="space-y-2.5">
            {lockedFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.id}
                  className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-white transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs group-hover:border-indigo-300 transition-colors">
                      <Icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900">{feat.title}</h4>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.2 rounded-full border ${feat.badgeColor}`}>
                          {feat.tier}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {feat.desc}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    <span className="p-1.5 rounded-lg bg-slate-200/80 text-slate-500 flex items-center justify-center" title="Feature locked">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Compliant with ISO 19152 Land Administration Domain Model</span>
          </div>

          {requestSent ? (
            <div className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Inquiry Received. A DharNav Specialist will contact you.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRequestSent(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-102"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Inquire for Enterprise Access</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
