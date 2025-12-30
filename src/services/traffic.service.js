import { GoogleGenerativeAI } from "@google/generative-ai";
// import axios from 'axios';

/**
 const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
 * Skill 2: Vision + OpenStreetMap (No Google Maps Key Required)
 */
export async function detectTraffic(imageBuffer, geminiKey) {
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const visionPrompt = `
    Analyze this photo with high precision.
    1. Identify the exact location, road name, and city.
    2. Assess the traffic density (count vehicles, look for congestion).
    3. Determine if this looks like a traffic jam.
    
    IMPORTANT: You must return ONLY a JSON object. No conversational text.
    JSON structure:
    {
      "location": "Street Name, City",
      "isJam": true/false,
      "ai_assessment": "Clear/Moderate/Heavy",
      "description": "Short explanation of visual evidence"
    }
  `;

  
  
  try {
    console.log(`[BACKEND VISION] 📸 Sending image to Gemini for analysis...`);

    const result = await model.generateContent([
      visionPrompt,
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: "image/jpeg"
        }
      }
    ]);

    const responseText = result.response.text();
    console.log(`[BACKEND VISION] 🤖 AI Raw Response:`, responseText);

    // Robust JSON Extraction (Finds the first { and last })
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI did not return a valid JSON object.");
    }

    const data = JSON.parse(jsonMatch[0]);
    
    // Generate a Google Maps search link for the identified location
    const mapsLink = `https://www.google.com/maps/search/${encodeURIComponent(data.location)}`;

    console.log(`[BACKEND VISION] ✅ Analysis complete for: ${data.location}`);

    return {
      road: data.location,
      status: data.isJam ? `🔴 Heavy Traffic (${data.ai_assessment})` : `🟢 Flow looks ${data.ai_assessment}`,
      details: data.description,
      alternative: `View live flow and alternatives here: ${mapsLink}`
    };

  } catch (error) {
    console.error("[BACKEND VISION] ❌ Traffic Analysis Error:", error.message);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}