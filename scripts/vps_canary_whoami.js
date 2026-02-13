/**
 * Creates a protected canary route (BasicAuth) pointing to traefik/whoami on the VPS.
 *
 * Env (in local .env, NOT committed):
 * - VPS_HOST, VPS_USER, VPS_SSH_KEY_PATH
 * - CANARY_HOST (e.g. canary.fatopago.com)
 * - CANARY_BASIC_AUTH_USERS (e.g. "user:$2y$05$...." ; multiple separated by comma)
 * - CANARY_DYNAMIC_FILE (optional, default: /opt/traefik/dynamic.d/90-canary.yml)
 */
import dotenv from 'dotenv';
import { connectSsh, exec, sftp } from './lib/ssh.js';

dotenv.config();

function requireEnv(name) {
  const v = (process.env[name] || '').trim();
  if (!v) throw new Error(`Missing ${name} in .env`);
  return v;
}

function buildYaml({ canaryHost, users }) {
  const usersYaml = users.map((u) => `          - "${u.replace(/"/g, '\\"')}"`).join('\n');
  return `http:
  middlewares:
    canary-basic-auth:
      basicAuth:
        users:
${usersYaml}
  routers:
    canary-whoami:
      rule: "Host(\\\`${canaryHost}\\\`)"
      service: canary-whoami
      middlewares: [canary-basic-auth]
      entryPoints: [websecure]
      tls: { certResolver: myresolver }
  services:
    canary-whoami:
      loadBalancer:
        servers:
          - url: "http://app_00_whoami:80"
`;
}

async function writeRemoteFile(conn, remotePath, content, mode = 0o644) {
  const s = await sftp(conn);
  await new Promise((resolve, reject) => {
    s.writeFile(remotePath, Buffer.from(content, 'utf8'), { mode }, (e) => (e ? reject(e) : resolve()));
  });
}

async function run() {
  const canaryHost = requireEnv('CANARY_HOST');
  const usersRaw = requireEnv('CANARY_BASIC_AUTH_USERS');
  const dynFile = (process.env.CANARY_DYNAMIC_FILE || '/opt/traefik/dynamic.d/90-canary.yml').trim();

  const users = usersRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (users.length === 0) throw new Error('CANARY_BASIC_AUTH_USERS must contain at least one "user:hash".');

  const yaml = buildYaml({ canaryHost, users });

  const conn = await connectSsh(process.env);
  try {
    await exec(conn, 'docker network inspect web >/dev/null 2>&1 || docker network create --driver bridge web');

    await exec(conn, 'docker rm -f app_00_whoami >/dev/null 2>&1 || true');
    await exec(conn, 'docker run -d --name app_00_whoami --restart always --network web traefik/whoami:v1.10.3');

    await exec(conn, 'mkdir -p /opt/traefik/dynamic.d');
    await writeRemoteFile(conn, dynFile, yaml, 0o644);

    // Traefik watches dynamic.d; still tail logs for quick visibility
    await exec(conn, 'docker logs --tail 80 traefik >/tmp/traefik_canary_tail.log 2>&1 || true');
  } finally {
    conn.end();
  }
}

run().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});

