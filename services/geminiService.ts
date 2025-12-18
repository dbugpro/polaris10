import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../types";

export const generateResponse = async (
  prompt: string,
  imageBase64?: string,
  useThinking: boolean = false
): Promise<{ text: string; groundingSources: GroundingSource[] }> => {
  try {
    // Re-pick key from process.env on every call to support dynamic injection from openSelectKey()
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
      throw new Error("API Key is not configured. Please click 'Connect API' in the header to select your AI Studio key.");
    }
    
    // Create new instance right before the call
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

    const modelToUse = useThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelToUse,
      contents: { parts },
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are Polaris, an advanced AI navigator. Your interface is a deep blue orb. You are helpful, precise, and knowledgeable. " + (useThinking ? "You are currently in Deep Thinking mode, focusing on complex reasoning and thorough analysis." : ""),
        ...(useThinking ? {
          thinkingConfig: {
            thinkingBudget: 32768
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
    
    // Check for specific permission/auth errors
    if (error.message?.includes("API key not valid") || error.message?.includes("Requested entity was not found")) {
      throw new Error("API Key validation failed. Please ensure you have selected a paid project for the Pro model.");
    }
    
    throw new Error(error.message || "An unexpected error occurred.");
  }
};