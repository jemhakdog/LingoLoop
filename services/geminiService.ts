import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DailyWord } from '../types';

const apiKey = process.env.API_KEY || '';

// Initialize client only when needed to avoid issues if key is missing during load
const getAiClient = () => new GoogleGenAI({ apiKey });

export const generateDailyWord = async (): Promise<DailyWord> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = getAiClient();
  const model = "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model,
    contents: "Generate a sophisticated 'Word of the Day' for a language learner. It should be an English word that is useful but slightly advanced (C1/C2 level).",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          definition: { type: Type.STRING },
          phonetic: { type: Type.STRING, description: "IPA phonetic transcription" },
          example: { type: Type.STRING },
          difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
        },
        required: ["word", "definition", "phonetic", "example", "difficulty"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  return JSON.parse(text) as DailyWord;
};

export const getPronunciationAudio = async (text: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = getAiClient();
  const model = "gemini-2.5-flash-preview-tts";

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: text }]
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    }
  });

  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!audioData) {
    throw new Error("Failed to generate audio content");
  }

  return audioData;
};
