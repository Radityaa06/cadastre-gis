import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Scan, 
  Activity, 
  Wifi, 
  ShieldCheck, 
  Maximize2, 
  RefreshCw, 
  Play, 
  Pause, 
  FileDown, 
  Trash2,
  CheckCircle2,
  Zap,
  Layers,
  Sparkles
} from 'lucide-react';
import { CadastralParcel } from '../types';

interface LiveCadastralScannerSectionProps {
  parcels: CadastralParcel[];
  isScanning: boolean;
  scanProgress: number;
  onTriggerScan: () => void;
  onClearMap?: () => void;
  onSelectParcel: (parcel: CadastralParcel) => void;
}

interface ScanLogEvent {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning';
  message: string;
}

export const LiveCadastralScannerSection: React.FC<LiveCadastralScannerSectionProps> = ({
  parcels,
  isScanning,
  scanProgress,
  onTriggerScan,
  onClearMap,
  onSelectParcel,
}) => {
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [scanResolution, setScanResolution] = useState<'ultra' | 'standard' | 'regional'>('ultra');
  const [lidarDensity, setLidarDensity] = useState(2840);
  const [satelliteCount, setSatelliteCount] = useState(14);
  const [rtkAccuracy, setRtkAccuracy] = useState('±1.4 cm');
  const [spectralIndex, setSpectralIndex] = useState(0.74);
  const [logs, setLogs] = useState<ScanLogEvent[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'GNSS RTK receiver initialized. Multi-frequency L1/L2/L5 carrier-phase locked.',
    },
    {
      id: 'log-2',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'Aerial LiDAR sensor ready: Pulse frequency 450 kHz @ 120m survey altitude.',
    },
    {
      id: 'log-3',
      timestamp: new Date().toLocaleTimeString(),
      level: 'success',
      message: 'Spectral edge detector calibrated with cadastral survey deed overlay.',
    },
  ]);

  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Live telemetry subtle fluctuations for realistic live feel
  useEffect(() => {
    const interval = setInterval(() => {
      setLidarDensity((prev) => Math.min(3200, Math.max(2600, prev + Math.floor((Math.random() - 0.48) * 40))));
      setSatelliteCount((prev) => Math.min(18, Math.max(12, prev + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0))));
      setSpectralIndex((prev) => parseFloat((Math.min(0.85, Math.max(0.65, prev + (Math.random() - 0.5) * 0.02))).toFixed(2)));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Continuous Scan Loop
  useEffect(() => {
    if (!isContinuousMode) return;
    const interval = setInterval(() => {
      const newLog: ScanLogEvent = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: Math.random() > 0.3 ? 'info' : 'success',
        message: [
          `LiDAR sweep sweep completed. Returned ${lidarDensity} pts/m² with 99.2% surface penetration.`,
          `Compound boundary fence vector confirmed via multispectral edge filter (NDVI: ${spectralIndex}).`,
          `RTK Differential fix verified (accuracy: ${rtkAccuracy}, PDOP: 1.1).`,
          `Cadastral parcel bounding nodes aligned with district deed registry.`,
        ][Math.floor(Math.random() * 4)],
      };
      setLogs((prev) => [...prev.slice(-25), newLog]);
    }, 3800);
    return () => clearInterval(interval);
  }, [isContinuousMode, lidarDensity, spectralIndex, rtkAccuracy]);

  // Append logs when external scan starts
  useEffect(() => {
    if (isScanning) {
      const newLog: ScanLogEvent = {
        id: `scan-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        message: `High-resolution aerial scan executing... Delineating compound walls, fences, and Khasra boundaries.`,
      };
      setLogs((prev) => [...prev.slice(-25), newLog]);
    }
  }, [isScanning]);

  // Append log when parcels change
  useEffect(() => {
    if (parcels.length > 0) {
      const newLog: ScanLogEvent = {
        id: `pcount-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'success',
        message: `Live Cadastral Telemetry: ${parcels.length} contiguous parcel packets indexed and verified on map.`,
      };
      setLogs((prev) => [...prev.slice(-25), newLog]);
    }
  }, [parcels.length]);

  // Export Scan Telemetry as GeoJSON
  const handleExportGeoJson = () => {
    const geoJson = {
      type: 'FeatureCollection',
      metadata: {
        scanner: 'DharNav AI Aerial Cadastre LiDAR',
        timestamp: new Date().toISOString(),
        rtkAccuracy,
        satellites: satelliteCount,
        lidarDensity,
        parcelsCount: parcels.length,
      },
      features: parcels.map((p) => ({
        type: 'Feature',
        properties: {
          pin: p.pin,
          code: p.code,
          zoning: p.zoning,
          acres: p.acres,
          sqft: p.sqft,
          confidence: p.confidence,
          khasraNumber: p.deedRecord?.khasraPattaNumber || null,
          owner: p.deedRecord?.registeredOwner || null,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            (p.latLngPoints || []).map((pt) => [pt.lng, pt.lat]),
          ],
        },
      })),
    };

    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dharnav-cadastral-scan-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Live Scanner Header */}
      <div className="p-4 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase tracking-wider font-display text-white">
                Live Aerial Cadastral Scanner
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold tracking-wide">
                LIVE TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous LiDAR point cloud, RTK GNSS triangulation, & multispectral boundary extraction
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Continuous Scan Toggle */}
          <button
            id="btn-toggle-continuous-scan"
            onClick={() => setIsContinuousMode(!isContinuousMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              isContinuousMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {isContinuousMode ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isContinuousMode ? 'Continuous: ON' : 'Continuous: OFF'}</span>
          </button>

          {/* Trigger Scan Sweep Now */}
          <button
            id="btn-trigger-instant-sweep"
            onClick={onTriggerScan}
            disabled={isScanning}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Scan className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Sweep Viewport'}</span>
          </button>

          {/* Export GeoJSON */}
          <button
            onClick={handleExportGeoJson}
            disabled={parcels.length === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            title="Download GeoJSON boundary telemetry"
          >
            <FileDown className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Export GeoJSON</span>
          </button>
        </div>
      </div>

      {/* Main Live Telemetry Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Radar Graphic & Live Sensor Metrics (5 Cols) */}
        <div className="md:col-span-5 bg-slate-900 rounded-2xl p-4 text-white border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-indigo-400" />
              <span>Real-Time Radar Display</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>450 kHz LiDAR</span>
            </span>
          </div>

          {/* Visual Radar Scope Container */}
          <div className="relative w-full aspect-square max-w-[240px] mx-auto rounded-full bg-slate-950 border-2 border-indigo-500/30 overflow-hidden flex items-center justify-center shadow-inner">
            {/* Concentric distance rings */}
            <div className="absolute w-[80%] h-[80%] rounded-full border border-indigo-500/20" />
            <div className="absolute w-[55%] h-[55%] rounded-full border border-indigo-500/20" />
            <div className="absolute w-[30%] h-[30%] rounded-full border border-indigo-500/20" />

            {/* Radar Crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-indigo-500/20" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-full w-px bg-indigo-500/20" />
            </div>

            {/* Animated Rotating Radar Beam */}
            <div 
              className="absolute inset-0 origin-center pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(99, 102, 241, 0.4) 360deg)',
                animation: 'spin 3s linear infinite',
              }}
            />

            {/* Simulated Detected Parcel Corner Blips on Radar */}
            {parcels.slice(0, 4).map((p, i) => {
              const angles = [45, 135, 220, 310];
              const dists = [38, 55, 68, 48];
              const angleRad = (angles[i] * Math.PI) / 180;
              const x = 50 + Math.cos(angleRad) * (dists[i] / 2);
              const y = 50 + Math.sin(angleRad) * (dists[i] / 2);
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectParcel(p)}
                  className="absolute cursor-pointer group"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                  title={`${p.code}: ${p.acres} acres`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 border border-white shadow-xs group-hover:scale-150 transition-transform animate-pulse" />
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-indigo-300 font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.code}
                  </span>
                </div>
              );
            })}

            {/* Center GNSS Receiver Dot */}
            <div className="relative z-10 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-md" />

            {/* Radar Scope Legend */}
            <div className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-500">
              R: 250m
            </div>
          </div>

          {/* Quick Resolution Selector */}
          <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-800 text-[10px]">
            <span className="text-slate-400">Resolution:</span>
            <div className="flex items-center gap-1">
              {(['ultra', 'standard', 'regional'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setScanResolution(mode)}
                  className={`px-2 py-0.5 rounded-md font-semibold capitalize transition-all ${
                    scanResolution === mode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {mode === 'ultra' ? '0.5m GSD' : mode === 'standard' ? '1.0m GSD' : '2.5m GSD'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Metrics Cards & Activity Stream (7 Cols) */}
        <div className="md:col-span-7 space-y-4">
          {/* 4 Sensor Telemetry Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Tile 1: Point Cloud */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase">LiDAR Density</span>
                <Sparkles className="w-3 h-3 text-indigo-500" />
              </div>
              <div className="text-sm font-black font-mono text-slate-900">
                {lidarDensity.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">pts / m²</div>
            </div>

            {/* Tile 2: RTK Accuracy */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase">RTK Accuracy</span>
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
              </div>
              <div className="text-sm font-black font-mono text-emerald-700">
                {rtkAccuracy}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Carrier-Phase Fixed</div>
            </div>

            {/* Tile 3: Satellite Constellation */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase">Satellites</span>
                <Wifi className="w-3 h-3 text-indigo-500" />
              </div>
              <div className="text-sm font-black font-mono text-slate-900">
                {satelliteCount} Locked
              </div>
              <div className="text-[10px] text-slate-500 font-medium">GPS + Galileo</div>
            </div>

            {/* Tile 4: Spectral NDVI */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase">NDVI Edge Index</span>
                <Layers className="w-3 h-3 text-indigo-500" />
              </div>
              <div className="text-sm font-black font-mono text-slate-900">
                {spectralIndex}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Wall/Fence Edge</div>
            </div>
          </div>

          {/* Active Packets Summary Bar */}
          <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="font-bold text-indigo-950">
                {parcels.length} Cadastral Packets Delineated in Viewport
              </span>
              <span className="text-indigo-700 font-mono">
                ({parcels.reduce((sum, p) => sum + p.acres, 0).toFixed(2)} Total Acres)
              </span>
            </div>

            {onClearMap && (
              <button
                onClick={onClearMap}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 transition-colors"
                title="Reset scanner and clear map"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Scanner</span>
              </button>
            )}
          </div>

          {/* Live Scanning Activity Terminal */}
          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[10px]">
              <span className="font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Live Telemetry Event Log</span>
              </span>
              <span className="text-slate-500 font-mono">Auto-scrolling</span>
            </div>

            <div 
              ref={logContainerRef}
              className="font-mono text-[11px] text-slate-300 space-y-1.5 max-h-36 overflow-y-auto pr-1"
            >
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-500 shrink-0 text-[10px]">[{log.timestamp}]</span>
                  <span className={
                    log.level === 'success' 
                      ? 'text-emerald-400 font-semibold' 
                      : log.level === 'warning' 
                      ? 'text-amber-400' 
                      : 'text-slate-300'
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
