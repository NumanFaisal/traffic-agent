import 'dotenv/config';
import express from 'express';
import cors from 'cors'; // Import CORS
import { handleUserRequest } from './orchestrator.js';

const app = express();

// 1. ALLOW ALL CROSS-ORIGIN REQUESTS (Required for the HTML Tester)
app.use(cors());

// 2. INCREASE PAYLOAD LIMITS
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.post('/agent', async (req, res) => {
  const { text, imageBase64 } = req.body;
  
  try {
    console.log(`[${new Date().toLocaleTimeString()}] Request received...`);
    
    let imageBuffer = null;
    if (imageBase64) {
      // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    const response = await handleUserRequest(text || "", imageBuffer);
    res.json({ success: true, response });

  } catch (error) {
    console.error("❌ Agent Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  🚀 AI Agent is ONLINE
  📡 URL: http://localhost:${PORT}/agent
  -----------------------------------
  - Skill 1: News Verifier (Fixed Tool)
  - Skill 2: Traffic Detector
  - Skill 3: Route Analyzer
  `);
});