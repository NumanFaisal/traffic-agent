import { GoogleGenerativeAI } from "@google/generative-ai";


export async function verifyNews(input, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    tools: [{ google_search: {} }] // Enables live web search
  });
  const prompt = `You are a professional fact-checker. 
  Analyze the following claim: "${input}". 
  Use Google Search to find current news reports and official statements. 
  Provide a verdict: TRUE, FALSE, or MISLEADING, and explain why with sources.`;

  try {
    console.log(`[BACKEND SEARCH] 🔍 Initiating live internet search for: "${input}"`);
    console.log(`[BACKEND SEARCH] 🌐 Accessing Google Search Grounding...`);

    const result = await model.generateContent(prompt);
    
    // Extract grounding metadata if available (sources)
    const metadata = result.response.candidates?.[0]?.groundingMetadata;
    if (metadata && metadata.searchEntryPoint) {
      console.log(`[BACKEND SEARCH] ✅ Sources found. Displaying search results metadata in response.`);
    }

    return result.response.text();
  } catch (error) {
    console.error("[BACKEND SEARCH] ❌ News Verification Error:", error);
    return "The fact-checking tool encountered an error while searching the internet: " + error.message;
  }
}