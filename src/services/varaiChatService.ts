import { GoogleGenAI } from '@google/genai';
import { CadastralParcel } from '../types';

export interface VaraiQueryAction {
  type: 'filter' | 'highlight' | 'select' | 'reset' | 'info';
  focusParcelId?: string | null;
  suggestedTab?: 'google-maps' | 'drone-images' | 'digital-twin' | null;
  filterActive?: boolean;
}

export interface VaraiMatchingParcel {
  id: string;
  code: string;
  pin: string;
  acres: number;
  zoning: string;
  taxAssessment: number;
  confidence: number;
  deedStatus: string;
  reason: string;
}

export interface VaraiChatResult {
  reply: string;
  matchCount: number;
  matchingParcels: VaraiMatchingParcel[];
  action: VaraiQueryAction;
}

export interface VaraiChatHistoryItem {
  role: 'user' | 'model';
  content: string;
}

/**
 * Intelligent deterministic GIS query parser used when GEMINI_API_KEY is not configured
 * or as a robust fallback/verifier.
 */
function localGisQueryEngine(
  prompt: string,
  parcels: CadastralParcel[]
): VaraiChatResult {
  const rawLower = prompt.toLowerCase().trim();
  // Strip common punctuation for cleaner intent matching
  const lower = rawLower.replace(/[?!.,;:]/g, ' ').replace(/\s+/g, ' ').trim();

  // -------------------------------------------------------------
  // 1. Natural Language Greetings & Salutations (e.g. "hi", "hello", "hey")
  // -------------------------------------------------------------
  const greetingWords = ['hi', 'hello', 'hey', 'yo', 'sup', 'howdy', 'greetings', 'namaste', 'morning', 'evening', 'afternoon'];
  const isDirectGreeting =
    greetingWords.includes(lower) ||
    /^(hi|hello|hey|yo|howdy|sup|greetings|namaste|good morning|good evening|good afternoon)(\s+(varai|ai|assistant|there|team|bot))?$/.test(lower) ||
    lower === 'how are you' ||
    lower === 'how are u' ||
    lower === "what's up" ||
    lower === 'whats up';

  if (isDirectGreeting) {
    return {
      reply: `Hello! I am **VARAI.ai**, your specialized Cadastral GIS & Spatial AI Agent for DharNav.

I can inspect our live cadastral survey dataset (${parcels.length} parcels indexed), evaluate deed disputes, query zoning and tax records, or review 3D digital twin simulations.

**Try asking me:**
• *'Which parcels have deed disputes?'*
• *'Show industrial parcels over 3 acres'*
• *'Which parcel has the highest tax valuation?'*
• *'Show 3D digital twin simulations'*
• *'Inspect PACKET-102'*`,
      matchCount: 0,
      matchingParcels: [],
      action: {
        type: 'info',
        focusParcelId: null,
        suggestedTab: null,
        filterActive: false,
      },
    };
  }

  // -------------------------------------------------------------
  // 2. Pleasantries & Gratitude (e.g. "thanks", "thank you", "cool", "ok")
  // -------------------------------------------------------------
  const pleasantries = ['thanks', 'thank you', 'thx', 'appreciate it', 'awesome', 'great', 'cool', 'ok', 'okay', 'got it', 'understood', 'perfect', 'nice', 'good job'];
  if (pleasantries.includes(lower) || /^(thanks|thank you|thx|great job|perfect|ok thanks)/.test(lower)) {
    return {
      reply: `You're very welcome! Let me know if you need to query any other parcel records, inspect deed boundaries, or model 3D digital twin simulations.`,
      matchCount: 0,
      matchingParcels: [],
      action: {
        type: 'info',
        focusParcelId: null,
        suggestedTab: null,
        filterActive: false,
      },
    };
  }

  // -------------------------------------------------------------
  // 3. Capabilities, Help & Agent Identity (e.g. "help", "who are you", "what can you do")
  // -------------------------------------------------------------
  if (
    lower === 'help' ||
    lower.includes('who are you') ||
    lower.includes('what can you do') ||
    lower.includes('what are your capabilities') ||
    lower.includes('features') ||
    lower.includes('commands') ||
    lower.includes('what is varai')
  ) {
    return {
      reply: `I am **VARAI.ai**, DharNav's specialized Cadastral GIS & Spatial AI Agent.

**Here is what I can do automatically:**
1. **Natural Language Understanding**: Ask questions in plain English about acreage, zoning, tax assessments, deed disputes, and GPS coordinates.
2. **Live GIS Spatial Querying**: Dynamically search across all ${parcels.length} active parcels in the cadastral database.
3. **Automated Map Filtering**: Isolate matching parcels on Google Maps and Drone view while dimming or hiding others.
4. **Glowing Highlights & Auto-Framing**: Highlight matching parcels with glowing magenta outlines and auto-pan/zoom Google Maps to frame them.
5. **Exact Counts & Explicit Reasons**: Deliver precise match counts with clear, statutory and survey-based explanations for each parcel.

Try any question below or click one of the quick pills above!`,
      matchCount: 0,
      matchingParcels: [],
      action: {
        type: 'info',
        focusParcelId: null,
        suggestedTab: null,
        filterActive: false,
      },
    };
  }

  // -------------------------------------------------------------
  // 4. About DharNav Platform Overview
  // -------------------------------------------------------------
  if (
    lower.includes('what is dharnav') ||
    lower.includes('tell me about dharnav') ||
    lower.includes('about dharnav') ||
    lower.includes('how does dharnav work') ||
    lower.includes('explain dharnav') ||
    lower.includes('project overview')
  ) {
    return {
      reply: `**DharNav** is an AI-powered Cadastral Digital Twin & Drone Vision platform that modernizes land administration and boundary surveying:

• **Google Maps Cadastre**: Interactive sub-meter GPS boundary mapping, corner monument editing, real-time ray-casting area calculations, and boundary sealing.
• **Drone Orthomosaic Vision**: Aerial computer vision analyzing sub-centimeter orthomosaics with deep boundary polygon extraction (99.4% IoU) and surveyor correction loops.
• **Deed Alignment & Resolution Engine**: Boundary discrepancy detection against registered revenue records, 1-click snap-to-deed auto-reconciliation, and Form 14A legal court petition drafting.
• **3D Digital Twin Simulator**: Volumetric proposed construction modeling with solar azimuth/elevation shadow casting.
• **VARAI AI**: Conversational spatial assistant for natural language querying, automated map filtering, and parcel highlights.`,
      matchCount: 0,
      matchingParcels: [],
      action: {
        type: 'info',
        focusParcelId: null,
        suggestedTab: null,
        filterActive: false,
      },
    };
  }

  // -------------------------------------------------------------
  // 5. Reset / Clear Map Filter (e.g. "reset", "clear filter", "show all")
  // -------------------------------------------------------------
  if (
    lower === 'reset' ||
    lower.includes('reset filter') ||
    lower.includes('clear filter') ||
    lower.includes('show all') ||
    lower.includes('all parcels') ||
    lower.includes('unfilter') ||
    lower.includes('reset map') ||
    lower.includes('view all')
  ) {
    return {
      reply: `I have reset the map filter. All **${parcels.length} cadastral parcels** are now visible across Google Maps and Drone workspace.`,
      matchCount: parcels.length,
      matchingParcels: [],
      action: {
        type: 'reset',
        filterActive: false,
        focusParcelId: null,
        suggestedTab: null,
      },
    };
  }

  // -------------------------------------------------------------
  // 6. Direct Specific Parcel Lookup by Code, PIN, Address, or Khasra
  // -------------------------------------------------------------
  const directMatch = parcels.find((p) => {
    const codeLow = p.code.toLowerCase();
    const pinLow = p.pin.toLowerCase();
    const addrLow = p.address.toLowerCase();
    const khasraLow = p.deedRecord?.khasraPattaNumber?.toLowerCase() || '';

    // Check code match (e.g. "packet-102", "packet 102", "102", "p-102")
    if (lower.includes(codeLow)) return true;
    const numOnly = p.code.replace(/\D/g, '');
    if (numOnly && (lower.includes(`packet ${numOnly}`) || lower.includes(`packet-${numOnly}`) || lower.includes(`parcel ${numOnly}`) || lower.includes(`parcel-${numOnly}`) || lower.includes(`p-${numOnly}`) || lower.includes(`p${numOnly}`) || lower === numOnly)) {
      return true;
    }
    if (pinLow && lower.includes(pinLow)) return true;
    if (khasraLow && lower.includes(khasraLow)) return true;
    if (addrLow && lower.includes(addrLow)) return true;
    return false;
  });

  if (directMatch) {
    return {
      reply: `Located parcel **${directMatch.code}** (PIN: \`${directMatch.pin}\`).
• **Acreage:** ${directMatch.acres} acres (${directMatch.sqft.toLocaleString()} sq ft)
• **Zoning:** ${directMatch.zoning}
• **Address:** ${directMatch.address}
• **Revenue Status:** ${directMatch.deedRecord?.revenueStatus || 'Clear'}
• **Tax Assessment:** $${directMatch.taxAssessment.toLocaleString()} USD
• **AI Model Confidence:** ${directMatch.confidence.toFixed(1)}%

The map has been filtered and centered on this parcel.`,
      matchCount: 1,
      matchingParcels: [
        {
          id: directMatch.id,
          code: directMatch.code,
          pin: directMatch.pin,
          acres: directMatch.acres,
          zoning: directMatch.zoning,
          taxAssessment: directMatch.taxAssessment,
          confidence: directMatch.confidence,
          deedStatus: directMatch.deedRecord?.revenueStatus || 'Clear',
          reason: `Direct identifier match for ${directMatch.code} at ${directMatch.address}.`,
        },
      ],
      action: {
        type: 'filter',
        focusParcelId: directMatch.id,
        suggestedTab: 'google-maps',
        filterActive: true,
      },
    };
  }

  // -------------------------------------------------------------
  // 7. Deed Remedies & Legal Statutory Solutions
  // -------------------------------------------------------------
  if (
    lower.includes('solution') ||
    lower.includes('remedy') ||
    lower.includes('petition') ||
    lower.includes('rectif') ||
    lower.includes('compounding') ||
    lower.includes('snap to deed') ||
    lower.includes('fix deed') ||
    lower.includes('solve deed')
  ) {
    const hits = parcels.filter(
      (p) =>
        p.deedRecord?.revenueStatus === 'Disputed' ||
        p.deedRecord?.encroachmentDetected ||
        (p.deedRecord?.discrepancyIndexPercentage && p.deedRecord.discrepancyIndexPercentage > 0)
    );

    if (hits.length === 0) {
      return {
        reply: `All parcels currently have aligned boundaries with 0.0% deed discrepancy. No deed rectification actions required.`,
        matchCount: 0,
        matchingParcels: [],
        action: { type: 'info', filterActive: false, focusParcelId: null, suggestedTab: null },
      };
    }

    const matching = hits.map((p) => ({
      id: p.id,
      code: p.code,
      pin: p.pin,
      acres: p.acres,
      zoning: p.zoning,
      taxAssessment: p.taxAssessment,
      confidence: p.confidence,
      deedStatus: p.deedRecord?.revenueStatus || 'Disputed',
      reason: `Eligible for 1-Click 'Snap Boundary to Deed' or Form 14A Deed Rectification Petition under Land Revenue Code Sec. 84. Discrepancy: ${p.deedRecord?.discrepancyIndexPercentage || 0}%.`,
    }));

    return {
      reply: `Identified **${matching.length} parcel(s)** with actionable deed solutions. You can auto-reconcile via 1-click **'Snap Boundary to Deed'** or draft a formal statutory court petition (**Form 14A** / Compounding NOC). The map has been filtered to these parcels.`,
      matchCount: matching.length,
      matchingParcels: matching,
      action: {
        type: 'filter',
        focusParcelId: matching[0]?.id || null,
        suggestedTab: 'google-maps',
        filterActive: true,
      },
    };
  }

  // -------------------------------------------------------------
  // 8. Deed Conflicts, Disputes & Encroachments
  // -------------------------------------------------------------
  if (
    lower.includes('dispute') ||
    lower.includes('deed') ||
    lower.includes('encroach') ||
    lower.includes('violation') ||
    lower.includes('conflict') ||
    lower.includes('easement') ||
    lower.includes('boundary issue')
  ) {
    const hits = parcels.filter(
      (p) => p.deedRecord?.revenueStatus === 'Disputed' || p.deedRecord?.encroachmentDetected
    );

    if (hits.length === 0) {
      return {
        reply: `No deed disputes or encroachments detected. All cataloged parcels have clear revenue status and aligned deed boundaries.`,
        matchCount: 0,
        matchingParcels: [],
        action: { type: 'info', filterActive: false, focusParcelId: null, suggestedTab: null },
      };
    }

    const matching = hits.map((p) => ({
      id: p.id,
      code: p.code,
      pin: p.pin,
      acres: p.acres,
      zoning: p.zoning,
      taxAssessment: p.taxAssessment,
      confidence: p.confidence,
      deedStatus: p.deedRecord?.revenueStatus || 'Disputed',
      reason:
        p.deedRecord?.disputeNotes ||
        `Revenue record marked as ${p.deedRecord?.revenueStatus} with boundary discrepancy of ${p.deedRecord?.discrepancyIndexPercentage || 0}%.`,
    }));

    return {
      reply: `Identified **${matching.length} parcel(s)** with legal deed discrepancies or boundary encroachments. The map has been filtered to highlight these parcels for legal inspection.`,
      matchCount: matching.length,
      matchingParcels: matching,
      action: {
        type: 'filter',
        focusParcelId: matching[0]?.id || null,
        suggestedTab: 'google-maps',
        filterActive: true,
      },
    };
  }

  // -------------------------------------------------------------
  // 9. Digital Twin 3D Volumetric Simulations & Solar Shadows
  // -------------------------------------------------------------
  if (
    lower.includes('simulation') ||
    lower.includes('twin') ||
    lower.includes('what-if') ||
    lower.includes('what if') ||
    lower.includes('shadow') ||
    lower.includes('volumetric') ||
    lower.includes('3d') ||
    lower.includes('construction')
  ) {
    const hits = parcels.filter((p) => p.simulations && p.simulations.length > 0);

    if (hits.length === 0) {
      return {
        reply: `Currently, none of the parcels have active construction simulations. You can select any parcel and click **'What-If 3D Simulator'** to simulate proposed buildings with solar shadow analysis.`,
        matchCount: 0,
        matchingParcels: [],
        action: {
          type: 'info',
          focusParcelId: null,
          suggestedTab: 'digital-twin',
          filterActive: false,
        },
      };
    }

    const matching = hits.map((p) => ({
      id: p.id,
      code: p.code,
      pin: p.pin,
      acres: p.acres,
      zoning: p.zoning,
      taxAssessment: p.taxAssessment,
      confidence: p.confidence,
      deedStatus: p.deedRecord?.revenueStatus || 'Clear',
      reason: `Has ${p.simulations!.length} active construction simulation(s) with 3D solar shadow and setback analysis.`,
    }));

    return {
      reply: `Found **${matching.length} parcel(s)** with active or proposed Digital Twin construction simulations. Map filtered to display simulation footprints.`,
      matchCount: matching.length,
      matchingParcels: matching,
      action: {
        type: 'filter',
        focusParcelId: matching[0]?.id || null,
        suggestedTab: 'digital-twin',
        filterActive: true,
      },
    };
  }

  // -------------------------------------------------------------
  // 10. Zoning Queries (Industrial, Commercial, Residential, Agriculture)
  // -------------------------------------------------------------
  const isIndustrial = lower.includes('industrial') || lower.includes('m-2') || lower.includes('m-1') || lower.includes('warehouse') || lower.includes('logistics') || lower.includes('i-p') || lower.includes('factory');
  const isCommercial = lower.includes('commercial') || lower.includes('c-3') || lower.includes('retail') || lower.includes('office') || lower.includes('mall');
  const isResidential = lower.includes('residential') || lower.includes('housing') || lower.includes('r-1') || lower.includes('r-2') || lower.includes('home') || lower.includes('apartment');
  const isAgricultural = lower.includes('agri') || lower.includes('farm') || lower.includes('crop') || lower.includes('a-1') || lower.includes('rural');

  if (isIndustrial || isCommercial || isResidential || isAgricultural) {
    let hits: CadastralParcel[] = [];
    let zoneLabel = '';

    if (isIndustrial) {
      zoneLabel = 'Industrial';
      hits = parcels.filter((p) => {
        const z = p.zoning.toLowerCase();
        return z.includes('industrial') || z.includes('m-2') || z.includes('m-1') || z.includes('logistics') || z.includes('i-p');
      });
    } else if (isCommercial) {
      zoneLabel = 'Commercial';
      hits = parcels.filter((p) => {
        const z = p.zoning.toLowerCase();
        return z.includes('commercial') || z.includes('c-3') || z.includes('retail');
      });
    } else if (isResidential) {
      zoneLabel = 'Residential';
      hits = parcels.filter((p) => {
        const z = p.zoning.toLowerCase();
        return z.includes('residential') || z.includes('r-1') || z.includes('r-2');
      });
    } else if (isAgricultural) {
      zoneLabel = 'Agricultural';
      hits = parcels.filter((p) => {
        const z = p.zoning.toLowerCase();
        return z.includes('agri') || z.includes('farm') || z.includes('a-1') || z.includes('rural');
      });
    }

    // Also check if combined with acreage filter (e.g. "industrial > 3 acres")
    const numMatch = lower.match(/(?:>|>=|over|above|greater than|more than)\s*(\d+(?:\.\d+)?)/);
    if (numMatch) {
      const threshold = parseFloat(numMatch[1]);
      hits = hits.filter((p) => p.acres >= threshold);
    }

    if (hits.length === 0) {
      return {
        reply: `Searched across all ${parcels.length} cataloged parcels, but found **0 parcels** matching '${zoneLabel}' zoning criteria. Current cataloged zoning classes include M-2 Industrial, M-1 Light Manufacturing, I-P Tech Flex, and C-3 Commercial.`,
        matchCount: 0,
        matchingParcels: [],
        action: { type: 'info', filterActive: false, focusParcelId: null, suggestedTab: null },
      };
    }

    const matching = hits.map((p) => ({
      id: p.id,
      code: p.code,
      pin: p.pin,
      acres: p.acres,
      zoning: p.zoning,
      taxAssessment: p.taxAssessment,
      confidence: p.confidence,
      deedStatus: p.deedRecord?.revenueStatus || 'Clear',
      reason: `Zoned as ${p.zoning} with ${p.acres} acres (${p.sqft.toLocaleString()} sq ft).`,
    }));

    return {
      reply: `Found **${matching.length} ${zoneLabel.toLowerCase()} parcel(s)**. Map updated to highlight matching zoning footprint.`,
      matchCount: matching.length,
      matchingParcels: matching,
      action: {
        type: 'filter',
        focusParcelId: matching[0]?.id || null,
        suggestedTab: 'google-maps',
        filterActive: true,
      },
    };
  }

  // -------------------------------------------------------------
  // 11. Acreage & Land Area Queries (e.g. "> 3 acres", "largest", "smallest")
  // -------------------------------------------------------------
  if (lower.includes('acre') || lower.includes('largest') || lower.includes('biggest') || lower.includes('smallest') || lower.includes('maximum area') || lower.includes('minimum area')) {
    if (lower.includes('largest') || lower.includes('biggest') || lower.includes('maximum area')) {
      const sorted = [...parcels].sort((a, b) => b.acres - a.acres);
      const top = sorted[0];
      if (top) {
        return {
          reply: `The largest parcel in the survey dataset is **${top.code}** with **${top.acres} acres** (${top.sqft.toLocaleString()} sq ft), zoned as **${top.zoning}** at ${top.address}.`,
          matchCount: 1,
          matchingParcels: [
            {
              id: top.id,
              code: top.code,
              pin: top.pin,
              acres: top.acres,
              zoning: top.zoning,
              taxAssessment: top.taxAssessment,
              confidence: top.confidence,
              deedStatus: top.deedRecord?.revenueStatus || 'Clear',
              reason: `Largest parcel in the survey dataset spanning ${top.acres} acres.`,
            },
          ],
          action: {
            type: 'filter',
            focusParcelId: top.id,
            suggestedTab: 'google-maps',
            filterActive: true,
          },
        };
      }
    }

    if (lower.includes('smallest') || lower.includes('minimum area')) {
      const sorted = [...parcels].sort((a, b) => a.acres - b.acres);
      const minP = sorted[0];
      if (minP) {
        return {
          reply: `The smallest parcel in the survey dataset is **${minP.code}** with **${minP.acres} acres** (${minP.sqft.toLocaleString()} sq ft), zoned as **${minP.zoning}** at ${minP.address}.`,
          matchCount: 1,
          matchingParcels: [
            {
              id: minP.id,
              code: minP.code,
              pin: minP.pin,
              acres: minP.acres,
              zoning: minP.zoning,
              taxAssessment: minP.taxAssessment,
              confidence: minP.confidence,
              deedStatus: minP.deedRecord?.revenueStatus || 'Clear',
              reason: `Smallest parcel in the survey dataset spanning ${minP.acres} acres.`,
            },
          ],
          action: {
            type: 'filter',
            focusParcelId: minP.id,
            suggestedTab: 'google-maps',
            filterActive: true,
          },
        };
      }
    }

    // Parse numeric acreage threshold
    const numMatch = lower.match(/(?:>|>=|<|<=|over|above|greater than|more than|under|below|less than|smaller than)?\s*(\d+(?:\.\d+)?)\s*(?:acres?|ac)?/);
    const isLessThan = lower.includes('less') || lower.includes('under') || lower.includes('smaller') || lower.includes('below') || lower.includes('<');
    const threshold = numMatch ? parseFloat(numMatch[1]) : 3.0;

    const hits = parcels.filter((p) => (isLessThan ? p.acres <= threshold : p.acres >= threshold));

    if (hits.length === 0) {
      const minA = Math.min(...parcels.map((p) => p.acres));
      const maxA = Math.max(...parcels.map((p) => p.acres));
      return {
        reply: `No parcels found with land area ${isLessThan ? '≤' : '≥'} ${threshold} acres. Existing parcels range from ${minA} to ${maxA} acres.`,
        matchCount: 0,
        matchingParcels: [],
        action: { type: 'info', filterActive: false, focusParcelId: null, suggestedTab: null },
      };
    }

    const matching = hits.map((p) => ({
      id: p.id,
      code: p.code,
      pin: p.pin,
      acres: p.acres,
      zoning: p.zoning,
      taxAssessment: p.taxAssessment,
      confidence: p.confidence,
      deedStatus: p.deedRecord?.revenueStatus || 'Clear',
      reason: `Area is ${p.acres} acres (${p.sqft.toLocaleString()} sq ft), satisfying criteria of ${isLessThan ? '≤' : '≥'} ${threshold} acres.`,
    }));

    return {
      reply: `Found **${matching.length} parcel(s)** with land area ${isLessThan ? 'less than or equal to' : 'greater than or equal to'} ${threshold} acres.`,
      matchCount: matching.length,
      matchingParcels: matching,
      action: {
        type: 'filter',
        focusParcelId: matching[0]?.id || null,
        suggestedTab: 'google-maps',
        filterActive: true,
      },
    };
  }

  // -------------------------------------------------------------
  // 12. Municipal Tax Assessment & Valuations
  // -------------------------------------------------------------
  if (lower.includes('tax') || lower.includes('assessment') || lower.includes('valuation') || lower.includes('expensive') || lower.includes('worth') || lower.includes('$')) {
    if (lower.includes('highest') || lower.includes('most expensive')) {
      const sorted = [...parcels].sort((a, b) => b.taxAssessment - a.taxAssessment);
      const top = sorted[0];
      if (top) {
        return {
          reply: `The parcel with the highest tax valuation is **${top.code}** assessed at **$${top.taxAssessment.toLocaleString()} USD** (${top.acres} ac, ${top.zoning}).`,
          matchCount: 1,
          matchingParcels: [
            {
              id: top.id,
              code: top.code,
              pin: top.pin,
              acres: top.acres,
              zoning: top.zoning,
              taxAssessment: top.taxAssessment,
              confidence: top.confidence,
              deedStatus: top.deedRecord?.revenueStatus || 'Clear',
              reason: `Highest municipal tax valuation at $${top.taxAssessment.toLocaleString()} USD.`,
            },
          ],
          action: {
            type: 'filter',
            focusParcelId: top.id,
            suggestedTab: 'google-maps',
            filterActive: true,
          },
        };
      }
    }

    let threshold = 2000000;
    if (lower.includes('3m') || lower.includes('3 million')) threshold = 3000000;
    else if (lower.includes('5m') || lower.includes('5 million')) threshold = 5000000;
    else if (lower.includes('1m') || lower.includes('1 million')) threshold = 1000000;

    const hits = parcels.filter((p) => p.taxAssessment >= threshold);

    if (hits.length === 0) {
      return {
        reply: `No parcels found with municipal tax assessment ≥ $${threshold.toLocaleString()} USD.`,
        matchCount: 0,
        matchingParcels: [],
        action: { type: 'info', filterActive: false, focusParcelId: null, suggestedTab: null },
      };
    }

    const matching = hits.map((p) => ({
      id: p.id,
      code: p.code,
      pin: p.pin,
      acres: p.acres,
      zoning: p.zoning,
      taxAssessment: p.taxAssessment,
      confidence: p.confidence,
      deedStatus: p.deedRecord?.revenueStatus || 'Clear',
      reason: `Tax assessed valuation: $${p.taxAssessment.toLocaleString()} USD (${p.zoning}).`,
    }));

    return {
      reply: `Analyzed municipal tax valuations. Found **${matching.length} parcel(s)** assessed at $${threshold.toLocaleString()} USD or higher.`,
      matchCount: matching.length,
      matchingParcels: matching,
      action: {
        type: 'filter',
        focusParcelId: matching[0]?.id || null,
        suggestedTab: 'google-maps',
        filterActive: true,
      },
    };
  }

  // -------------------------------------------------------------
  // 13. AI Verification Confidence & Review Flags
  // -------------------------------------------------------------
  if (lower.includes('review') || lower.includes('confidence') || lower.includes('flag') || lower.includes('verify') || lower.includes('accuracy')) {
    const hits = parcels.filter((p) => p.confidence < 85 || p.verificationStatus === 'needs_review');

    if (hits.length === 0) {
      return {
        reply: `All cataloged parcels currently meet high AI confidence standards (≥ 85%) and have verified cadastral boundaries.`,
        matchCount: 0,
        matchingParcels: [],
        action: { type: 'info', filterActive: false, focusParcelId: null, suggestedTab: null },
      };
    }

    const matching = hits.map((p) => ({
      id: p.id,
      code: p.code,
      pin: p.pin,
      acres: p.acres,
      zoning: p.zoning,
      taxAssessment: p.taxAssessment,
      confidence: p.confidence,
      deedStatus: p.deedRecord?.revenueStatus || 'Clear',
      reason: `AI confidence rating is ${p.confidence.toFixed(1)}%, flagged with status '${p.verificationStatus || 'needs_review'}' for surveyor verification.`,
    }));

    return {
      reply: `Detected **${matching.length} parcel(s)** flagged for surveyor verification due to boundary complexity or lower model confidence.`,
      matchCount: matching.length,
      matchingParcels: matching,
      action: {
        type: 'filter',
        focusParcelId: matching[0]?.id || null,
        suggestedTab: 'google-maps',
        filterActive: true,
      },
    };
  }

  // -------------------------------------------------------------
  // 14. Unknown or General Non-GIS Queries Fallback
  // (Do NOT return random parcels!)
  // -------------------------------------------------------------
  return {
    reply: `I am **VARAI.ai**, DharNav's specialized Cadastral GIS Assistant.

I couldn't find any cadastral parcels or records matching your query: *"${prompt}"*.

**Here are some questions you can ask me:**
• 🏛️ *'Which parcels have deed disputes or encroachments?'*
• ⚖️ *'What solutions are recommended for disputed deeds?'*
• 🏭 *'Show industrial parcels over 3 acres'*
• 🏢 *'Which parcels have 3D digital twin simulations?'*
• 💰 *'Which parcel has the highest tax valuation?'*
• 🔍 *'Inspect PACKET-102'*
• 🗺️ *'Reset map filter'*`,
    matchCount: 0,
    matchingParcels: [],
    action: {
      type: 'info',
      focusParcelId: null,
      suggestedTab: null,
      filterActive: false,
    },
  };
}

/**
 * Executes a conversational multi-turn inquiry using Gemini 3.8 Flash model,
 * with deterministic fallback to localGisQueryEngine.
 */
export async function queryVaraiChat(
  userPrompt: string,
  history: VaraiChatHistoryItem[],
  parcels: CadastralParcel[],
  activeTab?: string
): Promise<VaraiChatResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // If no valid API key is configured (or if it's the default placeholder), serve instantly via local engine
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.startsWith('MY_') || apiKey.trim() === '') {
    return localGisQueryEngine(userPrompt, parcels);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Simplify parcel payload for model context efficiency
    const gisContextSummary = parcels.map((p) => ({
      id: p.id,
      code: p.code,
      pin: p.pin,
      address: p.address,
      zoning: p.zoning,
      acres: p.acres,
      sqft: p.sqft,
      taxAssessment: p.taxAssessment,
      confidence: p.confidence,
      verificationStatus: p.verificationStatus || 'verified',
      aiReliabilityTier: p.aiReliabilityTier || 'high',
      deedStatus: p.deedRecord?.revenueStatus || 'Clear',
      encroachmentDetected: p.deedRecord?.encroachmentDetected || false,
      disputeNotes: p.deedRecord?.disputeNotes || '',
      khasraPatta: p.deedRecord?.khasraPattaNumber || '',
      simulationsCount: (p.simulations || []).length,
      monumentsCount: p.latLngPoints ? p.latLngPoints.length : p.boundaryPoints.length,
    }));

    const systemInstruction = `You are VARAI.ai, the specialized Cadastral GIS & Spatial AI Agent for the DharNav platform.
You have comprehensive knowledge of this project:
- DharNav Cadastral Digital Twin & Drone AI Intelligence platform
- Interactive Google Maps cadastral boundary surveying, monument GPS coordinates, micro-nudging
- Drone orthomosaic aerial computer vision analysis, Ground Sampling Distance (GSD), segmentation IoU
- Municipal zoning classifications (Heavy Industrial M-2, Commercial C-3, Residential R-1, Agriculture)
- Revenue records, Khasra/Patta deed records, property disputes, and boundary encroachments
- What-If Digital Twin 3D volumetric building footprints, height stories, and solar shadows
- AI self-verification loops, surveyor correction records, and confidence scores

Your job:
1. Understand the user's natural language question.
2. If the user says a greeting ("hi", "hello"), thanks, or small talk, respond warmly and conversationally WITHOUT filtering parcels or returning fake matches (matchCount: 0, matchingParcels: []).
3. If the user asks a real GIS query, search the provided GIS dataset of parcels.
4. If parcels match:
   - Provide the EXACT count of matching parcels
   - Provide clear, explicit reasons why each parcel matched
   - Set action type to "filter" or "highlight" with filterActive: true
5. If no parcels match, state that 0 parcels matched honestly (matchCount: 0, matchingParcels: []).

Output strictly valid JSON with this exact schema:
{
  "reply": "Clear, markdown-formatted conversational answer.",
  "matchCount": 0,
  "matchingParcels": [
    {
      "id": "p-102",
      "code": "PACKET-102",
      "pin": "08-24-102-002",
      "acres": 3.8,
      "zoning": "C-3 Commercial",
      "taxAssessment": 1950000,
      "confidence": 72.0,
      "deedStatus": "Disputed",
      "reason": "Explicit explanation of why this specific parcel meets the criteria."
    }
  ],
  "action": {
    "type": "filter", // "filter", "highlight", "select", "reset", or "info"
    "focusParcelId": null,
    "suggestedTab": "google-maps",
    "filterActive": true
  }
}
`;

    const conversationPrompt = `
Current Active View Tab: ${activeTab || 'google-maps'}
Current DharNav GIS Parcels Dataset (${parcels.length} parcels):
${JSON.stringify(gisContextSummary, null, 2)}

User Input:
"${userPrompt}"
`;

    const contents: any[] = [];
    
    // Add recent history for multi-turn context (last 6 turns)
    const recentHistory = history.slice(-6);
    for (const h of recentHistory) {
      contents.push({
        role: h.role,
        parts: [{ text: h.content }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: conversationPrompt }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text || '';
    const parsed = JSON.parse(responseText);

    return {
      reply: parsed.reply || `Found ${parsed.matchCount || 0} matching parcels in the GIS database.`,
      matchCount: typeof parsed.matchCount === 'number' ? parsed.matchCount : (parsed.matchingParcels || []).length,
      matchingParcels: parsed.matchingParcels || [],
      action: parsed.action || {
        type: (parsed.matchingParcels && parsed.matchingParcels.length > 0) ? 'filter' : 'info',
        focusParcelId: parsed.matchingParcels?.[0]?.id || null,
        suggestedTab: 'google-maps',
        filterActive: Boolean(parsed.matchingParcels && parsed.matchingParcels.length > 0),
      },
    };
  } catch (error) {
    console.warn('Gemini VARAI.ai call encountered an issue, falling back to local GIS engine:', error);
    return localGisQueryEngine(userPrompt, parcels);
  }
}
