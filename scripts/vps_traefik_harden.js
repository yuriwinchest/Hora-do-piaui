/**
 * Harden Traefik on the VPS following the "organiza-vps.md" checklist.
 *
 * What it does (safe-by-default):
 * - Creates /opt/traefik/dynamic.d if missing
 * - Backups: acme.json, dynamic.yml, docker-compose.yml (timestamped)
 * - Updates /opt/traefik/docker-compose.yml to:
 *   - use file provider directory (/etc/traefik/dynamic.d)
 *   - mount ./dynamic.d read-only
 *   - explicitly disable docker provider (--providers.docker=false)
 *   - ensure network web is external
 * - Restarts Traefik (docker compose up -d)
 *
 * Requirements:
 * - .env with VPS_HOST, VPS_USER, VPS_SSH_KEY_PATH
 */
import dotenv from 'dotenv';
import { connectSsh, exec, sftp } from './lib/ssh.js';

dotenv.config();

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function indentOf(line) {
  const m = line.match(/^(\s*)/);
  return m ? m[1].length : 0;
}

function findSectionEnd(lines, startIdx) {
  const baseIndent = indentOf(lines[startIdx]);
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const ind = indentOf(line);
    if (ind <= baseIndent) return i;
  }
  return lines.length;
}

function findChildKeyExact(lines, parentStartIdx, parentEndIdx, key, expectedIndent) {
  for (let i = parentStartIdx + 1; i < parentEndIdx; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (indentOf(line) !== expectedIndent) continue;
    if (line.trim() === `${key}:`) return i;
  }
  return -1;
}

function findChildKeyWithValue(lines, parentStartIdx, parentEndIdx, key, expectedIndent) {
  // Matches both:
  // - key:
  // - key: value
  const re = new RegExp(`^${key.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}:\\s*`);
  for (let i = parentStartIdx + 1; i < parentEndIdx; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (indentOf(line) !== expectedIndent) continue;
    if (re.test(line.trim())) return i;
  }
  return -1;
}

function normalizeCmdItem(line) {
  // Accept:
  // - --foo=bar
  // - "--foo=bar"
  const trimmed = line.trim();
  const m = trimmed.match(/^-\s*(.*)$/);
  if (!m) return null;
  let v = m[1].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  return v;
}

function patchTraefikCommand(lines, traefikStart, traefikEnd) {
  const cmdIdxExact = findChildKeyExact(lines, traefikStart, traefikEnd, 'command', 4);
  if (cmdIdxExact < 0) {
    const cmdIdxValue = findChildKeyWithValue(lines, traefikStart, traefikEnd, 'command', 4);
    if (cmdIdxValue >= 0) {
      throw new Error('Unsupported docker-compose.yml: services.<traefik>.command must be a YAML list (command: on its own line).');
    }
    throw new Error('Could not find services.<traefik>.command in docker-compose.yml');
  }
  const cmdIdx = cmdIdxExact;

  // command list items start after cmdIdx and have indent 6 and "- ..."
  let i = cmdIdx + 1;
  while (i < traefikEnd && (!lines[i].trim() || lines[i].trim().startsWith('#'))) i++;

  const items = [];
  const extraLines = [];
  for (; i < traefikEnd; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) {
      // Preserve comments/blank lines in the command block (they will be moved to the top).
      extraLines.push(line);
      continue;
    }
    const ind = indentOf(line);
    if (ind < 6) break;
    if (!line.trim().startsWith('-')) break;

    const v = normalizeCmdItem(line);
    if (!v) {
      extraLines.push(line);
      continue;
    }
    items.push(v);
  }

  const desired = [
    '--providers.file.directory=/etc/traefik/dynamic.d',
    '--providers.file.watch=true',
    '--providers.docker=false',
  ];

  const filtered = items.filter((v) => {
    if (v.startsWith('--providers.file.filename=')) return false;
    if (v.startsWith('--providers.docker')) return false; // we'll re-add docker=false
    return true;
  });

  for (const d of desired) {
    if (!filtered.some((v) => v === d)) filtered.push(d);
  }

  // Replace the command list block in-place: remove existing list items under command and re-add.
  const startList = cmdIdx + 1;
  const endList = i; // first non-list line or traefikEnd

  const newList = filtered.map((v) => `      - ${v}`);
  // Keep comments/blank lines (if any) at the top of the command block.
  const preserved = extraLines.length ? [...extraLines, ...newList] : newList;
  lines.splice(startList, endList - startList, ...preserved);
  return lines;
}

function patchTraefikVolumes(lines, traefikStart, traefikEnd) {
  const volsIdx = findChildKeyExact(lines, traefikStart, traefikEnd, 'volumes', 4);
  if (volsIdx < 0) throw new Error('Could not find services.traefik.volumes in docker-compose.yml');

  const mount = './dynamic.d:/etc/traefik/dynamic.d:ro';
  // Find volumes list extent
  let i = volsIdx + 1;
  while (i < traefikEnd && (!lines[i].trim() || lines[i].trim().startsWith('#'))) i++;
  const entries = [];
  for (; i < traefikEnd; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const ind = indentOf(line);
    if (ind < 6) break;
    if (!line.trim().startsWith('-')) break;
    const v = normalizeCmdItem(line);
    if (v) entries.push(v);
  }

  if (entries.some((e) => e === mount)) return lines;

  // Insert mount at end of volumes list (before i)
  lines.splice(i, 0, `      - ${mount}`);
  return lines;
}

function patchTraefikNetworks(lines, traefikStart, traefikEnd) {
  const netsIdx = findChildKeyExact(lines, traefikStart, traefikEnd, 'networks', 4);
  if (netsIdx < 0) throw new Error('Could not find services.traefik.networks in docker-compose.yml');

  let i = netsIdx + 1;
  while (i < traefikEnd && (!lines[i].trim() || lines[i].trim().startsWith('#'))) i++;

  const nets = [];
  let endList = i;
  for (; endList < traefikEnd; endList++) {
    const line = lines[endList];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const ind = indentOf(line);
    if (ind < 6) break;
    if (!line.trim().startsWith('-')) break;
    const v = normalizeCmdItem(line);
    if (v) nets.push(v);
  }

  if (nets.includes('web')) return lines;

  lines.splice(endList, 0, '      - web');
  return lines;
}

function ensureTopLevelWebExternal(lines) {
  const netsIdx = lines.findIndex((l) => l.trim() === 'networks:' && indentOf(l) === 0);
  if (netsIdx < 0) {
    lines.push('');
    lines.push('networks:');
    lines.push('  web:');
    lines.push('    external: true');
    return lines;
  }

  const netsEnd = findSectionEnd(lines, netsIdx);
  const webIdx = findChildKeyExact(lines, netsIdx, netsEnd, 'web', 2);
  if (webIdx < 0) {
    lines.splice(netsIdx + 1, 0, '  web:', '    external: true');
    return lines;
  }

  const webEnd = findSectionEnd(lines, webIdx);
  const extIdx = findChildKeyWithValue(lines, webIdx, webEnd, 'external', 4);
  if (extIdx < 0) {
    lines.splice(webIdx + 1, 0, '    external: true');
    return lines;
  }

  // Ensure it's true
  lines[extIdx] = '    external: true';
  return lines;
}

async function readRemoteFile(conn, remotePath) {
  const content = await exec(conn, `test -f ${remotePath} && cat ${remotePath} || echo "__MISSING__"`);
  if (content.trim() === '__MISSING__') return null;
  return content;
}

async function writeRemoteFile(conn, remotePath, content, mode = 0o644) {
  const s = await sftp(conn);
  await new Promise((resolve, reject) => {
    s.writeFile(remotePath, Buffer.from(content, 'utf8'), { mode }, (e) => (e ? reject(e) : resolve()));
  });
}

async function dockerComposeUp(conn) {
  const which = await exec(conn, 'command -v docker-compose >/dev/null 2>&1 && echo "docker-compose" || echo "docker compose"');
  const cmd = which.trim() === 'docker-compose' ? 'docker-compose' : 'docker compose';
  await exec(conn, `cd /opt/traefik && ${cmd} up -d`);
  return cmd;
}

async function dockerComposePsAny(conn, cmd) {
  const ids = await exec(conn, `cd /opt/traefik && ${cmd} ps -q || true`);
  return ids
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

async function run() {
  const stamp = nowStamp();
  const conn = await connectSsh(process.env);

  try {
    // Pre-req dirs
    await exec(conn, 'mkdir -p /opt/traefik/dynamic.d');

    // Backups (best-effort)
    await exec(conn, `cd /opt/traefik && (test -f acme.json && cp -a acme.json acme.json.bak.${stamp} || true)`);
    await exec(conn, `cd /opt/traefik && (test -f dynamic.yml && cp -a dynamic.yml dynamic.yml.bak.${stamp} || true)`);
    await exec(conn, `cd /opt/traefik && (test -f docker-compose.yml && cp -a docker-compose.yml docker-compose.yml.bak.${stamp} || true)`);

    const remoteComposePath = '/opt/traefik/docker-compose.yml';
    const compose = await readRemoteFile(conn, remoteComposePath);
    if (!compose) throw new Error('Missing /opt/traefik/docker-compose.yml on VPS.');

    let lines = compose.split(/\r?\n/);

    const servicesIdx = lines.findIndex((l) => l.trim() === 'services:' && indentOf(l) === 0);
    if (servicesIdx < 0) throw new Error('docker-compose.yml missing top-level "services:"');
    const servicesEnd = findSectionEnd(lines, servicesIdx);

    const envServiceName = String(process.env.TRAEFIK_SERVICE_NAME || 'traefik').trim();
    let traefikIdx = findChildKeyExact(lines, servicesIdx, servicesEnd, envServiceName, 2);

    // Fallback: detect by image/container_name if service name differs.
    if (traefikIdx < 0) {
      for (let si = servicesIdx + 1; si < servicesEnd; si++) {
        const line = lines[si];
        if (!line.trim() || line.trim().startsWith('#')) continue;
        if (indentOf(line) !== 2) continue;
        if (!line.trim().endsWith(':')) continue;

        const svcStart = si;
        const svcEnd = findSectionEnd(lines, svcStart);
        const imageIdx = findChildKeyWithValue(lines, svcStart, svcEnd, 'image', 4);
        const nameIdx = findChildKeyWithValue(lines, svcStart, svcEnd, 'container_name', 4);
        const imageLine = imageIdx >= 0 ? lines[imageIdx].trim() : '';
        const nameLine = nameIdx >= 0 ? lines[nameIdx].trim() : '';
        const isTraefik =
          (imageLine.startsWith('image:') && imageLine.toLowerCase().includes('traefik')) ||
          nameLine === 'container_name: traefik';
        if (isTraefik) {
          traefikIdx = svcStart;
          break;
        }
        si = svcEnd - 1;
      }
    }

    if (traefikIdx < 0) {
      throw new Error('Could not find Traefik service. Set TRAEFIK_SERVICE_NAME in .env if needed.');
    }
    const traefikEnd = findSectionEnd(lines, traefikIdx);

    lines = patchTraefikCommand(lines, traefikIdx, traefikEnd);
    // Recompute block end if command list size changed
    const traefikEnd2 = findSectionEnd(lines, traefikIdx);
    lines = patchTraefikVolumes(lines, traefikIdx, traefikEnd2);
    const traefikEnd3 = findSectionEnd(lines, traefikIdx);
    lines = patchTraefikNetworks(lines, traefikIdx, traefikEnd3);
    lines = ensureTopLevelWebExternal(lines);

    const updated = lines.join('\n');

    if (updated === compose) {
      // Nothing to change, but still ensure Traefik is up
      const cmd = await dockerComposeUp(conn);
      const ids = await dockerComposePsAny(conn, cmd);
      if (ids.length === 0) throw new Error('Traefik compose has no running containers after update.');
      return;
    }

    // Upload and restart
    await writeRemoteFile(conn, '/tmp/traefik-docker-compose.yml', updated, 0o644);
    await exec(conn, `sudo cp /tmp/traefik-docker-compose.yml ${remoteComposePath}`);

    const cmd = await dockerComposeUp(conn);

    // Verification: use compose ps (doesn't assume container_name)
    const ids = await dockerComposePsAny(conn, cmd);
    if (ids.length === 0) throw new Error('Traefik compose has no running containers after update.');

    const logs = await exec(conn, `docker logs --tail 200 ${ids[0]} 2>&1 || true`);
    if (/level=error|fatal|panic/i.test(logs)) {
      throw new Error('Traefik logs show errors after update. Check `docker logs traefik`.');
    }
  } finally {
    conn.end();
  }
}

run().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
