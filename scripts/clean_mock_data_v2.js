import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const IDS_TO_DELETE = [
  '4cf26712-4cc8-4333-9b58-a1b28f66df83',
  'f6844cd5-098b-4f9b-85c0-7d29c704f712',
  '182cc653-075b-42a8-aefe-9c33a42ff0db',
  'f47ac10b-58cc-4372-a567-0e02b2c3d480',
  'f47ac10b-58cc-4372-a567-0e02b2c3d481',
  'f47ac10b-58cc-4372-a567-0e02b2c3d482',
  'f47ac10b-58cc-4372-a567-0e02b2c3d483',
  'f47ac10b-58cc-4372-a567-0e02b2c3d484'
];

async function cleanData() {
  console.log('Deleting specific mock videos...');

  const { error, count } = await supabase
    .from('horapiaui_videos')
    .delete()
    .in('id', IDS_TO_DELETE);

  if (error) console.error('Error deleting videos:', error);
  else console.log(`Deleted mock videos.`);
}

cleanData();
