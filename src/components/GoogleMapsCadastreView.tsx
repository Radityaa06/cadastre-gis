import React, { useEffect, useRef, useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Layers, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  Sparkles,
  Plane,
  Building2,
  Repeat,
  Crosshair,
  Scan,
  PenTool,
  Check,
  X,
  Undo2,
  Maximize2,
  Trash2,
  Edit3,
  Save,
  FileText,
  ShieldAlert,
  Copy,
  CheckCircle2,
  Map as MapIcon,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  Info,
  Radio,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus
} from 'lucide-react';
import { loadGoogleMapsScript } from '../services/googleMapsLoader';
import { CadastralParcel, IdentifiedFeature } from '../types';
import { MapCoordinateFinder } from './MapCoordinateFinder';


interface GoogleMapsCadastreViewProps {
  parcels: CadastralParcel[];
  selectedParcel: CadastralParcel | null;
  onSelectParcel: (parcel: CadastralParcel | null) => void;
  onUpdateParcels?: (parcels: CadastralParcel[]) => void;
  onInspectInDroneView?: (parcel: CadastralParcel) => void;
  onSimulateInDigitalTwin?: (parcel: CadastralParcel) => void;
  onClearMap?: () => void;
  filteredParcelIds?: string[] | null;
  highlightedParcelIds?: string[];
  onResetFilter?: () => void;
}

// Ray-casting point in polygon algorithm
function isPointInPolygon(point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    const intersect =
      yi > point.lng !== yj > point.lng &&
      point.lat < ((xj - xi) * (point.lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Geodesic polygon area in square meters
function computeSphericalArea(coords: { lat: number; lng: number }[]): number {
  if (coords.length < 3) return 0;
  const rad = Math.PI / 180;
  const R = 6378137; // Earth radius in meters
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    area += (p2.lng - p1.lng) * rad * (2 + Math.sin(p1.lat * rad) + Math.sin(p2.lat * rad));
  }
  area = Math.abs(area * (R * R) / 2);
  return area;
}

// Haversine distance between two coordinates in meters
function computeHaversineDistance(c1: { lat: number; lng: number }, c2: { lat: number; lng: number }): number {
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

export const GoogleMapsCadastreView: React.FC<GoogleMapsCadastreViewProps> = ({
  parcels,
  selectedParcel,
  onSelectParcel,
  onUpdateParcels,
  onInspectInDroneView,
  onSimulateInDigitalTwin,
  onClearMap,
  filteredParcelIds,
  highlightedParcelIds,
  onResetFilter,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const parcelPolygonsRef = useRef<google.maps.Polygon[]>([]);
  const labelMarkersRef = useRef<google.maps.Marker[]>([]);
  const cornerMarkersRef = useRef<google.maps.Marker[]>([]);
  const manualMarkersRef = useRef<google.maps.Marker[]>([]);
  const manualPolylineRef = useRef<google.maps.Polyline | null>(null);
  const searchBeaconMarkerRef = useRef<google.maps.Marker | null>(null);

  // States
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'fetching' | 'success' | 'error' | 'permission_denied'>('fetching');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'hybrid' | 'satellite' | 'roadmap' | 'terrain'>('hybrid');
  const [isLocating, setIsLocating] = useState(false);
  
  // Coordinate Selection & Map Pin-Drop
  const [isPickModeActive, setIsPickModeActive] = useState(false);
  const [livePickedCoords, setLivePickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showCoordinateFinder, setShowCoordinateFinder] = useState(true);

  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanNotification, setScanNotification] = useState<string | null>(null);

  // Manual Boundary Drawing Mode
  const [isManualDrawMode, setIsManualDrawMode] = useState(false);
  const [manualPoints, setManualPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [isSealModalOpen, setIsSealModalOpen] = useState(false);
  const [newPacketName, setNewPacketName] = useState('PACKET-M01');
  const [newKhasraNo, setNewKhasraNo] = useState('Khasra #240/M');
  const [newOwnerName, setNewOwnerName] = useState('District Surveyor Parcel');
  const [newZoning, setNewZoning] = useState('Commercial Logistics');

  // Vertex Dragging / Editing Mode
  const [isEditingVertices, setIsEditingVertices] = useState(false);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(null);
  const [editingVertexCoords, setEditingVertexCoords] = useState<{ lat: string; lng: string } | null>(null);
  const [vertexNudgeMeters, setVertexNudgeMeters] = useState<number>(5);
  const [liveMovingCoordinate, setLiveMovingCoordinate] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [liveMovingVertex, setLiveMovingVertex] = useState<{ index: number; lat: number; lng: number } | null>(null);
  const [coordinateMovedToast, setCoordinateMovedToast] = useState<{ lat: number; lng: number; info: string } | null>(null);
  const [copiedCoordinates, setCopiedCoordinates] = useState(false);

  // Toggles for Overlays
  const [showPacketLabels, setShowPacketLabels] = useState(true);
  const [showCornerMonuments, setShowCornerMonuments] = useState(true);

  // Fetch live location
  const fetchLiveLocation = () => {
    setIsLocating(true);
    setLocationStatus('fetching');
    setErrorMessage(null);

    if (!navigator.geolocation) {
      setLocationStatus('error');
      setErrorMessage('Geolocation API is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLiveLocation(coords);
        setLocationStatus('success');
        setIsLocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(coords);
          mapInstanceRef.current.setZoom(17);

          if (userMarkerRef.current) {
            userMarkerRef.current.setPosition(coords);
          } else if ((window as any).google?.maps) {
            userMarkerRef.current = new google.maps.Marker({
              position: coords,
              map: mapInstanceRef.current,
              title: 'Your Live Geospatial Location',
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#4f46e5',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
              },
            });
          }
        }
      },
      (err) => {
        console.warn('Geolocation notice:', err);
        setIsLocating(false);
        const defaultCoords = { lat: 37.7749, lng: -122.4194 };
        setLiveLocation(defaultCoords);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(defaultCoords);
          mapInstanceRef.current.setZoom(16);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    fetchLiveLocation();
  }, []);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    loadGoogleMapsScript()
      .then((google) => {
        if (!isMounted || !mapContainerRef.current) return;

        const initialCenter = liveLocation || { lat: 37.7749, lng: -122.4194 };

        const map = new google.maps.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 16,
          mapTypeId: mapType,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;

        // User Marker
        if (liveLocation) {
          userMarkerRef.current = new google.maps.Marker({
            position: liveLocation,
            map: map,
            title: 'Your Live Location (GPS)',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4f46e5',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
          });
        }

        // Map Click Listener for Manual Drawing & Coordinate Picking Mode
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const clickedCoord = { lat: e.latLng.lat(), lng: e.latLng.lng() };

          // If pick coordinate mode is active
          if ((window as any).__DHARNAV_PICK_COORDINATE__) {
            setLivePickedCoords(clickedCoord);
            dropPinAtCoordinate(clickedCoord, `Sampled Coordinate (${clickedCoord.lat.toFixed(5)}, ${clickedCoord.lng.toFixed(5)})`);
            return;
          }

          // We use window or ref check because state closures can be stale
          setManualPoints((prev) => {
            const isDrawing = (window as any).__DHARNAV_MANUAL_DRAWING__;
            if (!isDrawing) return prev;
            return [...prev, clickedCoord];
          });
        });

        // Track cursor coordinates for live hover readout
        map.addListener('mousemove', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            setHoverCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }
        });

        renderAllCadastralParcels(google, map);
      })
      .catch((err) => {
        console.warn('Google Maps loader warning:', err);
      });

    return () => {
      isMounted = false;
      cleanupOverlays();
    };
  }, []);

  // Drop interactive beacon pin on searched or sampled coordinate with live drag support
  const dropPinAtCoordinate = (coords: { lat: number; lng: number }, label?: string) => {
    const google = (window as any).google;
    if (!google?.maps || !mapInstanceRef.current) return;

    if (searchBeaconMarkerRef.current) {
      searchBeaconMarkerRef.current.setMap(null);
      searchBeaconMarkerRef.current = null;
    }

    const marker = new google.maps.Marker({
      position: coords,
      map: mapInstanceRef.current,
      title: label || `Target: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)} (Drag on map to move)`,
      animation: google.maps.Animation.DROP,
      draggable: true,
      cursor: 'move',
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 7,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="padding: 8px; font-size: 11px; font-family: sans-serif; color: #1e293b; max-width: 220px;">
        <strong style="color: #0f172a;">${label || 'Selected Coordinate'}</strong><br/>
        <span style="font-family: monospace; color: #4f46e5; font-weight: 700;">${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}</span><br/>
        <span style="font-size: 10px; color: #d97706; font-weight: 600;">💡 Drag pin to move coordinate anywhere</span>
      </div>`,
    });

    marker.addListener('dragstart', () => {
      infoWindow.close();
      setLiveMovingCoordinate({
        lat: coords.lat,
        lng: coords.lng,
        label: 'Moving coordinate pin...',
      });
    });

    marker.addListener('drag', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const cur = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setLivePickedCoords(cur);
      setLiveMovingCoordinate({
        lat: cur.lat,
        lng: cur.lng,
        label: 'Moving coordinate pin on live map...',
      });
    });

    marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const newCoords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setLivePickedCoords(newCoords);
      setLiveMovingCoordinate(null);

      // Check boundary containment in all known parcels
      let insideParcel: CadastralParcel | null = null;
      for (const p of parcels) {
        if (p.latLngPoints && p.latLngPoints.length >= 3) {
          if (isPointInPolygon(newCoords, p.latLngPoints)) {
            insideParcel = p;
            onSelectParcel(p);
            break;
          }
        }
      }

      const updatedTitle = insideParcel 
        ? `Inside ${insideParcel.code} (${insideParcel.acres} ac)` 
        : `Repositioned Coordinate`;

      infoWindow.setContent(`<div style="padding: 8px; font-size: 11px; font-family: sans-serif; color: #1e293b; max-width: 240px;">
        <div style="font-weight: bold; color: ${insideParcel ? '#15803d' : '#0f172a'};">${updatedTitle}</div>
        <div style="font-family: monospace; color: #4f46e5; font-weight: 700; margin-top: 2px;">
          ${newCoords.lat.toFixed(6)}, ${newCoords.lng.toFixed(6)}
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
          ✓ Coordinate moved on terrain. Drag again to adjust.
        </div>
      </div>`);
      infoWindow.open(mapInstanceRef.current, marker);

      setCoordinateMovedToast({
        lat: newCoords.lat,
        lng: newCoords.lng,
        info: insideParcel ? `Repositioned inside ${insideParcel.code}` : 'Target coordinate moved on terrain',
      });
      setTimeout(() => setCoordinateMovedToast(null), 4000);
    });

    infoWindow.open(mapInstanceRef.current, marker);
    searchBeaconMarkerRef.current = marker;
  };

  const handlePanToCoordinate = (coords: { lat: number; lng: number }, zoom = 18) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo(coords);
    mapInstanceRef.current.setZoom(zoom);
  };

  // Sync window global flag for manual draw & pick coordinate click handlers
  useEffect(() => {
    (window as any).__DHARNAV_MANUAL_DRAWING__ = isManualDrawMode;
    (window as any).__DHARNAV_PICK_COORDINATE__ = isPickModeActive;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({
        draggableCursor: isManualDrawMode || isPickModeActive ? 'crosshair' : null,
      });
    }
  }, [isManualDrawMode, isPickModeActive]);

  // Update map type
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  // Cleanup helper
  const cleanupOverlays = () => {
    parcelPolygonsRef.current.forEach((poly) => poly.setMap(null));
    parcelPolygonsRef.current = [];
    labelMarkersRef.current.forEach((m) => m.setMap(null));
    labelMarkersRef.current = [];
    cornerMarkersRef.current.forEach((m) => m.setMap(null));
    cornerMarkersRef.current = [];
    manualMarkersRef.current.forEach((m) => m.setMap(null));
    manualMarkersRef.current = [];
    if (manualPolylineRef.current) {
      manualPolylineRef.current.setMap(null);
      manualPolylineRef.current = null;
    }
    if (searchBeaconMarkerRef.current) {
      searchBeaconMarkerRef.current.setMap(null);
      searchBeaconMarkerRef.current = null;
    }
  };

  // Re-render polygons when parcels, selectedParcel, showPacketLabels, showCornerMonuments, filteredParcelIds, highlightedParcelIds change
  useEffect(() => {
    const google = (window as any).google;
    if (!google?.maps || !mapInstanceRef.current) return;
    renderAllCadastralParcels(google, mapInstanceRef.current);

    // Auto-frame map view when VARAI AI highlights or filters parcels
    const targetIds = (highlightedParcelIds && highlightedParcelIds.length > 0)
      ? highlightedParcelIds
      : (filteredParcelIds && filteredParcelIds.length > 0)
      ? filteredParcelIds
      : null;

    if (targetIds && targetIds.length > 0) {
      try {
        const bounds = new google.maps.LatLngBounds();
        let hasCoords = false;
        const baseCenter = mapInstanceRef.current.getCenter() || { lat: () => 37.7749, lng: () => -122.4194 };
        const baseLat = liveLocation?.lat || baseCenter.lat();
        const baseLng = liveLocation?.lng || baseCenter.lng();

        parcels.forEach((p) => {
          if (targetIds.includes(p.id)) {
            if (p.latLngPoints && p.latLngPoints.length > 0) {
              p.latLngPoints.forEach((pt) => {
                bounds.extend(pt);
                hasCoords = true;
              });
            } else if (p.boundaryPoints && p.boundaryPoints.length > 0) {
              p.boundaryPoints.forEach((pt) => {
                bounds.extend({
                  lat: baseLat + (50 - pt.y) * 0.0001,
                  lng: baseLng + (pt.x - 50) * 0.0001,
                });
                hasCoords = true;
              });
            }
          }
        });

        if (hasCoords && mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(bounds, 60);
        }
      } catch (err) {
        console.warn('Could not auto-frame bounds for VARAI parcels', err);
      }
    }
  }, [parcels, selectedParcel, showPacketLabels, showCornerMonuments, isEditingVertices, filteredParcelIds, highlightedParcelIds]);

  // Render Manual Polyline in Drawing Mode
  useEffect(() => {
    const google = (window as any).google;
    if (!google?.maps || !mapInstanceRef.current) return;

    // Clear old manual markers
    manualMarkersRef.current.forEach((m) => m.setMap(null));
    manualMarkersRef.current = [];
    if (manualPolylineRef.current) {
      manualPolylineRef.current.setMap(null);
    }

    if (!isManualDrawMode || manualPoints.length === 0) return;

    // Add survey corner stones with drag-to-move support
    manualPoints.forEach((pt, idx) => {
      const marker = new google.maps.Marker({
        position: pt,
        map: mapInstanceRef.current,
        title: `Corner Stone #${idx + 1}: ${pt.lat.toFixed(6)}, ${pt.lng.toFixed(6)} (Drag on map to move)`,
        draggable: true,
        cursor: 'move',
        label: {
          text: `${idx + 1}`,
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: '#4f46e5',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('drag', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const cur = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setLiveMovingVertex({
          index: idx + 1,
          lat: cur.lat,
          lng: cur.lng,
        });
      });

      marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const newPt = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setManualPoints((prev) => {
          const updated = [...prev];
          updated[idx] = newPt;
          return updated;
        });
        setLiveMovingVertex(null);
        setCoordinateMovedToast({
          lat: newPt.lat,
          lng: newPt.lng,
          info: `Moved Survey Monument #${idx + 1}`,
        });
        setTimeout(() => setCoordinateMovedToast(null), 3000);
      });

      manualMarkersRef.current.push(marker);
    });

    // Draw active connecting polyline / closed polygon preview
    manualPolylineRef.current = new google.maps.Polyline({
      path: manualPoints.length > 2 ? [...manualPoints, manualPoints[0]] : manualPoints,
      strokeColor: '#4f46e5',
      strokeOpacity: 0.9,
      strokeWeight: 3,
      map: mapInstanceRef.current,
    });
  }, [manualPoints, isManualDrawMode]);

  // Main parcel & packet polygon renderer
  const renderAllCadastralParcels = (google: any, map: google.maps.Map) => {
    // Clear old polygons & labels
    parcelPolygonsRef.current.forEach((poly) => poly.setMap(null));
    parcelPolygonsRef.current = [];
    labelMarkersRef.current.forEach((m) => m.setMap(null));
    labelMarkersRef.current = [];
    cornerMarkersRef.current.forEach((m) => m.setMap(null));
    cornerMarkersRef.current = [];

    const baseCenter = map.getCenter() || { lat: () => 37.7749, lng: () => -122.4194 };
    const baseLat = liveLocation?.lat || baseCenter.lat();
    const baseLng = liveLocation?.lng || baseCenter.lng();

    parcels.forEach((parcel) => {
      const isFilteredOut = filteredParcelIds !== null && filteredParcelIds !== undefined && !filteredParcelIds.includes(parcel.id);
      if (isFilteredOut) return;

      const isSelected = selectedParcel?.id === parcel.id;
      const isHighlighted = highlightedParcelIds?.includes(parcel.id);

      // Calculate geographic coordinates
      let path: { lat: number; lng: number }[] = [];
      if (parcel.latLngPoints && parcel.latLngPoints.length >= 3) {
        path = parcel.latLngPoints;
      } else {
        path = parcel.boundaryPoints.map((pt) => ({
          lat: baseLat + (50 - pt.y) * 0.0001,
          lng: baseLng + (pt.x - 50) * 0.0001,
        }));
      }

      // Check if deed encroachment exists
      const isDisputed = parcel.deedRecord?.revenueStatus === 'Disputed';

      const strokeColor = isHighlighted
        ? '#db2777'
        : isSelected
        ? '#4f46e5'
        : isDisputed
        ? '#ef4444'
        : parcel.colorTheme || '#0284c7';

      const strokeWeight = isHighlighted ? 4.5 : isSelected ? 3.5 : isDisputed ? 2.5 : 2;
      const strokeOpacity = isHighlighted ? 1 : isSelected ? 1 : 0.9;
      const fillColor = isHighlighted ? '#f43f5e' : isSelected ? '#6366f1' : isDisputed ? '#f87171' : parcel.colorTheme || '#38bdf8';
      const fillOpacity = isHighlighted ? 0.5 : isSelected ? 0.45 : 0.22;

      const polygon = new google.maps.Polygon({
        paths: path,
        strokeColor,
        strokeOpacity,
        strokeWeight,
        fillColor,
        fillOpacity,
        editable: isSelected && isEditingVertices,
        draggable: false,
        map: map,
      });

      polygon.addListener('click', () => {
        onSelectParcel(parcel);
      });

      // If user edits vertices on editable polygon, sync points
      if (isSelected && isEditingVertices) {
        polygon.getPath().addListener('set_at', () => {
          const newLatLngs: { lat: number; lng: number }[] = [];
          for (let i = 0; i < polygon.getPath().getLength(); i++) {
            const pt = polygon.getPath().getAt(i);
            newLatLngs.push({ lat: pt.lat(), lng: pt.lng() });
          }
          handleUpdateParcelCoordinates(parcel.id, newLatLngs);
        });

        polygon.getPath().addListener('insert_at', () => {
          const newLatLngs: { lat: number; lng: number }[] = [];
          for (let i = 0; i < polygon.getPath().getLength(); i++) {
            const pt = polygon.getPath().getAt(i);
            newLatLngs.push({ lat: pt.lat(), lng: pt.lng() });
          }
          handleUpdateParcelCoordinates(parcel.id, newLatLngs);
        });
      }

      parcelPolygonsRef.current.push(polygon);

      // 1. Packet Centroid Label
      if (showPacketLabels && path.length > 0) {
        const centroidLat = path.reduce((sum, p) => sum + p.lat, 0) / path.length;
        const centroidLng = path.reduce((sum, p) => sum + p.lng, 0) / path.length;

        const isHighlighted = highlightedParcelIds?.includes(parcel.id);
        const labelMarker = new google.maps.Marker({
          position: { lat: centroidLat, lng: centroidLng },
          map: map,
          title: `${parcel.code} • ${parcel.acres} ac`,
          label: {
            text: isHighlighted ? `⭐ ${parcel.code}\n${parcel.acres}ac` : `${parcel.code}\n${parcel.acres}ac`,
            color: isHighlighted ? '#ffffff' : isSelected ? '#4338ca' : '#0f172a',
            fontSize: '11px',
            fontWeight: 'bold',
            className: 'text-center font-mono',
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isHighlighted ? 18 : 15,
            fillColor: isHighlighted ? '#db2777' : isSelected ? '#e0e7ff' : '#ffffff',
            fillOpacity: 0.95,
            strokeColor: isHighlighted ? '#ffffff' : isSelected ? '#4f46e5' : '#94a3b8',
            strokeWeight: isHighlighted ? 2.5 : 1.5,
          },
        });

        labelMarker.addListener('click', () => {
          onSelectParcel(parcel);
        });

        labelMarkersRef.current.push(labelMarker);
      }

      // 2. Corner Survey Stones / Monuments with direct selection and live dragging
      if (showCornerMonuments && (isSelected || parcels.length <= 6)) {
        const canDrag = isSelected && isEditingVertices;
        path.forEach((pt, idx) => {
          const isThisSelectedVertex = isSelected && selectedVertexIndex === idx;
          const cornerMarker = new google.maps.Marker({
            position: pt,
            map: map,
            title: isSelected
              ? `${parcel.code} Monument #${idx + 1} (${pt.lat.toFixed(6)}, ${pt.lng.toFixed(6)}) ${canDrag ? '- Drag on map to move coordinate' : '- Click to select & move'}`
              : `${parcel.code} Vertex #${idx + 1} (${pt.lat.toFixed(6)}, ${pt.lng.toFixed(6)})`,
            draggable: canDrag,
            cursor: canDrag ? 'grab' : 'pointer',
            label: isSelected ? {
              text: `${idx + 1}`,
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 'bold',
            } : undefined,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: isThisSelectedVertex ? 11 : (canDrag ? 9.5 : (isSelected ? 6.5 : 4)),
              fillColor: isThisSelectedVertex ? '#dc2626' : (canDrag ? '#f59e0b' : (isSelected ? '#4f46e5' : '#0284c7')),
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: isThisSelectedVertex ? 3 : (isSelected ? 2.5 : 1.5),
            },
          });

          if (canDrag) {
            cornerMarker.addListener('dragstart', () => {
              setSelectedVertexIndex(idx);
              setLiveMovingVertex({
                index: idx + 1,
                lat: pt.lat,
                lng: pt.lng,
              });
            });

            cornerMarker.addListener('drag', (e: google.maps.MapMouseEvent) => {
              if (!e.latLng) return;
              const curLat = e.latLng.lat();
              const curLng = e.latLng.lng();
              const newCoords = [...path];
              newCoords[idx] = { lat: curLat, lng: curLng };
              polygon.setPath(newCoords);
              setLiveMovingVertex({
                index: idx + 1,
                lat: curLat,
                lng: curLng,
              });
            });

            cornerMarker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
              if (!e.latLng) return;
              const finalLat = e.latLng.lat();
              const finalLng = e.latLng.lng();
              const newCoords = [...path];
              newCoords[idx] = { lat: finalLat, lng: finalLng };
              handleUpdateParcelCoordinates(parcel.id, newCoords);
              setLiveMovingVertex(null);
              setSelectedVertexIndex(idx);
              setCoordinateMovedToast({
                lat: finalLat,
                lng: finalLng,
                info: `Moved ${parcel.code} Monument #${idx + 1}`,
              });
              setTimeout(() => setCoordinateMovedToast(null), 4000);
            });
          }

          cornerMarker.addListener('click', () => {
            onSelectParcel(parcel);
            setSelectedVertexIndex(idx);
            setIsEditingVertices(true);
            setEditingVertexCoords({
              lat: pt.lat.toFixed(6),
              lng: pt.lng.toFixed(6),
            });
          });

          cornerMarkersRef.current.push(cornerMarker);
        });
      }
    });
  };

  // Sync edited coordinates back to parcel
  const handleUpdateParcelCoordinates = (parcelId: string, newCoords: { lat: number; lng: number }[]) => {
    const areaM2 = computeSphericalArea(newCoords);
    const acres = Number((areaM2 / 4046.86).toFixed(2));
    const sqft = Math.round(areaM2 * 10.7639);

    const updated = parcels.map((p) => {
      if (p.id === parcelId) {
        return {
          ...p,
          latLngPoints: newCoords,
          acres,
          sqft,
          verificationStatus: 'corrected' as const,
          confidence: 99.9,
        };
      }
      return p;
    });

    if (onUpdateParcels) {
      onUpdateParcels(updated);
    }
  };

  // Shift selected vertex in cardinal direction by vertexNudgeMeters
  const handleNudgeVertex = (vertexIdx: number, direction: 'N' | 'S' | 'E' | 'W') => {
    if (!selectedParcel || !selectedParcel.latLngPoints || !selectedParcel.latLngPoints[vertexIdx]) return;
    const pt = selectedParcel.latLngPoints[vertexIdx];
    const deltaLat = vertexNudgeMeters / 111139;
    const cosLat = Math.cos((pt.lat * Math.PI) / 180);
    const deltaLng = vertexNudgeMeters / (111139 * (Math.abs(cosLat) > 0.0001 ? cosLat : 1));

    let newLat = pt.lat;
    let newLng = pt.lng;
    if (direction === 'N') newLat += deltaLat;
    if (direction === 'S') newLat -= deltaLat;
    if (direction === 'E') newLng += deltaLng;
    if (direction === 'W') newLng -= deltaLng;

    const newPath = [...selectedParcel.latLngPoints];
    newPath[vertexIdx] = { lat: newLat, lng: newLng };
    handleUpdateParcelCoordinates(selectedParcel.id, newPath);
    setEditingVertexCoords({ lat: newLat.toFixed(6), lng: newLng.toFixed(6) });
    setCoordinateMovedToast({
      lat: newLat,
      lng: newLng,
      info: `Nudged ${selectedParcel.code} Monument #${vertexIdx + 1} (${direction} ${vertexNudgeMeters}m)`,
    });
    setTimeout(() => setCoordinateMovedToast(null), 3500);
  };

  // Direct manual coordinate update from sidebar input fields
  const handleSaveManualVertex = (vertexIdx: number) => {
    if (!selectedParcel || !selectedParcel.latLngPoints || !editingVertexCoords) return;
    const newLat = parseFloat(editingVertexCoords.lat);
    const newLng = parseFloat(editingVertexCoords.lng);
    if (isNaN(newLat) || isNaN(newLng)) return;

    const newPath = [...selectedParcel.latLngPoints];
    newPath[vertexIdx] = { lat: newLat, lng: newLng };
    handleUpdateParcelCoordinates(selectedParcel.id, newPath);
    setCoordinateMovedToast({
      lat: newLat,
      lng: newLng,
      info: `Updated ${selectedParcel.code} Monument #${vertexIdx + 1}`,
    });
    setTimeout(() => setCoordinateMovedToast(null), 3500);
  };

  // Insert a new vertex boundary coordinate halfway to the next point
  const handleAddVertexAfter = (idx: number) => {
    if (!selectedParcel || !selectedParcel.latLngPoints) return;
    const pts = selectedParcel.latLngPoints;
    const nextIdx = (idx + 1) % pts.length;
    const midLat = (pts[idx].lat + pts[nextIdx].lat) / 2;
    const midLng = (pts[idx].lng + pts[nextIdx].lng) / 2;

    const newPath = [...pts];
    newPath.splice(idx + 1, 0, { lat: midLat, lng: midLng });
    handleUpdateParcelCoordinates(selectedParcel.id, newPath);
    setSelectedVertexIndex(idx + 1);
    setEditingVertexCoords({ lat: midLat.toFixed(6), lng: midLng.toFixed(6) });
    setCoordinateMovedToast({
      lat: midLat,
      lng: midLng,
      info: `Added Monument #${idx + 2} to ${selectedParcel.code}`,
    });
    setTimeout(() => setCoordinateMovedToast(null), 3500);
  };

  // Remove a corner vertex if there are more than 3
  const handleDeleteVertex = (idx: number) => {
    if (!selectedParcel || !selectedParcel.latLngPoints || selectedParcel.latLngPoints.length <= 3) {
      return;
    }
    const newPath = [...selectedParcel.latLngPoints];
    newPath.splice(idx, 1);
    handleUpdateParcelCoordinates(selectedParcel.id, newPath);
    setSelectedVertexIndex(null);
    setEditingVertexCoords(null);
    setCoordinateMovedToast({
      lat: selectedParcel.latLngPoints[idx].lat,
      lng: selectedParcel.latLngPoints[idx].lng,
      info: `Removed Monument #${idx + 1}`,
    });
    setTimeout(() => setCoordinateMovedToast(null), 3500);
  };

  // AUTOMATED AREA SCANNER: Scans viewport and detects cadastral packets & boundaries
  const handleScanAreaForPackets = () => {
    if (!mapInstanceRef.current) return;
    setIsScanning(true);
    setScanProgress(10);
    setScanNotification(null);

    const center = mapInstanceRef.current.getCenter();
    const cLat = center ? center.lat() : liveLocation?.lat || 37.7749;
    const cLng = center ? center.lng() : liveLocation?.lng || -122.4194;

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      setScanProgress(100);

      // Generate 5 contiguous calibrated cadastral packets around the current viewport
      const offset = 0.0012;
      const scannedParcels: CadastralParcel[] = [
        {
          id: `scan-p1-${Date.now()}`,
          pin: `08-${Math.floor(10 + Math.random() * 89)}-102-001`,
          code: 'PACKET-G01',
          address: `Cadastral Sector Lot 1, Grid (${cLat.toFixed(4)}, ${cLng.toFixed(4)})`,
          zoning: 'M-2 Heavy Logistics & Warehousing',
          acres: 3.42,
          sqft: 148975,
          confidence: 98.8,
          structuresDetected: 3,
          taxAssessment: 2450000,
          colorTheme: '#0284c7',
          verificationStatus: 'verified',
          aiReliabilityTier: 'high',
          latLngPoints: [
            { lat: cLat + offset * 0.8, lng: cLng - offset * 0.9 },
            { lat: cLat + offset * 0.85, lng: cLng - offset * 0.1 },
            { lat: cLat + offset * 0.1, lng: cLng - offset * 0.12 },
            { lat: cLat + offset * 0.05, lng: cLng - offset * 0.88 },
          ],
          boundaryPoints: [
            { x: 15, y: 18 },
            { x: 45, y: 16 },
            { x: 44, y: 46 },
            { x: 16, y: 48 },
          ],
          identifiedFeatures: [
            {
              id: 'sf-1',
              name: 'Masonry Perimeter Boundary Wall',
              category: 'boundary',
              confidence: 99.1,
              details: 'Precast concrete compound wall with 2.2m setback',
              center: { x: 30, y: 17 },
            },
            {
              id: 'sf-2',
              name: 'Primary Logistics Depot',
              category: 'structure',
              confidence: 98.4,
              details: 'Steel portal frame warehouse footprint',
              center: { x: 28, y: 32 },
            },
          ],
          deedRecord: {
            khasraPattaNumber: 'Khasra #214/1A',
            registeredOwner: 'Pacific North Logistics Ltd.',
            registrationDate: '12-May-2018',
            deedAreaAcres: 3.40,
            revenueStatus: 'Clear',
            encroachmentDetected: false,
            discrepancyIndexPercentage: 0.3,
            disputeNotes: 'Survey coordinates align with digitized municipal revenue deed.',
          },
        },
        {
          id: `scan-p2-${Date.now()}`,
          pin: `08-${Math.floor(10 + Math.random() * 89)}-102-002`,
          code: 'PACKET-G02',
          address: `Cadastral Sector Lot 2, Grid (${cLat.toFixed(4)}, ${cLng.toFixed(4)})`,
          zoning: 'C-3 General Commercial',
          acres: 2.78,
          sqft: 121096,
          confidence: 74.2,
          structuresDetected: 2,
          taxAssessment: 3100000,
          colorTheme: '#f59e0b',
          verificationStatus: 'needs_review',
          aiReliabilityTier: 'occasional',
          latLngPoints: [
            { lat: cLat + offset * 0.85, lng: cLng - offset * 0.08 },
            { lat: cLat + offset * 0.9, lng: cLng + offset * 0.8 },
            { lat: cLat + offset * 0.15, lng: cLng + offset * 0.78 },
            { lat: cLat + offset * 0.1, lng: cLng - offset * 0.1 },
          ],
          boundaryPoints: [
            { x: 46, y: 16 },
            { x: 82, y: 14 },
            { x: 81, y: 44 },
            { x: 45, y: 46 },
          ],
          identifiedFeatures: [
            {
              id: 'sf-3',
              name: 'Chainlink Boundary Fence',
              category: 'boundary',
              confidence: 78.5,
              details: 'Encroaches 1.1m into municipal roadway right-of-way easement',
              center: { x: 64, y: 15 },
            },
          ],
          deedRecord: {
            khasraPattaNumber: 'Khasra #214/2B',
            registeredOwner: 'Meridian Commercial Real Estate',
            registrationDate: '04-Nov-2019',
            deedAreaAcres: 2.65,
            revenueStatus: 'Disputed',
            encroachmentDetected: true,
            discrepancyIndexPercentage: 4.2,
            disputeNotes: 'Western boundary fence overlaps adjacent municipal road reserve by 1.1m.',
          },
        },
        {
          id: `scan-p3-${Date.now()}`,
          pin: `08-${Math.floor(10 + Math.random() * 89)}-102-003`,
          code: 'PACKET-G03',
          address: `Cadastral Sector Lot 3, Grid (${cLat.toFixed(4)}, ${cLng.toFixed(4)})`,
          zoning: 'AG-1 Prime Agricultural',
          acres: 5.14,
          sqft: 223898,
          confidence: 99.4,
          structuresDetected: 1,
          taxAssessment: 1680000,
          colorTheme: '#10b981',
          verificationStatus: 'verified',
          aiReliabilityTier: 'high',
          latLngPoints: [
            { lat: cLat + offset * 0.08, lng: cLng - offset * 0.9 },
            { lat: cLat + offset * 0.1, lng: cLng - offset * 0.12 },
            { lat: cLat - offset * 0.8, lng: cLng - offset * 0.14 },
            { lat: cLat - offset * 0.78, lng: cLng - offset * 0.88 },
          ],
          boundaryPoints: [
            { x: 16, y: 49 },
            { x: 44, y: 47 },
            { x: 43, y: 84 },
            { x: 17, y: 83 },
          ],
          identifiedFeatures: [
            {
              id: 'sf-4',
              name: 'Agricultural Irrigation Well & Pump House',
              category: 'infrastructure',
              confidence: 99.3,
              details: 'Tubewell installation with concrete cistern',
              center: { x: 25, y: 65 },
            },
          ],
          deedRecord: {
            khasraPattaNumber: 'Khasra #215/1',
            registeredOwner: 'Kisan Agrarian Cooperative',
            registrationDate: '21-Aug-2012',
            deedAreaAcres: 5.12,
            revenueStatus: 'Clear',
            encroachmentDetected: false,
            discrepancyIndexPercentage: 0.2,
            disputeNotes: 'Title clear. Field irrigation bunds match survey lines.',
          },
        },
        {
          id: `scan-p4-${Date.now()}`,
          pin: `08-${Math.floor(10 + Math.random() * 89)}-102-004`,
          code: 'PACKET-G04',
          address: `Cadastral Sector Lot 4, Grid (${cLat.toFixed(4)}, ${cLng.toFixed(4)})`,
          zoning: 'R-2 Medium Density Residential',
          acres: 3.96,
          sqft: 172497,
          confidence: 98.1,
          structuresDetected: 4,
          taxAssessment: 2950000,
          colorTheme: '#8b5cf6',
          verificationStatus: 'verified',
          aiReliabilityTier: 'high',
          latLngPoints: [
            { lat: cLat + offset * 0.1, lng: cLng - offset * 0.1 },
            { lat: cLat + offset * 0.14, lng: cLng + offset * 0.78 },
            { lat: cLat - offset * 0.75, lng: cLng + offset * 0.75 },
            { lat: cLat - offset * 0.8, lng: cLng - offset * 0.12 },
          ],
          boundaryPoints: [
            { x: 45, y: 47 },
            { x: 81, y: 45 },
            { x: 80, y: 82 },
            { x: 44, y: 84 },
          ],
          identifiedFeatures: [
            {
              id: 'sf-5',
              name: 'Subdivided Residential Plots & Access Lane',
              category: 'road',
              confidence: 97.9,
              details: '6-meter municipal bitumen right of way',
              center: { x: 62, y: 64 },
            },
          ],
          deedRecord: {
            khasraPattaNumber: 'Khasra #215/2',
            registeredOwner: 'Horizon Developers Consortium',
            registrationDate: '19-Jan-2021',
            deedAreaAcres: 3.95,
            revenueStatus: 'Clear',
            encroachmentDetected: false,
            discrepancyIndexPercentage: 0.1,
            disputeNotes: 'Full municipal building plan sanction granted.',
          },
        },
      ];

      if (onUpdateParcels) {
        onUpdateParcels(scannedParcels);
      }
      onSelectParcel(scannedParcels[0]);

      // Fit map bounds to show scanned packets
      const bounds = new google.maps.LatLngBounds();
      scannedParcels.forEach((p) => {
        p.latLngPoints?.forEach((pt) => bounds.extend(pt));
      });
      mapInstanceRef.current?.fitBounds(bounds);

      setIsScanning(false);
      setScanNotification(`Scan Complete: 4 Cadastral Packets, 16 Boundary Monuments & 10 Features detected.`);
    }, 1400);
  };

  // MANUAL BOUNDARY SEAL & SAVE
  const handleSealManualPacket = () => {
    if (manualPoints.length < 3) return;

    const areaM2 = computeSphericalArea(manualPoints);
    const acres = Number((areaM2 / 4046.86).toFixed(2));
    const sqft = Math.round(areaM2 * 10.7639);

    const centroidLat = manualPoints.reduce((s, p) => s + p.lat, 0) / manualPoints.length;
    const centroidLng = manualPoints.reduce((s, p) => s + p.lng, 0) / manualPoints.length;

    const newParcel: CadastralParcel = {
      id: `manual-${Date.now()}`,
      pin: `08-${Math.floor(10 + Math.random() * 89)}-999-${Math.floor(100 + Math.random() * 899)}`,
      code: newPacketName || `PACKET-M${parcels.length + 1}`,
      address: `Manually Delineated Lot, GPS (${centroidLat.toFixed(5)}, ${centroidLng.toFixed(5)})`,
      zoning: newZoning,
      acres: acres > 0 ? acres : 1.25,
      sqft: sqft > 0 ? sqft : 54450,
      confidence: 99.9,
      structuresDetected: 0,
      taxAssessment: Math.round(acres * 450000),
      colorTheme: '#4f46e5',
      verificationStatus: 'verified',
      aiReliabilityTier: 'high',
      isManual: true,
      latLngPoints: manualPoints,
      boundaryPoints: manualPoints.map((pt, idx) => ({
        x: 20 + (idx % 2 === 0 ? 0 : 40),
        y: 20 + (idx < 2 ? 0 : 40),
      })),
      identifiedFeatures: [
        {
          id: `feat-${Date.now()}`,
          name: 'Surveyor Field Corner Monument Markers',
          category: 'boundary',
          confidence: 100,
          details: `${manualPoints.length} corner boundary GPS monuments anchored in field`,
          center: { x: 50, y: 50 },
        },
      ],
      deedRecord: {
        khasraPattaNumber: newKhasraNo || 'Khasra #Manual/1',
        registeredOwner: newOwnerName || 'Field Surveyor Inspection',
        registrationDate: new Date().toLocaleDateString(),
        deedAreaAcres: acres,
        revenueStatus: 'Clear',
        encroachmentDetected: false,
        discrepancyIndexPercentage: 0,
        disputeNotes: 'Manually surveyed and sealed using GPS boundary monuments.',
      },
    };

    const updated = [newParcel, ...parcels];
    if (onUpdateParcels) {
      onUpdateParcels(updated);
    }
    onSelectParcel(newParcel);

    // Reset manual drawing state
    setManualPoints([]);
    setIsManualDrawMode(false);
    setIsSealModalOpen(false);
    setScanNotification(`Manual Packet ${newParcel.code} sealed & registered successfully.`);
  };

  // Copy GPS Coordinates of Selected Parcel
  const handleCopyCoordinates = () => {
    if (!selectedParcel?.latLngPoints) return;
    const text = selectedParcel.latLngPoints
      .map((p, i) => `Vertex ${i + 1}: ${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCoordinates(true);
    setTimeout(() => setCopiedCoordinates(false), 2000);
  };

  // Fit camera bounds to all parcels
  const handleFitToAllParcels = () => {
    if (!mapInstanceRef.current || parcels.length === 0) return;
    const google = (window as any).google;
    if (!google?.maps) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    parcels.forEach((p) => {
      if (p.latLngPoints && p.latLngPoints.length > 0) {
        p.latLngPoints.forEach((pt) => {
          bounds.extend(pt);
          hasPoints = true;
        });
      }
    });

    if (hasPoints) {
      mapInstanceRef.current.fitBounds(bounds);
    } else if (liveLocation) {
      mapInstanceRef.current.panTo(liveLocation);
      mapInstanceRef.current.setZoom(16);
    }
  };

  // Jump to sample cadastral regions
  const handleJumpToRegion = (coords: { lat: number; lng: number }, name: string) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo(coords);
    mapInstanceRef.current.setZoom(17);
    setScanNotification(`Navigated to ${name}. Click "Scan Area for Packets" to detect boundaries.`);
  };

  // Calculate live manual drawing stats
  const manualAreaM2 = computeSphericalArea(manualPoints);
  const manualAcres = Number((manualAreaM2 / 4046.86).toFixed(3));
  let manualPerimeterM = 0;
  for (let i = 0; i < manualPoints.length; i++) {
    const p1 = manualPoints[i];
    const p2 = manualPoints[(i + 1) % manualPoints.length];
    manualPerimeterM += computeHaversineDistance(p1, p2);
  }

  // CLEAR ALL PACKETS & OVERLAYS FROM MAP (Before switching modes for pristine results)
  const handleClearMapAndPackets = () => {
    cleanupOverlays();
    setManualPoints([]);
    setIsManualDrawMode(false);
    setIsEditingVertices(false);
    if (onUpdateParcels) {
      onUpdateParcels([]);
    }
    onSelectParcel(null);
    if (onClearMap) {
      onClearMap();
    }
    setScanNotification('Cleared all packets and boundary markers from map. Ready for a clean Auto Scan or Manual Survey.');
  };

  return (
    <div className="space-y-4">
      {/* Top Map Action Toolbar - Professional GIS Command Deck */}
      <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Primary Survey Operations */}
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Main Automated AI Scanner Button */}
          <button
            id="btn-scan-area-packets"
            onClick={handleScanAreaForPackets}
            disabled={isScanning}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:scale-102 active:scale-98 ring-2 ring-indigo-500/20"
            title="Scan satellite imagery and extract cadastral boundaries"
          >
            <Scan className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Scan Packets'}</span>
          </button>

          {/* Manual Draw Packet Toggle Button */}
          <button
            id="btn-toggle-manual-draw"
            onClick={() => {
              setIsManualDrawMode(!isManualDrawMode);
              if (isManualDrawMode) {
                setManualPoints([]);
              }
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              isManualDrawMode
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs animate-pulse ring-2 ring-amber-400/30'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Manually click on map to delineate custom boundary packets"
          >
            <PenTool className={`w-3.5 h-3.5 ${isManualDrawMode ? 'text-white' : 'text-amber-600'}`} />
            <span>{isManualDrawMode ? 'Exit Drawing' : 'Draw Packet'}</span>
          </button>

          {/* Clear Map Button */}
          <button
            id="btn-clear-google-maps"
            onClick={handleClearMapAndPackets}
            disabled={isScanning}
            className="px-2.5 py-2 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Clear all boundaries and markers from map"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* VARAI AI Active Filter Chip */}
          {filteredParcelIds && (
            <div className="px-2.5 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/90 rounded-xl text-xs font-bold text-purple-800 flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" />
              <span>Filter: {filteredParcelIds.length}</span>
              {onResetFilter && (
                <button
                  id="btn-reset-varai-filter-maps"
                  onClick={onResetFilter}
                  className="ml-0.5 hover:text-purple-950 p-0.5 rounded text-slate-400 hover:text-slate-600"
                  title="Clear filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center: Navigation & Cadastre Tools (Segmented Dock) */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 gap-1 text-xs">
          {/* Coordinates Finder Toggle */}
          <button
            id="btn-toggle-coords-finder"
            onClick={() => setShowCoordinateFinder(!showCoordinateFinder)}
            className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              showCoordinateFinder
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Toggle Precision Coordinate & Parcel Finder"
          >
            <Crosshair className="w-3.5 h-3.5 text-indigo-600" />
            <span>Coords</span>
            <span className={`w-1.5 h-1.5 rounded-full ${showCoordinateFinder ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`} />
          </button>

          {/* Move Coordinates Mode Toggle */}
          <button
            id="btn-toggle-move-coords"
            onClick={() => {
              if (!selectedParcel && parcels.length > 0) {
                onSelectParcel(parcels[0]);
              }
              setIsEditingVertices(!isEditingVertices);
            }}
            className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              isEditingVertices
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Move parcel boundary corner coordinates on the live Google Map"
          >
            <Move className="w-3.5 h-3.5" />
            <span>Move Nodes</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isEditingVertices ? 'bg-white' : 'bg-slate-300'}`} />
          </button>

          <div className="w-px h-4 bg-slate-200 mx-0.5" />

          {/* Re-Center GPS */}
          <button
            id="btn-fetch-live-gps"
            onClick={fetchLiveLocation}
            disabled={isLocating}
            className="px-2.5 py-1.5 text-slate-700 hover:text-emerald-700 font-bold flex items-center gap-1 rounded-lg transition-colors hover:bg-white"
            title="Locate my position on map via GPS"
          >
            <Navigation className={`w-3.5 h-3.5 text-emerald-600 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'My GPS'}</span>
          </button>

          {/* Fit Camera to Parcels */}
          <button
            id="btn-fit-all-parcels"
            onClick={handleFitToAllParcels}
            className="px-2.5 py-1.5 text-slate-700 hover:text-indigo-700 font-bold flex items-center gap-1 rounded-lg transition-colors hover:bg-white"
            title="Fit camera view to all scanned parcels"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Fit View</span>
          </button>
        </div>

        {/* Right: Map Overlays & Basemap Layer Switcher */}
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Overlays Pill Group */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 gap-0.5 text-xs">
            <button
              onClick={() => setShowPacketLabels(!showPacketLabels)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                showPacketLabels
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Toggle Packet ID centroid labels"
            >
              Labels
            </button>

            <button
              onClick={() => setShowCornerMonuments(!showCornerMonuments)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                showCornerMonuments
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Toggle Corner boundary stones"
            >
              Stones
            </button>
          </div>

          {/* Map Type Switcher */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {(['hybrid', 'satellite', 'roadmap', 'terrain'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setMapType(type)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                  mapType === type
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Drawing Mode Active Banner */}
      {isManualDrawMode && (
        <div className="bg-amber-50 border-2 border-amber-300 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Manual Boundary Delineator Active
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                  {manualPoints.length} Points Dropped
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Click anywhere on the map to drop boundary corner monuments. Click at least 3 points, then seal packet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {manualPoints.length > 0 && (
              <div className="text-xs font-mono bg-white px-2.5 py-1.5 rounded-xl border border-amber-200 text-slate-700">
                <span>{manualAcres} ac</span> • <span>{Math.round(manualPerimeterM)}m perimeter</span>
              </div>
            )}

            {manualPoints.length > 0 && (
              <button
                onClick={() => setManualPoints((prev) => prev.slice(0, -1))}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1 shadow-2xs"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            )}

            <button
              onClick={() => setManualPoints([])}
              disabled={manualPoints.length === 0}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              onClick={() => setIsSealModalOpen(true)}
              disabled={manualPoints.length < 3}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Complete & Seal Packet</span>
            </button>
          </div>
        </div>
      )}

      {/* Scanning Radar Banner Indicator */}
      {isScanning && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center justify-between shadow-xs animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Scan className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Scanning Aerial Telemetry & Cadastral Boundaries
              </h4>
              <p className="text-xs text-indigo-700 font-medium">
                Detecting property packets, compound walls, fence vectors, and municipal deed alignment...
              </p>
            </div>
          </div>
          <div className="text-xs font-mono font-bold text-indigo-700 bg-white px-3 py-1 rounded-xl border border-indigo-200">
            {scanProgress}%
          </div>
        </div>
      )}

      {/* Scan notification banner */}
      {scanNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{scanNotification}</span>
          </div>
          <button 
            onClick={() => setScanNotification(null)}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Coordinate Selection & Parcel Finder Section */}
      {showCoordinateFinder && (
        <MapCoordinateFinder
          parcels={parcels}
          selectedParcel={selectedParcel}
          onSelectParcel={onSelectParcel}
          onPanToCoordinate={handlePanToCoordinate}
          onDropPinAtCoordinate={dropPinAtCoordinate}
          isPickModeActive={isPickModeActive}
          onTogglePickMode={() => setIsPickModeActive(!isPickModeActive)}
          livePickedCoords={livePickedCoords}
          onClearPickedCoords={() => {
            setLivePickedCoords(null);
            if (searchBeaconMarkerRef.current) {
              searchBeaconMarkerRef.current.setMap(null);
              searchBeaconMarkerRef.current = null;
            }
          }}
          onTriggerScanAtCoords={() => {
            handleScanAreaForPackets();
          }}
        />
      )}

      {/* Main Map & Parcel Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Map Container Column */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-slate-200 shadow-xs h-[580px] relative bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Live Hover Coordinate Readout (Top Right) */}
          {hoverCoords && (
            <div className="absolute top-3 right-3 bg-slate-900/90 text-white font-mono text-[10px] px-2.5 py-1 rounded-xl border border-slate-700 shadow-md backdrop-blur-xs flex items-center gap-1.5 pointer-events-none z-10">
              <Crosshair className="w-3 h-3 text-indigo-400" />
              <span>{hoverCoords.lat.toFixed(6)}, {hoverCoords.lng.toFixed(6)}</span>
            </div>
          )}

          {/* Interactive Pick on Map Guide Prompt */}
          {isPickModeActive && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg border border-white/50 flex items-center gap-1.5 animate-bounce z-20">
              <MapPin className="w-3.5 h-3.5" />
              <span>Click anywhere on map to sample coordinate & identify parcel</span>
            </div>
          )}

          {/* Quick Jump Survey Sector Presets (Floating Overlay) */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs p-1.5 rounded-xl border border-slate-200 shadow-md flex items-center gap-1.5 text-xs z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
              Sectors:
            </span>
            <button
              onClick={() => handleJumpToRegion({ lat: 37.7749, lng: -122.4194 }, 'Urban Sector (San Francisco)')}
              className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 font-medium text-[11px]"
            >
              Urban
            </button>
            <button
              onClick={() => handleJumpToRegion({ lat: 28.5823, lng: 77.0500 }, 'Khasra Agricultural Lot (Dwarka)')}
              className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 font-medium text-[11px]"
            >
              Khasra Farmland
            </button>
            <button
              onClick={() => handleJumpToRegion({ lat: 48.1351, lng: 11.5820 }, 'Cadastral District (Munich)')}
              className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 font-medium text-[11px]"
            >
              European Cadastre
            </button>
          </div>

          {/* Live Moving Pin Notification (Pin Dragged) */}
          {liveMovingCoordinate && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-amber-600 text-white font-mono text-xs px-4 py-2 rounded-full shadow-xl border border-amber-300 flex items-center gap-2 z-20 animate-pulse">
              <Move className="w-4 h-4" />
              <span className="font-bold">Repositioning Pin:</span>
              <span>{liveMovingCoordinate.lat.toFixed(6)}, {liveMovingCoordinate.lng.toFixed(6)}</span>
            </div>
          )}

          {/* Live Moving Vertex Notification (Boundary Vertex Dragged) */}
          {liveMovingVertex && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-indigo-600 text-white font-mono text-xs px-4 py-2 rounded-full shadow-xl border border-indigo-300 flex items-center gap-2 z-20">
              <Move className="w-4 h-4 animate-spin" />
              <span className="font-bold">Moving Monument #{liveMovingVertex.index}:</span>
              <span>{liveMovingVertex.lat.toFixed(6)}, {liveMovingVertex.lng.toFixed(6)}</span>
            </div>
          )}

          {/* Coordinate Moved Success Toast */}
          {coordinateMovedToast && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-xs px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 z-30 animate-in fade-in slide-in-from-bottom-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white">{coordinateMovedToast.info}</span>
                <span className="font-mono text-slate-300 ml-2 font-medium">
                  {coordinateMovedToast.lat.toFixed(6)}, {coordinateMovedToast.lng.toFixed(6)}
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${coordinateMovedToast.lat.toFixed(6)}, ${coordinateMovedToast.lng.toFixed(6)}`);
                }}
                className="ml-1 p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white"
                title="Copy coordinates"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Vertex Editing Mode Active On-Map Pill */}
          {isEditingVertices && !liveMovingVertex && !isPickModeActive && (
            <div className="absolute top-14 left-4 bg-amber-500/95 text-white text-xs px-3 py-1.5 rounded-xl shadow-md border border-amber-300 flex items-center gap-1.5 z-10">
              <Move className="w-3.5 h-3.5" />
              <span className="font-bold">Drag & Move Vertices Active: Click and drag any numbered stone</span>
            </div>
          )}

          {/* Floating Stats Pill on Map */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 shadow-md flex items-center gap-3 text-xs text-slate-700">
            <div>
              <span className="text-slate-400">Packets:</span>{' '}
              <strong className="text-slate-900">{parcels.length}</strong>
            </div>
            <div className="w-px h-3 bg-slate-200" />
            <div>
              <span className="text-slate-400">Total Area:</span>{' '}
              <strong className="text-slate-900">
                {parcels.reduce((sum, p) => sum + p.acres, 0).toFixed(1)} ac
              </strong>
            </div>
            <div className="w-px h-3 bg-slate-200" />
            <div className="flex items-center gap-1 text-emerald-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>GSD 2.8cm/px</span>
            </div>
          </div>
        </div>

        {/* Selected Cadastre Telemetry Panel Column */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 max-h-[580px] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cadastral Telemetry</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200">
              {selectedParcel?.verificationStatus || 'ACTIVE'}
            </span>
          </div>

          {selectedParcel ? (
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-indigo-600 font-bold">
                    {selectedParcel.pin}
                  </span>
                  {selectedParcel.isManual && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                      MANUAL SURVEY
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-black text-slate-900 mt-0.5 font-display">
                  {selectedParcel.code}
                </h4>
                <div className="text-slate-500 text-[11px] mt-0.5 leading-tight">
                  {selectedParcel.address}
                </div>
              </div>

              {/* Area & Valuation Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block font-medium">Calculated Area</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedParcel.acres} ac</span>
                  <span className="text-[10px] text-slate-500 block">{selectedParcel.sqft.toLocaleString()} sqft</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block font-medium">AI Confidence</span>
                  <span className={`font-bold text-sm font-mono ${
                    selectedParcel.confidence < 75 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {selectedParcel.confidence.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {selectedParcel.structuresDetected} Structures
                  </span>
                </div>
              </div>

              {/* Deed & Revenue Alignment Status */}
              {selectedParcel.deedRecord && (
                <div className={`p-3 rounded-xl border ${
                  selectedParcel.deedRecord.revenueStatus === 'Disputed'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>{selectedParcel.deedRecord.khasraPattaNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      selectedParcel.deedRecord.revenueStatus === 'Disputed'
                        ? 'bg-rose-200 text-rose-800 font-extrabold'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {selectedParcel.deedRecord.revenueStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    <strong>Owner:</strong> {selectedParcel.deedRecord.registeredOwner}
                  </div>
                  {selectedParcel.deedRecord.encroachmentDetected && (
                    <div className="mt-1.5 text-[10px] font-bold text-rose-700 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      <span>Boundary encroachment detected</span>
                    </div>
                  )}
                </div>
              )}

              {/* Vertex Coordinates Explorer & Live Mover Panel */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Move className="w-3 h-3 text-amber-500" />
                    <span>GPS Monuments ({selectedParcel.latLngPoints?.length || selectedParcel.boundaryPoints.length})</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopyCoordinates}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      title="Copy all monument coordinates to clipboard"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedCoordinates ? 'Copied!' : 'Copy All'}</span>
                    </button>
                  </div>
                </div>

                {/* Monument Stones Selector List */}
                <div className="bg-slate-50 rounded-xl p-1.5 font-mono text-[10px] text-slate-600 space-y-1 max-h-32 overflow-y-auto border border-slate-200/80">
                  {(selectedParcel.latLngPoints || []).map((pt, idx) => {
                    const isSelectedIdx = selectedVertexIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedVertexIndex(idx);
                          setEditingVertexCoords({ lat: pt.lat.toFixed(6), lng: pt.lng.toFixed(6) });
                          if (mapInstanceRef.current) {
                            mapInstanceRef.current.panTo(pt);
                          }
                        }}
                        className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-all ${
                          isSelectedIdx
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-2xs'
                            : 'hover:bg-white hover:shadow-2xs text-slate-700'
                        }`}
                        title="Click to select and move this coordinate"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                            isSelectedIdx ? 'bg-amber-600' : 'bg-indigo-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-bold">Stone #{idx + 1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{pt.lat.toFixed(5)}, {pt.lng.toFixed(5)}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (mapInstanceRef.current) {
                                mapInstanceRef.current.panTo(pt);
                                mapInstanceRef.current.setZoom(19);
                              }
                            }}
                            className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600"
                            title="Center on map"
                          >
                            <Crosshair className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {(!selectedParcel.latLngPoints || selectedParcel.latLngPoints.length === 0) && (
                    <div className="text-slate-400 italic p-1">Projected relative boundary coordinates</div>
                  )}
                </div>

                {/* Selected Monument Coordinate Editor & Nudge Pad */}
                {selectedVertexIndex !== null && selectedParcel.latLngPoints && selectedParcel.latLngPoints[selectedVertexIndex] && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[9px]">
                          {selectedVertexIndex + 1}
                        </span>
                        <span className="text-xs font-bold text-amber-900">
                          Move Monument #{selectedVertexIndex + 1}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedVertexIndex(null)}
                        className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold"
                      >
                        Deselect
                      </button>
                    </div>

                    {/* Numerical Coordinates Input */}
                    <div className="grid grid-cols-2 gap-1.5 font-mono">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block">Latitude</label>
                        <input
                          type="text"
                          value={editingVertexCoords?.lat || ''}
                          onChange={(e) => setEditingVertexCoords((prev) => ({ lat: e.target.value, lng: prev?.lng || '' }))}
                          className="w-full px-2 py-1 bg-white border border-amber-200 rounded-lg text-[10px] text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-amber-400"
                          placeholder="Lat"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block">Longitude</label>
                        <input
                          type="text"
                          value={editingVertexCoords?.lng || ''}
                          onChange={(e) => setEditingVertexCoords((prev) => ({ lat: prev?.lat || '', lng: e.target.value }))}
                          className="w-full px-2 py-1 bg-white border border-amber-200 rounded-lg text-[10px] text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-amber-400"
                          placeholder="Lng"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleSaveManualVertex(selectedVertexIndex)}
                      className="w-full py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Apply New Coordinates</span>
                    </button>

                    {/* Step Selector & Micro-Nudge D-Pad */}
                    <div className="pt-1.5 border-t border-amber-200/70">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">
                          Nudge Coordinate:
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 5, 10].map((m) => (
                            <button
                              key={m}
                              onClick={() => setVertexNudgeMeters(m)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                                vertexNudgeMeters === m
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-white text-amber-800 border border-amber-200'
                              }`}
                            >
                              {m}m
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 4-Way D-Pad Buttons */}
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => handleNudgeVertex(selectedVertexIndex, 'N')}
                          className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-md border border-amber-300 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                          title="Nudge North"
                        >
                          <ChevronUp className="w-3 h-3" />
                          <span>North ({vertexNudgeMeters}m)</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleNudgeVertex(selectedVertexIndex, 'W')}
                            className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-md border border-amber-300 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                            title="Nudge West"
                          >
                            <ChevronLeft className="w-3 h-3" />
                            <span>West</span>
                          </button>
                          <button
                            onClick={() => {
                              const pt = selectedParcel.latLngPoints![selectedVertexIndex];
                              if (mapInstanceRef.current) {
                                mapInstanceRef.current.panTo(pt);
                                mapInstanceRef.current.setZoom(19);
                              }
                            }}
                            className="px-2 py-1 bg-amber-200 text-amber-900 rounded-md text-[9px] font-extrabold"
                            title="Center camera on this monument"
                          >
                            CENTER
                          </button>
                          <button
                            onClick={() => handleNudgeVertex(selectedVertexIndex, 'E')}
                            className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-md border border-amber-300 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                            title="Nudge East"
                          >
                            <span>East</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleNudgeVertex(selectedVertexIndex, 'S')}
                          className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-md border border-amber-300 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                          title="Nudge South"
                        >
                          <ChevronDown className="w-3 h-3" />
                          <span>South ({vertexNudgeMeters}m)</span>
                        </button>
                      </div>
                    </div>

                    {/* Add / Remove Vertex Action Buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-amber-200/70">
                      <button
                        onClick={() => handleAddVertexAfter(selectedVertexIndex)}
                        className="py-1 px-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                        title="Add an intermediate boundary corner stone after this one"
                      >
                        <Plus className="w-3 h-3 text-emerald-600" />
                        <span>Add Stone</span>
                      </button>
                      <button
                        onClick={() => handleDeleteVertex(selectedVertexIndex)}
                        disabled={selectedParcel.latLngPoints.length <= 3}
                        className="py-1 px-2 bg-white hover:bg-rose-50 disabled:opacity-50 text-rose-800 border border-rose-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                        title="Delete this corner stone (minimum 3 required)"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                        <span>Delete Stone</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Vertex Editing Mode Toggle */}
                <button
                  onClick={() => setIsEditingVertices(!isEditingVertices)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                    isEditingVertices
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300/40'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Move className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isEditingVertices ? 'Exit Drag & Move Mode' : 'Drag & Move Coordinates on Live Map'}</span>
                </button>
              </div>

              {/* Cross-Tool Navigation Links */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Launch Connected Tools:
                </div>
                {onSimulateInDigitalTwin && (
                  <button
                    id="btn-maps-to-digital-twin"
                    onClick={() => onSimulateInDigitalTwin(selectedParcel)}
                    className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-indigo-200 transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Simulate 3D What-If</span>
                  </button>
                )}

                {onInspectInDroneView && (
                  <button
                    id="btn-maps-to-drone"
                    onClick={() => onInspectInDroneView(selectedParcel)}
                    className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-blue-200 transition-colors"
                  >
                    <Plane className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Drone Orthomosaic</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <Compass className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p>Click any parcel boundary polygon on the map to inspect telemetry, or click "Scan Area for Packets".</p>
            </div>
          )}
        </div>
      </div>


      {/* Manual Packet Seal Modal */}
      {isSealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base font-display">
                    Seal & Register Manual Packet
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {manualPoints.length} corner monuments • {manualAcres} acres
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsSealModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Packet Code / Lot Identifier</label>
                <input
                  type="text"
                  value={newPacketName}
                  onChange={(e) => setNewPacketName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="e.g. PACKET-M01"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Revenue Khasra / Patta Number</label>
                <input
                  type="text"
                  value={newKhasraNo}
                  onChange={(e) => setNewKhasraNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Khasra #240/M"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Registered Owner / Claimant</label>
                <input
                  type="text"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  placeholder="Owner Name"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Zoning Classification</label>
                <select
                  value={newZoning}
                  onChange={(e) => setNewZoning(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Commercial Logistics">Commercial Logistics</option>
                  <option value="Prime Agricultural AG-1">Prime Agricultural AG-1</option>
                  <option value="Heavy Industrial M-2">Heavy Industrial M-2</option>
                  <option value="Residential R-2">Residential R-2</option>
                  <option value="Municipal Reserve">Municipal Reserve</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsSealModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSealManualPacket}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Seal Packet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
