import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = 'postgres://postgres:Fatopago%402026@db.mkfkiefwltdepgheynco.supabase.co:5432/postgres';

const { Client } = pg;

async function debugImageIssue() {
  console.log('--- Debugging Image Save Issue ---');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    
    // 1. Check Column Name
    console.log('\nChecking table schema...');
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'horapiaui_news' 
        AND column_name LIKE '%image%';
    `);
    
    console.log('Image columns found:', res.rows);
    // Expected: 'image' or 'image_url'
    
    // 2. Check the Latest News (Created by you)
    console.log('\nChecking latest news entry...');
    const resNews = await client.query(`
        SELECT id, title, image, image_description 
        FROM public.horapiaui_news 
        ORDER BY created_at DESC 
        LIMIT 1;
    `);
    
    if (resNews.rowCount > 0) {
        console.log('Latest News:');
        console.log(`- Title: ${resNews.rows[0].title}`);
        console.log(`- Image Field Value: '${resNews.rows[0].image}'`); // Check if it's null or empty
        console.log(`- Description: ${resNews.rows[0].image_description}`);
    }

  } catch (err) {
    console.error(err.message);
  } finally {
    await client.end();
  }
}

debugImageIssue();
