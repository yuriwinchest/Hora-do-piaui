import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Usando ANON KEY, se falhar por RLS precisarei da SERVICE_ROLE_KEY se disponível, mas normalmente delete requer permissões. 
// Se o RLS estiver ativo, talvez eu precise de autenticação ou service role.
// Vou tentar com ANON KEY primeiro, mas o ideal seria usar a service role key se estiver no .env, mas geralmente não está em projetos frontend.
// Se falhar, pedirei ao usuário para apagar manualmente ou farei login.

// UPDATE: Se o RLS permitir delete para anon ou public, vai funcionar. Se não, preciso logar.
// Como tenho acesso aos scripts anteriores, vi que scripts de setup usam VITE_SUPABASE_URL.
// Vou checar se existe uma chave de serviço no .env lendo-o (mas sem expor no output).
// Melhor: vou tentar ler o .env para ver as chaves disponíveis.

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const NEWS_IDS = [
  'f47ac10b-58cc-4372-a567-0e02b2c3d471',
  'f47ac10b-58cc-4372-a567-0e02b2c3d472',
  'f47ac10b-58cc-4372-a567-0e02b2c3d473',
  'f47ac10b-58cc-4372-a567-0e02b2c3d474',
  'f47ac10b-58cc-4372-a567-0e02b2c3d475',
  'f47ac10b-58cc-4372-a567-0e02b2c3d476',
  'f47ac10b-58cc-4372-a567-0e02b2c3d477',
  'f47ac10b-58cc-4372-a567-0e02b2c3d478',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'
];

const VIDEO_IDS = [
  'f47ac10b-58cc-4372-a567-0e02b2c3d480',
  'f47ac10b-58cc-4372-a567-0e02b2c3d481',
  'f47ac10b-58cc-4372-a567-0e02b2c3d482',
  'f47ac10b-58cc-4372-a567-0e02b2c3d483',
  'f47ac10b-58cc-4372-a567-0e02b2c3d484'
];

async function cleanData() {
  console.log('Cleaning mock data...');

  // Delete News
  const { error: newsError, count: newsCount } = await supabase
    .from('horapiaui_news')
    .delete()
    .in('id', NEWS_IDS);

  if (newsError) console.error('Error deleting news:', newsError);
  else console.log(`Mock news deleted successfully.`);

  // Delete Videos
  const { error: videoError, count: videoCount } = await supabase
    .from('horapiaui_videos')
    .delete()
    .in('id', VIDEO_IDS);

  if (videoError) console.error('Error deleting videos:', videoError);
  else console.log(`Mock videos deleted successfully.`);
}

cleanData();
