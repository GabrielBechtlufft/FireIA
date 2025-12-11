import { GoogleGenAI } from "@google/genai";
import { Incident, Vehicle } from "../types";

// NOTE: in a real app, ensure process.env.API_KEY is defined in build config
// For this demo, if API_KEY is missing, we will simulate or handle gracefully.
const API_KEY = process.env.API_KEY || '';

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export const generateSituationReport = async (incidents: Incident[], vehicles: Vehicle[]): Promise<string> => {
  if (!ai) {
    return "API Key not configured. Using simulation: Currently managing " + incidents.length + " active incidents with " + vehicles.filter(v => v.status === 'Disponível').length + " available vehicles.";
  }

  try {
    const activeIncidents = incidents.filter(i => i.status !== 'Encerrado').length;
    const availableVehicles = vehicles.filter(v => v.status === 'Disponível').length;
    
    // Construct a prompt context
    const context = `
      Data:
      - Active Incidents: ${activeIncidents}
      - Detailed Incident List: ${JSON.stringify(incidents.map(i => ({ type: i.type, priority: i.priority, desc: i.description })))}
      - Available Vehicles: ${availableVehicles}
      - Total Vehicles: ${vehicles.length}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an AI assistant for a Fire Department COE. 
      Based on the provided data, generate a concise, professional Situation Report (SITREP) for the shift commander.
      Focus on critical incidents and resource availability. Use military/emergency style brevity.
      ${context}`,
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating report. Please check system logs.";
  }
};

export const suggestResources = async (incident: Incident, vehicles: Vehicle[]): Promise<string> => {
    if (!ai) return "AI unavailable.";

    try {
        const available = vehicles.filter(v => v.status === 'Disponível').map(v => ({ id: v.id, type: v.type }));
        const prompt = `
            Incident: ${incident.type} (${incident.priority}) at ${incident.address}.
            Description: ${incident.description}.
            Available Resources: ${JSON.stringify(available)}.
            
            Suggest which vehicle IDs to dispatch and why. Keep it short.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        return response.text || "No suggestion available.";
    } catch (e) {
        return "Error getting suggestions.";
    }
}