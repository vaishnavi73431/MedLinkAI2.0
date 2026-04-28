const OpenAI = require('openai');
const fs = require('fs');

const envConfig = fs.readFileSync('.env', 'utf-8');
const env = {};
envConfig.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const firstEqual = line.indexOf('=');
    if (firstEqual === -1) return;
    env[line.substring(0, firstEqual).trim()] = line.substring(firstEqual + 1).trim();
});

const openai = new OpenAI({
    apiKey: env.VITE_OPENAI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

async function run() {
    try {
        console.log("Testing chat completion...");
        const res = await openai.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: [{ role: "user", content: "Say hello!" }],
            tools: [{
                type: "function",
                function: {
                    name: "test_tool",
                    description: "test",
                    parameters: { type: "object", properties: { query: { type: "string" } } }
                }
            }],
            tool_choice: "auto"
        });
        console.log("Success:", res.choices[0].message.content);
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error(e.response.data);
    }
}
run();
