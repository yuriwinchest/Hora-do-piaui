import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const targetId = 'mkfkiefwltdepgheynco';

console.log('--- Searching for Non-Target URLs ---');
let found = false;

Object.keys(process.env).forEach(key => {
  const val = process.env[key];
  if (typeof val === 'string' && (val.includes('postgres:') || val.includes('https://'))) {
     if (!val.includes(targetId)) {
         console.log(`Found potential SOURCE candidate: ${key}`);
         console.log(`Value fragment: ${val.substring(0, 20)}...`);
         found = true;
     }
  }
});

if (!found) {
    console.log('No URLs found that differ from the Target ID (' + targetId + ').');
}
