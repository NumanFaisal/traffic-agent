import { GoogleGenerativeAI } from "@google/generative-ai";
// import axios from 'axios';

/**
 const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
 * Skill 2: Vision + OpenStreetMap (No Google Maps Key Required)
 */
export async function detectTraffic(imageBuffer, geminiKey) {
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const visionPrompt = `Analyze this photo. 
  1. Identify the street/city. 
  2. Is it a traffic jam? 
  Return ONLY JSON: { "location": "string", "isJam": boolean, "description": "string" }`;
  
  try {
    const result = await model.generateContent([
      visionPrompt,
      { inlineData: { data: imageBuffer.toString("base64"), mimeType: "image/jpeg" } }
    ]);

    const data = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
    
    // Generate a Google Maps link for the identified location to see alternatives
    const mapsLink = `https://www.google.com/maps/search/${encodeURIComponent(data.location)}`;

    return {
      road: data.location,
      status: data.isJam ? "🔴 Heavy Traffic detected in photo" : "🟢 Flow looks clear",
      details: data.description,
      alternative: data.isJam ? `Avoid this area. See alternative routes here: ${mapsLink}` : `Check live flow here: ${mapsLink}`
    };
  } catch (e) {
    throw new Error("Could not analyze traffic from image.");
  }
}