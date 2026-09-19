import React, { useRef } from 'react';
import { Upload, FileImage, Sparkles, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { SAMPLE_DRONE_IMAGES } from '../data/sampleCadastres';

interface UploadDroneDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadCustomImage: (base64: string, file: File) => void;
  onSelectSamplePreset: (presetId: string) => void;
  isAnalyzing: boolean;
}

export const UploadDroneDialog: React.FC<UploadDroneDialogProps> = ({
  isOpen,
  onClose,
  onUploadCustomImage,
  onSelectSamplePreset,
  isAnalyzing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [selectedFormat, setSelectedFormat] = React.useState<string>('All Supported Formats');
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const supportedFormats = [
    { label: 'GeoTIFF / TIFF (.tif, .tiff)', ext: '.tif,.tiff', desc: 'Georeferenced orthomosaics with embedded coordinate metadata' },
    { label: 'Ultra-HD JPEG (.jpg, .jpeg)', ext: '.jpg,.jpeg', desc: 'DJI Phantom / Mavic / Matrice RTK aerial high-res exports' },
    { label: 'PNG Multispectral (.png)', ext: '.png', desc: 'Lossless RGB & 4-band false-color NDVI crop and parcel imagery' },
    { label: 'RAW & DNG Aerial (.raw, .dng)', ext: '.dng,.raw', desc: 'Uncompressed drone sensor raw captures' },
  ];

  const handleFile = (file: File) => {
    setUploadError(null);
    if (!file) return;

    // Check size limit: 30MB
    if (file.size > 30 * 1024 * 1024) {
      setUploadError('File size exceeds 30MB limit. Please provide an optimized drone orthophoto.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        onUploadCustomImage(base64, file);
      }
    };
    reader.onerror = () => {
      setUploadError('Error reading file. Please try another format.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        id="upload-drone-dialog-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FileImage className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">Upload Drone Aerial Imagery</h3>
              <p className="text-xs text-slate-500 font-medium">Automatic boundary detection, parcel delineation & feature identification</p>
            </div>
          </div>
          <button
            id="btn-close-drone-modal"
            onClick={onClose}
            disabled={isAnalyzing}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Format Selector Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select or Target Imagery Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {supportedFormats.map((fmt) => (
                <div 
                  key={fmt.label}
                  onClick={() => setSelectedFormat(fmt.label)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedFormat === fmt.label 
                      ? 'border-blue-500 bg-blue-50/50 text-blue-900 ring-1 ring-blue-500/30' 
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center justify-between">
                    <span>{fmt.label}</span>
                    {selectedFormat === fmt.label && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-snug">{fmt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Upload Drone Picture File
            </label>
            <div
              id="drone-dropzone"
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/60'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.tif,.tiff,.webp,.dng"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-blue-100/70 text-blue-600 mx-auto flex items-center justify-center mb-3">
                <Upload className="w-7 h-7" />
              </div>
              <p className="font-semibold text-sm text-slate-800">
                Click to browse or drag & drop drone imagery
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports GeoTIFF, JPG, PNG, DNG, WebP (up to 30 MB)
              </p>

              {uploadError && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Instant Preset Orthophoto Showcase */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Or choose from Pre-Loaded Drone Surveys
              </label>
              <span className="text-[11px] text-blue-600 font-medium">Ready with cadastral vectors</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {SAMPLE_DRONE_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  id={`preset-${sample.id}`}
                  onClick={() => {
                    onSelectSamplePreset(sample.id);
                    onClose();
                  }}
                  className="group relative rounded-xl border border-slate-200 overflow-hidden text-left hover:border-blue-500 hover:shadow-md transition-all bg-white"
                >
                  <div className="h-20 w-full overflow-hidden bg-slate-100">
                    <img
                      src={sample.url}
                      alt={sample.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2.5">
                    <div className="font-bold text-xs text-slate-900 truncate">{sample.name}</div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between mt-1">
                      <span>{sample.format}</span>
                      <span className="font-mono text-blue-600">{sample.resolution}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            AI computer vision delineates boundaries & identifies all structures
          </span>
          <button
            id="btn-cancel-upload"
            onClick={onClose}
            className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
