import React, { useRef, useState } from 'react';
import { 
  Upload, 
  Map as MapIcon, 
  ArrowRight, 
  Brain, 
  Building2, 
  CheckCircle2, 
  Compass, 
  FileCheck, 
  FileText, 
  HardDrive, 
  Layers, 
  Navigation, 
  Plane, 
  Repeat, 
  Scale, 
  ShieldCheck, 
  Sparkles, 
  Sun, 
  Wifi,
  Radio,
  TrendingUp,
  Activity
} from 'lucide-react';
import { SAMPLE_DRONE_IMAGES } from '../data/sampleCadastres';

interface HomeOverviewProps {
  onNavigateToDrone: (openUploadDialog?: boolean) => void;
  onNavigateToMaps: () => void;
  onUploadImageFromComputer: (base64: string, file: File) => void;
  onSelectSamplePreset: (presetId: string) => void;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  onNavigateToDrone,
  onNavigateToMaps,
  onUploadImageFromComputer,
  onSelectSamplePreset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    setUploadError(null);
    if (file.size > 35 * 1024 * 1024) {
      setUploadError('File size exceeds 35MB. Please upload an optimized aerial image.');
      return;
    }

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        onUploadImageFromComputer(base64, file);
      }
      setIsProcessingFile(false);
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file. Please try another file.');
      setIsProcessingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150 font-sans">
      {/* Executive Enterprise Metric & Trust Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-600">RTK Precision</div>
            <div className="text-sm font-black text-slate-900 font-mono">99.4% IoU Fixed</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-600">Cataloged Lots</div>
            <div className="text-sm font-black text-slate-900 font-mono">24.6 ac Indexed</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Scale className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-600">Deed Reconciled</div>
            <div className="text-sm font-black text-slate-900 font-mono">Khasra #142 Sync</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
            <TrendingUp className="w-4 h-4 text-cyan-600" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-600">Total Valuation</div>
            <div className="text-sm font-black text-indigo-700 font-mono">$48.2M Assessed</div>
          </div>
        </div>
      </div>

      {/* DUAL EXECUTIVE WORKSPACE LAUNCHPAD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* WORKSPACE 1: UPLOAD DRONE ORTHOMOSAIC & DIGITAL TWIN */}
        <div 
          id="card-upload-image-computer"
          className="bg-white rounded-2xl border border-indigo-200 p-4 sm:p-5 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            {/* Header Strip */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 font-display">
                    Drone Orthomosaic & Digital Twin
                  </h4>
                  <span className="text-[10px] text-indigo-600 font-bold">
                    Sub-cm polygon extraction & 3D solar simulation
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-extrabold border border-indigo-200">
                PRIMARY WORKSPACE
              </span>
            </div>

            {/* Native Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.tif,.tiff,.png,.jpg,.jpeg,.dng,.raw"
              onChange={handleFileChange}
              className="hidden"
              id="native-computer-file-input"
            />

            {/* Compact Low-Profile Drag & Drop Dock */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-3 text-center transition-all cursor-pointer flex items-center justify-center gap-3 ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01]'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/30'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-indigo-600 shrink-0">
                <Plane className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800">
                  {isProcessingFile ? (
                    <span className="text-indigo-600 animate-pulse">Processing orthomosaic...</span>
                  ) : (
                    <span>Click to browse aerial image, or drop GeoTIFF / JPG</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-600 font-mono">
                  Up to 35MB • Auto boundary detection & roof vectors
                </div>
              </div>
            </div>

            {uploadError && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-xl">
                {uploadError}
              </div>
            )}

            {/* Quick Sample Presets Strip */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                Instant Demo Datasets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_DRONE_IMAGES.map((sample) => (
                  <button
                    key={sample.id}
                    id={`btn-sample-preset-${sample.id}`}
                    onClick={() => {
                      onSelectSamplePreset(sample.id);
                      onNavigateToDrone(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200/90 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>{sample.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100">
            <button
              id="btn-trigger-browse-computer"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Launch Drone Digital Twin</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        {/* WORKSPACE 2: GO WITH GOOGLE MAPS */}
        <div 
          id="card-go-with-google-maps"
          className="bg-white rounded-2xl border border-emerald-200 p-4 sm:p-5 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            {/* Header Strip */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                  <MapIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 font-display">
                    Google Maps Live GPS Cadastre
                  </h4>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    Satellite overlays & real-time surveyor blue dot
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-extrabold border border-emerald-200">
                FIELD GPS
              </span>
            </div>

            {/* High-Density GPS Telemetry Status Strip */}
            <div 
              onClick={onNavigateToMaps}
              className="border border-emerald-200/90 rounded-xl p-3 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <Navigation className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Surveyor GPS Geolocation Engine</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    Direct GPS lock • Hybrid, Satellite & Terrain basemaps
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-white px-2 py-1 rounded-lg border border-emerald-200 shrink-0">
                Ready
              </span>
            </div>

            {/* Compact 4-Capability Pills */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                Integrated Field Capabilities:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">Auto GPS Positioning</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">Surveyor Blue Dot</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">Hybrid / Sat Basemaps</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">PIN Node Coordinates</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100">
            <button
              id="btn-trigger-go-with-google-maps"
              onClick={onNavigateToMaps}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Launch Google Maps GPS</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* PLATFORM ARCHITECTURE & CAPABILITIES */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-indigo-700 font-extrabold text-[10px] tracking-wider uppercase font-display">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Enterprise Architecture</span>
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight font-display">
              DharNav Cadastral Digital Twin Intelligence
            </h3>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
            <span>ISO 19152 LADM Compliant</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">100% Closed Loop</span>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Plane className="w-3.5 h-3.5" />
            </div>
            <h4 className="font-extrabold text-slate-900">
              1. Drone Vision
            </h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Ingests GeoTIFF orthomosaics. Automatically extracts boundaries, fences, wall vectors, and lot footprints.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Repeat className="w-3.5 h-3.5" />
            </div>
            <h4 className="font-extrabold text-slate-900">
              2. AI Feedback Loop
            </h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Licensed surveyors refine edge ambiguities. Corrections immediately update internal model weights.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <h4 className="font-extrabold text-slate-900">
              3. Deed Reconcile
            </h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Cross-references digitized revenue deeds with physical drone lines to flag encroachments & statutory remedies.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Sun className="w-3.5 h-3.5" />
            </div>
            <h4 className="font-extrabold text-slate-900">
              4. 3D Solar Digital Twin
            </h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Models proposed structures, tests boundary setback compliance, and computes 3D volumetric solar shadows.
            </p>
          </div>
        </div>

        {/* Compact Technical Bar */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
            <span><strong>Formats:</strong> GeoTIFF, HD-JPG, PNG, DNG/RAW</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span><strong>Outputs:</strong> Vector GeoJSON, Tax Challans, Official Certificates</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-indigo-600" />
            <span><strong>Field Mode:</strong> Offline GPS caching & IndexedDB sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
