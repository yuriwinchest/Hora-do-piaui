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

async function inspectVideos() {
  console.log('Fetching all videos...');

  const { data, error } = await supabase
    .from('horapiaui_videos')
    .select('id, title, created_at');

  if (error) {
    console.error('Error fetching videos:', error);
    return;
  }

  console.log('Videos found:', data.length);
  data.forEach(video => {
    console.log(`[${video.id}] ${video.title} (${video.created_at})`);
  });
}

inspectVideos();
