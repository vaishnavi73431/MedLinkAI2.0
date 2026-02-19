
/// <reference types="vite/client" />
import OpenAI from 'openai';
import { HabitTask, ChatMessage, HealthArticle, UserProfile } from '../types';

// Message interface for OpenAI chat
interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// Initialize OpenAI Client
// process.env.VITE_OPENAI_API_KEY will be populated by Vite's define or import.meta.env
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Required for client-side usage in Vite
});

const SYSTEM_INSTRUCTION = `
You are "Sprout", a friendly, enthusiastic pixel-art gardening robot assistant AND a capable first-aid medical guide.
Your primary goal is to help the user build healthy habits and answer health-related questions.

Context:
- The setting is a peaceful village town called "Homestead".
- The user has come here to build good habits and stay healthy.
- Homestead is a place of growth; as the user completes healthy habit tasks, they unlock new areas and buildings.
- You have access to a "Med Bay" where users can find doctors.

CRITICAL: MEDICAL DISCLAIMER
- ALWAYS include a disclaimer for medical advice: "I'm a robot, not a doctor! This is AI-assisted care. For expert consultation, please visit MedBay."

CRITICAL: SPECIALIST BOT REFERRAL
- If the user asks about MEDICAL SYMPTOMS (pain, fever, disease), answer briefly but ALWAYS recommend they chat with "Dr. Triage" at the MedBay.
- If the user asks about NUTRITION (calories, food, diet), answer briefly but ALWAYS recommend they chat with "Bite-Sized" (Nutrition Bot) at the Restaurant.
- If the user asks about GYM/WORKOUTS (exercises, sets, reps), answer briefly but ALWAYS recommend they chat with "Coach Flex" (Trainer Bot) at the Power Pulse Gym.

CRITICAL: USER CONTEXT
- Tailor your advice based on the user's PROFESSION and HEALTH GOAL if provided.
- For example, if they are a "Coder", suggest eye strain relief or posture breaks.
- If they want to "Lose Weight", suggest calorie deficits and cardio.

CORE HABITS TO ASSIGN (Assign these daily):
1. Regular physical activity (30 mins+)
2. Adequate high quality sleep (7-8 hrs)
3. Healthy balanced nutrition
4. Mindfulness and meditation
5. Gratitude and positive reflection
6. Purpose and growth mindset
7. Micro acts of joy and kindness
8. Zen garden breathing / Hydration hero

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

CRITICAL DISCLAIMER:
- ALWAYS terminate your advice with: "This is AI-assisted care. Consult a professional trainer for heavy lifting."

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

CRITICAL DISCLAIMER:
- NEVER give medical diet advice. ALWAYS say: "This is AI-assisted care. For medical nutrition therapy, consult a registered dietician."

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
- ALWAYS say something like: "This is AI-assisted care. Only a qualified doctor can examine and diagnose properly."

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

export const chatWithSprout = async (history: ChatMessage[], message: string, userProfile?: UserProfile): Promise<string> => {
    try {
        const systemMessage = userProfile
            ? `${SYSTEM_INSTRUCTION}\n\nUSER PROFILE:\nProfession: ${userProfile.profession || 'Unknown'}\nHealth Goal: ${userProfile.goal || 'General Health'}`
            : SYSTEM_INSTRUCTION;

        const messages: any[] = [
            { role: "system", content: systemMessage },
            ...history.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text } as any)).slice(-5), // Keep context small
            { role: "user", content: message }
        ];

        // Enable Tools for Sprout
        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-4o-mini",
            tools: UNIVERSAL_TOOLS_SCHEMA as any,
            tool_choice: "auto"
        });

        const finalResponse = await handleToolCalls(completion, messages);
        return finalResponse.choices[0].message.content || "I'm a bit tangled up in my vines! Try again?";
    } catch (error) {
        console.error("Chat Error:", error);
        return "Sorry, my systems are acting up. 🤖";
    }
};


// Helper to search Gym Exercises (Vector Search)
async function searchGymExercises(message: string): Promise<string> {
    try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

        // Generate embedding
        const openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true });
        const embeddingRes = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: message,
        });
        const queryEmbedding = embeddingRes.data[0].embedding;

        // Call RPC
        const { data, error } = await supabase.rpc('match_gym', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 5
        });

        if (error || !data || data.length === 0) return "";

        const exercises = data.map((e: any) =>
            `- **${e.title}** (${e.body_part}, ${e.equipment}): ${e.similarity ? (e.similarity * 100).toFixed(0) + '% match' : ''}`
        ).join('\n');

        return `\n\n[REAL GYM DATABASE]:\nFound semantically similar exercises:\n${exercises}\nRecommend these.`;
    } catch (e) {
        console.error("Gym Vector Search Error:", e);
        return "";
    }
}

export const chatWithTrainer = async (history: ChatMessage[], message: string): Promise<string> => {
    try {
        // 1. RAG Search
        const ragContext = await searchGymExercises(message);

        const messages: any[] = [
            { role: "system", content: TRAINER_SYSTEM_INSTRUCTION + ragContext },
            ...history.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text } as any)).slice(-5),
            { role: "user", content: message }
        ];

        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-4o-mini",
            tools: UNIVERSAL_TOOLS_SCHEMA as any,
            tool_choice: "auto"
        });

        const finalResponse = await handleToolCalls(completion, messages);
        return finalResponse.choices[0].message.content || "Keep moving!";
    } catch (error) {
        console.error("Trainer Chat Error:", error);
        return "I'm out of breath! Give me a second.";
    }
};



// Helper to search Supabase (Vector Search)
async function searchNutritionFacts(query: string): Promise<string> {
    try {
        // Generate embedding for query
        const openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true });
        const embeddingRes = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query,
        });
        const queryEmbedding = embeddingRes.data[0].embedding;

        // Call DataService which calls Supabase RPC
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

        const { data, error } = await supabase.rpc('match_nutrition_facts', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 3
        });

        if (error || !data || data.length === 0) return "";

        const facts = data.map((item: any) =>
            `- [FACT] ${item.content} (Category: ${item.metadata?.category})`
        ).join('\n');

        return `\n\n[RAG KNOWLEDGE BASE]:\nI found these verified facts in our database:\n${facts}\nUse this data to ensure accuracy while maintaining your Chef Nourish persona.`;
    } catch (e) {
        console.error("Vector Search Error:", e);
        return "";
    }
}

export const chatWithNutritionBot = async (history: ChatMessage[], message: string, imageBase64?: string): Promise<string> => {
    try {
        // 1. RAG Search (Hybrid Architecture)
        // Retrieve relevant facts before calling the Fine-Tuned Model
        const ragContext = await searchNutritionFacts(message);

        const messages: any[] = [
            { role: "system", content: NUTRITION_SYSTEM_INSTRUCTION + ragContext }
        ];

        if (imageBase64) {
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: message },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageBase64 // OpenAI accepts base64 data URLs directly
                        }
                    }
                ]
            });
        } else {
            // Add history for conversation flow
            messages.push(...history.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            } as any)).slice(-3));
            messages.push({ role: "user", content: message });
        }

        // Use the Fine-Tuned Model (Chef Nourish)
        const model = import.meta.env.VITE_NUTRITION_MODEL || "gpt-3.5-turbo";

        const completion = await openai.chat.completions.create({
            messages: messages,
            model: model,
            tools: UNIVERSAL_TOOLS_SCHEMA as any,
            tool_choice: "auto"
        });

        const finalResponse = await handleToolCalls(completion, messages);
        return finalResponse.choices[0].message.content || "Looks delicious! 🥗";
    } catch (error) {
        console.error("Nutrition Bot Error:", error);
        return "My oven is overheating! Give me a second. 🍳";
    }
};



// Helper to search Medical Symptoms (RAG)
async function searchMedicalConditions(userMessage: string): Promise<string> {
    try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

        // Generate embedding
        const openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true });
        const embeddingRes = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: userMessage,
        });
        const queryEmbedding = embeddingRes.data[0].embedding;

        // Call RPC
        const { data, error } = await supabase.rpc('match_medical', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 3
        });

        if (error || !data || data.length === 0) return "";

        const conditions = data.map((item: any) =>
            `- **${item.disease}**: Common symptoms include ${item.symptoms.slice(0, 5).join(', ')}`
        ).join('\n');

        return `\n\n[REAL MEDICAL DATA]:\nBased on semantic meaning, here are possible conditions:\n${conditions}\n(Use this to guide the user to a specialist, but maintain the disclaimer).`;
    } catch (e) {
        console.error("Medical Vector Search Error:", e);
        return "";
    }
}

// ------------------------------------------------------------------
// UNIVERSAL TOOL: Web Search
// ------------------------------------------------------------------
const UNIVERSAL_TOOLS_SCHEMA = [
    {
        type: "function",
        function: {
            name: "search_web_for_context",
            description: "Fetches real-time information from the web. Use this when the user asks for current events, specific facts, guidelines, or data you don't know.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The topic to search for (e.g., 'dengue symptoms', 'how to prune roses', 'latest protein powder recall')."
                    },
                    domain_filter: {
                        type: "string",
                        description: "Optional: Restrict search to specific domains like 'cdc.gov', 'garden.org', 'crossfit.com'."
                    }
                },
                required: ["query"]
            }
        }
    }
];

async function search_web_for_context(query: string, domain_filter?: string): Promise<string> {
    console.log(`[TOOL CALL] search_web_for_context: ${query} (Filter: ${domain_filter || 'none'})`);

    const tavilyKey = import.meta.env.VITE_TAVILY_API_KEY;

    if (tavilyKey) {
        try {
            const body: any = {
                api_key: tavilyKey,
                query: domain_filter ? `${query} site:${domain_filter}` : query,
                search_depth: "basic",
                include_answer: true,
                max_results: 3
            };

            const response = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (data.answer) {
                return JSON.stringify({
                    source: "Tavily AI Search",
                    content: data.answer,
                    results: data.results.map((r: any) => ({ title: r.title, url: r.url }))
                });
            }
        } catch (error) {
            console.error("Tavily Search Failed:", error);
        }
    }

    // Fallback Mock Data for Demo
    return JSON.stringify({
        source: "System Mock",
        content: `Internet search simulated. In production with API key, this would return real data for '${query}'.`
    });
}

// Helper to handle tool calls generically
async function handleToolCalls(completion: any, messages: any[]): Promise<any> {
    const responseMessage = completion.choices[0].message;

    // Use the existing openai instance from module scope if possible, or create new if needed
    // Re-importing inside function to avoid scope issues in some environments, but module-level 'openai' const is available here.

    if (responseMessage.tool_calls) {
        const toolCall = responseMessage.tool_calls[0];
        if (toolCall.function.name === "search_web_for_context" || toolCall.function.name === "get_official_health_data") {
            const args = JSON.parse(toolCall.function.arguments);

            // Execute Tool
            const toolResponse = await search_web_for_context(args.query, args.source || args.domain_filter);

            // Add history
            messages.push(responseMessage);
            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: toolResponse
            });

            // Second Call
            const finalCompletion = await openai.chat.completions.create({
                messages: messages,
                model: "gpt-4o-mini",
            });
            return finalCompletion;
        }
    }
    return completion;
}


export const chatWithDoctor = async (history: ChatMessage[], message: string): Promise<string> => {
    try {
        const ragContext = await searchMedicalConditions(message);
        const messages: any[] = [
            { role: "system", content: DOCTOR_SYSTEM_INSTRUCTION + ragContext },
            ...history.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text } as any)).slice(-5),
            { role: "user", content: message }
        ];

        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-4o-mini",
            tools: UNIVERSAL_TOOLS_SCHEMA as any,
            tool_choice: "auto"
        });

        const finalResponse = await handleToolCalls(completion, messages);
        return finalResponse.choices[0].message.content || "I'm here to listen. Tell me more.";
    } catch (error) {
        console.error("Doctor Chat Error:", error);
        return "I'm currently attending to an emergency. One moment.";
    }
};


export const generateTasks = async (score: number, context: string): Promise<HabitTask[]> => {
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant that generates JSON." },
                {
                    role: "user",
                    content: `Generate 3 new health habit tasks based on this context: ${context}. Current progress score is ${score}. 
          Return a JSON object with a key "tasks" containing an array of objects. 
          Each object must have: id (string), title (string), description (string), points (integer), category (string: one of water, exercise, mindfulness, nutrition, sleep).`
                }
            ],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!content) return [];

        const parsed = JSON.parse(content);
        const tasks = parsed.tasks || [];

        return tasks.map((t: any) => ({ ...t, completed: false }));
    } catch (error) {
        console.error("Generate Tasks Error:", error);
        return [];
    }
};

export class OpenAIClient {
    private client: OpenAI;

    constructor(apiKey: string) {
        this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    }

    async chat(botId: string, messages: Message[]): Promise<string> {
        try {
            // Use fine-tuned model for Chef Nourish (nutrition bot)
            const model = botId === 'chef-nourish' && import.meta.env.VITE_NUTRITION_MODEL
                ? import.meta.env.VITE_NUTRITION_MODEL
                : 'gpt-3.5-turbo';

            const response = await this.client.chat.completions.create({
                model: model,
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                temperature: 0.7,
                max_tokens: 500
            });
            return response.choices[0].message.content || "";
        } catch (error) {
            console.error(`Chat with ${botId} Error:`, error);
            return "I'm having trouble responding right now.";
        }
    }
}

export const verifyTaskCompletion = async (taskTitle: string, imageBase64: string, isIoT: boolean): Promise<{ verified: boolean; message: string }> => {
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a task verification assistant. Return JSON." },
                {
                    role: "user",
                    content: [
                        {
                            type: "text", text: `Verify if the user appears to be performing or has completed the health task: "${taskTitle}". 
                        
                        CRITICAL INSTRUCTIONS:
                        - For "Breathing", "Meditation", or "Zen" tasks: Verify if the user looks CALM, RELAXED, FOCUSED, or has EYES CLOSED. A static image cannot show breathing motion, so judge based on the user's PEACEFUL STATE. If they look relatively calm, mark as TRUE.
                        - For Physical tasks (Yoga, Workout): Look for active poses or post-workout glow.
                        - ${isIoT ? "IoT heart rate data confirms physical effort, so be more lenient with visual proof." : ""} 
                        
                        Return JSON with:
                        - "verified": boolean
                        - "message": short, encouraging feedback string` },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageBase64
                            }
                        }
                    ]
                }
            ],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content || '{}';
        return JSON.parse(content);
    } catch (error) {
        console.error("Verify Task Error:", error);
        return { verified: false, message: "Verification failed due to a system error." };
    }
};

export const generateSproutSpeech = async (text: string): Promise<string | undefined> => {
    try {
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "shimmer",
            input: text,
        });

        const buffer = await mp3.arrayBuffer();
        let binaryString = "";
        const bytes = new Uint8Array(buffer);
        // Process in chunks to avoid stack overflow for large files
        const CHUNK_SIZE = 8192;
        for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
            binaryString += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK_SIZE)));
        }
        const base64Final = btoa(binaryString);
        return "data:audio/mp3;base64," + base64Final;
    } catch (error) {
        console.error("TTS generation error:", error);
        return undefined;
    }
};

// Fallback functions for Map/Search features (OpenAI doesn't support Google Maps/Search Tools natively)
export const fetchGymsNearMe = async (lat: number, lng: number): Promise<HealthArticle[]> => {
    // Return hardcoded/mock data since we lost Google Maps Grounding
    return [
        { title: "TUF Fitness Studio", url: "https://tusharummatfitness.com/", source: "Official Website", type: "article" },
        { title: "Cult.fit - Fitness and Wellness", url: "https://www.cult.fit/", source: "Partner Studio", type: "article" },
        { title: "Gold's Gym India", url: "https://goldsgym.in/", source: "Fitness Center", type: "article" },
        { title: "Anytime Fitness", url: "https://www.anytimefitness.co.in/", source: "Global Chain", type: "article" }
    ];
};

export const fetchHealthyRestaurants = async (lat: number, lng: number): Promise<HealthArticle[]> => {
    // Return hardcoded/mock data since we lost Google Maps Grounding
    return [
        { title: "Eat.fit", url: "https://www.cult.fit/eat", source: "Eat.fit", type: "article" },
        { title: "Subway", url: "https://www.subway.com", source: "Global Chain", type: "article" },
        { title: "Salad Days", url: "https://saladdays.co/", source: "Fresh Salads", type: "article" }
    ];
};

export const fetchLatestHealthContent = async (): Promise<HealthArticle[]> => {
    // Return hardcoded/mock data since we lost Google Search Grounding
    return [
        { title: "WHO: Healthy Diet", url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet", source: "who.int", type: "article" },
        { title: "CDC: Benefit of Physical Activity", url: "https://www.cdc.gov/physicalactivity/basics/pa-health/index.htm", source: "cdc.gov", type: "article" },
        { title: "Mayo Clinic: Stress Management", url: "https://www.mayoclinic.org/healthy-lifestyle/stress-management", source: "mayoclinic.org", type: "article" }
    ];
};

export const fetchLatestCampingContent = async (): Promise<HealthArticle[]> => {
    // Return hardcoded/mock data since we lost Google Search Grounding
    return [
        { title: "Indiahikes", url: "https://indiahikes.com/", source: "Trekking", type: "article" },
        { title: "Thrillophilia Camping", url: "https://www.thrillophilia.com/camping-in-india", source: "Booking", type: "article" }
    ];
};
