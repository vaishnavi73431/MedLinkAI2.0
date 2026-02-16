const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const XLSX = require('xlsx');

// Load environment variables (mocking dotenv)
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
        console.error("Could not read .env file");
        return {};
    }
};

const env = parseEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const EXCEL_FILE = 'Gym Exercises Dataset.xlsx';

async function importGymData() {
    if (!fs.existsSync(EXCEL_FILE)) {
        console.error(`File ${EXCEL_FILE} not found!`);
        return;
    }

    console.log(`Reading from ${EXCEL_FILE}...`);
    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log(`Found ${data.length} rows.`);

    const items = [];

    // Map data to our schema
    // The dataset likely has columns like 'Title', 'Desc', 'Type', 'BodyPart', etc.
    // We need to inspect the first row to be sure, but sheet_to_json does that.

    for (const row of data) {
        // Normalize keys to lower case for easier mapping if needed, 
        // or just access directly if we know header names.
        // Let's assume standard names from Kaggle or map dynamically.

        // Log first row keys to debug if needed
        if (items.length === 0) console.log("First row keys:", Object.keys(row));

        const item = {
            title: row['Title'] || row['name'] || row['Exercise Name'],
            description: row['Desc'] || row['Description'] || '',
            type: row['Type'] || row['Exercise Type'] || '',
            body_part: row['BodyPart'] || row['Muscle Group'] || '',
            equipment: row['Equipment'] || '',
            level: row['Level'] || row['Difficulty'] || '',
            rating: row['Rating'] || null
        };

        if (item.title) {
            items.push(item);
        }

        if (items.length >= 100) {
            const { error } = await supabase.from('gym_exercises').insert(items);
            if (error) console.error("Insert error:", error.message);
            else process.stdout.write('.');
            items.length = 0;
        }
    }

    if (items.length > 0) {
        const { error } = await supabase.from('gym_exercises').insert(items);
        if (error) console.error("Insert error:", error.message);
    }

    console.log("\nGym Data Import complete!");
}

importGymData();
