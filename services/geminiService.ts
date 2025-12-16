import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DailyWord } from '../types';
import { curatedWords } from './wordList';

const apiKey = process.env.API_KEY || '';
const CACHE_KEY_WORD = 'lingoloop_daily_word';
const CACHE_KEY_AUDIO = 'lingoloop_daily_audio';

// Initialize client only when needed to avoid issues if key is missing during load
const getAiClient = () => new GoogleGenAI({ apiKey });

const getTodayDateString = () => new Date().toDateString();

// Helper to get a deterministic word based on the date
const getWordForToday = (): string => {
  // Use epoch days to ensure the index changes exactly at midnight UTC (or consistent daily rotation)
  const epochDays = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const wordIndex = epochDays % curatedWords.length;
  return curatedWords[wordIndex];
};

export const generateDailyWord = async (): Promise<DailyWord> => {
  // Check Cache
  const today = getTodayDateString();
  try {
    const cached = localStorage.getItem(CACHE_KEY_WORD);
    if (cached) {
      const { date, data } = JSON.parse(cached);
      if (date === today) {
        console.log("Using cached Daily Word for", today);
        return data as DailyWord;
      }
    }
  } catch (e) {
    console.warn("Failed to read daily word cache", e);
  }

  // Strategy: Try Dictionary API with curated list first
  try {
    const targetWord = getWordForToday();
    console.log(`Fetching data for: ${targetWord}`);
    
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${targetWord}`);
    
    if (!response.ok) {
        throw new Error(`Dictionary API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Dictionary API returned empty data");
    }

    const entry = data[0]; // Take the first entry

    // Extract best definition and example
    let bestDefinition = "Definition unavailable.";
    let bestExample = `No example available for ${targetWord}.`;
    
    // Look for a definition with an example if possible
    let found = false;
    if (entry.meanings) {
        for (const meaning of entry.meanings) {
            for (const def of meaning.definitions) {
                if (def.definition) bestDefinition = def.definition;
                if (def.example) {
                    bestExample = def.example;
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
    }

    const result: DailyWord = {
        word: entry.word,
        definition: bestDefinition,
        phonetic: entry.phonetic || (entry.phonetics && entry.phonetics.find((p: any) => p.text)?.text) || `/${targetWord}/`,
        example: bestExample,
        difficulty: "Hard" // Curated list is mostly C1/C2
    };

    // Save to Cache
    try {
        localStorage.setItem(CACHE_KEY_WORD, JSON.stringify({ date: today, data: result }));
    } catch (e) {
        console.warn("Failed to write daily word cache", e);
    }

    return result;

  } catch (error) {
    console.error("Dictionary API failed, falling back to AI generation:", error);
    // Fallback to AI if Dictionary API fails or word is missing
    return generateDailyWordFallback(today);
  }
};

// Fallback method using Gemini if the API strategy fails
const generateDailyWordFallback = async (today: string): Promise<DailyWord> => {
  if (!apiKey) throw new Error("API Key is missing and external API failed.");

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

  let text = response.text;
  if (!text) throw new Error("No response from Gemini");

  if (text.trim().startsWith("```")) {
    text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const result = JSON.parse(text) as DailyWord;

  try {
    localStorage.setItem(CACHE_KEY_WORD, JSON.stringify({ date: today, data: result }));
  } catch (e) {
    console.warn("Failed to write daily word cache", e);
  }

  return result;
};

// Internal raw TTS fetcher
export const getPronunciationAudio = async (text: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = getAiClient();
  const model = "gemini-2.5-flash-preview-tts";

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [{ text: text }]
      }
    ],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    }
  });

  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!audioData) {
    console.error("Gemini TTS unexpected response:", JSON.stringify(response, null, 2));
    throw new Error("Failed to generate audio content. The model may have returned text instead of audio.");
  }

  return audioData;
};

// Cached wrapper for Daily Word Audio
export const getDailyWordAudio = async (text: string): Promise<string> => {
  const today = getTodayDateString();
  
  // Check Cache
  try {
    const cached = localStorage.getItem(CACHE_KEY_AUDIO);
    if (cached) {
      const { date, word, audio } = JSON.parse(cached);
      if (date === today && word === text) {
        console.log("Using cached Audio for", text);
        return audio;
      }
    }
  } catch (e) {
    console.warn("Failed to read daily audio cache", e);
  }

  // Fetch from API
  const audio = await getPronunciationAudio(text);

  // Save to Cache
  try {
    localStorage.setItem(CACHE_KEY_AUDIO, JSON.stringify({ date: today, word: text, audio }));
  } catch (e) {
    console.warn("Failed to write daily audio cache", e);
  }

  return audio;
};