import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const knownProjects = {
  'raxjzfvunjxqbxswuipp': 'OLD_VPS_PROJECT',
  'mkfkiefwltdepgheynco': 'NEW_LOCAL_PROJECT'
};

console.log('--- Scanning .env for Database Connections ---');

const dbVars = {};

Object.keys(process.env).forEach(key => {
  const val = process.env[key];
  if (typeof val === 'string' && (val.includes('postgres://') || val.includes('postgresql://') || val.includes('supabase.co'))) {
    
    let label = 'UNKNOWN';
    for (const [id, name] of Object.entries(knownProjects)) {
      if (val.includes(id)) {
        label = name;
        break;
      }
    }
    
    console.log(`Key: ${key}`);
    console.log(`  -> Identifies as: ${label}`);
    // console.log(`  -> Value fragment: ${val.substring(0, 15)}...`); // debug only if needed
    
    if (label !== 'UNKNOWN') {
      dbVars[label] = dbVars[label] || [];
      dbVars[label].push(key);
    }
  }
});

console.log('\n--- Summary ---');
console.log('Variables pointing to OLD project:', dbVars.OLD_VPS_PROJECT || 'None');
console.log('Variables pointing to NEW project:', dbVars.NEW_LOCAL_PROJECT || 'None');
