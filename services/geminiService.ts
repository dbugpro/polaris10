import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../types";

// Initialize the client
// Note: API_KEY is expected to be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const generateResponse = async (
  prompt: string,
  imageBase64?: string
): Promise<{ text: string; groundingSources: GroundingSource[] }> => {
  try {
    const parts: any[] = [];

    if (imageBase64) {
      // If we have an image, we extract the base64 data. 
      // Usually imageBase64 comes as "data:image/png;base64,..."
      const base64Data = imageBase64.split(',')[1];
      const mimeType = imageBase64.split(';')[0].split(':')[1];
      
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    parts.push({ text: prompt });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        // Enable Google Search Grounding
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are Polaris, an advanced AI navigator. Your interface is a deep blue orb. You are helpful, precise, and knowledgeable about the world. When using search tools, summarize the information clearly.",
      },
    });

    const text = response.text || "I couldn't generate a response.";
    
    // Extract grounding metadata if available
    const groundingSources: GroundingSource[] = [];
    
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        const candidate = candidates[0];
        const chunks = candidate.groundingMetadata?.groundingChunks;
        
        if (chunks) {
            chunks.forEach((chunk: any) => {
                if (chunk.web) {
                    groundingSources.push({
                        title: chunk.web.title || "Source",
                        url: chunk.web.uri
                    });
                }
            });
        }
    }

    return { text, groundingSources };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "An unexpected error occurred.");
  }
};