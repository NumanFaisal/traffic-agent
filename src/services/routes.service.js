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

    // 1. If an image is provided, identify the current location first
    if (fileBuffer) {
      const visionPrompt = `
        Analyze this photo. Look for landmarks, street signs, or city features.
        Identify the exact location (Street, City).
        Return ONLY a JSON object: { "identified_location": "string" }
      `;

      const visionResult = await model.generateContent([
        visionPrompt,
        { inlineData: { data: fileBuffer.toString("base64"), mimeType: "image/jpeg" } }
      ]);

      const visionData = JSON.parse(visionResult.response.text().replace(/```json|```/g, "").trim());
      contextFromImage = visionData.identified_location;
    }

    // 2. Extract Intent (Origin and Destination)
    const extractPrompt = `
      User Text: "${userInput}"
      Image Context: "${contextFromImage}"
      
      Task: Identify the 'from' (origin) and 'to' (destination) points.
      If the text says 'go to [place]', use the Image Context as the 'from' point.
      If both are in the text, ignore the image context.
      
      Example: "Bistupur to Mango" -> { "from": "Bistupur, Jamshedpur", "to": "Mango, Jamshedpur" }
      Return ONLY JSON.
    `;

    const extraction = await model.generateContent(extractPrompt);
    const { from, to } = JSON.parse(extraction.response.text().replace(/```json|```/g, "").trim());

    if (!to) {
      return `I've identified the location as ${from || contextFromImage}. Where would you like to go from here?`;
    }

    // 3. Create a Google Maps Navigation Link (Direct & Alternative routes)
    // The 'dir' endpoint automatically shows alternative routes if traffic is detected
    const googleNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=driving`;

    return {
      summary: `Route from ${from} to ${to}`,
      status: "✅ Route & Alternatives Generated",
      details: `Identified starting point: ${from}`,
      link: googleNavUrl
    };

  } catch (err) {
    console.error("Routing Error:", err);
    return "Could not calculate the route. Please provide clear location names or a clearer photo.";
  }
}