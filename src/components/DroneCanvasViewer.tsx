import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Crosshair, 
  CheckCircle, 
  Tag, 
  Building2, 
  Trees, 
  ShieldAlert, 
  Route, 
  Droplet, 
  Sparkles,
  AlertTriangle,
  Brain,
  Plus,
  Landmark,
  Sun,
  Box,
  Move
} from 'lucide-react';
import { CadastralParcel, IdentifiedFeature, ImageViewMode } from '../types';
import { 
  calculateSunShadow, 
  calculateMetersPerPercent,
  calculatePolygonCentroid 
} from '../utils/cadastreCalculations';

interface DroneCanvasViewerProps {
  imageUrl: string;
  viewMode: ImageViewMode;
  parcels: CadastralParcel[];
  identifiedFeatures: IdentifiedFeature[];
  selectedParcel: CadastralParcel | null;
  onSelectParcel: (parcel: CadastralParcel) => void;
  telemetryOpacity: number;
  showLabels: boolean;
  activeFeatureFilter: string | null;
  onSelectFeatureFilter: (category: string | null) => void;
  onOpenCorrectionModal?: (parcel: CadastralParcel) => void;
  onOpenWhatIfModal?: (parcel: CadastralParcel) => void;
  onUpdateParcelVertex?: (parcelId: string, vertexIndex: number, newCoord: { x: number; y: number }) => void;
  isVertexEditMode?: boolean;
  sunAzimuth?: number;
  sunElevation?: number;
  filteredParcelIds?: string[] | null;
  highlightedParcelIds?: string[];
  onResetFilter?: () => void;
}

export const DroneCanvasViewer: React.FC<DroneCanvasViewerProps> = ({
  imageUrl,
  viewMode,
  parcels,
  identifiedFeatures,
  selectedParcel,
  onSelectParcel,
  telemetryOpacity,
  showLabels,
  activeFeatureFilter,
  onSelectFeatureFilter,
  onOpenCorrectionModal,
  onOpenWhatIfModal,
  onUpdateParcelVertex,
  isVertexEditMode = false,
  sunAzimuth = 220,
  sunElevation = 40,
  filteredParcelIds,
  highlightedParcelIds,
  onResetFilter,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [splitSliderPos, setSplitSliderPos] = useState(50);
  const [hoveredFeature, setHoveredFeature] = useState<IdentifiedFeature | null>(null);
  const [imageAspect, setImageAspect] = useState<number | null>(null);

  // Vertex Dragging State
  const [draggingVertex, setDraggingVertex] = useState<{ parcelId: string; vertexIndex: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setImageAspect(naturalWidth / naturalHeight);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (draggingVertex) return;
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // If dragging a vertex node
    if (draggingVertex && svgRef.current && onUpdateParcelVertex) {
      const rect = svgRef.current.getBoundingClientRect();
      const normX = Math.max(0.5, Math.min(99.5, ((e.clientX - rect.left) / rect.width) * 100));
      const normY = Math.max(0.5, Math.min(99.5, ((e.clientY - rect.top) / rect.height) * 100));
      onUpdateParcelVertex(draggingVertex.parcelId, draggingVertex.vertexIndex, {
        x: Math.round(normX * 10) / 10,
        y: Math.round(normY * 10) / 10,
      });
      return;
    }

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingVertex(null);
  };

  // Global window mousemove & mouseup listener while dragging a vertex node to ensure stable, smooth movement
  useEffect(() => {
    if (!draggingVertex) return;

    const onGlobalMouseMove = (e: MouseEvent) => {
      if (svgRef.current && onUpdateParcelVertex) {
        const rect = svgRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const normX = Math.max(0.5, Math.min(99.5, ((e.clientX - rect.left) / rect.width) * 100));
        const normY = Math.max(0.5, Math.min(99.5, ((e.clientY - rect.top) / rect.height) * 100));
        onUpdateParcelVertex(draggingVertex.parcelId, draggingVertex.vertexIndex, {
          x: Math.round(normX * 10) / 10,
          y: Math.round(normY * 10) / 10,
        });
      }
    };

    const onGlobalMouseUp = () => {
      setDraggingVertex(null);
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
    };
  }, [draggingVertex, onUpdateParcelVertex]);

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'structure':
        return <Building2 className="w-3 h-3 text-indigo-600" />;
      case 'road':
        return <Route className="w-3 h-3 text-amber-600" />;
      case 'vegetation':
        return <Trees className="w-3 h-3 text-emerald-600" />;
      case 'water':
        return <Droplet className="w-3 h-3 text-cyan-600" />;
      default:
        return <Crosshair className="w-3 h-3 text-blue-600" />;
    }
  };

  const getReliabilityColor = (parcel: CadastralParcel) => {
    if (parcel.verificationStatus === 'corrected') return '#2563eb'; // blue: corrected & learned
    if (parcel.aiReliabilityTier === 'high' || parcel.confidence >= 90) return '#10b981'; // 🟢 Green
    if (parcel.aiReliabilityTier === 'occasional' || parcel.confidence >= 70) return '#eab308'; // 🟡 Yellow
    return '#ef4444'; // 🔴 Red
  };

  const filteredFeatures = activeFeatureFilter
    ? identifiedFeatures.filter((f) => f.category === activeFeatureFilter)
    : identifiedFeatures;

  // Calculate Sun Ray Vector for 3D Shadow projection
  const sunRad = (sunAzimuth * Math.PI) / 180;
  const shadowMultiplier = (45 / Math.max(15, sunElevation)) * 4.5;
  const shadowDx = Math.sin(sunRad) * shadowMultiplier;
  const shadowDy = Math.cos(sunRad) * shadowMultiplier;

  return (
    <div className="relative w-full h-[640px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden select-none flex flex-col shadow-xs">
      {/* Top Floating Telemetry Pills */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 text-xs font-semibold text-slate-800">
          {viewMode === 'digital_twin' ? (
            <>
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Digital Twin: What-If Active</span>
            </>
          ) : viewMode === 'volumetric_3d' ? (
            <>
              <Sun className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '10s' }} />
              <span>3D Sun & Shadow Simulation</span>
            </>
          ) : viewMode === 'deed_conflict' ? (
            <>
              <Landmark className="w-4 h-4 text-rose-600" />
              <span>Deed vs Drone Encroachment</span>
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 text-blue-600" />
              <span>DharNav AI Closed Loop</span>
            </>
          )}
          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {parcels.length} Packets
          </span>
        </div>

        {selectedParcel && (
          <div className="pointer-events-auto bg-blue-600 text-white px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
            <span>Target: {selectedParcel.code}</span>
            <span className="text-blue-100 font-normal">
              (Conf: {selectedParcel.confidence.toFixed(1)}%)
            </span>
            {selectedParcel.confidence < 75 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-amber-950 text-[10px] font-extrabold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Self-Check</span>
              </span>
            )}
          </div>
        )}

        {/* Node Dragging Active Indicator */}
        {isVertexEditMode && (
          <div className="pointer-events-auto bg-amber-500 text-white px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 text-xs font-bold animate-pulse">
            <Move className="w-3.5 h-3.5" />
            <span>Interactive Node Dragging Active</span>
          </div>
        )}

        {/* VARAI AI Filter Active Indicator */}
        {filteredParcelIds && (
          <div className="pointer-events-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>VARAI Filter: {filteredParcelIds.length} parcel(s)</span>
            {onResetFilter && (
              <button
                id="btn-reset-varai-filter-drone"
                onClick={onResetFilter}
                className="ml-1 text-[10px] underline text-purple-200 hover:text-white"
              >
                Reset
              </button>
            )}
          </div>
        )}

        {/* Quick What-If simulation button when parcel is selected */}
        {selectedParcel && onOpenWhatIfModal && (
          <button
            onClick={() => onOpenWhatIfModal(selectedParcel)}
            className="pointer-events-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Simulate Building</span>
          </button>
        )}
      </div>

      {/* Top-Right Quick Filter for Features */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 shadow-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
          Features:
        </span>
        <button
          onClick={() => onSelectFeatureFilter(null)}
          className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            activeFeatureFilter === null
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({identifiedFeatures.length})
        </button>
        {['structure', 'road', 'vegetation', 'water'].map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectFeatureFilter(activeFeatureFilter === cat ? null : cat)}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${
              activeFeatureFilter === cat
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Interactive Canvas Viewport */}
      <div
        ref={containerRef}
        className={`relative flex-1 overflow-hidden bg-slate-200 ${
          isVertexEditMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="w-full h-full relative transition-transform duration-75 origin-center flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* Base Orthomosaic Image Layer & Aspect-Ratio Matched Overlay Container */}
          <div 
            className="relative flex items-center justify-center max-w-full max-h-full"
            style={{
              aspectRatio: imageAspect ? `${imageAspect}` : 'auto',
              width: imageAspect ? 'auto' : '100%',
              height: '100%',
              maxHeight: '100%',
              maxWidth: '100%',
            }}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              onLoad={handleImageLoad}
              alt="Drone Orthomosaic Survey"
              className={`w-full h-full object-contain pointer-events-none transition-all duration-300 rounded-lg shadow-sm ${
                viewMode === 'thermal'
                  ? 'contrast-150 saturate-200 hue-rotate-90 invert-25'
                  : viewMode === 'contour'
                  ? 'brightness-90 contrast-125 grayscale'
                  : ''
              }`}
            />

            {/* Split Comparison Divider */}
            {viewMode === 'split' && (
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${splitSliderPos}%` }}
              >
                <img
                  src={imageUrl}
                  alt="Original Side"
                  className="max-w-none w-full h-full object-contain"
                />
              </div>
            )}

            {/* Simulated Topographic / Contour Lines Vector Overlay */}
            {viewMode === 'contour' && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80">
                <defs>
                  <pattern id="contourPattern" width="60" height="60" patternUnits="userSpaceOnUse">
                    <circle cx="30" cy="30" r="10" fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx="30" cy="30" r="20" fill="none" stroke="#3b82f6" strokeWidth="1" />
                    <circle cx="30" cy="30" r="28" fill="none" stroke="#93c5fd" strokeWidth="1.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#contourPattern)" />
              </svg>
            )}

            {/* Cadastral Boundaries, Packets, Learning Map, Deed & Digital Twin SVG Layer */}
            {viewMode !== 'original' && (
              <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full pointer-events-auto"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {/* Parcel Polygons */}
                {parcels.map((parcel) => {
                  const isSelected = selectedParcel?.id === parcel.id;
                  const isHighlighted = highlightedParcelIds?.includes(parcel.id);
                  const isFilteredOut = filteredParcelIds !== null && filteredParcelIds !== undefined && !filteredParcelIds.includes(parcel.id);
                  const pts = parcel.boundaryPoints.map((p) => `${p.x},${p.y}`).join(' ');

                  const parcelColor = isHighlighted
                    ? '#ec4899'
                    : viewMode === 'reliability' 
                    ? getReliabilityColor(parcel) 
                    : viewMode === 'digital_twin' || viewMode === 'volumetric_3d'
                    ? (isSelected ? '#4f46e5' : '#64748b')
                    : viewMode === 'deed_conflict'
                    ? (parcel.deedRecord?.encroachmentDetected ? '#ef4444' : '#10b981')
                    : parcel.colorTheme;

                  return (
                    <g 
                      key={parcel.id} 
                      className={`cursor-pointer group transition-opacity duration-200 ${
                        isFilteredOut ? 'opacity-20 pointer-events-none' : 'opacity-100'
                      }`} 
                      onClick={() => onSelectParcel(parcel)}
                    >
                      {/* VARAI AI Glowing Highlight Ring */}
                      {isHighlighted && (
                        <polygon
                          points={pts}
                          fill="#f43f5e"
                          fillOpacity="0.45"
                          stroke="#db2777"
                          strokeWidth="2.8"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* DEED CONFLICT MODE: Official Government Deed Line Overlay */}
                      {viewMode === 'deed_conflict' && parcel.deedRecord?.deedBoundaryPoints && (
                        <polygon
                          points={parcel.deedRecord.deedBoundaryPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="1.2"
                          strokeDasharray="2 1"
                          opacity="0.95"
                        />
                      )}

                      {/* Original AI Boundary Ghost Line (When Ground Truth Corrected) */}
                      {parcel.verificationStatus === 'corrected' && parcel.originalAiBoundaryPoints && (
                        <polygon
                          points={parcel.originalAiBoundaryPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="0.8"
                          strokeDasharray="1.5 1"
                          opacity="0.85"
                        />
                      )}

                      {/* High-Contrast Underlay Shadow Stroke */}
                      <polygon
                        points={pts}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={isSelected ? '1.5' : '1.1'}
                        strokeOpacity="0.7"
                      />

                      {/* Current Active/Corrected Parcel Polygon */}
                      <polygon
                        points={pts}
                        fill={parcelColor}
                        fillOpacity={
                          isSelected
                            ? Math.min(0.65, (telemetryOpacity / 100) * 0.75)
                            : (telemetryOpacity / 100) * 0.35
                        }
                        stroke={isSelected ? '#ffffff' : parcelColor}
                        strokeWidth={isSelected ? '1.0' : '0.7'}
                        strokeDasharray={
                          parcel.confidence < 75 && parcel.verificationStatus !== 'corrected'
                            ? '1.5 1'
                            : 'none'
                        }
                        className="transition-all duration-200 group-hover:fill-opacity-50"
                      />

                      {/* Interactive Vertex Nodes (Click & Drag Support) */}
                      {parcel.boundaryPoints.map((pt, pIdx) => {
                        const isNodeDragging = draggingVertex?.parcelId === parcel.id && draggingVertex.vertexIndex === pIdx;
                        return (
                          <g key={pIdx} className="select-none pointer-events-auto">
                            {/* Outer steady glow halo (No spinning dashes, no blinking) */}
                            {(isVertexEditMode || isSelected) && (
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isNodeDragging ? 2.8 : isVertexEditMode ? 2.2 : 1.5}
                                fill={isNodeDragging ? '#fef3c7' : isVertexEditMode ? '#fffbeb' : '#eff6ff'}
                                fillOpacity={isNodeDragging ? 0.7 : 0.4}
                                stroke={isNodeDragging ? '#d97706' : isVertexEditMode ? '#f59e0b' : '#3b82f6'}
                                strokeWidth="0.3"
                                strokeOpacity={0.8}
                              />
                            )}
                            {/* Core vertex dot with solid white contrast ring (No hover jitter, no animate-spin) */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isNodeDragging ? 2.0 : isVertexEditMode ? 1.5 : isSelected ? 1.1 : 0.7}
                              fill={isNodeDragging ? '#d97706' : isVertexEditMode ? '#f59e0b' : isSelected ? '#ffffff' : parcelColor}
                              stroke="#ffffff"
                              strokeWidth="0.35"
                              className={isVertexEditMode ? 'cursor-grab active:cursor-grabbing' : ''}
                              onMouseDown={(e) => {
                                if (isVertexEditMode) {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setDraggingVertex({ parcelId: parcel.id, vertexIndex: pIdx });
                                }
                              }}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}

                {/* 3D VOLUMETRIC & SOLAR SHADOWS LAYER */}
                {viewMode === 'volumetric_3d' &&
                  parcels.map((p) =>
                    (p.simulations || []).map((sim) => {
                      const f = sim.footprintPoints;
                      if (f.length < 4) return null;

                      // Accurate physics-based solar shadow calculation
                      const shadowData = calculateSunShadow(f, sim.heightStories, sunAzimuth, sunElevation, 2.5);
                      const shadowPts = shadowData.shadowPoints.map((pt) => `${pt.x},${pt.y}`).join(' ');

                      // Isometric 3D wall extrusion points
                      const roofOffset = sim.heightStories * 1.3;
                      const roofPts = f.map((pt) => `${pt.x},${pt.y - roofOffset}`).join(' ');

                      return (
                        <g key={`3d-sim-${sim.id}`}>
                          {/* Shaded Ground Solar Shadow */}
                          {shadowPts && (
                            <polygon
                              points={shadowPts}
                              fill="#090d16"
                              fillOpacity="0.55"
                              className="transition-all duration-300 pointer-events-none"
                            />
                          )}

                          {/* 3D Extruded Building Walls */}
                          <polygon
                            points={`${f[3].x},${f[3].y} ${f[2].x},${f[2].y} ${f[2].x},${f[2].y - roofOffset} ${f[3].x},${f[3].y - roofOffset}`}
                            fill="#334155"
                            stroke="#0f172a"
                            strokeWidth="0.3"
                          />
                          <polygon
                            points={`${f[2].x},${f[2].y} ${f[1].x},${f[1].y} ${f[1].x},${f[1].y - roofOffset} ${f[2].x},${f[2].y - roofOffset}`}
                            fill="#475569"
                            stroke="#0f172a"
                            strokeWidth="0.3"
                          />

                          {/* 3D Elevated Roof Plane */}
                          <polygon
                            points={roofPts}
                            fill="#818cf8"
                            stroke="#4338ca"
                            strokeWidth="0.6"
                            fillOpacity="0.92"
                          />
                        </g>
                      );
                    })
                  )}

                {/* DIGITAL TWIN: Render Standard Simulated Footprints with Accurate Setback Guidelines */}
                {(viewMode === 'digital_twin' || viewMode === 'cadastral') &&
                  parcels.map((p) =>
                    (p.simulations || []).map((sim) => {
                      const simPts = sim.footprintPoints.map((pt) => `${pt.x},${pt.y}`).join(' ');
                      const isConflict = sim.impactAnalysis.boundaryConflict;
                      const strokeCol = isConflict ? '#ef4444' : '#6366f1';
                      const fillCol = isConflict ? '#ef4444' : '#6366f1';
                      const simCenterX = sim.footprintPoints.reduce((s, pt) => s + pt.x, 0) / 4;
                      const simCenterY = sim.footprintPoints.reduce((s, pt) => s + pt.y, 0) / 4;

                      return (
                        <g key={sim.id} className="cursor-pointer animate-in fade-in">
                          {/* Pulsing hazard border if conflict */}
                          {isConflict && (
                            <polygon
                              points={simPts}
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="2.0"
                              strokeOpacity="0.4"
                              className="animate-ping"
                              style={{ transformOrigin: `${simCenterX}px ${simCenterY}px` }}
                            />
                          )}

                          {/* Building footprint polygon with blueprint cross */}
                          <polygon
                            points={simPts}
                            fill={fillCol}
                            fillOpacity={isConflict ? 0.45 : 0.65}
                            stroke={strokeCol}
                            strokeWidth="1.0"
                            strokeDasharray={isConflict ? '1.5 1' : 'none'}
                          />
                          <line
                            x1={sim.footprintPoints[0].x}
                            y1={sim.footprintPoints[0].y}
                            x2={sim.footprintPoints[2].x}
                            y2={sim.footprintPoints[2].y}
                            stroke="#ffffff"
                            strokeWidth="0.4"
                            strokeOpacity="0.7"
                          />
                          <line
                            x1={sim.footprintPoints[1].x}
                            y1={sim.footprintPoints[1].y}
                            x2={sim.footprintPoints[3].x}
                            y2={sim.footprintPoints[3].y}
                            stroke="#ffffff"
                            strokeWidth="0.4"
                            strokeOpacity="0.7"
                          />

                          {/* On-Canvas Metric Dimensions Text */}
                          <text
                            x={simCenterX}
                            y={simCenterY - 0.8}
                            fill="#ffffff"
                            fontSize="1.9"
                            fontWeight="800"
                            textAnchor="middle"
                            className="pointer-events-none select-none drop-shadow"
                          >
                            {sim.widthMeters}m × {sim.lengthMeters}m
                          </text>
                          <text
                            x={simCenterX}
                            y={simCenterY + 1.8}
                            fill="#e0e7ff"
                            fontSize="1.3"
                            fontWeight="600"
                            textAnchor="middle"
                            className="pointer-events-none select-none drop-shadow"
                          >
                            {sim.estimatedSqFt.toLocaleString()} sq ft • {sim.heightStories}F
                          </text>
                        </g>
                      );
                    })
                  )}
              </svg>
            )}

            {/* Badges, Digital Twin Markers & Feature Callouts */}
            {viewMode !== 'original' && (
              <div className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Parcel ID Badges */}
                {showLabels &&
                  parcels.map((parcel) => {
                    const avgX =
                      parcel.boundaryPoints.reduce((sum, p) => sum + p.x, 0) /
                      parcel.boundaryPoints.length;
                    const avgY =
                      parcel.boundaryPoints.reduce((sum, p) => sum + p.y, 0) /
                      parcel.boundaryPoints.length;
                    const isSelected = selectedParcel?.id === parcel.id;
                    const isNeedsReview = parcel.confidence < 75 && parcel.verificationStatus !== 'corrected';
                    const simCount = (parcel.simulations || []).length;
                    const isEncroached = parcel.deedRecord?.encroachmentDetected;

                    return (
                      <div
                        key={`label-${parcel.id}`}
                        style={{ left: `${avgX}%`, top: `${avgY}%` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectParcel(parcel);
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer transition-all duration-150 ${
                          isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-10'
                        }`}
                      >
                        <div
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md flex items-center gap-1.5 border whitespace-nowrap ${
                            isSelected
                              ? 'bg-slate-900 text-white border-white ring-2 ring-indigo-500'
                              : viewMode === 'deed_conflict' && isEncroached
                              ? 'bg-rose-50 text-rose-900 border-rose-300 ring-1 ring-rose-400'
                              : isNeedsReview
                              ? 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400'
                              : 'bg-white/95 text-slate-800 border-slate-300'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                viewMode === 'reliability'
                                  ? getReliabilityColor(parcel)
                                  : viewMode === 'deed_conflict' && isEncroached
                                  ? '#ef4444'
                                  : parcel.colorTheme,
                            }}
                          />
                          <span>{parcel.code}</span>
                          <span className="text-[10px] font-mono opacity-85">
                            {parcel.acres}ac
                          </span>
                          <span className="text-[9px] font-normal opacity-70">
                            ({parcel.confidence.toFixed(0)}%)
                          </span>
                          {viewMode === 'deed_conflict' && isEncroached && (
                            <span className="px-1 py-0.2 rounded bg-rose-600 text-white font-mono text-[9px] font-bold">
                              ENCROACHED
                            </span>
                          )}
                          {simCount > 0 && viewMode !== 'deed_conflict' && (
                            <span className="px-1 py-0.2 rounded bg-indigo-600 text-white font-mono text-[9px] font-bold">
                              {simCount} SIM
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {/* Digital Twin Simulated Construction Badges */}
                {showLabels &&
                  (viewMode === 'digital_twin' || viewMode === 'volumetric_3d') &&
                  parcels.flatMap((p) =>
                    (p.simulations || []).map((sim) => {
                      const avgSimX = sim.footprintPoints.reduce((s, pt) => s + pt.x, 0) / 4;
                      const avgSimY = sim.footprintPoints.reduce((s, pt) => s + pt.y, 0) / 4;
                      const isConflict = sim.impactAnalysis.boundaryConflict;

                      return (
                        <div
                          key={`sim-label-${sim.id}`}
                          style={{ left: `${avgSimX}%`, top: `${avgSimY}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-30"
                        >
                          <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-lg flex items-center gap-1.5 border whitespace-nowrap ${
                            isConflict
                              ? 'bg-rose-900 text-white border-rose-400 ring-2 ring-rose-500'
                              : 'bg-indigo-900 text-white border-indigo-400 ring-2 ring-indigo-400'
                          }`}>
                            <Building2 className="w-3 h-3 text-indigo-300" />
                            <span>{sim.name}</span>
                            <span className="opacity-80">({sim.heightStories}F)</span>
                            {isConflict && <span className="text-rose-300 font-extrabold">🚨 CONFLICT</span>}
                          </div>
                        </div>
                      );
                    })
                  )}

                {/* Feature Tags */}
                {showLabels &&
                  filteredFeatures.map((feat) => (
                    <div
                      key={feat.id}
                      style={{ left: `${feat.center.x}%`, top: `${feat.center.y}%` }}
                      onMouseEnter={() => setHoveredFeature(feat)}
                      onMouseLeave={() => setHoveredFeature(null)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-help z-20 group"
                    >
                      <div className="p-1 rounded-full bg-white/90 border border-slate-200 shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center">
                        {getCategoryIcon(feat.category)}
                      </div>

                      <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] p-2 rounded-lg shadow-xl w-48 text-left z-40 pointer-events-none">
                        <div className="font-bold text-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>{feat.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-300 mt-0.5">{feat.details}</div>
                        <div className="text-[9px] text-emerald-400 mt-1 font-mono">
                          Confidence: {feat.confidence}%
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/80 shadow-md">
        <button
          id="btn-zoom-in"
          onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-out"
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.25))}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="btn-reset-zoom"
          onClick={handleResetView}
          className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1"
          title="Reset Viewport"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        {viewMode === 'split' && (
          <div className="flex items-center gap-2 pl-2 ml-1 border-l border-slate-200">
            <span className="text-[11px] font-semibold text-slate-600">Split:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={splitSliderPos}
              onChange={(e) => setSplitSliderPos(Number(e.target.value))}
              className="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        )}
      </div>

      {/* Active Hover Detail Bar */}
      {hoveredFeature && (
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-50 text-blue-600">
            {getCategoryIcon(hoveredFeature.category)}
          </div>
          <div>
            <span className="font-bold text-slate-900">{hoveredFeature.name}</span>
            <span className="text-slate-500 text-[11px] ml-1.5">({hoveredFeature.category})</span>
          </div>
        </div>
      )}
    </div>
  );
};
