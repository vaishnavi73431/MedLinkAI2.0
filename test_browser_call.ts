import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const openai = new OpenAI({
        apiKey: process.env.VITE_OPENAI_API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        dangerouslyAllowBrowser: true 
    });

    try {
        console.log("Testing call...");
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: "Hello?" }],
            model: "gemini-2.5-flash",
            // Add tools to simulate the failing call specifically
            tools: [
                {
                    type: "function",
                    function: {
                        name: "search_web_for_context",
                        description: "Fetches real-time information",
                        parameters: {
                            type: "object",
                            properties: {
                                query: { type: "string" },
                                domain_filter: { type: "string" }
                            },
                            required: ["query"]
                        }
                    }
                }
            ],
            tool_choice: "auto"
        });
        console.log("Success:", completion.choices[0].message.content);
    } catch (e: any) {
        console.error("Error generating completion:", e.message);
        if (e.response) {
            console.error("API Response Data:", e.response.data);
        }
    }
}
run();
