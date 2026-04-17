// Dry-run: conta (e opcionalmente aplica) rewrite de URLs que apontam
// para o host direto do Supabase -> proxy https://horapiaui.com/supabase.
// Usa supabase-js com service_role (via REST), sem dependencia de pg/pooler.
//
// Uso:
//   node scripts/count_supabase_direct_urls.js          # dry-run (default)
//   node scripts/count_supabase_direct_urls.js --apply  # aplica
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const LEGACY_ORIGIN = 'https://mkfkiefwltdepgheynco.supabase.co';
const NEW_ORIGIN = 'https://horapiaui.com/supabase';
const APPLY = process.argv.includes('--apply');

// Importante: o supabase-js do admin deve ir DIRETO (nao via proxy do site),
// porque este script roda localmente a partir da rede boa.
const SUPABASE_URL = 'https://mkfkiefwltdepgheynco.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const targets = [
  { table: 'horapiaui_news', columns: ['image', 'image_url', 'author_avatar'] },
  { table: 'advertising_banners', columns: ['image_url'] },
  { table: 'horapiaui_videos', columns: ['image', 'thumbnail', 'thumbnail_url'] },
];

async function countAndMaybeApply() {
  let grand = 0;
  for (const t of targets) {
    for (const c of t.columns) {
      // SELECT id + coluna, filtrando pelo prefixo legacy
      const { data, error } = await sb
        .from(t.table)
        .select(`id, ${c}`)
        .like(c, `${LEGACY_ORIGIN}%`);
      if (error) {
        if (String(error.message).toLowerCase().includes('does not exist')) {
          console.log(`[SKIP] ${t.table}.${c} (coluna/tabela nao existe)`);
          continue;
        }
        throw error;
      }
      const n = data?.length || 0;
      grand += n;
      console.log(`[COUNT] ${t.table}.${c}: ${n} linhas`);
      if (APPLY && n > 0) {
        for (const row of data) {
          const newVal = row[c].replace(LEGACY_ORIGIN, NEW_ORIGIN);
          const { error: upErr } = await sb
            .from(t.table)
            .update({ [c]: newVal })
            .eq('id', row.id);
          if (upErr) {
            console.error(`[ERR] ${t.table}#${row.id}.${c}:`, upErr.message);
          }
        }
        console.log(`[APPLIED] ${t.table}.${c}: ${n} linhas`);
      }
    }
  }
  console.log(`---\n${APPLY ? 'TOTAL REESCRITO' : 'TOTAL a reescrever'}: ${grand}`);
}

countAndMaybeApply().catch((e) => { console.error(e?.message || e); process.exit(1); });
