import React from 'react';
import { Upload, FileImage, Sparkles, Plus, Image as ImageIcon } from 'lucide-react';
import { SAMPLE_DRONE_IMAGES } from '../data/sampleCadastres';

interface EmptyDronePlaygroundProps {
  onOpenUploadDialog: () => void;
  onSelectSamplePreset: (presetId: string) => void;
}

export const EmptyDronePlayground: React.FC<EmptyDronePlaygroundProps> = ({
  onOpenUploadDialog,
  onSelectSamplePreset,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs flex flex-col items-center justify-center text-center max-w-4xl mx-auto my-4 animate-in fade-in duration-200">
      {/* Visual Upload Icon Box */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-sm">
          <FileImage className="w-10 h-10" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
          <Plus className="w-4 h-4" />
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
        <span>Ready for Drone Orthophoto / Aerial Survey Analysis</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight max-w-xl">
        Insert Drone Imagery to Begin Automatic Boundary & Packet Extraction
      </h2>

      <p className="text-sm text-slate-500 max-w-lg mt-3 leading-relaxed">
        The playground is empty and ready. Click below to open the upload dialog with support for multiple formats (GeoTIFF, JPG, PNG, RAW, DNG). The system will analyze the boundaries, packets, and classify every structure on screen.
      </p>

      {/* Main Upload Trigger Button */}
      <button
        id="btn-trigger-upload-empty"
        onClick={onOpenUploadDialog}
        className="mt-6 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all"
      >
        <Upload className="w-5 h-5" />
        <span>Open Upload Pic Dialog Box</span>
      </button>

      {/* Quick Sample Presets */}
      <div className="w-full mt-10 pt-8 border-t border-slate-100">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Or load a pre-calibrated sample drone survey
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          {SAMPLE_DRONE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSamplePreset(sample.id)}
              className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all group flex items-center gap-3 bg-slate-50/50"
            >
              <img
                src={sample.url}
                alt={sample.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 truncate group-hover:text-blue-600">
                  {sample.name}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {sample.format} • {sample.resolution}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
