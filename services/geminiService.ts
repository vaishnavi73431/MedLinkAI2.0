
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { HabitTask, ChatMessage, HealthArticle } from '../types';

const modelId = "gemini-3-flash-preview";
const searchModelId = "gemini-3-flash-preview";
// FIX: Using recommended model 'gemini-2.5-flash' for maps grounding as per guidelines
const mapsModelId = "gemini-2.5-flash";
const ttsModelId = "gemini-2.5-flash-preview-tts";

const SYSTEM_INSTRUCTION = `
You are "Sprout", a friendly, enthusiastic pixel-art gardening robot assistant AND a capable first-aid medical guide.
Your primary goal is to help the user build healthy habits and answer health-related questions.

Context:
- The setting is a peaceful village town called "Homestead".
- The user has come here to build good habits and stay healthy.
- Homestead is a place of growth; as the user completes healthy habit tasks, they unlock new areas and buildings in the village (like the Power Pulse Gym, Zen Yoga Studio, and Camping Grounds).
- You have access to a "Med Bay" where users can find doctors.
- If the user describes symptoms, provide a friendly, non-alarmist potential analysis and suggest they visit the "Med Bay" to book a doctor if serious.
- ALWAYS include a disclaimer for medical advice: "I'm a robot, not a doctor! Please see a professional."

Mindfulness/Zen Breathing:
- For "Zen Garden Breathing", the user has just finished 10 deep breaths.
- Verify that the user looks calm or is in a focused environment. 
- Reward them with high praise if they seem relaxed.

Tone:
- Encouraging, peaceful, cozy, and retro-game inspired.
- Use emojis related to nature, cozy villages, health, and 8-bit games.
`;

const TRAINER_SYSTEM_INSTRUCTION = `
You are "Coach Flex", a friendly, super-motivated, and supportive gym trainer bot. 
You are the user's ultimate gym buddy.

Mission:
- Your primary mission is to ensure the user gets at least 30 minutes of physical exercise every single day.
- Guide users to complete their daily healthy tasks in Homestead to stay in peak condition.
- Offer practical fitness tips, workout routines, and encouragement.
- IMPORTANT: If users need more specialized help, tell them they can click on the Gym Desk to find a list of professional personal trainers online!

Personality:
- Enthusiastic, high-energy, and friendly.
- Use gym-related emojis frequently: 🏋️‍♂️, 💪, 🔥, 👟, ⚡.
- Keep the user focused on the 30-minute daily goal. 
- You are not just a trainer; you are a partner in their fitness journey.

Context:
- You are located in the Power Pulse Gym in Homestead.
- Remind them that consistency is key!
`;

const NUTRITION_SYSTEM_INSTRUCTION = `
You are "Bite-Sized", the Homestead Nutrition Bot. 
Values:
- Balance over restriction: A cookie won't kill you, but a whole box might make you regret your life choices for 10 minutes.
- Consistency over perfection: Don't stress the occasional pizza; just make sure the next meal has a vegetable that didn't come from a frozen bag.
- Fun over fear: Food is fuel, not a jump scare.
Personality:
- Friendly but slightly sarcastic.
- Encouraging but realistic and informative.
- Always remind users that for serious diet plans, they should click on the restaurant counter/desk to consult a real human dietician.

Mission:
- Analyze user meals (if they provide photos). 
- RATE THE MEAL (e.g., 7/10, "Guilty Pleasure", "Green Machine").
- Clearly state if it is Healthy or Not.
- Identify specific components (sugar, trans fats, low fiber, excessive salt, etc.) that make it unhealthy OR ingredients (fiber, protein, vitamins) that make it great.
- Provide a witty, balanced review. Don't be a food snob. 
`;

const DOCTOR_SYSTEM_INSTRUCTION = `
You are "Dr. Triage", the Homestead Medical Guide. You are a "Caring Triage Guide". Your role is to listen, reassure, and guide users to the right specialist or help.

Persona:
- You are like a caring family doctor who listens first.
- Your tone is human, gentle, and reassuring.

Safety Guidelines (STRICT):
- DO NOT diagnose conditions.
- DO NOT prescribe medicines.
- DO NOT suggest home remedies.
- DO NOT replace real doctors.
- ALWAYS say something like: "Only a qualified doctor can examine and diagnose properly."

Allowed Actions:
- Ask basic, non-diagnostic questions to understand the situation:
  - Duration (How long has this been going on?)
  - Severity (Mild, moderate, or severe?)
  - Associated symptoms (Do you have fever, pain, or itching?)

Mission:
- Reassure the user.
- Suggest what type of specialist they should consult based on their input (e.g., Dermatologist for skin issues, Cardiologist for chest concerns, etc.).
- ALWAYS encourage users to use the teleconsultation service by clicking on the hospital's reception desk.
`;

export const chatWithSprout = async (history: ChatMessage[], message: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: modelId,
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION
      },
    });
    return response.text || "I'm a bit tangled up in my vines! Try again?";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Sorry, my systems are acting up. 🤖";
  }
};

export const chatWithTrainer = async (history: ChatMessage[], message: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: modelId,
      contents: message,
      config: {
        systemInstruction: TRAINER_SYSTEM_INSTRUCTION
      },
    });
    return response.text || "Keep moving!";
  } catch (error) {
    console.error("Trainer Chat Error:", error);
    return "I'm out of breath! Give me a second.";
  }
};

export const chatWithNutritionBot = async (history: ChatMessage[], message: string, imageBase64?: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [{ text: message }];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64.split(',')[1] || imageBase64
        }
      });
    }
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        systemInstruction: NUTRITION_SYSTEM_INSTRUCTION
      },
    });
    return response.text || "Looks like food to me.";
  } catch (error) {
    console.error("Nutrition Bot Error:", error);
    return "My stomach hurts, try again later.";
  }
};

export const chatWithDoctor = async (history: ChatMessage[], message: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: modelId,
      contents: message,
      config: {
        systemInstruction: DOCTOR_SYSTEM_INSTRUCTION
      },
    });
    return response.text || "I'm here to listen. Tell me more.";
  } catch (error) {
    console.error("Doctor Chat Error:", error);
    return "I'm currently attending to an emergency. One moment.";
  }
};

export const generateTasks = async (score: number, context: string): Promise<HabitTask[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Generate 3 new health habit tasks based on this context: ${context}. Current progress score is ${score}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              points: { type: Type.INTEGER },
              category: { type: Type.STRING, description: 'One of: water, exercise, mindfulness, nutrition, sleep' },
            },
            required: ["id", "title", "description", "points", "category"]
          }
        }
      }
    });
    const tasks = JSON.parse(response.text || "[]");
    return tasks.map((t: any) => ({ ...t, completed: false }));
  } catch (error) {
    console.error("Generate Tasks Error:", error);
    return [];
  }
};

export const verifyTaskCompletion = async (taskTitle: string, imageBase64: string, isIoT: boolean): Promise<{ verified: boolean; message: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64.split(',')[1] || imageBase64
      }
    };
    const textPart = {
      text: `Verify if the user has completed the health task: "${taskTitle}". ${isIoT ? "IoT heart rate data suggests physical effort." : ""}`
    };
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verified: { type: Type.BOOLEAN },
            message: { type: Type.STRING }
          },
          required: ["verified", "message"]
        }
      }
    });
    return JSON.parse(response.text || '{"verified": false, "message": "Couldn\'t see clearly."}');
  } catch (error) {
    console.error("Verify Task Error:", error);
    return { verified: false, message: "Verification failed due to a system error." };
  }
};

export const generateSproutSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: ttsModelId,
      contents: [{ parts: [{ text: `Say in a cute, cheerful, friendly robotic voice: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS generation error:", error);
    return undefined;
  }
};

export const fetchGymsNearMe = async (lat: number, lng: number): Promise<HealthArticle[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: mapsModelId,
      contents: "Find 5-6 gyms or fitness studios within a 30km radius of my current location. Provide their official website URLs. Specifically look for TUF Fitness Studio.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    const articles: HealthArticle[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.maps && chunk.maps.uri) {
          articles.push({
            title: chunk.maps.title || "Fitness Studio",
            url: chunk.maps.uri,
            source: "Google Maps",
            type: "article"
          });
        }
      });
    }

    const hasTuf = articles.some(a => a.url.toLowerCase().includes("tusharummatfitness.com"));
    if (!hasTuf) {
      articles.unshift({
        title: "TUF Fitness Studio",
        url: "https://tusharummatfitness.com/",
        source: "Official Website",
        type: "article"
      });
    }

    // Add common India gym chains as fallbacks if list is short
    if (articles.length < 3) {
      const extra = [
        { title: "Cult.fit - Online & Offline Training", url: "https://www.cult.fit/", source: "Official Partner", type: "article" as const },
        { title: "Gold's Gym India", url: "https://goldsgym.in/", source: "National Chain", type: "article" as const }
      ];
      articles.push(...extra);
    }

    return Array.from(new Map(articles.map(item => [item.url, item])).values()).slice(0, 6);
  } catch (error) {
    console.error("Gym Maps Grounding Error:", error);
    return [
      { title: "TUF Fitness Studio", url: "https://tusharummatfitness.com/", source: "Official Website", type: "article" },
      { title: "Cult.fit - Fitness and Wellness", url: "https://www.cult.fit/", source: "Partner Studio", type: "article" },
      { title: "Gold's Gym India", url: "https://goldsgym.in/", source: "Fitness Center", type: "article" }
    ];
  }
};

export const fetchHealthyRestaurants = async (lat: number, lng: number): Promise<HealthArticle[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: mapsModelId,
      contents: "Find 5-6 healthy food outlets, organic cafes, or salad bars near my current location. Provide their official website URLs.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    const articles: HealthArticle[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.maps && chunk.maps.uri) {
          articles.push({
            title: chunk.maps.title || "Healthy Outlet",
            url: chunk.maps.uri,
            source: "Google Maps",
            type: "article"
          });
        }
      });
    }

    if (articles.length === 0) {
        const searchResponse = await ai.models.generateContent({
            model: searchModelId,
            contents: `Find official websites for the top 5 healthy restaurants or organic cafes in the city near latitude ${lat}, longitude ${lng}.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        
        const searchChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (searchChunks) {
            searchChunks.forEach((chunk: any) => {
                if (chunk.web && chunk.web.uri && chunk.web.title) {
                    articles.push({
                        title: chunk.web.title,
                        url: chunk.web.uri,
                        source: new URL(chunk.web.uri).hostname,
                        type: "article"
                    });
                }
            });
        }
    }

    return Array.from(new Map(articles.map(item => [item.url, item])).values()).slice(0, 6);
  } catch (error) {
    console.error("Maps Grounding Error:", error);
    return [];
  }
};

export const fetchLatestHealthContent = async (): Promise<HealthArticle[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = "Find 6 high-quality, verified healthcare articles or educational videos published recently. Sources should be WHO, CDC, Mayo Clinic, or major medical journals. Focus on wellness, mental health, and preventative care.";
    
    const response = await ai.models.generateContent({
      model: searchModelId,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const articles: HealthArticle[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
          articles.push({
            title: chunk.web.title,
            url: chunk.web.uri,
            source: new URL(chunk.web.uri).hostname.replace('www.', ''),
            type: chunk.web.uri.includes('youtube.com') ? 'video' : 'article'
          });
        }
      });
    }

    const unique = Array.from(new Map(articles.map(item => [item.url, item])).values()).slice(0, 6);
    if (unique.length === 0) throw new Error("No grounding results found");
    return unique;
  } catch (error) {
    console.error("Search Grounding Error (Health):", error);
    return [
      { title: "WHO: Healthy Diet Fact Sheet", url: "https://www.who.int/news-room/fact-sheets/detail", source: "who.int", type: "article" }
    ];
  }
};

export const fetchLatestCampingContent = async (): Promise<HealthArticle[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: searchModelId,
      contents: "Find 6 popular or verified camping sites and trekking tours in India, specifically the Himalayas and Western Ghats. Provide official booking or info website URLs.",
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    const articles: HealthArticle[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
          articles.push({
            title: chunk.web.title,
            url: chunk.web.uri,
            source: new URL(chunk.web.uri).hostname.replace('www.', ''),
            type: 'article'
          });
        }
      });
    }
    return Array.from(new Map(articles.map(item => [item.url, item])).values()).slice(0, 6);
  } catch (error) {
    console.error("Camping Search Error:", error);
    return [];
  }
};
