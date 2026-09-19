// DharNav Land Revenue, Tax Generation, Boundary Fencing & Price Valuation Engine

export interface LandRevenueParams {
  zoning: 'residential' | 'commercial' | 'industrial' | 'agricultural';
  acres: number;
  sqft: number;
  circleRatePerSqFt: number; // Government guidance value per sqft
  marketRatePerSqFt?: number;
  municipalZoneTier: 'Tier 1 Metro' | 'Tier 2 Urban' | 'Tier 3 Peri-Urban' | 'Rural / Gram Panchayat';
  hasLateFiling: boolean;
}

export interface LandRevenueTaxBreakdown {
  circleValuation: number;
  marketValuation: number;
  annualLandRevenueTax: number;
  municipalDevelopmentCess: number;
  drainageAndSanitationCess: number;
  educationAndInfrastructureCess: number;
  lateFilingPenalty: number;
  totalAnnualTaxPayable: number;
  stampDutyEstimate: number; // 6.5% typical for transfer
  registrationFeeEstimate: number; // 1%
  totalTransferDuty: number;
}

export interface TaxAssessmentChallan {
  challanNumber: string;
  assessmentYear: string;
  parcelPin: string;
  parcelCode: string;
  registeredOwner: string;
  address: string;
  zoning: string;
  landAreaAcres: number;
  landAreaSqFt: number;
  circleRatePerSqFt: number;
  taxableValuation: number;
  taxBreakdown: LandRevenueTaxBreakdown;
  dueDate: string;
  issuedDate: string;
  verificationHash: string;
}

export type FencingType = 
  | 'precast_concrete' 
  | 'chain_link' 
  | 'stone_masonry' 
  | 'barbed_wire' 
  | 'dgps_granite_pillars';

export interface FencingOptionInfo {
  id: FencingType;
  name: string;
  description: string;
  materialCostPerMeter: number; // in USD
  laborCostPerMeter: number;    // in USD
  pillarSpacingMeters: number;
  estimatedLifespanYears: number;
  recommendedZoning: string;
}

export const FENCING_OPTIONS: Record<FencingType, FencingOptionInfo> = {
  precast_concrete: {
    id: 'precast_concrete',
    name: 'Precast Reinforced Concrete Wall (6ft)',
    description: 'Heavy duty modular RCC precast slabs & slotted posts. High security & zero encroachment.',
    materialCostPerMeter: 55,
    laborCostPerMeter: 25,
    pillarSpacingMeters: 2.5,
    estimatedLifespanYears: 30,
    recommendedZoning: 'Industrial & High-Value Commercial',
  },
  chain_link: {
    id: 'chain_link',
    name: 'Galvanized Chain-Link Fence (6ft)',
    description: 'Hot-dipped galvanized mesh with heavy gauge GI pipes & tension wires. Anti-corrosive.',
    materialCostPerMeter: 28,
    laborCostPerMeter: 14,
    pillarSpacingMeters: 3.0,
    estimatedLifespanYears: 15,
    recommendedZoning: 'Commercial, Residential & Institutional',
  },
  stone_masonry: {
    id: 'stone_masonry',
    name: 'Dressed Stone Masonry Wall (7ft)',
    description: 'Granite/basalt rubble stone masonry with reinforced concrete coping and deep trench footing.',
    materialCostPerMeter: 75,
    laborCostPerMeter: 40,
    pillarSpacingMeters: 4.0,
    estimatedLifespanYears: 50,
    recommendedZoning: 'Perimeter Estates & Industrial Hubs',
  },
  barbed_wire: {
    id: 'barbed_wire',
    name: 'High-Tensile Barbed Wire Fence (5ft)',
    description: '5-strand high-tensile galvanized barbed wire mounted on reinforced concrete / steel angle posts.',
    materialCostPerMeter: 12,
    laborCostPerMeter: 8,
    pillarSpacingMeters: 3.5,
    estimatedLifespanYears: 10,
    recommendedZoning: 'Agricultural & Large Rural Landholdings',
  },
  dgps_granite_pillars: {
    id: 'dgps_granite_pillars',
    name: 'DGPS Survey Granite Boundary Monuments',
    description: 'State cadastral standard chiseled granite pillars (1.5m height) with engraved GIS benchmark pins.',
    materialCostPerMeter: 18,
    laborCostPerMeter: 9,
    pillarSpacingMeters: 15.0,
    estimatedLifespanYears: 75,
    recommendedZoning: 'Government Revenue Survey & Farmland Boundaries',
  },
};

export interface BoundaryDemarcationEstimate {
  perimeterMeters: number;
  perimeterLinearFeet: number;
  selectedFencing: FencingOptionInfo;
  gateCount: number;
  gateUnitCost: number;
  cornerPillarsCount: number;
  materialCost: number;
  laborCost: number;
  gateTotalCost: number;
  dgpsSurveyVerificationFee: number;
  contingencyAndPermits: number; // 5%
  totalBoundaryCost: number;
  estimatedCompletionDays: number;
}

export interface LandValuationParams {
  acres: number;
  sqft: number;
  baseMarketRatePerSqFt: number;
  circleRatePerSqFt: number;
  roadFrontageFeet: number;
  isCornerLot: boolean;
  hasDirectHighwayAccess: boolean;
  soilOrTopographyCondition: 'flat_prime' | 'moderate_slope' | 'wetland_buffer';
  clearTitleTier: 'A_unencumbered' | 'B_minor_encroachment' | 'C_disputed';
}

export interface LandValuationEstimate {
  baseMarketValuation: number;
  circleGuidanceValuation: number;
  roadFrontagePremium: number;
  cornerLotBonus: number;
  highwayAccessBonus: number;
  topographyAdjustment: number;
  titleClearanceAdjustment: number;
  netEstimatedMarketPrice: number;
  effectivePricePerSqFt: number;
  effectivePricePerAcre: number;
  governmentCircleGapPercentage: number;
  recommendationNote: string;
}

// -------------------------------------------------------------------------
// 1. LAND REVENUE & TAX CALCULATION ENGINE
// -------------------------------------------------------------------------
export function calculateLandRevenueTax(params: LandRevenueParams): LandRevenueTaxBreakdown {
  const { zoning, sqft, circleRatePerSqFt, marketRatePerSqFt, municipalZoneTier, hasLateFiling } = params;

  const circleValuation = Math.round(sqft * circleRatePerSqFt);
  const effectiveMarketRate = marketRatePerSqFt || (circleRatePerSqFt * 1.35);
  const marketValuation = Math.round(sqft * effectiveMarketRate);

  // Annual land revenue base tax rate based on zoning & municipal tier
  let baseTaxRate = 0.002; // 0.20%
  if (zoning === 'commercial') baseTaxRate = 0.0065; // 0.65%
  else if (zoning === 'industrial') baseTaxRate = 0.0048; // 0.48%
  else if (zoning === 'residential') baseTaxRate = 0.0035; // 0.35%
  else if (zoning === 'agricultural') baseTaxRate = 0.0008; // 0.08%

  // Tier multiplier
  let tierMultiplier = 1.0;
  if (municipalZoneTier === 'Tier 1 Metro') tierMultiplier = 1.3;
  else if (municipalZoneTier === 'Tier 2 Urban') tierMultiplier = 1.1;
  else if (municipalZoneTier === 'Tier 3 Peri-Urban') tierMultiplier = 0.9;
  else if (municipalZoneTier === 'Rural / Gram Panchayat') tierMultiplier = 0.6;

  const annualLandRevenueTax = Math.round(circleValuation * baseTaxRate * tierMultiplier);

  // Municipal Development Cess (15% of land revenue tax)
  const municipalDevelopmentCess = Math.round(annualLandRevenueTax * 0.15);

  // Drainage & Sanitation Surcharge (8%)
  const drainageAndSanitationCess = Math.round(annualLandRevenueTax * 0.08);

  // Education & Infrastructure Cess (7%)
  const educationAndInfrastructureCess = Math.round(annualLandRevenueTax * 0.07);

  // Late Filing Penalty (if applicable, 10% on tax + fixed surcharge)
  const lateFilingPenalty = hasLateFiling ? Math.round(annualLandRevenueTax * 0.10 + 75) : 0;

  const totalAnnualTaxPayable = 
    annualLandRevenueTax + 
    municipalDevelopmentCess + 
    drainageAndSanitationCess + 
    educationAndInfrastructureCess + 
    lateFilingPenalty;

  // Stamp duty and registration (on circle valuation)
  const stampDutyRate = zoning === 'commercial' ? 0.07 : 0.055;
  const stampDutyEstimate = Math.round(circleValuation * stampDutyRate);
  const registrationFeeEstimate = Math.round(circleValuation * 0.01);
  const totalTransferDuty = stampDutyEstimate + registrationFeeEstimate;

  return {
    circleValuation,
    marketValuation,
    annualLandRevenueTax,
    municipalDevelopmentCess,
    drainageAndSanitationCess,
    educationAndInfrastructureCess,
    lateFilingPenalty,
    totalAnnualTaxPayable,
    stampDutyEstimate,
    registrationFeeEstimate,
    totalTransferDuty,
  };
}

// -------------------------------------------------------------------------
// 2. OFFICIAL TAX CHALLAN & ASSESSMENT NOTICE GENERATOR
// -------------------------------------------------------------------------
export function generateTaxChallan(
  parcel: {
    pin: string;
    code: string;
    address: string;
    zoning: string;
    acres: number;
    sqft: number;
    deedRecord?: { registeredOwner?: string; khasraPattaNumber?: string };
  },
  params: {
    circleRatePerSqFt: number;
    municipalZoneTier: LandRevenueParams['municipalZoneTier'];
    hasLateFiling: boolean;
  }
): TaxAssessmentChallan {
  const normZoning: LandRevenueParams['zoning'] = 
    parcel.zoning.toLowerCase().includes('com') ? 'commercial' :
    parcel.zoning.toLowerCase().includes('ind') ? 'industrial' :
    parcel.zoning.toLowerCase().includes('agri') ? 'agricultural' : 'residential';

  const taxBreakdown = calculateLandRevenueTax({
    zoning: normZoning,
    acres: parcel.acres,
    sqft: parcel.sqft,
    circleRatePerSqFt: params.circleRatePerSqFt,
    municipalZoneTier: params.municipalZoneTier,
    hasLateFiling: params.hasLateFiling,
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const assessmentYear = `${currentYear}-${(currentYear + 1).toString().slice(2)}`;
  
  // Due date is 45 days ahead
  const due = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
  const dueDateStr = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const issuedDateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Generate deterministic Challan ID based on PIN & year
  const rawHash = `${parcel.pin}-${currentYear}-${params.circleRatePerSqFt}`;
  let hashNum = 0;
  for (let i = 0; i < rawHash.length; i++) {
    hashNum = (hashNum << 5) - hashNum + rawHash.charCodeAt(i);
    hashNum |= 0;
  }
  const challanNumber = `CHL-${currentYear}-${Math.abs(hashNum).toString().slice(0, 7).padStart(7, '4')}`;
  const verificationHash = `SHA256:0x${Math.abs(hashNum * 83921).toString(16).padStart(12, 'a')}...DHARNAV`;

  return {
    challanNumber,
    assessmentYear,
    parcelPin: parcel.pin,
    parcelCode: parcel.code,
    registeredOwner: parcel.deedRecord?.registeredOwner || 'Industrial Park Holdings LLC',
    address: parcel.address,
    zoning: parcel.zoning,
    landAreaAcres: parcel.acres,
    landAreaSqFt: parcel.sqft,
    circleRatePerSqFt: params.circleRatePerSqFt,
    taxableValuation: taxBreakdown.circleValuation,
    taxBreakdown,
    dueDate: dueDateStr,
    issuedDate: issuedDateStr,
    verificationHash,
  };
}

// -------------------------------------------------------------------------
// 3. PARCEL BOUNDARY DEMARCATION & FENCING COST ESTIMATOR
// -------------------------------------------------------------------------
export function calculateBoundaryFencingEstimate(
  perimeterMeters: number,
  fencingType: FencingType,
  gateCount: number = 1,
  includeDGPSVerification: boolean = true
): BoundaryDemarcationEstimate {
  const selectedFencing = FENCING_OPTIONS[fencingType];
  const perimeterLinearFeet = Math.round(perimeterMeters * 3.28084);

  // Subtract gate widths (approx 6 meters per heavy gate)
  const effectiveFenceLength = Math.max(0, perimeterMeters - (gateCount * 6));

  const materialCost = Math.round(effectiveFenceLength * selectedFencing.materialCostPerMeter);
  const laborCost = Math.round(effectiveFenceLength * selectedFencing.laborCostPerMeter);
  
  // Gate unit cost based on fencing type
  const gateUnitCost = fencingType === 'stone_masonry' ? 2400 :
                       fencingType === 'precast_concrete' ? 1800 :
                       fencingType === 'chain_link' ? 950 : 450;
  const gateTotalCost = gateCount * gateUnitCost;

  // Corner pillars (at least 4 for quadrilateral, 1 per 60m of perimeter)
  const cornerPillarsCount = Math.max(4, Math.ceil(perimeterMeters / 60));

  // Cadastral DGPS verification & benchmark monumentation
  const dgpsSurveyVerificationFee = includeDGPSVerification ? (450 + Math.round(perimeterMeters * 0.4)) : 0;

  // 5% statutory permits and contingency
  const subtotal = materialCost + laborCost + gateTotalCost + dgpsSurveyVerificationFee;
  const contingencyAndPermits = Math.round(subtotal * 0.05);

  const totalBoundaryCost = subtotal + contingencyAndPermits;
  
  // Estimated days: 15-25m per work crew per day
  const metersPerDay = fencingType === 'stone_masonry' ? 12 :
                       fencingType === 'precast_concrete' ? 25 :
                       fencingType === 'chain_link' ? 40 : 50;
  const estimatedCompletionDays = Math.max(3, Math.ceil(perimeterMeters / metersPerDay) + (gateCount * 2));

  return {
    perimeterMeters: Math.round(perimeterMeters),
    perimeterLinearFeet,
    selectedFencing,
    gateCount,
    gateUnitCost,
    cornerPillarsCount,
    materialCost,
    laborCost,
    gateTotalCost,
    dgpsSurveyVerificationFee,
    contingencyAndPermits,
    totalBoundaryCost,
    estimatedCompletionDays,
  };
}

// -------------------------------------------------------------------------
// 4. LAND MARKET PRICE & VALUATION CALCULATOR
// -------------------------------------------------------------------------
export function calculateLandValuation(params: LandValuationParams): LandValuationEstimate {
  const {
    acres,
    sqft,
    baseMarketRatePerSqFt,
    circleRatePerSqFt,
    roadFrontageFeet,
    isCornerLot,
    hasDirectHighwayAccess,
    soilOrTopographyCondition,
    clearTitleTier,
  } = params;

  const baseMarketValuation = Math.round(sqft * baseMarketRatePerSqFt);
  const circleGuidanceValuation = Math.round(sqft * circleRatePerSqFt);

  // Frontage premium: ratio of frontage feet to lot perimeter / depth
  // Up to +18% if road frontage is >= 200 feet
  let frontageMultiplier = 0;
  if (roadFrontageFeet >= 200) frontageMultiplier = 0.18;
  else if (roadFrontageFeet >= 120) frontageMultiplier = 0.12;
  else if (roadFrontageFeet >= 60) frontageMultiplier = 0.06;
  const roadFrontagePremium = Math.round(baseMarketValuation * frontageMultiplier);

  // Corner lot bonus: +10%
  const cornerLotBonus = isCornerLot ? Math.round(baseMarketValuation * 0.10) : 0;

  // Direct Highway access: +15%
  const highwayAccessBonus = hasDirectHighwayAccess ? Math.round(baseMarketValuation * 0.15) : 0;

  // Topography adjustment
  let topographyRate = 0;
  if (soilOrTopographyCondition === 'moderate_slope') topographyRate = -0.06;
  else if (soilOrTopographyCondition === 'wetland_buffer') topographyRate = -0.15;
  const topographyAdjustment = Math.round(baseMarketValuation * topographyRate);

  // Title clearance adjustment
  let titleRate = 0;
  if (clearTitleTier === 'B_minor_encroachment') titleRate = -0.08;
  else if (clearTitleTier === 'C_disputed') titleRate = -0.22;
  const titleClearanceAdjustment = Math.round(baseMarketValuation * titleRate);

  const netEstimatedMarketPrice = 
    baseMarketValuation + 
    roadFrontagePremium + 
    cornerLotBonus + 
    highwayAccessBonus + 
    topographyAdjustment + 
    titleClearanceAdjustment;

  const effectivePricePerSqFt = Math.round((netEstimatedMarketPrice / sqft) * 100) / 100;
  const effectivePricePerAcre = Math.round((netEstimatedMarketPrice / acres));

  const governmentCircleGapPercentage = Math.round(
    ((netEstimatedMarketPrice - circleGuidanceValuation) / circleGuidanceValuation) * 100
  );

  let recommendationNote = 'Fair market valuation aligns with regional prime industrial transactions.';
  if (clearTitleTier === 'C_disputed') {
    recommendationNote = 'Warning: Active deed boundary dispute triggers a ~22% market discount until revenue court regularization.';
  } else if (hasDirectHighwayAccess && isCornerLot) {
    recommendationNote = 'Prime strategic commercial parcel. Generates maximum frontage yield & premium capitalization.';
  }

  return {
    baseMarketValuation,
    circleGuidanceValuation,
    roadFrontagePremium,
    cornerLotBonus,
    highwayAccessBonus,
    topographyAdjustment,
    titleClearanceAdjustment,
    netEstimatedMarketPrice,
    effectivePricePerSqFt,
    effectivePricePerAcre,
    governmentCircleGapPercentage,
    recommendationNote,
  };
}
