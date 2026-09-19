import React from 'react';
import { Layers, Eye, Scan, Mountain, Flame, Split, Brain, Building2, Landmark, Box } from 'lucide-react';
import { ImageViewMode } from '../types';

interface ViewModeToolbarProps {
  viewMode: ImageViewMode;
  onViewModeChange: (mode: ImageViewMode) => void;
  telemetryOpacity: number;
  onOpacityChange: (opacity: number) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  isVertexEditMode?: boolean;
  onToggleVertexEdit?: () => void;
}

export const ViewModeToolbar: React.FC<ViewModeToolbarProps> = ({
  viewMode,
  onViewModeChange,
  telemetryOpacity,
  onOpacityChange,
  showLabels,
  onToggleLabels,
  isVertexEditMode = false,
  onToggleVertexEdit,
}) => {
  const modes: { id: ImageViewMode; label: string; icon: React.ReactNode; tooltip: string }[] = [
    { id: 'original', label: 'Orthophoto', icon: <Eye className="w-3.5 h-3.5" />, tooltip: 'High-res RGB drone orthomosaic' },
    { id: 'cadastral', label: 'Cadastral Lots', icon: <Layers className="w-3.5 h-3.5" />, tooltip: 'Delineated boundaries & packets' },
    { id: 'digital_twin', label: 'Digital Twin (What-If)', icon: <Building2 className="w-3.5 h-3.5 text-indigo-500" />, tooltip: 'Simulate new buildings and spatial impact' },
    { id: 'volumetric_3d', label: '3D Sun & Shadows', icon: <Box className="w-3.5 h-3.5 text-violet-600" />, tooltip: '3D volumetric building heights and solar shadow simulation' },
    { id: 'deed_conflict', label: 'Deed vs Drone', icon: <Landmark className="w-3.5 h-3.5 text-rose-500" />, tooltip: 'Compare official revenue deed records against drone reality' },
    { id: 'reliability', label: 'DharNav Learning Map', icon: <Brain className="w-3.5 h-3.5 text-amber-500" />, tooltip: '🟢 High, 🟡 Occasional, 🔴 Frequent Error Tier Map' },
    { id: 'segmentation', label: 'AI Segmentation', icon: <Scan className="w-3.5 h-3.5" />, tooltip: 'Classification masks & objects' },
    { id: 'contour', label: 'Contour / Topo', icon: <Mountain className="w-3.5 h-3.5" />, tooltip: 'Elevation contours & terrain vectors' },
    { id: 'thermal', label: 'Thermal / NDVI', icon: <Flame className="w-3.5 h-3.5" />, tooltip: 'Multispectral vegetation index' },
    { id: 'split', label: 'Slider Split', icon: <Split className="w-3.5 h-3.5" />, tooltip: 'Before/after overlay slider' },
  ];

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-xs">
      {/* View Mode Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 min-w-0 flex-1 scrollbar-thin scrollbar-thumb-slate-200">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-2 font-display shrink-0">
          Multi-View:
        </span>
        {modes.map((mode) => {
          const isActive = viewMode === mode.id;
          return (
            <button
              key={mode.id}
              id={`btn-view-${mode.id}`}
              onClick={() => onViewModeChange(mode.id)}
              title={mode.tooltip}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold ring-2 ring-indigo-500/30'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {mode.icon}
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Opacity, Interactive Vertex Dragging, & Label Controls */}
      <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-200/80 lg:pl-3 justify-end">
        {/* Interactive Vertex Dragging Mode Toggle */}
        {onToggleVertexEdit && (
          <button
            id="btn-toggle-vertex-mode"
            onClick={onToggleVertexEdit}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
              isVertexEditMode
                ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400/30 shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
            title="Click and drag boundary corner nodes directly on the drone map"
          >
            <span className={`w-2 h-2 rounded-full ${isVertexEditMode ? 'bg-white animate-ping' : 'bg-amber-500'}`} />
            <span>{isVertexEditMode ? 'Node Dragging ON' : 'Drag Nodes'}</span>
          </button>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Opacity:
          </label>
          <input
            id="slider-telemetry-opacity"
            type="range"
            min="10"
            max="100"
            value={telemetryOpacity}
            onChange={(e) => onOpacityChange(Number(e.target.value))}
            className="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <span className="text-xs font-mono font-bold text-slate-700 w-7">{telemetryOpacity}%</span>
        </div>

        <button
          id="btn-toggle-labels"
          onClick={onToggleLabels}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 ${
            showLabels
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          {showLabels ? 'Labels ON' : 'Labels OFF'}
        </button>
      </div>
    </div>
  );
};
