#!/usr/bin/env node
/**
 * Backup Storage - standalone (sem dotenv, para rodar no Docker na VPS)
 * Variáveis: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BACKUP_IMAGES_DIR
 */
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OUT_DIR = process.env.BACKUP_IMAGES_DIR || './backup-images';
const BUCKET = 'images';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Falta SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function listAll(prefix = '', limit = 1000, offset = 0) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix, limit, offset })
  });
  if (!res.ok) throw new Error(`List: ${res.status}`);
  return res.json();
}

async function listRecursive(prefix = '', acc = []) {
  let offset = 0;
  let items;
  do {
    items = await listAll(prefix, 1000, offset);
    for (const item of items) {
      if (!item.name) continue;
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) acc.push(full);
      else await listRecursive(full, acc);
    }
    offset += items.length;
  } while (items.length === 1000);
  return acc;
}

async function download(fp) {
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fp}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${res.status}: ${fp}`);
  return Buffer.from(await res.arrayBuffer());
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Listando imagens do Supabase Storage...');
  const files = await listRecursive();
  console.log(`Encontradas ${files.length} imagens`);
  let ok = 0, err = 0;
  for (const fp of files) {
    try {
      const buf = await download(fp);
      const outPath = path.join(OUT_DIR, fp.replace(/\//g, '_'));
      fs.writeFileSync(outPath, buf);
      ok++;
      if (ok % 20 === 0) process.stdout.write('.');
    } catch (e) {
      err++;
      console.error(`\nErro ${fp}:`, e.message);
    }
  }
  console.log(`\nOK: ${ok} | Erros: ${err}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
