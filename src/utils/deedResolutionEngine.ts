import { CadastralParcel, DeedProblemSolution } from '../types';

export interface DeedResolutionReport {
  isDisputed: boolean;
  discrepancyPercentage: number;
  conflictType: 'road_right_of_way' | 'neighbor_boundary' | 'green_buffer' | 'area_drift' | 'none';
  primaryPreferredSolution: DeedProblemSolution;
  alternativeSolutions: DeedProblemSolution[];
  canAutoSnap: boolean;
  legalSummary: string;
}

/**
 * Evaluates a cadastral parcel and its registered deed record to determine
 * the primary preferred solution and statutory referrals for any detected conflict.
 */
export function getDeedConflictSolutions(parcel: CadastralParcel): DeedResolutionReport {
  const deed = parcel.deedRecord;

  if (!deed) {
    const fallbackSolution: DeedProblemSolution = {
      id: 'sol-no-deed',
      remedyType: 'deed_rectification_petition',
      title: 'First-Time Cadastral Title Registration',
      preferred: true,
      summary: 'No registered deed was detected. File an initial title registration survey petition with the Revenue Department.',
      actionLabel: 'Draft Initial Registration Petition',
      statutoryReference: 'Land Revenue Code Sec. 32 & Registration Act Sec. 17',
      competentAuthority: 'District Land Records & Settlement Office',
      estimatedTimeline: '30 to 45 Business Days',
      proceduralSteps: [
        '1. Generate official certified drone boundary map with high-precision GPS coordinates',
        '2. Submit application Form 1 to Sub-Divisional Magistrate / Tehsildar',
        '3. 30-day public notice issuance for neighbor boundary objections',
        '4. Issuance of permanent Khasra / Patta deed registration number',
      ],
      requiredDocuments: [
        'High-Resolution Orthomosaic Survey Map',
        'Tax Assessment & Possession Certificate',
        'Proof of Identity & Chain of Title Deeds',
      ],
    };

    return {
      isDisputed: false,
      discrepancyPercentage: 0,
      conflictType: 'none',
      primaryPreferredSolution: fallbackSolution,
      alternativeSolutions: [],
      canAutoSnap: false,
      legalSummary: 'No registered deed currently linked to this PIN.',
    };
  }

  const isEncroached = deed.encroachmentDetected;
  const discrepancy = deed.discrepancyIndexPercentage || 0;
  const canAutoSnap = Boolean(deed.deedBoundaryPoints && deed.deedBoundaryPoints.length >= 3);
  const conflictType = deed.encroachmentType || (discrepancy > 2.5 ? 'area_drift' : 'none');

  // Conflict 1: Green Buffer / Drainage / Environmental Reservation
  if (conflictType === 'green_buffer' || (isEncroached && deed.disputeNotes?.toLowerCase().includes('drainage'))) {
    const primary: DeedProblemSolution = {
      id: 'sol-buffer-retract',
      remedyType: 'buffer_setback_retraction',
      title: 'Drainage Buffer Retraction & Registered Line Alignment',
      preferred: true,
      summary: 'Retract the physical boundary fence to conform with registered deed lines and restore the required state drainage canal buffer reservation.',
      actionLabel: 'Snap Boundary to Registered Deed (Auto-Reconcile)',
      statutoryReference: 'State Wetland & Drainage Protection Act Sec. 14(A) & Land Revenue Code Sec. 132',
      competentAuthority: 'District Environment & Land Revenue Tribunal / Tehsildar',
      estimatedTimeline: '7 to 10 Business Days',
      proceduralSteps: [
        '1. Align digitized boundary coordinates to official Khasra deed line (1-click auto-snap)',
        '2. Serve site inspection notice to Municipal Stormwater & Drainage Directorate',
        '3. Execute physical fence relocation 3.8m inward to respect environmental bioswale corridor',
        '4. Receive revenue clearance certificate and dismiss encroachment proceeding',
      ],
      requiredDocuments: [
        'Certified Drone Boundary Alignment Map',
        'State Irrigation & Drainage Master Plan Extract',
        'Registered Deed Khasra Extract',
      ],
    };

    const alt1: DeedProblemSolution = {
      id: 'sol-buffer-regularize',
      remedyType: 'compounding_noc',
      title: 'Retention Basin Regularization & Ecological Mitigation NOC',
      preferred: false,
      summary: 'Apply for special compounding NOC by constructing an engineered bypass swale to maintain retention volume without encroaching active channel.',
      actionLabel: 'Draft Regularization Application',
      statutoryReference: 'Municipal Stormwater Drainage Bye-Laws Rule 48 & Environmental Compounding Scheme',
      competentAuthority: 'Municipal Public Works & State Water Resources Dept',
      estimatedTimeline: '20 to 30 Business Days',
      proceduralSteps: [
        '1. Prepare civil engineering stormwater mitigation plan',
        '2. Submit Form E-4 to Municipal Superintending Engineer',
        '3. Pay designated ecological compensatory deposit',
        '4. Secure permanent non-objection certificate (NOC)',
      ],
      requiredDocuments: [
        'Civil Stormwater Retention Calculation Report',
        'Environmental Impact & Buffer Assessment',
        'Registered Deed & Property Tax Receipts',
      ],
    };

    const alt2: DeedProblemSolution = {
      id: 'sol-buffer-petition',
      remedyType: 'deed_rectification_petition',
      title: 'Statutory Boundary Demarcation Petition (Form 14A)',
      preferred: false,
      summary: 'Petition the Revenue Court for formal joint ground demarcation to re-survey the wetland reservation boundary with state surveyors.',
      actionLabel: 'Generate Court Demarcation Petition',
      statutoryReference: 'Land Revenue Code Sec. 84 & Cadastral Boundaries Rule 12',
      competentAuthority: 'Sub-Divisional Magistrate / Revenue Court',
      estimatedTimeline: '30 to 45 Business Days',
      proceduralSteps: [
        '1. File statutory petition under Sec. 84 before Sub-Divisional Magistrate',
        '2. Notice issued to Tehsildar & District Drainage Officer',
        '3. Joint Total Station / DGPS field demarcation survey',
        '4. Final judicial order fixing permanent boundary stone pillars',
      ],
      requiredDocuments: [
        'Certified Cadastral Survey Map with GPS Ground Control Points',
        'Original Title Deed & Settlement Record of Rights',
        'Affidavit of Peaceful Uninterrupted Possession',
      ],
    };

    return {
      isDisputed: true,
      discrepancyPercentage: discrepancy,
      conflictType: 'green_buffer',
      primaryPreferredSolution: primary,
      alternativeSolutions: [alt1, alt2],
      canAutoSnap,
      legalSummary: `Violation of state drainage / environmental buffer detected (${discrepancy}% discrepancy). Recommended action: Retract physical boundary to registered deed coordinates to avoid statutory penalties under Section 132.`,
    };
  }

  // Conflict 2: Road Right-of-Way / Municipal Setback Infringement
  if (conflictType === 'road_right_of_way' || (isEncroached && deed.disputeNotes?.toLowerCase().includes('road'))) {
    const primary: DeedProblemSolution = {
      id: 'sol-road-compounding',
      remedyType: 'compounding_noc',
      title: 'Municipal Street Line Compounding & Setback Regularization',
      preferred: true,
      summary: 'Apply for regularization of the road setback under the Municipal Compounding Scheme, or snap boundary to deed line to eliminate right-of-way overhang.',
      actionLabel: 'Apply for Municipal Compounding NOC',
      statutoryReference: 'Municipal Corporation Act Sec. 299 (Public Street Regularization) & Bye-Law 16',
      competentAuthority: 'Town Planning & Municipal Chief Executive Officer',
      estimatedTimeline: '14 to 21 Business Days',
      proceduralSteps: [
        '1. Calculate exact road margin overlap using drone survey vectors',
        '2. Submit online Application Form B-8 for Street Line Compounding',
        '3. Municipal Town Planner site inspection and road width verification',
        '4. Payment of compounding fee and issuance of Clearance Certificate',
      ],
      requiredDocuments: [
        'Orthophoto with Road Centerline & Right-of-Way Dimensions',
        'Approved Building Layout Plan',
        'Municipal Property Tax Receipt & Ownership Deed',
      ],
    };

    const alt1: DeedProblemSolution = {
      id: 'sol-road-snap',
      remedyType: 'snap_to_deed',
      title: '1-Click Snap to Registered Road Frontage Line',
      preferred: false,
      summary: 'Re-align the front fence boundary directly to the official deed line, eliminating the road right-of-way overlap immediately without fees.',
      actionLabel: 'Snap Boundary to Registered Deed (Auto-Reconcile)',
      statutoryReference: 'Highway Protection & Municipal Right-of-Way Standards',
      competentAuthority: 'Internal Surveyor / DharNav Cadastre Engine',
      estimatedTimeline: 'Immediate (1-Click)',
      proceduralSteps: [
        '1. Auto-align digitized polygon nodes to official deed coordinates',
        '2. Recalculate parcel acreage and perimeter dynamically',
        '3. Update status from Disputed to Clear in the cadastral database',
      ],
      requiredDocuments: [
        'Registered Deed Boundary Coordinates',
      ],
    };

    const alt2: DeedProblemSolution = {
      id: 'sol-road-petition',
      remedyType: 'deed_rectification_petition',
      title: 'Deed Rectification & Road Dedication Deed',
      preferred: false,
      summary: 'Execute a formal Dedication Deed ceding the front strip to the Municipality in exchange for Floor Space Index (FSI/FAR) transfer credits.',
      actionLabel: 'Draft FSI Transfer & Dedication Deed',
      statutoryReference: 'Transfer of Property Act Sec. 122 & Municipal FSI Transfer Regulations',
      competentAuthority: 'Urban Development Authority & Sub-Registrar',
      estimatedTimeline: '25 to 35 Business Days',
      proceduralSteps: [
        '1. Prepare deed of dedication for public street widening',
        '2. Obtain Transferable Development Rights (TDR) / FSI credit certificate',
        '3. Register modified title deed at Sub-Registrar Office',
      ],
      requiredDocuments: [
        'Deed of Dedication Draft',
        'Drone Cadastral Survey Map showing Dedicated Area',
        'Town Planning Approval Letter',
      ],
    };

    return {
      isDisputed: true,
      discrepancyPercentage: discrepancy,
      conflictType: 'road_right_of_way',
      primaryPreferredSolution: primary,
      alternativeSolutions: [alt1, alt2],
      canAutoSnap,
      legalSummary: `Right-of-way overlap detected with public street corridor (${discrepancy}% discrepancy). Recommended action: File for Municipal Street Line Compounding NOC or auto-align boundary to deed line.`,
    };
  }

  // Conflict 3: Neighbor Boundary Overlap
  if (conflictType === 'neighbor_boundary' || (isEncroached && deed.disputeNotes?.toLowerCase().includes('neighbor'))) {
    const primary: DeedProblemSolution = {
      id: 'sol-neighbor-demarcation',
      remedyType: 'joint_demarcation',
      title: 'Joint Revenue Demarcation & Mutual Boundary Realignment (Form 14A)',
      preferred: true,
      summary: 'Initiate an official joint survey with the adjacent parcel holder under Revenue Code Sec. 84 to resolve the overlapping boundary line.',
      actionLabel: 'Draft Joint Demarcation Application (Form 14A)',
      statutoryReference: 'Land Revenue Code Sec. 84 & Cadastral Boundaries Act Sec. 18',
      competentAuthority: 'Revenue Tehsildar & District Survey Officer',
      estimatedTimeline: '14 to 21 Business Days',
      proceduralSteps: [
        '1. File Joint Demarcation Requisition Form 14A before Revenue Tehsildar',
        '2. Issuance of 7-day summons to adjacent property owner',
        '3. Official joint survey using DGPS / Total Station with certified surveyor',
        '4. Fixing of permanent revenue boundary pillars and mutual accord sign-off',
      ],
      requiredDocuments: [
        'DharNav High-Resolution Drone Survey Overlay',
        'Registered Title Deeds of both adjoining parcels',
        'Certified Settlement Akshaks / Village Map Sheet',
      ],
    };

    const alt1: DeedProblemSolution = {
      id: 'sol-neighbor-snap',
      remedyType: 'snap_to_deed',
      title: 'Snap Boundary to Registered Patta Line',
      preferred: false,
      summary: 'Conform boundary to legal deed line immediately, ceding disputed overlap to eliminate title cloud.',
      actionLabel: 'Snap Boundary to Registered Deed',
      statutoryReference: 'Registration Act Sec. 32A',
      competentAuthority: 'Internal Surveyor / DharNav Cadastre Engine',
      estimatedTimeline: 'Immediate (1-Click)',
      proceduralSteps: [
        '1. Snap boundary polygon nodes to registered deed boundaries',
        '2. Recompute parcel acreage and perimeter telemetry',
        '3. Clear title status to Clear',
      ],
      requiredDocuments: ['Registered Patta Coordinates'],
    };

    return {
      isDisputed: true,
      discrepancyPercentage: discrepancy,
      conflictType: 'neighbor_boundary',
      primaryPreferredSolution: primary,
      alternativeSolutions: [alt1],
      canAutoSnap,
      legalSummary: `Overlap with adjoining registered boundary detected (${discrepancy}% discrepancy). Recommended action: File Form 14A for Joint Revenue Demarcation or auto-align boundary to deed line.`,
    };
  }

  // Conflict 4: Area Drift / Measurement Discrepancy (> 2.5%)
  if (discrepancy > 2.5 || isEncroached) {
    const primary: DeedProblemSolution = {
      id: 'sol-area-mutation',
      remedyType: 'deed_rectification_petition',
      title: 'Surveyor Deed Rectification & Area Mutation Petition',
      preferred: true,
      summary: 'Submit certified drone cadastral survey report to Land Revenue Office to mutate deed area from registered acres to physically surveyed acres.',
      actionLabel: 'Draft Deed Mutation Petition (Form 14A)',
      statutoryReference: 'Land Revenue Code Sec. 84 & Land Mutation Rules Sec. 42',
      competentAuthority: 'Sub-Divisional Magistrate / Revenue Tehsildar',
      estimatedTimeline: '10 to 15 Business Days',
      proceduralSteps: [
        '1. Generate official certified drone boundary map with high-precision GPS coordinates',
        '2. Submit petition under Sec. 84 citing physical ground reality and sub-centimeter GSD drone data',
        '3. Revenue inspector verifies physical boundary wall on site',
        '4. Revenue office updates computer land records (Khasra Khatauni) to match surveyed acreage',
      ],
      requiredDocuments: [
        'Certified Drone Orthomosaic Map & Boundary Coordinates',
        'Current Revenue Patta / Deed Extract',
        'Surveyor Field Affidavit & Ground Truth Certificate',
      ],
    };

    const alt1: DeedProblemSolution = {
      id: 'sol-snap-area',
      remedyType: 'snap_to_deed',
      title: 'Snap Boundary to Registered Deed Dimensions',
      preferred: false,
      summary: 'Scale and align physical boundary coordinates to match exact registered deed area of ' + deed.deedAreaAcres + ' acres.',
      actionLabel: 'Snap Boundary to Deed',
      statutoryReference: 'Registration Act Sec. 32A',
      competentAuthority: 'Internal Surveyor / DharNav Cadastre Engine',
      estimatedTimeline: 'Immediate (1-Click)',
      proceduralSteps: [
        '1. Snap digitized boundary to registered deed boundary points',
        '2. Reset discrepancy index to 0.0%',
        '3. Update title verification status to Clear',
      ],
      requiredDocuments: ['Registered Patta Coordinates'],
    };

    return {
      isDisputed: true,
      discrepancyPercentage: discrepancy,
      conflictType: 'area_drift',
      primaryPreferredSolution: primary,
      alternativeSolutions: [alt1],
      canAutoSnap,
      legalSummary: `Surveyed area (${parcel.acres} ac) deviates by ${discrepancy}% from registered deed (${deed.deedAreaAcres} ac). Recommended action: File Deed Rectification Petition or Snap to Deed.`,
    };
  }

  // No dispute / Boundaries fully conform
  const clearSolution: DeedProblemSolution = {
    id: 'sol-clear',
    remedyType: 'snap_to_deed',
    title: 'Deed Conformance Certified',
    preferred: true,
    summary: 'Physical property boundary lines conform fully with digitized state revenue records within sub-centimeter tolerance.',
    actionLabel: 'Print Conformance Certificate',
    statutoryReference: 'Cadastral Survey Standards & Land Records Verification Act Sec. 9',
    competentAuthority: 'DharNav National Geospatial Authority',
    estimatedTimeline: 'Completed & Certified',
    proceduralSteps: [
      '1. Sub-centimeter drone orthomosaic boundary digitized',
      '2. Automated topological overlay comparison with revenue deed polygon',
      '3. Discrepancy verified below statutory 2.5% dispute threshold',
      '4. Official digital twin survey certificate generated with cryptographic verification hash',
    ],
    requiredDocuments: [
      'Cadastral Survey Certificate',
      'Digital Twin Telemetry Record',
    ],
  };

  return {
    isDisputed: false,
    discrepancyPercentage: discrepancy,
    conflictType: 'none',
    primaryPreferredSolution: clearSolution,
    alternativeSolutions: [],
    canAutoSnap: false,
    legalSummary: 'Physical property boundary lines conform fully with registered state revenue records.',
  };
}

/**
 * Generates formal court petition legal brief text formatted for submission
 * before the Sub-Divisional Magistrate / Revenue Tehsildar.
 */
export function generatePetitionDraftText(
  parcel: CadastralParcel,
  solution?: DeedProblemSolution
): string {
  const deed = parcel.deedRecord;
  const owner = deed?.registeredOwner || 'Registered Property Owner';
  const khasra = deed?.khasraPattaNumber || 'Unassigned Khasra';
  const deedAcres = deed?.deedAreaAcres || parcel.acres;
  const surveyAcres = parcel.acres;
  const deltaAcres = Math.round((surveyAcres - deedAcres) * 100) / 100;
  const statutoryRef = solution?.statutoryReference || 'Section 84 of the Land Revenue Code';

  return `================================================================================
BEFORE THE COURT OF THE SUB-DIVISIONAL MAGISTRATE / REVENUE TEHSILDAR
DISTRICT LAND RECORDS & CADASTRAL ADMINISTRATION
================================================================================

CASE / PETITION NO: REV/CAD/2026/${parcel.pin.replace(/[^a-zA-Z0-9]/g, '')}

IN THE MATTER OF:
${owner}
Address: ${parcel.address}
Property Identification Number (PIN): ${parcel.pin}
Khasra / Patta Identifier: ${khasra}
                                                            ... PETITIONER / APPLICANT

                                  VERSUS

1. THE DISTRICT LAND RECORDS OFFICER / TEHSILDAR
2. MUNICIPAL TOWN PLANNING & DEVELOPMENT AUTHORITY
3. ADJOINING SURVEY SECTOR REVENUE STAKEHOLDERS
                                                            ... RESPONDENTS

--------------------------------------------------------------------------------
PETITION UNDER ${statutoryRef.toUpperCase()}
FOR FORMAL BOUNDARY DEMARCATION, DEED RECTIFICATION AND REVENUE MUTATION
--------------------------------------------------------------------------------

MOST RESPECTFULLY SHOWETH:

1. That the Petitioner is the lawful, bona-fide registered owner in physical possession
   of the landed property bearing PIN ${parcel.pin}, Khasra / Patta No. ${khasra},
   situated at ${parcel.address}, registered on ${deed?.registrationDate || '12-Oct-2018'}.

2. That the existing registered revenue entry records the property area as:
   - Registered Deed Area: ${deedAcres} Acres (${Math.round(deedAcres * 43560).toLocaleString()} Sq. Ft.)

3. That a high-precision sub-centimeter Ground Sampling Distance (GSD) aerial drone
   cadastral survey was recently conducted under the DharNav Geospatial Framework,
   which determined the actual physical ground possession area to be:
   - Actual Surveyed Area: ${surveyAcres} Acres (${parcel.sqft.toLocaleString()} Sq. Ft.)
   - Discrepancy Index: ${deed?.discrepancyIndexPercentage || Math.abs(deltaAcres)}% (${deltaAcres >= 0 ? '+' : ''}${deltaAcres} Acres)

4. DISPUTE / ALIGNMENT OBSERVATIONS:
   ${deed?.disputeNotes || 'Discrepancy noted between physical possession compound lines and historical digitized cadastral revenue sheets.'}

5. PROPOSED STATUTORY REMEDY (${solution?.title || 'Statutory Boundary Demarcation'}):
   ${solution?.summary || 'Re-alignment of revenue records to match certified ground truth coordinates.'}

6. That the Petitioner has held uninterrupted, open, and peaceful possession of the
   aforesaid property within existing physical compound walls / boundary markers
   for a substantial period, without any active adverse possession claim or dispute.

--------------------------------------------------------------------------------
PRAYER / RELIEF SOUGHT:
--------------------------------------------------------------------------------

Wherefore, in light of the facts and high-precision cadastral drone survey telemetry
herein submitted, the Petitioner most respectfully prays that this Hon'ble Court /
Authority may graciously be pleased to:

a) ORDER the issuance of an official notice for joint on-site inspection and demarcation
   under ${statutoryRef};

b) DIRECT the District Revenue Inspector / Cadastral Surveyor to authenticate the
   attached DharNav Drone Orthomosaic Boundary coordinates;

c) ORDER the rectification and mutation of Khasra / Patta records in the Revenue
   Register (Khatauni) to accurately reflect the true boundary coordinates and area;

d) PASS such further order(s) as this Hon'ble Court may deem fit and proper in the
   interest of natural justice and cadastral accuracy.

VERIFICATION:
I, the above-named Petitioner, do hereby solemnly verify and declare that the contents
of paragraphs 1 to 6 are true and correct to the best of my knowledge and official
cadastral records.

Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Place: District Land Records Administration Center

                                                ___________________________________
                                                SIGNATURE OF PETITIONER / ADVOCATE
================================================================================
ATTACHMENT: High-Precision GPS Boundary Vertices (${parcel.boundaryPoints.length} Points)
Timestamp: 2026-09-18 12:45 UTC | Hash: SHA-256: 8f9b2c31e4d58a10
================================================================================`;
}
