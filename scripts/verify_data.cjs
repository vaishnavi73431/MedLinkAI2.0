const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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

async function checkCounts() {
    console.log("Checking row counts...");

    const { count: nutCount, error: nutError } = await supabase.from('nutrition_facts').select('*', { count: 'exact', head: true });
    console.log(`Nutrition Facts: ${nutError ? nutError.message : nutCount}`);

    const { count: medCount, error: medError } = await supabase.from('medical_symptoms').select('*', { count: 'exact', head: true });
    console.log(`Medical Symptoms: ${medError ? medError.message : medCount}`);

    const { count: gymCount, error: gymError } = await supabase.from('gym_exercises').select('*', { count: 'exact', head: true });
    console.log(`Gym Exercises: ${gymError ? gymError.message : gymCount}`);
}

checkCounts();
