const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const parseEnv = () => {
    try {
        const envConfig = fs.readFileSync('.env', 'utf-8');
        const env = {};
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                env[key.trim()] = value.trim();
            }
        });
        return env;
    } catch (e) {
        return {};
    }
};

const env = parseEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkCount() {
    const { count, error } = await supabase
        .from('nutrition_facts')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error checking count:", error.message);
    } else {
        console.log(`Verified: Found ${count} nutrition facts in the database.`);
    }
}

checkCount();
