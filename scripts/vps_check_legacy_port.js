/**
 * Checks whether LEGACY_PORT is exposed on the VPS (IPv4 and/or IPv6).
 *
 * Env (local .env):
 * - VPS_HOST, VPS_USER, VPS_SSH_KEY_PATH
 * - LEGACY_PORT (e.g. 81)
 */
import dotenv from 'dotenv';
import { connectSsh, exec } from './lib/ssh.js';

dotenv.config();

const port = String(process.env.LEGACY_PORT || '').trim();
if (!port || !/^\d+$/.test(port)) {
  console.error('Missing/invalid LEGACY_PORT in .env (example: LEGACY_PORT=81)');
  process.exit(1);
}

async function run() {
  const conn = await connectSsh(process.env);
  try {
    const out = await exec(conn, `ss -lntp | awk '$4 ~ /:${port}$/ {print}' || true`);
    const lines = out
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      console.log(`OK: no process listening on :${port}`);
      return;
    }

    const exposed = lines.some((l) => l.includes(`0.0.0.0:${port}`) || l.includes(`:::${port}`));
    console.log(`Found listeners on :${port}:\n${lines.join('\n')}`);
    if (exposed) {
      console.log(`WARNING: :${port} appears exposed (0.0.0.0 or :::).`);
      process.exitCode = 2;
    } else {
      console.log(`OK: :${port} is not bound to 0.0.0.0/:::.`);
    }
  } finally {
    conn.end();
  }
}

run().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});

