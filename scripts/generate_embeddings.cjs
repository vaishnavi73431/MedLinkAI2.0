const { createClient } = require('@supabase/supabase-js');
const { fetch, Request, Response, Headers } = require('undici');

// Polyfill fetch for OpenAI and Supabase
if (!global.fetch) {
    global.fetch = fetch;
    global.Headers = Headers;
    global.Request = Request;
    global.Response = Response;
}

const OpenAI = require('openai');
const fs = require('fs');

// --- 1. Robust Environment Parsing ---
const parseEnv = () => {
    try {
        const envConfig = fs.readFileSync('.env', 'utf-8');
        const env = {};
        envConfig.split('\n').forEach(line => {
            line = line.trim();
            if (!line || line.startsWith('#')) return;
            const firstEqual = line.indexOf('=');
            if (firstEqual === -1) return;
            const key = line.substring(0, firstEqual).trim();
            let value = line.substring(firstEqual + 1).trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            env[key] = value;
        });
        return env;
    } catch (e) { return {}; }
};

const env = parseEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: env.VITE_OPENAI_API_KEY });

// --- 2. Helper: Retry Logic ---
async function withRetry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            console.log(`   Command failed, retrying (${i + 1}/${retries})... Error: ${error.code || error.message}`);
            await new Promise(res => setTimeout(res, delay * (i + 1)));
        }
    }
}

// --- 3. Helper: Connectivity Check ---
async function checkInternet() {
    console.log("🔍 Checking network connectivity...");
    try {
        await fetch('https://api.openai.com', { method: 'HEAD' }); // HEAD might be 404 but proves connection
        console.log("✅ OpenAI is reachable.");
    } catch (e) {
        console.error("❌ OpenAI Unreachable:", e.cause || e.message);
        console.log("   (If it's a 404/405, that's fine. We check for network error mainly)");
    }
    try {
        await fetch(env.VITE_SUPABASE_URL, { method: 'HEAD' });
        console.log("✅ Supabase is reachable.");
    } catch (e) {
        console.error("❌ Supabase Unreachable:", e.cause || e.message);
    }
}

// --- 4. Main Generation Logic ---
async function generateEmbeddings(table, textColumn, extraColumn = null, isArray = false) {
    console.log(`\nProcessing ${table}...`);

    // Fetch rows
    const { data: rows, error } = await supabase
        .from(table)
        .select(`id, ${textColumn}${extraColumn ? ', ' + extraColumn : ''}`)
        .is('embedding', null)
        .limit(50); // Small batch for safety

    if (error) {
        console.error(`Error fetching ${table}:`, error.message);
        return;
    }

    if (!rows || rows.length === 0) {
        console.log(`No pending rows for ${table}.`);
        return;
    }

    console.log(`Found ${rows.length} rows to embed.`);

    for (const row of rows) {
        let text = row[textColumn];

        // Custom formatting
        if (extraColumn) {
            let extra = row[extraColumn];
            if (isArray && Array.isArray(extra)) extra = extra.join(', ');
            text = `${text}: ${extra}`;
        }

        if (!text) continue;

        try {
            await withRetry(async () => {
                // OpenAI Call
                const response = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: text,
                });
                const embedding = response.data[0].embedding;

                // Supabase Update
                const { error: upError } = await supabase
                    .from(table)
                    .update({ embedding })
                    .eq('id', row.id);

                if (upError) throw new Error(`Supabase update failed: ${upError.message}`);
            });
            process.stdout.write('.');
        } catch (e) {
            console.error(`\n❌ Failed row ${row.id} in ${table}:`, e.message);
            if (e.cause) console.error("   Cause:", e.cause);
        }
    }
    console.log(`\nBatch done for ${table}.`);
}

async function run() {
    await checkInternet();

    // Nutrition
    await generateEmbeddings('nutrition_facts', 'food_name');

    // Medical
    await generateEmbeddings('medical_symptoms', 'disease', 'symptoms', true);

    // Gym
    await generateEmbeddings('gym_exercises', 'title', 'description');

    console.log("\nDone! Run the script again if you have more rows.");
}

run();
