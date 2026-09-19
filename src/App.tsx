import React, { useState } from 'react';
import { 
  Home as HomeIcon,
  Map as MapIcon, 
  Plane, 
  Upload, 
  Layers, 
  Sparkles, 
  FileText, 
  Compass, 
  CheckCircle2, 
  Radio,
  Eye,
  Scan,
  Download,
  Crosshair,
  RotateCcw,
  Brain,
  Repeat,
  Building2,
  Landmark,
  Box,
  Move,
  Wifi,
  Bot,
  Filter,
  Calculator,
  Crown,
  Lock
} from 'lucide-react';
import { SAMPLE_DRONE_IMAGES } from './data/sampleCadastres';
import { INITIAL_SAMPLE_PARCELS } from './data/dharNavVerificationData';
import { 
  CadastralParcel, 
  IdentifiedFeature, 
  ImageViewMode, 
  CorrectionReason, 
  SurveyorCorrectionRecord,
  SimulatedConstruction
} from './types';
import { 
  calculateRealParcelTelemetry, 
  calculateDeedDiscrepancy 
} from './utils/cadastreCalculations';
import { DroneCanvasViewer } from './components/DroneCanvasViewer';
import { ViewModeToolbar } from './components/ViewModeToolbar';
import { CadastreTelemetrySidebar } from './components/CadastreTelemetrySidebar';
import { UploadDroneDialog } from './components/UploadDroneDialog';
import { GoogleMapsCadastreView } from './components/GoogleMapsCadastreView';
import { HomeOverview } from './components/HomeOverview';
import { EmptyDronePlayground } from './components/EmptyDronePlayground';
import { DharNavLearningDashboard } from './components/DharNavLearningDashboard';
import { SurveyorCorrectionModal } from './components/SurveyorCorrectionModal';
import { WhatIfSimulatorModal } from './components/WhatIfSimulatorModal';
import { DigitalTwinSimulatorView } from './components/DigitalTwinSimulatorView';
import { CadastralCertificateModal } from './components/CadastralCertificateModal';
import { DeedConflictPanel } from './components/DeedConflictPanel';
import { Volumetric3DPanel } from './components/Volumetric3DPanel';
import { OfflineFieldSyncBar } from './components/OfflineFieldSyncBar';
import { DeedRectificationPetitionModal } from './components/DeedRectificationPetitionModal';
import { VaraiChatDrawer } from './components/VaraiChatDrawer';
import { ValuationSuiteModal, ValuationSuiteTab } from './components/calculators/ValuationSuiteModal';
import { PremiumLockedFeaturesModal } from './components/PremiumLockedFeaturesModal';
import { apiUrl } from './services/api';

export default function App() {
  // Navigation Tabs: 'home' | 'digital-twin' | 'dharnav-loop' | 'drone-images' | 'google-maps'
  const [activeTab, setActiveTab] = useState<
    'home' | 'digital-twin' | 'dharnav-loop' | 'drone-images' | 'google-maps'
  >('home');

  // Drone workspace state: Starts EMPTY by default
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{
    name: string;
    format: string;
    resolution: string;
    altitude: string;
  } | null>(null);

  // Active parcels with DharNav self-check, deed records, and 3D simulations
  const [parcels, setParcels] = useState<CadastralParcel[]>([]);
  const [hasClearedGoogleMaps, setHasClearedGoogleMaps] = useState<boolean>(false);
  const [identifiedFeatures, setIdentifiedFeatures] = useState<IdentifiedFeature[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<CadastralParcel | null>(null);

  // Digital Twin: What-If Simulation Modal state
  const [isWhatIfModalOpen, setIsWhatIfModalOpen] = useState<boolean>(false);
  const [whatIfTargetParcel, setWhatIfTargetParcel] = useState<CadastralParcel | null>(null);

  // Official Survey Certificate Modal State
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);
  const [certificateTargetParcel, setCertificateTargetParcel] = useState<CadastralParcel | null>(null);

  // Deed Rectification Petition Modal State
  const [isPetitionModalOpen, setIsPetitionModalOpen] = useState<boolean>(false);
  const [petitionTargetParcel, setPetitionTargetParcel] = useState<CadastralParcel | null>(null);
  const [deedResolutionToast, setDeedResolutionToast] = useState<string | null>(null);

  // Land Revenue Tax & Boundary Valuation Suite State
  const [isValuationSuiteOpen, setIsValuationSuiteOpen] = useState<boolean>(false);
  const [activeValuationTab, setActiveValuationTab] = useState<ValuationSuiteTab>('revenue_tax');

  // DharNav Premium & Locked Features Modal State
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);

  // VARAI AI Cadastral Chatbot & Spatial Query State
  const [isVaraiChatOpen, setIsVaraiChatOpen] = useState<boolean>(false);
  const [varaiFilteredParcelIds, setVaraiFilteredParcelIds] = useState<string[] | null>(null);
  const [varaiHighlightedParcelIds, setVaraiHighlightedParcelIds] = useState<string[]>([]);

  // Interactive Polygon Vertex Dragging Mode
  const [isVertexEditMode, setIsVertexEditMode] = useState<boolean>(false);

  // 3D Volumetric Sun Angles
  const [sunAzimuth, setSunAzimuth] = useState<number>(220);
  const [sunElevation, setSunElevation] = useState<number>(40);

  // DharNav Learned Surveyor Corrections Store
  const [correctionRecords, setCorrectionRecords] = useState<SurveyorCorrectionRecord[]>([
    {
      id: 'corr-init-1',
      parcelId: 'p-102',
      parcelCode: 'PACKET-102',
      timestamp: '2026-09-18 11:42',
      surveyorName: 'Chief Surveyor R. Verma',
      originalPoints: [
        { x: 35, y: 36 },
        { x: 47, y: 37 },
        { x: 46, y: 51 },
        { x: 34, y: 50 },
      ],
      correctedPoints: [
        { x: 35, y: 36 },
        { x: 48.2, y: 37 },
        { x: 47.2, y: 51 },
        { x: 34, y: 50 },
      ],
      displacementMeters: 1.5,
      primaryReason: 'shadow_false_boundary',
      reasonLabel: 'Shadow caused false boundary',
      notes: 'Canopy shadow cast a 1.5m false boundary line along eastern fence.',
      modelWeightUpdated: true,
      terrainContext: 'Heavy eucalyptus canopy along perimeter fence line',
    },
  ]);

  // Modal for Surveyor Review & Correction
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState<boolean>(false);
  const [correctionTargetParcel, setCorrectionTargetParcel] = useState<CadastralParcel | null>(null);

  // Viewer controls
  const [viewMode, setViewMode] = useState<ImageViewMode>('cadastral');
  const [telemetryOpacity, setTelemetryOpacity] = useState<number>(50);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [activeFeatureFilter, setActiveFeatureFilter] = useState<string | null>(null);

  // Upload modal state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStatusText, setAnalysisStatusText] = useState<string>('');

  // Handle preset sample selection (populates playground with preset's calibrated parcels)
  const handleSelectPreset = (presetId: string) => {
    const found = SAMPLE_DRONE_IMAGES.find((s) => s.id === presetId);
    if (found) {
      setActiveImageUrl(found.url);
      setImageMeta({
        name: found.name,
        format: found.format,
        resolution: found.resolution,
        altitude: found.altitude,
      });
      const selectedParcels = found.parcels && found.parcels.length > 0 ? found.parcels : INITIAL_SAMPLE_PARCELS;
      setParcels(selectedParcels);
      setIdentifiedFeatures(selectedParcels.flatMap((p) => p.identifiedFeatures || []));
      setSelectedParcel(selectedParcels[0] || null);
    }
  };

  // Handle custom image upload and Gemini AI analysis
  const handleUploadCustomImage = async (base64DataUrl: string, file: File) => {
    setIsAnalyzing(true);
    setAnalysisStatusText('Extracting drone orthomosaic metadata...');
    setIsUploadDialogOpen(false);

    try {
      setAnalysisStatusText('Running Gemini AI Vision for cadastral boundaries & DharNav self-check...');
      const response = await fetch(apiUrl('/api/drone/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64DataUrl,
          fileName: file.name,
          fileSizeKb: Math.round(file.size / 1024),
          fileFormat: file.type || 'image/jpeg',
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed with status ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setActiveImageUrl(base64DataUrl);
        setImageMeta({
          name: file.name,
          format: result.data.fileFormat || file.type || 'GeoTIFF / JPG',
          resolution: result.data.estimatedGroundSamplingDistance || '2.8 cm/px',
          altitude: result.data.flightAltitude || '95m AGL',
        });

        const processedParcels: CadastralParcel[] = (result.data.parcels || []).map((p: any, idx: number) => {
          const confidence = idx === 1 ? 72.0 : p.confidence || 98.4;
          return {
            ...p,
            confidence,
            verificationStatus: confidence < 75 ? 'needs_review' : 'verified',
            aiReliabilityTier: confidence < 70 ? 'frequent_error' : confidence < 85 ? 'occasional' : 'high',
            originalAiBoundaryPoints: p.boundaryPoints,
            simulations: [],
            deedRecord: {
              khasraPattaNumber: `Khasra #${140 + idx}/1A`,
              registeredOwner: `Survey Lot Owner #${idx + 1}`,
              registrationDate: '15-Jan-2020',
              deedAreaAcres: p.acres || 3.2,
              revenueStatus: idx === 1 ? 'Disputed' : 'Clear',
              encroachmentDetected: idx === 1,
              discrepancyIndexPercentage: idx === 1 ? 3.8 : 0.2,
              disputeNotes: idx === 1 ? 'Compound fence encroaches 1.2m on municipal right of way.' : 'Clear title.',
              deedBoundaryPoints: p.boundaryPoints,
            },
          };
        });

        setParcels(processedParcels);
        setIdentifiedFeatures(result.data.identifiedFeatures || []);
        setSelectedParcel(processedParcels[0] || null);
      }
    } catch (err) {
      console.warn('Backend analysis call failed, generating calibrated DharNav parcels:', err);
      setActiveImageUrl(base64DataUrl);
      setImageMeta({
        name: file.name,
        format: file.type || 'GeoTIFF / Orthomosaic',
        resolution: '2.5 cm/px',
        altitude: '80m AGL',
      });

      setParcels(INITIAL_SAMPLE_PARCELS);
      setIdentifiedFeatures(INITIAL_SAMPLE_PARCELS.flatMap((p) => p.identifiedFeatures));
      setSelectedParcel(INITIAL_SAMPLE_PARCELS[1]);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatusText('');
    }
  };

  // Live Polygon Vertex Dragging Handler with Real-Time Telemetry & Deed Recalculation
  const handleUpdateParcelVertex = (parcelId: string, vertexIndex: number, newCoord: { x: number; y: number }) => {
    setParcels((prev) =>
      prev.map((p) => {
        if (p.id === parcelId) {
          const newPts = [...p.boundaryPoints];
          newPts[vertexIndex] = newCoord;
          const liveTelemetry = calculateRealParcelTelemetry(
            newPts,
            p.originalAiBoundaryPoints,
            p.acres
          );
          const deedCheck = p.deedRecord
            ? calculateDeedDiscrepancy(liveTelemetry.acres, p.deedRecord.deedAreaAcres)
            : null;

          return {
            ...p,
            boundaryPoints: newPts,
            acres: liveTelemetry.acres,
            sqft: liveTelemetry.sqft,
            verificationStatus: 'corrected',
            confidence: 99.8,
            deedRecord: p.deedRecord && deedCheck
              ? {
                  ...p.deedRecord,
                  discrepancyIndexPercentage: deedCheck.discrepancyPercentage,
                  encroachmentDetected: deedCheck.isDisputed,
                  revenueStatus: deedCheck.isDisputed ? 'Disputed' : 'Clear',
                }
              : p.deedRecord,
          };
        }
        return p;
      })
    );

    setSelectedParcel((prev) => {
      if (!prev || prev.id !== parcelId) return prev;
      const newPts = [...prev.boundaryPoints];
      newPts[vertexIndex] = newCoord;
      const liveTelemetry = calculateRealParcelTelemetry(
        newPts,
        prev.originalAiBoundaryPoints,
        prev.acres
      );
      const deedCheck = prev.deedRecord
        ? calculateDeedDiscrepancy(liveTelemetry.acres, prev.deedRecord.deedAreaAcres)
        : null;

      return {
        ...prev,
        boundaryPoints: newPts,
        acres: liveTelemetry.acres,
        sqft: liveTelemetry.sqft,
        verificationStatus: 'corrected',
        confidence: 99.8,
        deedRecord: prev.deedRecord && deedCheck
          ? {
              ...prev.deedRecord,
              discrepancyIndexPercentage: deedCheck.discrepancyPercentage,
              encroachmentDetected: deedCheck.isDisputed,
              revenueStatus: deedCheck.isDisputed ? 'Disputed' : 'Clear',
            }
          : prev.deedRecord,
      };
    });
  };

  // DharNav Loop: Surveyor submits boundary correction and reason
  const handleApplySurveyorCorrection = (correction: {
    displacementMeters: number;
    deltaShiftPercent: { dx: number; dy: number };
    reason: CorrectionReason;
    notes: string;
  }) => {
    if (!correctionTargetParcel) return;

    const REASON_LABELS: Record<CorrectionReason, string> = {
      wall_fence_not_detected: 'Wall / fence not detected',
      shadow_false_boundary: 'Shadow caused false boundary',
      vegetation_blocked_boundary: 'Vegetation blocked the boundary',
      cadastral_record_differs: 'Existing cadastral record differs',
      ai_segmentation_error: 'AI segmentation error',
      other: 'Other survey discrepancy',
    };

    const updatedBoundaryPoints = correctionTargetParcel.boundaryPoints.map((pt, i) => {
      if (i === 1 || i === 2) {
        return {
          x: Math.min(100, Math.max(0, pt.x + correction.deltaShiftPercent.dx)),
          y: Math.min(100, Math.max(0, pt.y + correction.deltaShiftPercent.dy)),
        };
      }
      return pt;
    });

    const newRecord: SurveyorCorrectionRecord = {
      id: `corr-${Date.now()}`,
      parcelId: correctionTargetParcel.id,
      parcelCode: correctionTargetParcel.code,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      surveyorName: 'District Cadastral Surveyor',
      originalPoints: [...correctionTargetParcel.boundaryPoints],
      correctedPoints: updatedBoundaryPoints,
      displacementMeters: correction.displacementMeters,
      primaryReason: correction.reason,
      reasonLabel: REASON_LABELS[correction.reason],
      notes: correction.notes,
      modelWeightUpdated: true,
      terrainContext: `${correctionTargetParcel.address} - Corrected ${correction.displacementMeters}m shift`,
    };

    const updatedParcels = parcels.map((p) => {
      if (p.id === correctionTargetParcel.id) {
        return {
          ...p,
          confidence: 99.8,
          verificationStatus: 'corrected' as const,
          aiReliabilityTier: 'high' as const,
          boundaryPoints: updatedBoundaryPoints,
          colorTheme: '#0284c7',
          correctionHistory: [...(p.correctionHistory || []), newRecord],
        };
      }
      return p;
    });

    setParcels(updatedParcels);
    setSelectedParcel(updatedParcels.find((p) => p.id === correctionTargetParcel.id) || null);
    setCorrectionRecords((prev) => [newRecord, ...prev]);
    setIsCorrectionModalOpen(false);
  };

  // Digital Twin: Add new simulated construction to target parcel
  const handleAddSimulation = (sim: SimulatedConstruction) => {
    const targetId = sim.parcelId;
    const updatedParcels = (parcels.length > 0 ? parcels : INITIAL_SAMPLE_PARCELS).map((p) => {
      if (p.id === targetId) {
        return {
          ...p,
          simulations: [...(p.simulations || []), sim],
        };
      }
      return p;
    });

    setParcels(updatedParcels);
    setSelectedParcel(updatedParcels.find((p) => p.id === targetId) || null);
    setIsWhatIfModalOpen(false);
  };

  // Digital Twin: Update building height / stories for 3D extrusion
  const handleUpdateStories = (simId: string, stories: number) => {
    setParcels((prev) =>
      prev.map((p) => ({
        ...p,
        simulations: (p.simulations || []).map((s) =>
          s.id === simId ? { ...s, heightStories: stories } : s
        ),
      }))
    );
  };

  // Digital Twin: Remove simulated construction
  const handleRemoveSimulation = (parcelId: string, simId: string) => {
    const updatedParcels = parcels.map((p) => {
      if (p.id === parcelId) {
        return {
          ...p,
          simulations: (p.simulations || []).filter((s) => s.id !== simId),
        };
      }
      return p;
    });

    setParcels(updatedParcels);
    if (selectedParcel && selectedParcel.id === parcelId) {
      setSelectedParcel(updatedParcels.find((p) => p.id === parcelId) || null);
    }
  };

  // Export Digital Twin Impact Analysis Report
  const handleExportSimulationReport = (parcel: CadastralParcel) => {
    const reportData = {
      reportType: 'DharNav Cadastral Digital Twin Impact Analysis',
      generatedAt: new Date().toISOString(),
      parcel: {
        code: parcel.code,
        pin: parcel.pin,
        address: parcel.address,
        zoning: parcel.zoning,
        totalAcres: parcel.acres,
        totalSqFt: parcel.sqft,
      },
      simulationsCount: (parcel.simulations || []).length,
      simulations: parcel.simulations || [],
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digital-twin-report-${parcel.code}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1-Click "Snap Boundary to Registered Deed" Auto-Reconciliation Handler
  const handleSnapBoundaryToDeed = (parcelId: string) => {
    const target = parcels.find((p) => p.id === parcelId);
    if (!target || !target.deedRecord || !target.deedRecord.deedBoundaryPoints) return;

    const deedPoints = target.deedRecord.deedBoundaryPoints;
    const deedAcres = target.deedRecord.deedAreaAcres;
    const deedSqFt = Math.round(deedAcres * 43560);

    const newCorrectionRecord: SurveyorCorrectionRecord = {
      id: `corr-snap-${Date.now()}`,
      parcelId: target.id,
      parcelCode: target.code,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      surveyorName: 'District Cadastral Surveyor (Auto-Reconcile)',
      originalPoints: [...target.boundaryPoints],
      correctedPoints: [...deedPoints],
      displacementMeters: 1.2,
      primaryReason: 'cadastral_record_differs',
      reasonLabel: 'Existing cadastral record differs',
      notes: `Boundary snapped directly to registered deed line ${target.deedRecord.khasraPattaNumber}. Title discrepancy cleared from ${target.deedRecord.discrepancyIndexPercentage}% to 0.0%.`,
      modelWeightUpdated: true,
      terrainContext: `${target.address} - Auto-reconciled with official revenue patta`,
    };

    setParcels((prev) =>
      prev.map((p) => {
        if (p.id === parcelId) {
          return {
            ...p,
            boundaryPoints: deedPoints,
            acres: deedAcres,
            sqft: deedSqFt,
            confidence: 99.9,
            verificationStatus: 'corrected',
            colorTheme: '#0284c7',
            deedRecord: {
              ...p.deedRecord!,
              encroachmentDetected: false,
              revenueStatus: 'Clear',
              discrepancyIndexPercentage: 0.0,
              disputeNotes: `Boundary reconciled to registered deed (${target.deedRecord!.khasraPattaNumber}) on ${new Date().toLocaleDateString()}. Discrepancy cleared.`,
            },
            correctionHistory: [...(p.correctionHistory || []), newCorrectionRecord],
          };
        }
        return p;
      })
    );

    setSelectedParcel((prev) => {
      if (!prev || prev.id !== parcelId) return prev;
      return {
        ...prev,
        boundaryPoints: deedPoints,
        acres: deedAcres,
        sqft: deedSqFt,
        confidence: 99.9,
        verificationStatus: 'corrected',
        colorTheme: '#0284c7',
        deedRecord: {
          ...prev.deedRecord!,
          encroachmentDetected: false,
          revenueStatus: 'Clear',
          discrepancyIndexPercentage: 0.0,
          disputeNotes: `Boundary reconciled to registered deed (${target.deedRecord!.khasraPattaNumber}) on ${new Date().toLocaleDateString()}. Discrepancy cleared.`,
        },
        correctionHistory: [...(prev.correctionHistory || []), newCorrectionRecord],
      };
    });

    setCorrectionRecords((prev) => [newCorrectionRecord, ...prev]);

    setDeedResolutionToast(
      `Boundary for ${target.code} (${target.deedRecord.khasraPattaNumber}) snapped to registered deed line. Encroachment cleared (0.0% discrepancy).`
    );
    setTimeout(() => {
      setDeedResolutionToast(null);
    }, 5000);
  };

  // Reset workspace
  const handleClearDronePlayground = () => {
    setActiveImageUrl(null);
    setImageMeta(null);
    setParcels([]);
    setIdentifiedFeatures([]);
    setSelectedParcel(null);
  };

  // Export Vector GeoJSON
  const handleExportGeoJson = () => {
    if (parcels.length === 0) return;

    const geojson = {
      type: 'FeatureCollection',
      metadata: {
        system: 'DharNav AI Cadastral Platform',
        timestamp: new Date().toISOString(),
        surveyName: imageMeta?.name || 'Drone Orthomosaic Survey',
        feedbackRecordsCount: correctionRecords.length,
      },
      features: parcels.map((parcel) => ({
        type: 'Feature',
        properties: {
          pin: parcel.pin,
          code: parcel.code,
          address: parcel.address,
          zoning: parcel.zoning,
          acres: parcel.acres,
          sqft: parcel.sqft,
          taxAssessment: parcel.taxAssessment,
          confidence: parcel.confidence,
          verificationStatus: parcel.verificationStatus || 'verified',
          aiReliabilityTier: parcel.aiReliabilityTier || 'high',
          simulatedStructuresCount: (parcel.simulations || []).length,
          deedStatus: parcel.deedRecord?.revenueStatus || 'Clear',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              ...parcel.boundaryPoints.map((p) => [
                -122.4194 + (p.x - 50) * 0.0001,
                37.7749 + (50 - p.y) * 0.0001,
              ]),
              [
                -122.4194 + (parcel.boundaryPoints[0].x - 50) * 0.0001,
                37.7749 + (50 - parcel.boundaryPoints[0].y) * 0.0001,
              ],
            ],
          ],
        },
      })),
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dharnav-cadastre-parcels-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Application Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          {/* Left Side: Brand Logo + Dashboard + Calculators Menu Bar */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto py-1 scrollbar-none">
            {/* Brand Logo & Name */}
            <div 
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 cursor-pointer shrink-0"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-base text-slate-900 tracking-tight">
                    DharNav
                  </h1>
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hidden xl:inline-block">
                    Digital Twin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden md:block leading-tight">
                  Cadastral GIS
                </p>
              </div>
            </div>

            <div className="w-px h-6 bg-slate-200 hidden sm:block shrink-0" />

            {/* Dashboard Button */}
            <button
              id="tab-home"
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border shrink-0 ${
                activeTab === 'home'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Dashboard Overview"
            >
              <HomeIcon className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            {/* Navigation Menu Bar: Land Revenue Tax & Boundary Price Calculators */}
            <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/90 shadow-2xs shrink-0">
              <button
                id="btn-nav-revenue-tax"
                onClick={() => {
                  setActiveValuationTab('revenue_tax');
                  setIsValuationSuiteOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-white transition-all shadow-2xs group whitespace-nowrap"
                title="Open Land Revenue Calculator & Tax Generator"
              >
                <Landmark className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-105 transition-transform" />
                <span>Land Revenue & Tax</span>
              </button>

              <div className="w-px h-3.5 bg-slate-300/80 mx-0.5 hidden sm:block" />

              <button
                id="btn-nav-boundary-price"
                onClick={() => {
                  setActiveValuationTab('boundary_price');
                  setIsValuationSuiteOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-teal-600 hover:bg-white transition-all shadow-2xs group whitespace-nowrap"
                title="Open Boundary Demarcation & Land Price Calculator"
              >
                <Calculator className="w-3.5 h-3.5 text-teal-600 group-hover:scale-105 transition-transform" />
                <span>Boundary & Price Calc</span>
              </button>
            </div>
          </div>

          {/* Right Side: Clear Button (if active) & Premium Locked Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {activeTab === 'drone-images' && activeImageUrl && (
              <button
                id="btn-clear-playground"
                onClick={handleClearDronePlayground}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
                title="Clear playground to empty state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}

            {/* Premium Logo / Button with Lock for Special Features */}
            <button
              id="btn-nav-premium-lock"
              onClick={() => setIsPremiumModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/30 text-amber-900 border border-amber-300/80 rounded-xl text-xs font-extrabold shadow-2xs transition-all hover:scale-102 group cursor-pointer"
              title="DharNav Premium & Enterprise Features (Locked)"
            >
              <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-xs group-hover:rotate-12 transition-transform">
                <Crown className="w-3 h-3 text-slate-950" />
              </div>
              <span className="tracking-tight">Premium</span>
              <span className="p-0.5 rounded bg-amber-200/80 text-amber-800 ml-0.5">
                <Lock className="w-2.5 h-2.5" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
        {/* Offline Field Sync Bar */}
        <OfflineFieldSyncBar 
          parcels={parcels.length > 0 ? parcels : INITIAL_SAMPLE_PARCELS}
          onCacheParcels={() => {}}
        />

        {/* VARAI AI Active Spatial Filter Notification Banner */}
        {varaiFilteredParcelIds && (
          <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white p-3.5 rounded-2xl border border-purple-500/40 shadow-lg flex items-center justify-between text-xs animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-pink-300 font-display">VARAI AI Map Filter Active</span>
                <p className="text-[11px] text-slate-300">
                  Showing {varaiFilteredParcelIds.length} of {parcels.length > 0 ? parcels.length : INITIAL_SAMPLE_PARCELS.length} parcels matching your natural language query.
                </p>
              </div>
            </div>
            <button
              id="btn-banner-reset-varai-filter"
              onClick={() => {
                setVaraiFilteredParcelIds(null);
                setVaraiHighlightedParcelIds([]);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors shadow-2xs"
            >
              Reset Map Filter
            </button>
          </div>
        )}

        {/* Deed Auto-Resolution Notification Toast */}
        {deedResolutionToast && (
          <div className="bg-emerald-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
              <span>{deedResolutionToast}</span>
            </div>
            <button
              onClick={() => setDeedResolutionToast(null)}
              className="text-emerald-200 hover:text-white text-xs font-bold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Analyzing banner indicator */}
        {isAnalyzing && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center gap-3 animate-pulse shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Processing Aerial Orthomosaic
              </h4>
              <p className="text-xs text-blue-700 font-medium">{analysisStatusText}</p>
            </div>
          </div>
        )}

        {/* Tab 0: Home Overview */}
        {activeTab === 'home' && (
          <HomeOverview
            onNavigateToDrone={(openUpload = false) => {
              setActiveTab('drone-images');
              if (openUpload) {
                setIsUploadDialogOpen(true);
              }
            }}
            onNavigateToMaps={() => setActiveTab('google-maps')}
            onUploadImageFromComputer={(base64, file) => {
              handleUploadCustomImage(base64, file);
              setActiveTab('drone-images');
            }}
            onSelectSamplePreset={(presetId) => {
              handleSelectPreset(presetId);
              setActiveTab('drone-images');
            }}
          />
        )}

        {/* Tab 1: Cadastral Digital Twin + What-If Simulator */}
        {activeTab === 'digital-twin' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <DigitalTwinSimulatorView
              parcels={parcels.length > 0 ? parcels : INITIAL_SAMPLE_PARCELS}
              selectedParcel={selectedParcel || INITIAL_SAMPLE_PARCELS[1]}
              onSelectParcel={(p) => {
                setSelectedParcel(p);
                if (!activeImageUrl) {
                  handleSelectPreset(SAMPLE_DRONE_IMAGES[0].id);
                }
              }}
              onOpenWhatIfModal={(p) => {
                setWhatIfTargetParcel(p);
                setIsWhatIfModalOpen(true);
              }}
              onRemoveSimulation={handleRemoveSimulation}
              onExportReport={handleExportSimulationReport}
              onViewOnDroneMap={(p) => {
                setSelectedParcel(p);
                if (!activeImageUrl) {
                  handleSelectPreset(SAMPLE_DRONE_IMAGES[0].id);
                }
                setViewMode('digital_twin');
                setActiveTab('drone-images');
              }}
            />
          </div>
        )}

        {/* Tab 2: AI Self-Verification Loop & Model Learning Map Dashboard */}
        {activeTab === 'dharnav-loop' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <DharNavLearningDashboard
              parcels={parcels.length > 0 ? parcels : INITIAL_SAMPLE_PARCELS}
              correctionRecords={correctionRecords}
              onSelectParcel={(parcel) => {
                setSelectedParcel(parcel);
                if (!activeImageUrl) {
                  handleSelectPreset(SAMPLE_DRONE_IMAGES[0].id);
                }
                setActiveTab('drone-images');
              }}
              onOpenCorrectionModal={(parcel) => {
                setCorrectionTargetParcel(parcel);
                setIsCorrectionModalOpen(true);
              }}
              onRetrainModelWeights={() => {
                const upgradedParcels = (parcels.length > 0 ? parcels : INITIAL_SAMPLE_PARCELS).map((p) => ({
                  ...p,
                  confidence: Math.min(99.9, p.confidence + 5.5),
                  aiReliabilityTier: 'high' as const,
                }));
                setParcels(upgradedParcels);
              }}
              onExportLearningData={() => {
                const payload = {
                  title: 'DharNav AI Self-Verification Learned Feedback Dataset',
                  exportDate: new Date().toISOString(),
                  totalRecords: correctionRecords.length,
                  correctionRecords,
                  activeParcelsCount: (parcels.length > 0 ? parcels : INITIAL_SAMPLE_PARCELS).length,
                };
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `dharnav-learning-feedback-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            />
          </div>
        )}

        {/* Tab 3: Google Maps with Automatic Live Geolocation */}
        {activeTab === 'google-maps' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <GoogleMapsCadastreView
              parcels={hasClearedGoogleMaps ? parcels : (parcels.length > 0 ? parcels : INITIAL_SAMPLE_PARCELS)}
              selectedParcel={selectedParcel}
              onSelectParcel={setSelectedParcel}
              filteredParcelIds={varaiFilteredParcelIds}
              highlightedParcelIds={varaiHighlightedParcelIds}
              onResetFilter={() => {
                setVaraiFilteredParcelIds(null);
                setVaraiHighlightedParcelIds([]);
              }}
              onUpdateParcels={(updatedList) => {
                setParcels(updatedList);
                if (updatedList.length > 0) {
                  setHasClearedGoogleMaps(false);
                }
              }}
              onClearMap={() => {
                setParcels([]);
                setSelectedParcel(null);
                setHasClearedGoogleMaps(true);
              }}
              onInspectInDroneView={(p) => {
                setSelectedParcel(p);
                if (!activeImageUrl) {
                  handleSelectPreset(SAMPLE_DRONE_IMAGES[0].id);
                }
                setActiveTab('drone-images');
              }}
              onSimulateInDigitalTwin={(p) => {
                setSelectedParcel(p);
                setWhatIfTargetParcel(p);
                setActiveTab('digital-twin');
              }}
            />
          </div>
        )}

        {/* Tab 4: Drone Images Workspace */}
        {activeTab === 'drone-images' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {!activeImageUrl ? (
              <EmptyDronePlayground
                onOpenUploadDialog={() => setIsUploadDialogOpen(true)}
                onSelectSamplePreset={handleSelectPreset}
              />
            ) : (
              <div className="space-y-4">
                <ViewModeToolbar
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  telemetryOpacity={telemetryOpacity}
                  onOpacityChange={setTelemetryOpacity}
                  showLabels={showLabels}
                  onToggleLabels={() => setShowLabels(!showLabels)}
                  isVertexEditMode={isVertexEditMode}
                  onToggleVertexEdit={() => setIsVertexEditMode(!isVertexEditMode)}
                />

                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  <div className="flex-1 w-full space-y-4">
                    <DroneCanvasViewer
                      imageUrl={activeImageUrl}
                      viewMode={viewMode}
                      parcels={parcels}
                      identifiedFeatures={identifiedFeatures}
                      selectedParcel={selectedParcel}
                      onSelectParcel={setSelectedParcel}
                      filteredParcelIds={varaiFilteredParcelIds}
                      highlightedParcelIds={varaiHighlightedParcelIds}
                      onResetFilter={() => {
                        setVaraiFilteredParcelIds(null);
                        setVaraiHighlightedParcelIds([]);
                      }}
                      telemetryOpacity={telemetryOpacity}
                      showLabels={showLabels}
                      activeFeatureFilter={activeFeatureFilter}
                      onSelectFeatureFilter={setActiveFeatureFilter}
                      isVertexEditMode={isVertexEditMode}
                      onUpdateParcelVertex={handleUpdateParcelVertex}
                      sunAzimuth={sunAzimuth}
                      sunElevation={sunElevation}
                      onOpenCorrectionModal={(p) => {
                        setCorrectionTargetParcel(p);
                        setIsCorrectionModalOpen(true);
                      }}
                      onOpenWhatIfModal={(p) => {
                        setWhatIfTargetParcel(p);
                        setIsWhatIfModalOpen(true);
                      }}
                    />

                    {/* Volumetric 3D Sun & Shadow Panel when in 3D Mode */}
                    {viewMode === 'volumetric_3d' && selectedParcel && (
                      <Volumetric3DPanel
                        parcel={selectedParcel}
                        simulations={selectedParcel.simulations || []}
                        sunAzimuth={sunAzimuth}
                        sunElevation={sunElevation}
                        onSunAzimuthChange={setSunAzimuth}
                        onSunElevationChange={setSunElevation}
                        onUpdateStories={handleUpdateStories}
                      />
                    )}

                    {/* Deed Conflict Panel when in Deed Conflict Mode */}
                    {viewMode === 'deed_conflict' && selectedParcel && (
                      <DeedConflictPanel
                        parcel={selectedParcel}
                        onOpenReportModal={(p) => {
                          setCertificateTargetParcel(p);
                          setIsCertificateModalOpen(true);
                        }}
                        onInspectDeedOverlay={() => {}}
                        onSnapToDeed={handleSnapBoundaryToDeed}
                        onOpenPetitionModal={(p) => {
                          setPetitionTargetParcel(p);
                          setIsPetitionModalOpen(true);
                        }}
                      />
                    )}

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                      <div className="flex items-center gap-4">
                        <span>
                          <strong className="text-slate-800">Ground Sampling:</strong>{' '}
                          {imageMeta?.resolution || '2.8 cm/px'}
                        </span>
                        <span>
                          <strong className="text-slate-800">Flight Altitude:</strong>{' '}
                          {imageMeta?.altitude || '100m AGL'}
                        </span>
                        <span>
                          <strong className="text-slate-800">Format:</strong>{' '}
                          {imageMeta?.format || 'GeoTIFF'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-indigo-600 font-bold flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                          <Building2 className="w-3.5 h-3.5" />
                          Digital Twin Enabled
                        </span>
                      </div>
                    </div>
                  </div>

                  <CadastreTelemetrySidebar
                    parcels={parcels}
                    selectedParcel={selectedParcel}
                    onSelectParcel={setSelectedParcel}
                    onExportGeoJson={handleExportGeoJson}
                    isVertexEditMode={isVertexEditMode}
                    onToggleVertexEdit={() => setIsVertexEditMode(!isVertexEditMode)}
                    onOpenCertificateModal={(p) => {
                      setCertificateTargetParcel(p);
                      setIsCertificateModalOpen(true);
                    }}
                    onOpenCorrectionModal={(p) => {
                      setCorrectionTargetParcel(p);
                      setIsCorrectionModalOpen(true);
                    }}
                    onOpenWhatIfModal={(p) => {
                      setWhatIfTargetParcel(p);
                      setIsWhatIfModalOpen(true);
                    }}
                    onSnapToDeed={handleSnapBoundaryToDeed}
                    onOpenPetitionModal={(p) => {
                      setPetitionTargetParcel(p);
                      setIsPetitionModalOpen(true);
                    }}
                    totalAreaAcres={parcels.reduce((acc, p) => acc + p.acres, 0)}
                    segmentationIoU={99.4}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Upload Custom Drone Image Dialog */}
      <UploadDroneDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUploadCustomImage={handleUploadCustomImage}
        onSelectSamplePreset={handleSelectPreset}
        isAnalyzing={isAnalyzing}
      />

      {/* DharNav Surveyor Correction Modal */}
      <SurveyorCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        parcel={correctionTargetParcel}
        onSubmitCorrection={handleApplySurveyorCorrection}
      />

      {/* Digital Twin: What-If Proposed Construction Modal */}
      <WhatIfSimulatorModal
        isOpen={isWhatIfModalOpen}
        onClose={() => setIsWhatIfModalOpen(false)}
        parcel={whatIfTargetParcel}
        onApplySimulation={handleAddSimulation}
      />

      {/* Official Municipal Cadastral Certificate Modal */}
      {certificateTargetParcel && (
        <CadastralCertificateModal
          isOpen={isCertificateModalOpen}
          onClose={() => setIsCertificateModalOpen(false)}
          parcel={certificateTargetParcel}
          correctionHistory={correctionRecords}
        />
      )}

      {/* Formal Deed Rectification & Dispute Resolution Petition Modal */}
      <DeedRectificationPetitionModal
        isOpen={isPetitionModalOpen}
        onClose={() => setIsPetitionModalOpen(false)}
        parcel={petitionTargetParcel}
        onSnapToDeed={handleSnapBoundaryToDeed}
      />

      {/* Land Revenue Tax & Boundary Price Calculator Suite Modal */}
      <ValuationSuiteModal
        isOpen={isValuationSuiteOpen}
        activeSuiteTab={activeValuationTab}
        onClose={() => setIsValuationSuiteOpen(false)}
        parcels={parcels.length > 0 ? parcels : INITIAL_SAMPLE_PARCELS}
        selectedParcel={selectedParcel}
        onSelectParcel={setSelectedParcel}
      />

      {/* DharNav Premium & Locked Features Modal */}
      <PremiumLockedFeaturesModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
      />

      {/* Floating Action Button (FAB) for VARAI AI Chatbot */}
      {!isVaraiChatOpen && (
        <button
          id="btn-floating-varai-chat"
          onClick={() => setIsVaraiChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-slate-950 text-white rounded-2xl shadow-2xl hover:shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-3 border border-indigo-500/40 group ring-4 ring-indigo-500/10"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xs group-hover:rotate-12 transition-transform">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-extrabold flex items-center gap-1.5 leading-tight font-display">
              <span>VARAI AI</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-slate-300 font-medium">Cadastral GIS Chatbot</div>
          </div>
        </button>
      )}

      {/* VARAI.ai Cadastral GIS Chatbot Drawer */}
      <VaraiChatDrawer
        isOpen={isVaraiChatOpen}
        onClose={() => setIsVaraiChatOpen(false)}
        parcels={parcels.length > 0 ? parcels : INITIAL_SAMPLE_PARCELS}
        selectedParcel={selectedParcel}
        onSelectParcel={setSelectedParcel}
        onFilterParcels={(ids) => setVaraiFilteredParcelIds(ids)}
        onHighlightParcels={(ids) => setVaraiHighlightedParcelIds(ids)}
        activeFilterIds={varaiFilteredParcelIds}
        activeHighlightIds={varaiHighlightedParcelIds}
        onNavigateTab={(tab) => setActiveTab(tab)}
        activeTab={activeTab}
      />
    </div>
  );
}
