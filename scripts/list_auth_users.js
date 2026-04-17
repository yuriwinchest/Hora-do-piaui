/**
 * List Supabase Auth users (emails, ids, timestamps) and write to a CSV.
 *
 * Security notes:
 * - Passwords are NOT retrievable from Supabase Auth (only hashes exist server-side).
 * - This script intentionally does NOT print the user list to stdout by default.
 *
 * Env (required):
 * - SUPABASE_URL (or VITE_SUPABASE_URL)
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 * - node scripts/list_auth_users.js
 * - node scripts/list_auth_users.js --out auth-users.csv
 * - node scripts/list_auth_users.js --stdout   (prints CSV to stdout)
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

function getArgValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i < 0) return null;
  const v = process.argv[i + 1];
  if (!v || v.startsWith('--')) return null;
  return v;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function requireEnv(name, value) {
  const v = String(value || '').trim();
  if (!v) {
    console.error(`Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

function csvEscape(value) {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function main() {
  const supabaseUrl = requireEnv('SUPABASE_URL/VITE_SUPABASE_URL', process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);

  const outPathArg = getArgValue('--out');
  const outPath = outPathArg ? path.resolve(process.cwd(), outPathArg) : path.resolve(process.cwd(), 'auth-users.csv');
  const toStdout = hasFlag('--stdout');

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const perPage = 1000;
  let page = 1;
  const users = [];

  for (;;) {
    // Supabase Auth Admin API pagination: page is 1-based.
    // eslint-disable-next-line no-await-in-loop
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);

    const batch = data?.users || [];
    users.push(...batch);

    if (batch.length < perPage) break;
    page += 1;
  }

  const header = ['id', 'email', 'created_at', 'last_sign_in_at', 'confirmed_at', 'phone'];
  const lines = [header.join(',')];

  for (const u of users) {
    const row = [
      csvEscape(u.id),
      csvEscape(u.email),
      csvEscape(u.created_at),
      csvEscape(u.last_sign_in_at),
      csvEscape(u.confirmed_at),
      csvEscape(u.phone),
    ];
    lines.push(row.join(','));
  }

  const csv = lines.join('\n') + '\n';

  if (toStdout) {
    process.stdout.write(csv);
    console.log(`\nTotal users: ${users.length}`);
    return;
  }

  fs.writeFileSync(outPath, csv, 'utf8');
  console.log(`Wrote ${users.length} users to ${outPath}`);
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});

