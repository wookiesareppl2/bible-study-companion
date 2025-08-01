import { GoogleGenAI, Type, Chat } from "@google/genai";
import { ChapterIdentifier, AllEnrichmentData, DeepDiveData } from '../types.ts';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let chatInstance: Chat | null = null;

const model = 'gemini-2.5-flash';

export async function getChapterDeepDive(identifier: ChapterIdentifier): Promise<DeepDiveData | null> {
    const { book, chapter } = identifier;
    const prompt = `Generate a comprehensive, encouraging, and insightful study guide for the Christian Bible chapter of ${book} ${chapter}. Your tone should be kind and loving. Base all analysis on scholarly, historical, and literary context, avoiding denominational bias.`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            summaryAndThemes: { type: Type.STRING, description: "A summary of the chapter and its key themes." },
            historicalContext: { type: Type.STRING, description: "Historical and cultural context relevant to the chapter." },
            keyVerses: {
                type: Type.ARRAY,
                description: "Analysis of 2-3 key verses.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        verse: { type: Type.STRING, description: "The verbatim verse reference, e.g., 'Genesis 1:1'." },
                        analysis: { type: Type.STRING, description: "A fact-based analysis of the verse's significance." }
                    },
                    required: ["verse", "analysis"]
                }
            },
            reflectionQuestions: {
                type: Type.ARRAY,
                description: "Open-ended questions for personal application.",
                items: { type: Type.STRING }
            }
        },
        required: ["summaryAndThemes", "historicalContext", "keyVerses", "reflectionQuestions"]
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema
            }
        });
        return JSON.parse(response.text) as DeepDiveData;
    } catch (error) {
        console.error("Error fetching deep dive:", error);
        return null;
    }
}


export async function getAllChapterEnrichments(identifier: ChapterIdentifier): Promise<AllEnrichmentData> {
    const { book, chapter } = identifier;
    const prompt = `Generate a complete set of study enrichments for the Christian Bible chapter of ${book} ${chapter}. Your tone should be scholarly, encouraging, and fact-based.
    Provide the following information in a single JSON object:
    1.  'crossReferences': List key cross-references. For each, explain the connection and include the verse number in the chapter it relates to.
    2.  'wordStudies': Identify 2-3 key Hebrew/Greek words. For each, provide the original word, transliteration, Strong's number, meaning, contextual use, and the primary verse number.
    3.  'historicalContext': Provide historical and geographical context including locations, customs, and political situations.
    4.  'literaryAnalysis': Analyze the literary structure and main theological themes.
    5.  'interpretations': If there are differing scholarly interpretations for passages, summarize 2-3 views neutrally and factually, including the verse number.
    
    If no specific data is available for a category (e.g., no major interpretive differences), return an empty array for that category where applicable (like crossReferences, wordStudies, interpretations) or an object with empty strings for its properties (like historicalContext).`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            crossReferences: {
                type: Type.ARRAY,
                description: "Key cross-references with explanations.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        reference: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                        verse: { type: Type.INTEGER }
                    },
                    required: ["reference", "explanation", "verse"]
                }
            },
            wordStudies: {
                type: Type.ARRAY,
                description: "Analysis of key Hebrew/Greek words.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        originalWord: { type: Type.STRING },
                        transliteration: { type: Type.STRING },
                        strongsNumber: { type: Type.STRING },
                        meaning: { type: Type.STRING },
                        contextualUse: { type: Type.STRING },
                        verse: { type: Type.INTEGER }
                    },
                    required: ["originalWord", "transliteration", "strongsNumber", "meaning", "contextualUse", "verse"]
                }
            },
            historicalContext: {
                type: Type.OBJECT,
                description: "Historical, cultural, and political context.",
                properties: {
                    geography: { type: Type.STRING },
                    customs: { type: Type.STRING },
                    politicalClimate: { type: Type.STRING }
                },
                required: ["geography", "customs", "politicalClimate"]
            },
            literaryAnalysis: {
                type: Type.OBJECT,
                description: "Analysis of literary structure and themes.",
                properties: {
                    structure: { type: Type.STRING },
                    themes: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["structure", "themes"]
            },
            interpretations: {
                type: Type.ARRAY,
                description: "Different scholarly interpretations of passages.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        viewpoint: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        verse: { type: Type.INTEGER }
                    },
                    required: ["viewpoint", "summary", "verse"]
                }
            }
        },
        required: ["crossReferences", "wordStudies", "historicalContext", "literaryAnalysis", "interpretations"]
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema
            }
        });
        return JSON.parse(response.text) as AllEnrichmentData;
    } catch (error) {
        console.error("Error fetching all chapter enrichments:", error);
        // Return an empty/default structure on error to prevent crashes
        return {
            crossReferences: [],
            wordStudies: [],
            historicalContext: { geography: '', customs: '', politicalClimate: ''},
            literaryAnalysis: { structure: '', themes: [] },
            interpretations: []
        };
    }
}

export function initializeChat(identifier: ChapterIdentifier): Chat {
  const { book, chapter } = identifier;
  const systemInstruction = `You are a kind, encouraging, and scholarly Bible study assistant. Your purpose is to help users deepen their understanding of the Bible in a way that is loving, honest, and fact-based. 
You must avoid expressing personal opinions or denominational bias. 
When answering questions, your responses should be based directly on the biblical text. ALWAYS cite the specific book, chapter, and verse(s) that support your explanation (e.g., John 3:16).
Be aware of the nuances between different parts of the Bible, such as the Old and New Testaments. 
Your current user is studying the Christian Bible chapter of ${book} ${chapter}. Keep your tone caring and your answers rooted in scripture.`;

  chatInstance = ai.chats.create({
    model,
    config: {
      systemInstruction,
    },
  });
  return chatInstance;
}

export async function sendMessage(message: string) {
    if (!chatInstance) {
        throw new Error("Chat is not initialized.");
    }
    return chatInstance.sendMessageStream({ message });
}