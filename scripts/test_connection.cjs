const https = require('https');

function testUrl(url) {
    return new Promise((resolve, reject) => {
        console.log(`Testing connection to ${url}...`);
        https.get(url, (res) => {
            console.log(`${url} responded with status: ${res.statusCode}`);
            res.resume();
            resolve();
        }).on('error', (e) => {
            console.error(`FAILED to connect to ${url}: ${e.message}`);
            resolve(); // Resolve anyway to let other tests run
        });
    });
}

async function run() {
    await testUrl('https://www.google.com');
    await testUrl('https://api.openai.com');
    await testUrl('https://supabase.com');
}

run();
