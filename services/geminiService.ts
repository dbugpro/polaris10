import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../types";

const MODEL_NAME = 'gemini-2.5-flash';

export const generateResponse = async (
  prompt: string,
  imageBase64?: string
): Promise<{ text: string; groundingSources: GroundingSource[] }> => {
  try {
    // Ensure we are accessing the environment variable at runtime
    const apiKey = process.env.API_KEY;
    
    // Robust check for API Key presence before initializing the SDK
    if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
      throw new Error("API Key is not configured. Please check your environment settings to ensure 'API_KEY' is set.");
    }
    
    // Initialize the client per request to ensure we use the current environment variable
    const ai = new GoogleGenAI({ apiKey });

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
        systemInstruction: "You are Polaris, an advanced AI navigator. Your interface is a deep blue orb. You are helpful, precise, and knowledgeable about the world. When using search tools, provide clear summaries.",
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
    // Return a user-friendly error message
    throw new Error(error.message || "An unexpected error occurred.");
  }
};