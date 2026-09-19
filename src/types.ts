export interface CadastralParcel {
  id: string;
  pin: string; // Property Identification Number (e.g., 08-24-102-004)
  code: string; // e.g., P-101
  address: string;
  zoning: string; // e.g., M-2 Heavy Industrial / Logistics
  acres: number;
  sqft: number;
  confidence: number; // e.g., 72.4 (may be lower triggering self-verification flag)
  structuresDetected: number;
  taxAssessment: number;
  boundaryPoints: { x: number; y: number }[]; // In normalized coordinates 0-100% of the image/frame
  originalAiBoundaryPoints?: { x: number; y: number }[]; // Snapshot before surveyor correction
  latLngPoints?: { lat: number; lng: number }[]; // Real-world geographic GPS coordinates (latitude, longitude)
  latLngBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  isManual?: boolean; // Flag if manually drawn by surveyor
  colorTheme: string; // hex or tailwind tone for outline/fill
  identifiedFeatures: IdentifiedFeature[];
  
  // DharNav AI Self-Verification & Correction state
  verificationStatus?: 'verified' | 'needs_review' | 'corrected' | 're_checked';
  correctionHistory?: SurveyorCorrectionRecord[];
  aiReliabilityTier?: 'high' | 'occasional' | 'frequent_error'; // 🟢 🟡 🔴

  // Digital Twin Proposed Changes
  simulations?: SimulatedConstruction[];

  // Legal Cadastral Deed & Revenue Record Alignment (Feature 2)
  deedRecord?: LegalDeedRecord;
}

export interface DeedProblemSolution {
  id: string;
  remedyType: 'snap_to_deed' | 'deed_rectification_petition' | 'compounding_noc' | 'joint_demarcation' | 'buffer_setback_retraction';
  title: string;
  preferred: boolean;
  summary: string;
  actionLabel: string;
  statutoryReference: string;
  competentAuthority: string;
  estimatedTimeline: string;
  proceduralSteps: string[];
  requiredDocuments: string[];
}

export interface LegalDeedRecord {
  khasraPattaNumber: string; // e.g. "Khasra #142/8B"
  registeredOwner: string; // e.g. "Arjun Logistics Ltd."
  registrationDate: string; // e.g. "12-Oct-2018"
  deedAreaAcres: number;
  revenueStatus: 'Clear' | 'Disputed' | 'Easement Burdened';
  encroachmentDetected: boolean;
  encroachmentType?: 'road_right_of_way' | 'neighbor_boundary' | 'green_buffer' | 'area_drift' | 'setback_infringement';
  encroachmentAreaSqFt?: number;
  encroachmentAreaM2?: number;
  discrepancyIndexPercentage?: number; // % mismatch between deed and drone perimeter
  disputeNotes?: string;
  deedBoundaryPoints?: { x: number; y: number }[];

  // Preferred & Referred Solutions
  preferredSolution?: DeedProblemSolution;
  alternativeSolutions?: DeedProblemSolution[];
  resolutionNotes?: string;
}

export interface IdentifiedFeature {
  id: string;
  name: string;
  category: 'structure' | 'boundary' | 'road' | 'vegetation' | 'infrastructure' | 'water';
  confidence: number;
  details: string;
  polygon?: { x: number; y: number }[];
  center: { x: number; y: number };
}

export type CorrectionReason = 
  | 'wall_fence_not_detected'
  | 'shadow_false_boundary'
  | 'vegetation_blocked_boundary'
  | 'cadastral_record_differs'
  | 'ai_segmentation_error'
  | 'other';

export interface SurveyorCorrectionRecord {
  id: string;
  parcelId: string;
  parcelCode: string;
  timestamp: string;
  surveyorName: string;
  originalPoints: { x: number; y: number }[];
  correctedPoints: { x: number; y: number }[];
  displacementMeters: number; // e.g. 1.5m
  primaryReason: CorrectionReason;
  reasonLabel: string;
  notes: string;
  modelWeightUpdated: boolean;
  terrainContext: string; // e.g. "Tree canopy along eastern fence line"
}

// ==========================================
// CADASTRAL DIGITAL TWIN & WHAT-IF SIMULATOR
// ==========================================

export type SimulationBuildingType = 
  | 'warehouse' 
  | 'commercial_office' 
  | 'residential_duplex' 
  | 'solar_array' 
  | 'paved_parking' 
  | 'custom_footprint';

export interface SimulatedConstruction {
  id: string;
  parcelId: string;
  name: string;
  type: SimulationBuildingType;
  footprintPoints: { x: number; y: number }[]; // coordinates 0-100%
  widthMeters: number;
  lengthMeters: number;
  estimatedSqFt: number;
  heightStories: number;
  status: 'active' | 'archived';
  impactAnalysis: DigitalTwinImpactAnalysis;
  createdAt: string;

  // 3D Volumetric & Solar Shadow Simulation
  volumetric3D?: {
    heightMeters: number;
    sunAzimuthDegrees: number; // 0-360 (e.g. 215° Afternoon Sun)
    sunElevationAngle: number; // 10-85° (e.g. 42°)
    shadowLengthMeters: number;
    shadowPoints: { x: number; y: number }[];
    castsShadowOnNeighbors: boolean;
    solarIncidentLossPercentage: number; // % reduction on neighboring solar roofs
  };
}

export interface DigitalTwinImpactAnalysis {
  fitsInsideParcel: boolean; // ✅ / ❌
  crossesBoundary: boolean; // ❌ / ✅
  roadAccessStatus: 'clear' | 'impacted' | 'blocked'; // ✅ Clear / ⚠️ Possible Impact / ❌ Blocked
  roadAccessNotes: string;
  currentBuiltUpPercentage: number; // e.g. 35%
  proposedBuiltUpPercentage: number; // e.g. 68%
  maxPermissibleCoverage: number; // e.g. 60% based on zoning
  coverageExceeded: boolean;
  boundaryConflict: boolean;
  affectedFeatures: {
    featureName: string;
    category: string;
    severity: 'low' | 'moderate' | 'critical';
    details: string;
  }[];
  overallVerdict: 'approved' | 'conditional_warning' | 'rejected_conflict';
  recommendations: string[];
}

export interface DroneImageAnalysisResult {
  fileName: string;
  fileFormat: string;
  fileSizeKb: number;
  dimensions: { width: number; height: number };
  estimatedGroundSamplingDistance: string;
  flightAltitude: string;
  parcels: CadastralParcel[];
  identifiedFeatures: IdentifiedFeature[];
  telemetrySummary: {
    totalAreaAcres: number;
    totalParcelsCount: number;
    segmentationIoU: number;
    zoningSummary: string;
    surveyDate: string;
    verifiedCount: number;
    needsReviewCount: number;
  };
  rawAiDescription: string;
}

export type ImageViewMode =
  | 'original' // standard RGB orthomosaic
  | 'cadastral' // cadastral boundaries, lot labels & packet IDs
  | 'reliability' // DharNav Learning Map (🟢 High, 🟡 Occasional, 🔴 Frequent error)
  | 'digital_twin' // Digital Twin 🏙️ What-If Simulation View
  | 'segmentation' // feature classification masks (roofs, roads, green spaces)
  | 'contour' // LiDAR elevation contours & topo lines
  | 'thermal' // simulated thermal / infrared NDVI reflectance
  | 'split' // side-by-side / overlay slider
  | 'deed_conflict' // 🏛️ Deed vs Drone Encroachment Checker
  | 'volumetric_3d'; // 🏢 3D Volumetric Shadow & Sun Analysis

// ==========================================
// VARAI.ai CADASTRAL GIS CHATBOT INTERFACES
// ==========================================

export interface VaraiMatchingParcelItem {
  id: string;
  code: string;
  pin: string;
  acres: number;
  zoning: string;
  taxAssessment?: number;
  confidence?: number;
  deedStatus?: string;
  reason: string;
}

export interface VaraiChatMessage {
  id: string;
  sender: 'user' | 'varai';
  text: string;
  timestamp: string;
  matchCount?: number;
  matchingParcels?: VaraiMatchingParcelItem[];
  action?: {
    type: 'filter' | 'highlight' | 'select' | 'reset' | 'info';
    focusParcelId?: string | null;
    suggestedTab?: 'google-maps' | 'drone-images' | 'digital-twin' | null;
    filterActive?: boolean;
  };
}

