/**
 * Baixa todas as imagens do bucket Supabase Storage para pasta local.
 * Usa SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do .env
 * Saída: ./backup-images/ (ou BACKUP_IMAGES_DIR)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OUT_DIR = process.env.BACKUP_IMAGES_DIR || path.join(__dirname, '../docker/backup-images');
const BUCKET = 'images';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Falta SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

async function listAllObjects(prefix = '', limit = 1000, offset = 0) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prefix, limit, offset })
  });
  if (!res.ok) throw new Error(`List failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function listRecursive(prefix = '', acc = []) {
  let offset = 0;
  const limit = 1000;
  let items;
  do {
    items = await listAllObjects(prefix, limit, offset);
    for (const item of items) {
      if (!item.name) continue;
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) {
        acc.push(fullPath);
      } else {
        await listRecursive(fullPath, acc);
      }
    }
    offset += items.length;
  } while (items.length === limit);
  return acc;
}

async function downloadFile(filePath) {
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${filePath}`);
  return Buffer.from(await res.arrayBuffer());
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Listando objetos do bucket images...');
  const objects = await listRecursive();
  console.log(`Encontrados ${objects.length} arquivos`);
  let ok = 0;
  let err = 0;
  for (const fp of objects) {
    try {
      const buf = await downloadFile(fp);
      const outPath = path.join(OUT_DIR, fp.replace(/\//g, '_'));
      fs.writeFileSync(outPath, buf);
      ok++;
      if (ok % 10 === 0) process.stdout.write('.');
    } catch (e) {
      err++;
      console.error(`\nErro ${fp}:`, e.message);
    }
  }
  console.log(`\nOK: ${ok} | Erros: ${err}`);
  return ok;
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
