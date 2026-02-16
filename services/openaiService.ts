
/// <reference types="vite/client" />
import OpenAI from 'openai';
import { HabitTask, ChatMessage, HealthArticle, UserProfile } from '../types';

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

export const chatWithSprout = async (history: ChatMessage[], message: string, userProfile?: UserProfile): Promise<string> => {
    try {
        const systemMessage = userProfile
            ? `${SYSTEM_INSTRUCTION}\n\nUSER PROFILE:\nProfession: ${userProfile.profession || 'Unknown'}\nHealth Goal: ${userProfile.goal || 'General Health'}`
            : SYSTEM_INSTRUCTION;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemMessage },
                ...history.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text } as any)).slice(-5), // Keep context small
                { role: "user", content: message }
            ],
            model: "gpt-4o-mini",
        });

        return completion.choices[0].message.content || "I'm a bit tangled up in my vines! Try again?";
    } catch (error) {
        console.error("Chat Error:", error);
        return "Sorry, my systems are acting up. 🤖";
    }
};


// Helper to search Gym Exercises (RAG)
async function searchGymExercises(message: string): Promise<string> {
    try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

        // Extract potential body parts or equipment from message
        const keywords = message.toLowerCase();
        let filterColumn = 'body_part';
        let searchTerm = '';

        if (keywords.includes('chest')) searchTerm = 'Chest';
        else if (keywords.includes('back')) searchTerm = 'Back';
        else if (keywords.includes('leg') || keywords.includes('quad') || keywords.includes('squat')) searchTerm = 'Legs';
        else if (keywords.includes('arm') || keywords.includes('bicep') || keywords.includes('tricep')) searchTerm = 'Arms';
        else if (keywords.includes('abs') || keywords.includes('core')) searchTerm = 'Abdominals';
        else if (keywords.includes('cardio') || keywords.includes('run')) { filterColumn = 'type'; searchTerm = 'Cardio'; }
        else if (keywords.includes('strength') || keywords.includes('lift')) { filterColumn = 'type'; searchTerm = 'Strength'; }

        if (!searchTerm) {
            // General text search if no specific body part found
            const words = message.split(' ').filter(w => w.length > 4).slice(0, 1).join(' ');
            if (words) {
                const { data } = await supabase.from('gym_exercises').select('*').ilike('title', `%${words}%`).limit(3);
                if (data && data.length > 0) {
                    const exercises = data.map((e: any) => `- ${e.title} (${e.type}): ${e.desc?.substring(0, 100)}...`).join('\n');
                    return `\n\n[REAL GYM DATABASE]:\nFound specific exercises matching "${words}":\n${exercises}`;
                }
            }
            return "";
        }

        const { data, error } = await supabase
            .from('gym_exercises')
            .select('*')
            .ilike(filterColumn, `%${searchTerm}%`)
            .limit(5);

        if (error || !data || data.length === 0) return "";

        const exercises = data.map((e: any) =>
            `- **${e.title}** (${e.level}, ${e.equipment}): ${e.desc?.substring(0, 80)}...`
        ).join('\n');

        return `\n\n[REAL GYM DATABASE]:\nHere are some verified ${searchTerm} exercises from our database:\n${exercises}\nRecommend these to the user.`;
    } catch (e) {
        console.error("Gym RAG Error:", e);
        return "";
    }
}

export const chatWithTrainer = async (history: ChatMessage[], message: string): Promise<string> => {
    try {
        // 1. RAG Search
        const ragContext = await searchGymExercises(message);

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: TRAINER_SYSTEM_INSTRUCTION + ragContext },
                ...history.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text } as any)).slice(-5),
                { role: "user", content: message }
            ],
            model: "gpt-4o-mini",
        });
        return completion.choices[0].message.content || "Keep moving!";
    } catch (error) {
        console.error("Trainer Chat Error:", error);
        return "I'm out of breath! Give me a second.";
    }
};



// Helper to search Supabase (RAG)
async function searchNutritionFacts(query: string): Promise<string> {
    try {
        // Simple text search on food_name
        // We'll search for the first 1-2 words of the query to find matches
        const searchTerms = query.split(' ').slice(0, 2).join(' ');
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

        const { data, error } = await supabase
            .from('nutrition_facts')
            .select('*')
            .ilike('food_name', `%${searchTerms}%`)
            .limit(3);

        if (error || !data || data.length === 0) return "";

        const facts = data.map((item: any) =>
            `- ${item.food_name}: ${item.calories}kcal, ${item.proteins}g protein, ${item.fats}g fat`
        ).join('\n');

        return `\n\n[REAL DATA FROM KAGGLE DATABASE]:\nI found these exact facts in our database:\n${facts}\nUse this data to be precise.`;
    } catch (e) {
        console.error("RAG Search Error:", e);
        return "";
    }
}

export const chatWithNutritionBot = async (history: ChatMessage[], message: string, imageBase64?: string): Promise<string> => {
    try {
        // 1. RAG Search (Retrieval Augmented Generation)
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
            messages.push({ role: "user", content: message });
        }

        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-4o-mini", // Or gpt-4o for better vision
        });
        return completion.choices[0].message.content || "Looks like food to me.";
    } catch (error) {
        console.error("Nutrition Bot Error:", error);
        return "My stomach hurts, try again later.";
    }
};



// Helper to search Medical Symptoms (RAG)
async function searchMedicalConditions(userMessage: string): Promise<string> {
    try {
        // Simple keyword extraction (naive approach)
        // We split user message into words and search if any word matches a symptom in DB
        // A better approach would be vector search, but for now we'll do text matching heavily.

        // Actually, let's reverse it: Search for diseases where ANY of the symptoms overlap with user text?
        // Or just search user text against disease names/symptoms text search.

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

        // Let's try to match user message words against the 'symptoms' array using Postgres overlap or text search
        // Since we can't easily extracting symptoms from NLP without an AI step locally,
        // we will do a broad search:
        // Search if "disease" name OR "symptoms" text contains user keywords.

        // Simplified RAG: Search for the first 2-3 significant words
        const keywords = userMessage.split(' ')
            .filter(w => w.length > 3 && !['have', 'feel', 'pain', 'what', 'does'].includes(w.toLowerCase()))
            .slice(0, 2)
            .join(' | ');

        if (!keywords) return "";

        const { data, error } = await supabase
            .from('medical_symptoms')
            .select('*')
            .textSearch('symptoms', keywords, { config: 'english', type: 'websearch' })
            .limit(3);

        if (error || !data || data.length === 0) return "";

        const conditions = data.map((item: any) =>
            `- **${item.disease}**: Common symptoms include ${item.symptoms.slice(0, 5).join(', ')}`
        ).join('\n');

        return `\n\n[REAL MEDICAL DATA]:\nBased on keywords, here are possible conditions from our database:\n${conditions}\n(Use this to guide the user to a specialist, but maintain the disclaimer).`;
    } catch (e) {
        console.error("Medical RAG Search Error:", e);
        return "";
    }
}

export const chatWithDoctor = async (history: ChatMessage[], message: string): Promise<string> => {
    try {
        // 1. RAG Search
        const ragContext = await searchMedicalConditions(message);

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: DOCTOR_SYSTEM_INSTRUCTION + ragContext },
                ...history.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text } as any)).slice(-5),
                { role: "user", content: message }
            ],
            model: "gpt-4o-mini",
        });
        return completion.choices[0].message.content || "I'm here to listen. Tell me more.";
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
