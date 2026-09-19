import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { analyzeDroneImageWithGemini } from './src/services/geminiDroneService.ts';
import { queryVaraiChat } from './src/services/varaiChatService.ts';
import { INITIAL_SAMPLE_PARCELS } from './src/data/dharNavVerificationData.ts';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Increase payload limit for high-resolution aerial and drone photos (GeoTIFF / PNG / JPEG)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Drone Image Boundary, Packet & Feature Identification
  app.post('/api/drone/analyze', async (req, res) => {
    try {
      const { imageBase64, fileName, fileSizeKb, fileFormat } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 is required.' });
      }

      const result = await analyzeDroneImageWithGemini(
        imageBase64,
        fileName || 'drone-scan.jpg',
        fileSizeKb || 3500,
        fileFormat || 'JPEG / Orthomosaic'
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error analyzing drone image with Gemini:', error);
      res.status(500).json({
        error: error.message || 'Failed to analyze drone image.',
      });
    }
  });

  // VARAI.ai Cadastral GIS & Spatial Intelligence Chat Endpoint
  app.post('/api/varai/chat', async (req, res) => {
    try {
      const { message, history, parcels, activeTab, preferredLanguage } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'message string is required.' });
      }

      const parcelsList = (Array.isArray(parcels) && parcels.length > 0) ? parcels : INITIAL_SAMPLE_PARCELS;
      const result = await queryVaraiChat(
        message,
        Array.isArray(history) ? history : [],
        parcelsList,
        activeTab || 'google-maps',
        ['en', 'hi', 'te', 'ta'].includes(preferredLanguage) ? preferredLanguage : undefined
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error in VARAI.ai chat service:', error);
      res.status(500).json({
        error: error.message || 'Failed to process inquiry with VARAI.ai.',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cadastre GIS Server listening on port ${PORT}`);
  });
}

startServer();
