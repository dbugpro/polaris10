import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../types";

export type PolarisMode = 'standard' | 'fast' | 'deep' | 'turbo';

export const generateResponse = async (
  prompt: string,
  imageBase64?: string,
  mode: PolarisMode = 'standard'
): Promise<{ text: string; groundingSources: GroundingSource[] }> => {
  try {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
      throw new Error("API Key is not configured. Please use a valid environment key.");
    }
    
    const ai = new GoogleGenAI({ apiKey });

    const parts: any[] = [];

    if (imageBase64) {
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

    let modelToUse = 'gemini-3-flash-preview';
    if (mode === 'deep') modelToUse = 'gemini-3-pro-preview';
    if (mode === 'fast') modelToUse = 'gemini-flash-lite-latest';
    if (mode === 'turbo') modelToUse = 'gemini-3-flash-preview';
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelToUse,
      contents: { parts },
      config: {
        // Search is not available for all models/configs, using it where appropriate
        ...(mode !== 'fast' && mode !== 'turbo' ? { tools: [{ googleSearch: {} }] } : {}),
        systemInstruction: `You are Polaris, an advanced AI navigator. Your interface is a glowing orb. You are helpful, precise, and knowledgeable. Mode: ${mode}.`,
        ...(mode === 'deep' ? {
          thinkingConfig: {
            thinkingBudget: 32768
          }
        } : {}),
        ...(mode === 'turbo' ? {
          thinkingConfig: {
            thinkingBudget: 16384
          }
        } : {})
      },
    });

    const text = response.text || "I couldn't generate a response.";
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