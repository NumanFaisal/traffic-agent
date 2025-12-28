import { verifyNews } from "./services/news.service.js";
import { getBestRoute } from "./services/routes.service.js";
import { detectTraffic } from "./services/traffic.service.js";


/**
 * The Orchestrator decides which skill to trigger.
 */
export async function handleUserRequest(input, fileBuffer = null) {
  const geminiKey = process.env.GEMINI_API_KEY;

  // 1. If an image is sent -> Use Traffic Skill (AI Vision + OSM)
  if (fileBuffer) {
    console.log("-> [ORCHESTRATOR] Routing to Traffic Skill");
    const result = await detectTraffic(fileBuffer, geminiKey);
    return {
      type: "traffic",
      content: `🚦 *Traffic Update*\nStatus: ${result.status}\n📍 Area: ${result.road}\n📝 AI Observation: ${result.details}\n\n🗺️ *Alternative Route:* \n${result.alternative}`
    };
  }

  const routeKeywords = ['from', 'to', 'directions', 'route'];
  if (routeKeywords.some(kw => input.toLowerCase().includes(kw))) {
    console.log("-> [ORCHESTRATOR] Routing to Routes Skill");
    const res = await getBestRoute(input, geminiKey);
    if (typeof res === 'string') return { type: "text", content: res };
    return {
      type: "route",
      content: `🏁 *Trip Planner*\n${res.summary}\n${res.status}\n\n🚗 *Start Navigation:* \n${res.link}`
    };
  }

  // if (isRouteQuery) {
  //   console.log("-> Routing to: Routes Skill");
  //   const res = await getBestRoute(input, geminiKey);
  //   if (typeof res === 'string') return res;
  //   return `🏁 Route: ${res.summary}\n⏱ Est. Time: ${res.duration}\n🛣️ Distance: ${res.distance}\nℹ️ ${res.status}`;
  // }

  // 3. Default -> News Verification (Grounding)
  console.log("-> [ORCHESTRATOR] Routing to News Skill (Internet Search)");
  const newsResponse = await verifyNews(input, geminiKey);
  return {
    type: "news",
    content: newsResponse,
    status: "Internet search completed via Google Search Grounding."
  };
}