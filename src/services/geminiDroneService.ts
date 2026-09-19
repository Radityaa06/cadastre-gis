import { GoogleGenAI } from '@google/genai';
import { CadastralParcel, DroneImageAnalysisResult, IdentifiedFeature } from '../types';

export async function analyzeDroneImageWithGemini(
  base64DataUrl: string,
  fileName: string,
  fileSizeKb: number,
  fileFormat: string
): Promise<DroneImageAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Extract base64 data and mimeType
  const match = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  const mimeType = match ? match[1] : 'image/jpeg';
  const base64Data = match ? match[2] : base64DataUrl;

  const prompt = `
You are an expert Cadastral GIS Surveyor, Geospatial Cartographer, and Computer Vision Drone Imagery Analyst.
Analyze this high-resolution aerial/drone orthomosaic survey image carefully.

Tasks:
1. Identify and delineate land parcel boundaries ("packets" / cadastral lots / plots) visible in this image.
2. For each parcel/packet:
   - Provide a parcel code (e.g., P-101, P-102, Lot-1, etc.)
   - Generate a realistic cadastral Property Identification Number (PIN format e.g., "08-24-102-004")
   - Identify realistic zoning designation (e.g., "M-2 Heavy Industrial", "C-3 Commercial", "A-1 Prime Agriculture", "R-1 Residential", "Mixed Use")
   - Estimated acreage and square footage
   - Estimated structures detected inside the boundary (roofs, storage tanks, outbuildings)
   - Realistic tax assessment estimate (USD)
   - Provide polygon boundary points as normalized coordinates {x, y} where x and y are percentages from 0 to 100 representing position in the image (top-left is 0,0, bottom-right is 100,100). Minimum 4 coordinates forming a closed polygon.
   - Distinct color theme hex code (e.g. #0284c7, #d97706, #0d9488, #e11d48, #16a34a, #7c3aed)
3. Identify specific surface features ("what is what" on screen):
   - Categorize each feature into one of: 'structure', 'boundary', 'road', 'vegetation', 'infrastructure', 'water'
   - Give each feature an exact descriptive name (e.g. "Commercial Warehouse Rooftop", "Asphalt Access Road", "Perimeter Concrete Wall", "Agricultural Crop Bed", "Retention Pond", "Transformer Station")
   - Give exact normalized center coordinate {x, y} (0 to 100)
   - Detailed description of what is visible (materials, condition, dimensions, HVAC units, gates, etc.)
4. Estimate survey telemetry: Ground Sampling Distance (e.g., "2.5 cm/px"), Flight Altitude (e.g., "90m AGL"), overall Segmentation IoU confidence (e.g., 99.2).

Output strictly valid JSON with this exact schema:
{
  "estimatedGroundSamplingDistance": "2.8 cm/px",
  "flightAltitude": "100m AGL",
  "telemetrySummary": {
    "totalAreaAcres": 14.5,
    "totalParcelsCount": 3,
    "segmentationIoU": 98.7,
    "zoningSummary": "Mixed Industrial & Logistics Corridor",
    "surveyDate": "2026-09-18"
  },
  "parcels": [
    {
      "id": "p-1",
      "pin": "08-24-102-001",
      "code": "P-101",
      "address": "1200 Survey Way, Sector A",
      "zoning": "M-2 Heavy Industrial",
      "acres": 4.5,
      "sqft": 196020,
      "confidence": 99.1,
      "structuresDetected": 2,
      "taxAssessment": 2800000,
      "colorTheme": "#0284c7",
      "boundaryPoints": [{"x": 20, "y": 25}, {"x": 45, "y": 24}, {"x": 44, "y": 60}, {"x": 19, "y": 59}],
      "identifiedFeatures": [
        {
          "id": "f-1",
          "name": "Main Logistics Depot",
          "category": "structure",
          "confidence": 99.2,
          "details": "Steel frame warehouse with insulated membrane roof",
          "center": {"x": 32, "y": 42}
        }
      ]
    }
  ],
  "identifiedFeatures": [
    {
      "id": "f-global-1",
      "name": "Dual-Carriageway Access Highway",
      "category": "road",
      "confidence": 98.5,
      "details": "Paved asphalt roadway with clear lane markings and drainage curb",
      "center": {"x": 50, "y": 15}
    }
  ],
  "rawAiDescription": "Detailed overview of the cadastral layout..."
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
    },
  });

  const rawText = response.text || '{}';
  const parsed = JSON.parse(rawText);

  return {
    fileName: fileName || 'drone_orthomosaic.jpg',
    fileFormat: fileFormat || 'GeoTIFF / JPG',
    fileSizeKb: fileSizeKb || 4200,
    dimensions: { width: 1920, height: 1080 },
    estimatedGroundSamplingDistance: parsed.estimatedGroundSamplingDistance || '3.2 cm/px',
    flightAltitude: parsed.flightAltitude || '100m AGL',
    parcels: (parsed.parcels || []).map((p: any, idx: number) => ({
      ...p,
      id: p.id || `parcel-${idx + 1}`,
      boundaryPoints: p.boundaryPoints || [
        { x: 20 + idx * 10, y: 25 },
        { x: 40 + idx * 10, y: 25 },
        { x: 40 + idx * 10, y: 55 },
        { x: 20 + idx * 10, y: 55 },
      ],
      identifiedFeatures: p.identifiedFeatures || [],
      colorTheme: p.colorTheme || '#0284c7',
    })),
    identifiedFeatures: parsed.identifiedFeatures || [],
    telemetrySummary: parsed.telemetrySummary || {
      totalAreaAcres: 12.4,
      totalParcelsCount: parsed.parcels ? parsed.parcels.length : 2,
      segmentationIoU: 98.4,
      zoningSummary: 'Cadastral Survey Zone',
      surveyDate: new Date().toISOString().split('T')[0],
    },
    rawAiDescription: parsed.rawAiDescription || 'Cadastral delineation and feature extraction completed successfully.',
  };
}
