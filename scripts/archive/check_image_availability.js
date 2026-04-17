import https from 'https';

const urls = process.argv.slice(2).map((s) => String(s || '').trim()).filter(Boolean);

if (urls.length === 0) {
    console.error('Usage: node scripts/check_image_availability.js <url1> <url2> ...');
    process.exit(1);
}

urls.forEach(url => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
        console.log(`${url} => Status: ${res.statusCode}`);
    });
    req.on('error', (e) => console.log(`${url} => Error: ${e.message}`));
    req.end();
});
