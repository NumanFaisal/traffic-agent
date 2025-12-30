import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Skill 3: Best Path Analyzer
 * This skill identifies locations from either text or an image and 
 * generates a Google Maps Navigation link.
 */
export async function getBestRoute(userInput, geminiKey, fileBuffer = null) {
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    let contextFromImage = "";

    // 1. Image Identification (if provided)
    if (fileBuffer) {
      const visionPrompt = `
        Analyze this photo. Identify the exact location (Street, City, Landmark).
        Return ONLY a JSON object: { "identified_location": "string" }
      `;
      const visionResult = await model.generateContent([
        visionPrompt,
        { inlineData: { data: fileBuffer.toString("base64"), mimeType: "image/jpeg" } }
      ]);
      const visionData = JSON.parse(visionResult.response.text().replace(/```json|```/g, "").trim());
      contextFromImage = visionData.identified_location;
    }

    // 2. Extract Intent with "Precision Context"
    // We force Gemini to append the City/State if it looks like a local landmark
    const extractPrompt = `
      User Text: "${userInput}"
      Image Context: "${contextFromImage}"
      
      Task: Identify 'from' and 'to'. 
      IMPORTANT: If the locations are in Jamshedpur (like Bistupur, Mango, Sakchi, Telco, Adityapur), 
      ensure you append ", Jamshedpur, Jharkhand" to the names for the map link.
      
      Return ONLY JSON: { "from": "string", "to": "string" }
    `;

    const extraction = await model.generateContent(extractPrompt);
    const { from, to } = JSON.parse(extraction.response.text().replace(/```json|```/g, "").trim());

    if (!to) {
      return `I've pinned your location at ${from || contextFromImage}. Where would you like to navigate to?`;
    }

    // 3. Generate the "Smart" Navigation Link
    // We use the 'dir' action with 'navigate' to trigger the full GPS UI with alternatives
    // This URL format is the most reliable way to trigger Google Maps' native traffic-aware navigation
    const googleNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=driving&dir_action=navigate`;

    return {
      summary: `Route from ${from} to ${to}`,
      status: "🚀 Navigation Link Ready",
      details: "This link will open Google Maps with live traffic and alternative routes.",
      link: googleNavUrl
    };

  } catch (err) {
    console.error("Routing Error:", err);
    return "I couldn't generate a precise route. Please try saying: 'Navigate from Bistupur to Mango'.";
  }
}