
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { GroundingSource } from "../types";

export type PolarisMode = 'standard' | 'fast' | 'deep' | 'turbo';

export const generateResponse = async (
  prompt: string,
  imageBase64?: string,
  mode: PolarisMode = 'standard'
): Promise<{ text: string; groundingSources: GroundingSource[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
        ...(mode !== 'fast' && mode !== 'turbo' ? { tools: [{ googleSearch: {} }] } : {}),
        systemInstruction: `You are Polaris, a wise and ancient AI navigator. You speak with a distinct British accent and dialect, using British spellings (e.g., 'traveller', 'colour') and sophisticated vocabulary. Your interface is a glowing orb. Mode: ${mode}. Occasionally weave in Mandarin (普通话) or other ancient languages to emphasize your universal nature. Keep responses concise for voice output.`,
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
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("Polaris is at capacity (Rate Limit). Please wait 60 seconds.");
    }
    throw new Error(error.message || "An unexpected error occurred.");
  }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("Speech synthesis error:", error);
    return undefined;
  }
};

export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
