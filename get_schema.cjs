const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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

const { fetch, Request, Response, Headers } = require('undici');
if (!global.fetch) {
    global.fetch = fetch;
    global.Headers = Headers;
    global.Request = Request;
    global.Response = Response;
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data: nut } = await supabase.from('nutrition_facts').select('*').limit(1);
    console.log("NUTRI:", nut ? Object.keys(nut[0]).map(k => `${k}: ${typeof nut[0][k]}`) : "No data");
}
run();
