const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');

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

// Possible filenames for the dataset
const POSSIBLE_FILES = ['megaGymDataset.csv', 'gym.csv', 'gym_exercises.csv', 'archive/megaGymDataset.csv'];
let CSV_FILE = 'megaGymDataset.csv';

async function importGymData() {
    // Find the file
    let found = false;
    for (const file of POSSIBLE_FILES) {
        if (fs.existsSync(file)) {
            CSV_FILE = file;
            found = true;
            break;
        }
    }

    if (!found) {
        console.error(`Gym dataset file not found! Please place 'megaGymDataset.csv' (or 'gym.csv') in root.`);
        return;
    }

    console.log(`Reading from ${CSV_FILE}...`);

    const fileStream = fs.createReadStream(CSV_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let headers = [];
    let count = 0;
    const items = [];

    // MegaGymDataset usually has: Title, Desc, Type, BodyPart, Equipment, Level, Rating, etc.

    for await (const line of rl) {
        if (count === 0) {
            headers = line.split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
            console.log("Headers:", headers);
            count++;
            continue;
        }

        const row = parseCSVRow(line);
        if (row.length < 2) continue;

        // Map Columns dynamically
        const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('name'));
        const descIdx = headers.findIndex(h => h.includes('desc'));
        const typeIdx = headers.findIndex(h => h.includes('type'));
        const bodyPartIdx = headers.findIndex(h => h.includes('body') || h.includes('part'));
        const equipIdx = headers.findIndex(h => h.includes('equip'));
        const levelIdx = headers.findIndex(h => h.includes('level'));

        if (titleIdx === -1) continue;

        const item = {
            title: row[titleIdx]?.trim(),
            description: descIdx !== -1 ? row[descIdx]?.trim() : '',
            type: typeIdx !== -1 ? row[typeIdx]?.trim() : '',
            body_part: bodyPartIdx !== -1 ? row[bodyPartIdx]?.trim() : '',
            equipment: equipIdx !== -1 ? row[equipIdx]?.trim() : '',
            level: levelIdx !== -1 ? row[levelIdx]?.trim() : ''
        };

        if (item.title) {
            items.push(item);
        }

        count++;

        if (items.length >= 100) {
            // Upsert based on title (assuming distinct titles) or just insert
            // Note: If no unique constraint on title, duplicates might occur if run twice. 
            // Better to rely on unique ID or title. user should add unique constraint if needed.
            const { error } = await supabase.from('gym_exercises').insert(items);
            if (error) console.error("Insert error:", error.message);
            else console.log(`Imported batch ending at row ${count}`);
            items.length = 0;
        }
    }

    if (items.length > 0) {
        const { error } = await supabase.from('gym_exercises').insert(items);
        if (error) console.error("Insert error:", error.message);
        else console.log(`Imported final batch.`);
    }

    console.log("Gym Data Import complete!");
}

function parseCSVRow(row) {
    const result = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"')); // Remove surrounding quotes and handle double quotes
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    return result;
}

importGymData();
