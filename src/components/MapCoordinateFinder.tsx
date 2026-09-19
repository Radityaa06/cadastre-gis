import React, { useState, useEffect } from 'react';
import { 
  Crosshair, 
  MapPin, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ArrowRight, 
  Compass, 
  Maximize2,
  Trash2,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft
} from 'lucide-react';
import { CadastralParcel } from '../types';

interface MapCoordinateFinderProps {
  parcels: CadastralParcel[];
  selectedParcel: CadastralParcel | null;
  onSelectParcel: (parcel: CadastralParcel | null) => void;
  onPanToCoordinate: (coords: { lat: number; lng: number }, zoom?: number) => void;
  onDropPinAtCoordinate?: (coords: { lat: number; lng: number }, label?: string) => void;
  isPickModeActive: boolean;
  onTogglePickMode: () => void;
  livePickedCoords: { lat: number; lng: number } | null;
  onClearPickedCoords: () => void;
  onTriggerScanAtCoords?: (coords: { lat: number; lng: number }) => void;
}

// Haversine distance in meters
function computeHaversine(c1: { lat: number; lng: number }, c2: { lat: number; lng: number }): number {
  const R = 6378137;
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Ray-casting point in polygon algorithm
function isPointInPolygon(point: { lat: number; lng: number }, vs: { lat: number; lng: number }[]): boolean {
  if (vs.length < 3) return false;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].lng, yi = vs[i].lat;
    const xj = vs[j].lng, yj = vs[j].lat;
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Convert decimal degrees to DMS format for cadastral precision
function toDMS(deg: number, isLat: boolean): string {
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);
  const direction = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

export const MapCoordinateFinder: React.FC<MapCoordinateFinderProps> = ({
  parcels,
  selectedParcel,
  onSelectParcel,
  onPanToCoordinate,
  onDropPinAtCoordinate,
  isPickModeActive,
  onTogglePickMode,
  livePickedCoords,
  onClearPickedCoords,
  onTriggerScanAtCoords,
}) => {
  const [latInput, setLatInput] = useState('37.7758');
  const [lngInput, setLngInput] = useState('-122.4205');
  const [combinedInput, setCombinedInput] = useState('37.7758, -122.4205');
  const [matchedParcel, setMatchedParcel] = useState<CadastralParcel | null>(null);
  const [closestParcelInfo, setClosestParcelInfo] = useState<{
    parcel: CadastralParcel;
    distanceMeters: number;
  } | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [nudgeMeters, setNudgeMeters] = useState<number>(5);
  const [lastMovedDir, setLastMovedDir] = useState<string | null>(null);

  // Micro-nudge coordinate by meters in cardinal directions
  const handleNudgeCoordinate = (direction: 'N' | 'S' | 'E' | 'W') => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || isNaN(lng)) return;

    const deltaLat = nudgeMeters / 111139;
    const cosLat = Math.cos((lat * Math.PI) / 180);
    const deltaLng = nudgeMeters / (111139 * (Math.abs(cosLat) > 0.0001 ? cosLat : 1));

    let newLat = lat;
    let newLng = lng;
    if (direction === 'N') newLat += deltaLat;
    if (direction === 'S') newLat -= deltaLat;
    if (direction === 'E') newLng += deltaLng;
    if (direction === 'W') newLng -= deltaLng;

    const latStr = newLat.toFixed(6);
    const lngStr = newLng.toFixed(6);
    setLatInput(latStr);
    setLngInput(lngStr);
    setCombinedInput(`${latStr}, ${lngStr}`);
    setLastMovedDir(direction);
    setTimeout(() => setLastMovedDir(null), 1200);

    performFindParcel(newLat, newLng);
  };

  // Sync when live picked coordinates arrive from map click
  useEffect(() => {
    if (livePickedCoords) {
      const latStr = livePickedCoords.lat.toFixed(6);
      const lngStr = livePickedCoords.lng.toFixed(6);
      setLatInput(latStr);
      setLngInput(lngStr);
      setCombinedInput(`${latStr}, ${lngStr}`);
      performFindParcel(livePickedCoords.lat, livePickedCoords.lng);
    }
  }, [livePickedCoords]);

  // Synchronize when selectedParcel changes externally
  useEffect(() => {
    if (selectedParcel && selectedParcel.latLngPoints && selectedParcel.latLngPoints.length > 0) {
      // Calculate centroid of selected parcel
      const pts = selectedParcel.latLngPoints;
      const cLat = pts.reduce((sum, p) => sum + p.lat, 0) / pts.length;
      const cLng = pts.reduce((sum, p) => sum + p.lng, 0) / pts.length;
      setLatInput(cLat.toFixed(6));
      setLngInput(cLng.toFixed(6));
      setCombinedInput(`${cLat.toFixed(6)}, ${cLng.toFixed(6)}`);
      setMatchedParcel(selectedParcel);
      setClosestParcelInfo(null);
      setHasSearched(true);
    }
  }, [selectedParcel?.id]);

  // Handle combined paste or input change
  const handleCombinedChange = (val: string) => {
    setCombinedInput(val);
    setValidationError(null);
    if (val.includes(',')) {
      const parts = val.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          setLatInput(lat.toString());
          setLngInput(lng.toString());
        }
      }
    }
  };

  // Perform search & boundary containment check
  const performFindParcel = (lat: number, lng: number) => {
    setValidationError(null);
    setHasSearched(true);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setValidationError('Invalid coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180.');
      return;
    }

    const target = { lat, lng };

    // Check if point falls inside any parcel polygon
    let foundInside: CadastralParcel | null = null;
    for (const p of parcels) {
      if (p.latLngPoints && p.latLngPoints.length >= 3) {
        if (isPointInPolygon(target, p.latLngPoints)) {
          foundInside = p;
          break;
        }
      }
    }

    if (foundInside) {
      setMatchedParcel(foundInside);
      setClosestParcelInfo(null);
      onSelectParcel(foundInside);
      onPanToCoordinate(target, 18);
      if (onDropPinAtCoordinate) {
        onDropPinAtCoordinate(target, `Inside ${foundInside.code}`);
      }
    } else {
      // Find closest parcel
      setMatchedParcel(null);
      let closest: CadastralParcel | null = null;
      let minDistance = Infinity;

      for (const p of parcels) {
        if (p.latLngPoints && p.latLngPoints.length > 0) {
          // Check distance to all boundary vertices and centroid
          const cLat = p.latLngPoints.reduce((sum, pt) => sum + pt.lat, 0) / p.latLngPoints.length;
          const cLng = p.latLngPoints.reduce((sum, pt) => sum + pt.lng, 0) / p.latLngPoints.length;
          const dCentroid = computeHaversine(target, { lat: cLat, lng: cLng });

          let dMinVertex = dCentroid;
          for (const v of p.latLngPoints) {
            const dv = computeHaversine(target, v);
            if (dv < dMinVertex) dMinVertex = dv;
          }

          if (dMinVertex < minDistance) {
            minDistance = dMinVertex;
            closest = p;
          }
        }
      }

      if (closest && minDistance !== Infinity) {
        setClosestParcelInfo({
          parcel: closest,
          distanceMeters: Math.round(minDistance * 10) / 10,
        });
      } else {
        setClosestParcelInfo(null);
      }

      onPanToCoordinate(target, 17);
      if (onDropPinAtCoordinate) {
        onDropPinAtCoordinate(target, `Survey Target (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      }
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    performFindParcel(lat, lng);
  };

  const handleCopy = () => {
    const text = `${latInput}, ${lngInput}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const curLat = parseFloat(latInput);
  const curLng = parseFloat(lngInput);
  const isValidCoords = !isNaN(curLat) && !isNaN(curLng);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
      {/* Header */}
      <div className="p-3 sm:px-4 sm:py-3 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Crosshair className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 tracking-tight font-display">
                Coordinate Selector &amp; Parcel Locator
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold tracking-wide">
                RTK Sub-cm
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Sample GPS coordinates or inspect cadastral boundary polygons
            </p>
          </div>
        </div>

        {/* Action buttons on header */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-toggle-map-pick-coords"
            type="button"
            onClick={onTogglePickMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              isPickModeActive
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs animate-pulse ring-2 ring-amber-400/30'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isPickModeActive ? 'Click Map to Pick' : 'Pick on Map'}</span>
          </button>

          {livePickedCoords && (
            <button
              type="button"
              onClick={onClearPickedCoords}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
              title="Clear picked coordinates"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        {/* Form Inputs: Unified Command Search Row */}
        <form onSubmit={handleSearchSubmit} className="space-y-2.5">
          <div className="bg-slate-50/90 p-2 rounded-xl border border-slate-200/90 flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Input Segment: Lat & Lng */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[260px]">
              <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-lg border border-slate-200 flex-1 shadow-2xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">LAT</span>
                <input
                  type="text"
                  value={latInput}
                  onChange={(e) => {
                    setLatInput(e.target.value);
                    setCombinedInput(`${e.target.value}, ${lngInput}`);
                  }}
                  placeholder="37.7758"
                  className="w-full text-xs font-mono font-bold text-slate-800 focus:outline-hidden bg-transparent"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-lg border border-slate-200 flex-1 shadow-2xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">LNG</span>
                <input
                  type="text"
                  value={lngInput}
                  onChange={(e) => {
                    setLngInput(e.target.value);
                    setCombinedInput(`${latInput}, ${e.target.value}`);
                  }}
                  placeholder="-122.4205"
                  className="w-full text-xs font-mono font-bold text-slate-800 focus:outline-hidden bg-transparent"
                />
              </div>
            </div>

            {/* Actions: Copy & Find */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Copy GPS coordinates"
              >
                {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedCoords ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                id="btn-execute-find-parcel"
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:scale-102 active:scale-98"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find Parcel</span>
              </button>
            </div>
          </div>

          {/* Validation error */}
          {validationError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </form>

        {/* Quick Targets Strip */}
        <div className="flex items-center flex-wrap gap-1.5 pt-1 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Quick Targets:
          </span>
          {parcels.slice(0, 5).map((p) => {
            const pts = p.latLngPoints || [];
            if (pts.length === 0) return null;
            const cLat = pts.reduce((sum, pt) => sum + pt.lat, 0) / pts.length;
            const cLng = pts.reduce((sum, pt) => sum + pt.lng, 0) / pts.length;
            const isSelected = selectedParcel?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setLatInput(cLat.toFixed(6));
                  setLngInput(cLng.toFixed(6));
                  setCombinedInput(`${cLat.toFixed(6)}, ${cLng.toFixed(6)}`);
                  performFindParcel(cLat, cLng);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {p.code} <span className="opacity-75">({p.acres}ac)</span>
              </button>
            );
          })}
        </div>

        {/* Sleek Precision Nudge Dock */}
        {isValidCoords && (
          <div className="p-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-amber-500" />
                <span>Micro-Nudge:</span>
              </span>
              
              {/* Directional D-Pad */}
              <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs gap-0.5">
                <button
                  type="button"
                  onClick={() => handleNudgeCoordinate('N')}
                  className="px-2 py-1 hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold"
                  title={`Nudge North +${nudgeMeters}m`}
                >
                  <ArrowUp className="w-3 h-3 text-amber-600" />
                  <span>N</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeCoordinate('S')}
                  className="px-2 py-1 hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold"
                  title={`Nudge South -${nudgeMeters}m`}
                >
                  <ArrowDown className="w-3 h-3 text-amber-600" />
                  <span>S</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeCoordinate('W')}
                  className="px-2 py-1 hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold"
                  title={`Nudge West -${nudgeMeters}m`}
                >
                  <ArrowLeft className="w-3 h-3 text-amber-600" />
                  <span>W</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeCoordinate('E')}
                  className="px-2 py-1 hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold"
                  title={`Nudge East +${nudgeMeters}m`}
                >
                  <ArrowRight className="w-3 h-3 text-amber-600" />
                  <span>E</span>
                </button>
              </div>

              {/* Step Distance Selector */}
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-slate-400 font-semibold">Step:</span>
                {[1, 5, 10, 25].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setNudgeMeters(step)}
                    className={`px-1.5 py-0.5 rounded-md font-mono font-bold transition-all ${
                      nudgeMeters === step
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {step}m
                  </button>
                ))}
              </div>

              {lastMovedDir && (
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-mono font-bold animate-pulse">
                  Nudged {lastMovedDir} ({nudgeMeters}m)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 hidden lg:inline">
                {toDMS(curLat, true)}, {toDMS(curLng, false)}
              </span>

              <button
                type="button"
                onClick={() => {
                  onPanToCoordinate({ lat: curLat, lng: curLng }, 19);
                  if (onDropPinAtCoordinate) {
                    onDropPinAtCoordinate({ lat: curLat, lng: curLng }, `Active Coordinate (${curLat.toFixed(5)}, ${curLng.toFixed(5)})`);
                  }
                }}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Crosshair className="w-3 h-3 text-indigo-600" />
                <span>Center Pin</span>
              </button>
            </div>
          </div>
        )}

        {/* Search Results Display */}
        {hasSearched && (
          <div className="mt-2 animate-in fade-in duration-150">
            {matchedParcel ? (
              /* DIRECT HIT: Coordinate falls inside parcel boundary */
              <div className="p-3.5 bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Exact Cadastral Match Located!</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-extrabold">
                    Inside Boundary
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-indigo-600 font-bold">
                        {matchedParcel.pin}
                      </span>
                      <span className="font-black text-slate-900 font-display text-sm">
                        {matchedParcel.code}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {matchedParcel.zoning}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {matchedParcel.deedRecord?.khasraPattaNumber && (
                        <span className="font-semibold text-slate-800 mr-2">
                          {matchedParcel.deedRecord.khasraPattaNumber}
                        </span>
                      )}
                      Owner: {matchedParcel.deedRecord?.registeredOwner || 'Registered Titleholder'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{matchedParcel.acres} Acres</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {matchedParcel.confidence.toFixed(1)}% Confidence
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectParcel(matchedParcel);
                        if (matchedParcel.latLngPoints && matchedParcel.latLngPoints.length > 0) {
                          const pts = matchedParcel.latLngPoints;
                          const cLat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
                          const cLng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
                          onPanToCoordinate({ lat: cLat, lng: cLng }, 18);
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Frame Parcel</span>
                    </button>
                  </div>
                </div>

                {isValidCoords && (
                  <div className="flex items-center justify-between text-[10px] text-emerald-800 font-mono">
                    <span>Geodesic DMS: {toDMS(curLat, true)}, {toDMS(curLng, false)}</span>
                    <span className="font-bold text-emerald-700">WGS84 High Precision</span>
                  </div>
                )}
              </div>
            ) : (
              /* NO DIRECT HIT: Show distance to closest parcel */
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                    <Compass className="w-4 h-4 text-indigo-500" />
                    <span>Point Outside Active Parcels</span>
                  </div>
                  {closestParcelInfo && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                      {closestParcelInfo.distanceMeters}m to nearest
                    </span>
                  )}
                </div>

                {closestParcelInfo ? (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500">Closest boundary:</span>{' '}
                      <strong className="text-slate-900">{closestParcelInfo.parcel.code}</strong>{' '}
                      <span className="text-slate-500 font-mono">({closestParcelInfo.distanceMeters}m offset)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectParcel(closestParcelInfo.parcel);
                          if (closestParcelInfo.parcel.latLngPoints && closestParcelInfo.parcel.latLngPoints.length > 0) {
                            const pts = closestParcelInfo.parcel.latLngPoints;
                            const cLat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
                            const cLng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
                            onPanToCoordinate({ lat: cLat, lng: cLng }, 18);
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <span>Select {closestParcelInfo.parcel.code}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      {onTriggerScanAtCoords && (
                        <button
                          type="button"
                          onClick={() => onTriggerScanAtCoords({ lat: curLat, lng: curLng })}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200"
                        >
                          Scan This Location
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">
                    No parcels scanned nearby. Click &quot;Scan Area for Packets&quot; or manual draw to delineate.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
