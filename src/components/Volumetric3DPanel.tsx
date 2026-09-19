import React from 'react';
import { 
  Building2, 
  Sun, 
  Compass, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  ArrowRight,
  Eye,
  SlidersHorizontal,
  CloudSun
} from 'lucide-react';
import { CadastralParcel, SimulatedConstruction } from '../types';

interface Volumetric3DPanelProps {
  parcel: CadastralParcel;
  simulations: SimulatedConstruction[];
  sunAzimuth: number;
  sunElevation: number;
  onSunAzimuthChange: (azimuth: number) => void;
  onSunElevationChange: (elevation: number) => void;
  onUpdateStories: (simId: string, stories: number) => void;
}

export const Volumetric3DPanel: React.FC<Volumetric3DPanelProps> = ({
  parcel,
  simulations,
  sunAzimuth,
  sunElevation,
  onSunAzimuthChange,
  onSunElevationChange,
  onUpdateStories,
}) => {
  const activeSim = simulations[0] || null;
  const heightMeters = activeSim ? activeSim.heightStories * 3.8 : 12;
  // Shadow length formula: L = H / tan(elevation)
  const radElevation = (sunElevation * Math.PI) / 180;
  const shadowLengthMeters = heightMeters / Math.tan(Math.max(0.15, radElevation));
  const shadowLengthNormalized = (shadowLengthMeters / 150) * 100; // rough image space conversion

  // Sunlight status
  const timeOfDayLabel = 
    sunElevation < 20 ? 'Late Afternoon / Dusk' :
    sunElevation < 45 ? 'Mid Afternoon' :
    sunElevation < 65 ? 'Noon (High Sun)' : 'Peak Overhead';

  const castsShadowAcrossParcelLine = shadowLengthMeters > 15;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-pulse" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 font-display">
            3D Volumetric & Solar Shadow Simulator
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-50 text-violet-700 font-bold border border-violet-200">
          MICROCLIMATE GIS
        </span>
      </div>

      {/* Sun & Azimuth Visual Dial Controls */}
      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 font-display">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Solar Positioning Engine</span>
          </span>
          <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {timeOfDayLabel}
          </span>
        </div>

        {/* Solar Azimuth Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>Sun Azimuth (Direction: 0° N to 360°):</span>
            <span className="font-bold font-mono text-slate-900">{sunAzimuth}°</span>
          </div>
          <input
            id="slider-sun-azimuth"
            type="range"
            min="45"
            max="315"
            value={sunAzimuth}
            onChange={(e) => onSunAzimuthChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>90° (East Morning)</span>
            <span>180° (South Noon)</span>
            <span>270° (West Evening)</span>
          </div>
        </div>

        {/* Sun Elevation Angle Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>Sun Elevation Angle (Altitude Above Horizon):</span>
            <span className="font-bold font-mono text-slate-900">{sunElevation}°</span>
          </div>
          <input
            id="slider-sun-elevation"
            type="range"
            min="15"
            max="80"
            value={sunElevation}
            onChange={(e) => onSunElevationChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>15° (Long Shadows)</span>
            <span>45° (Midday)</span>
            <span>80° (Minimal Shadow)</span>
          </div>
        </div>
      </div>

      {/* Building Height & Volumetric Extrusions */}
      {activeSim ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 font-display">
              {activeSim.name} — Height Extrusion
            </span>
            <span className="text-xs font-mono font-bold text-violet-600">
              {heightMeters.toFixed(1)}m ({activeSim.heightStories} Stories)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 6, 8].map((stories) => (
              <button
                key={stories}
                id={`btn-stories-${stories}`}
                onClick={() => onUpdateStories(activeSim.id, stories)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  activeSim.heightStories === stories
                    ? 'bg-violet-600 text-white border-violet-700 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {stories}F
              </button>
            ))}
          </div>

          {/* Shadow Impact Metrics Bento */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] block">Calculated Shadow Length</span>
              <span className="font-extrabold text-slate-900 font-mono text-sm">
                {shadowLengthMeters.toFixed(1)} meters
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] block">Neighbor Shadow Spill</span>
              <span className={`font-extrabold text-xs block mt-0.5 ${
                castsShadowAcrossParcelLine ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {castsShadowAcrossParcelLine ? '⚠️ Yes (Crosses Lot Line)' : '✅ Contained on Lot'}
              </span>
            </div>
          </div>

          {/* Environmental Verdict Banner */}
          <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
            castsShadowAcrossParcelLine
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
          }`}>
            <div className="font-bold flex items-center gap-1.5 mb-0.5">
              {castsShadowAcrossParcelLine ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
              <span>
                {castsShadowAcrossParcelLine
                  ? 'Solar Right of Way: Shadow spills onto adjacent lot'
                  : 'Solar Compliant: No shading on neighboring rooftop solar arrays'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              At {sunElevation}° elevation and {sunAzimuth}° azimuth, the simulated {activeSim.heightStories}-story structure casts a {shadowLengthMeters.toFixed(1)}m ray shadow.
            </p>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-slate-400 text-xs">
          Select or simulate a building in the Digital Twin to evaluate 3D sun angle and shadows.
        </div>
      )}
    </div>
  );
};
