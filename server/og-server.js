/**
 * Servidor OG para VPS: responde a /noticia/:slug com HTML contendo
 * og:image = foto da matéria (para WhatsApp/Facebook mostrarem a imagem certa).
 * Nginx deve fazer proxy de /noticia/ para este servidor (ex.: porta 3000).
 *
 * Uso na VPS:
 *   DIST_PATH=/var/www/horapiaui OG_PORT=3000 node server/og-server.js
 * Env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (e opcional DIST_PATH, OG_PORT)
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

async function readJsonBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    let raw = '';
    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      raw += chunk.toString('utf8');
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

// Carregar .env SEM dependências externas (na VPS não tem node_modules).
// Formato suportado:
// - KEY=value
// - KEY="value com espaços"
// - ignora linhas vazias e comentários (#)
function loadDotEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (!key) continue;
    // remove aspas se houver
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    val = val.replace(/\\"/g, '"');
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

// Carregar .env do diretório do site (parent de server/), não do cwd (pm2 pode mudar cwd)
loadDotEnvFile(path.join(__dirname, '..', '.env'));

const BASE_URL = process.env.BASE_URL || 'https://horapiaui.com';
const LOGO_URL = `${BASE_URL}/assets/logo.png`;
const FAVICON_URL = `${BASE_URL}/favicon.png`;
const PORT = Number(process.env.OG_PORT) || 3001;
// Na VPS: arquivos em /var/www/horapiaui (parent de server/). Local: dist/
const DIST_PATH = process.env.DIST_PATH || (fs.existsSync(path.join(__dirname, '..', 'dist')) ? path.join(__dirname, '..', 'dist') : path.join(__dirname, '..'));

const DEFAULT_ADMIN_EMAILS = 'horapiaui@gmail.com';
const ADMIN_EMAILS = String(process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS)
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_ROLES = String(process.env.ADMIN_ROLES || 'Administrador,CEO')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function normalizeAbsoluteUrl(url) {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractFirstImageFromContent(content) {
  if (!content) return undefined;
  const match = content.match(/<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
  return match?.[1];
}

function removeMetaTag(html, attributeName, attributeValue) {
  // Regex to remove <meta ... attributeName="attributeValue" ...> handling any attribute order
  // Matches: <meta (anything) attributeName="attributeValue" (anything) >
  const regex = new RegExp(`<meta[^>]*${attributeName}=["']${attributeValue}["'][^>]*>`, 'gi');
  return html.replace(regex, '');
}

function upsertMetaProperty(html, property, content) {
  const safe = escapeAttribute(content);
  // Remove existing tag(s) first
  const clean = removeMetaTag(html, 'property', property);
  // Prepend to head to ensure priority
  return clean.replace('<head>', `<head>\n  <meta property="${property}" content="${safe}">`);
}

function upsertMetaName(html, name, content) {
  const safe = escapeAttribute(content);
  const clean = removeMetaTag(html, 'name', name);
  return clean.replace('<head>', `<head>\n  <meta name="${name}" content="${safe}">`);
}

function upsertLinkRel(html, rel, href) {
  const safe = escapeAttribute(href);
  const regex = new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*>`, 'gi');
  const clean = html.replace(regex, '');
  return clean.replace('<head>', `<head>\n  <link rel="${rel}" href="${safe}">`);
}

async function fetchSupabaseJson(pathSuffix, supabaseUrl, supabaseKey) {
  const res = await fetch(`${supabaseUrl}${pathSuffix}`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchNewsById(idOrSlug, supabaseUrl, supabaseKey) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const column = isUUID ? 'id' : 'slug';
  const pathSuffix = `/rest/v1/horapiaui_news?${column}=eq.${encodeURIComponent(idOrSlug)}&select=id,title,description,image,content&limit=1`;
  const res = await fetch(`${supabaseUrl}${pathSuffix}`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    console.error('OG Supabase', res.status, await res.text().catch(() => ''));
    return null;
  }
  const rows = await res.json();
  if (!Array.isArray(rows)) {
    console.error('OG Supabase respondeu não-array:', JSON.stringify(rows).slice(0, 300));
    return null;
  }
  const news = rows[0] ?? null;
  if (!news && idOrSlug) console.error('OG: notícia não encontrada slug=', idOrSlug.slice(0, 50));
  return news;
}

async function fetchFeaturedNewsImage(supabaseUrl, supabaseKey) {
  const rows = await fetchSupabaseJson(
    '/rest/v1/horapiaui_home_layout?id=eq.1&select=hero_main_id&limit=1',
    supabaseUrl,
    supabaseKey
  );
  const heroMainId = rows?.[0]?.hero_main_id;
  if (!heroMainId) return undefined;
  const featured = await fetchNewsById(heroMainId, supabaseUrl, supabaseKey);
  return normalizeAbsoluteUrl(featured?.image);
}

function loadIndexHtml() {
  const file = path.join(DIST_PATH, 'index.html');
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8');
}

async function handleNoticia(slug, supabaseUrl, primaryKey, fallbackKey) {
  const rawSlug = slug?.trim();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawSlug || '');
  const lookupValue = isUUID ? rawSlug : rawSlug?.toLowerCase();
  const canonicalUrl = `${BASE_URL}/noticia/${rawSlug || ''}`;

  let title = 'Hora do Piauí';
  let description = 'O seu portal de notícias do Piauí e do Brasil.';
  let chosenImage;

  const supabaseKey = primaryKey || fallbackKey;
  if (supabaseUrl && supabaseKey && rawSlug && lookupValue) {
    let news = await fetchNewsById(lookupValue, supabaseUrl, primaryKey);
    if (!news && fallbackKey && fallbackKey !== primaryKey) {
      news = await fetchNewsById(lookupValue, supabaseUrl, fallbackKey);
    }
    if (news?.title) title = news.title;
    if (news?.description) description = news.description;

    const mainImage = normalizeAbsoluteUrl(news?.image);
    const contentImage = normalizeAbsoluteUrl(extractFirstImageFromContent(news?.content));

    if (mainImage && mainImage !== LOGO_URL && !mainImage.endsWith('favicon.png')) {
      chosenImage = mainImage;
    } else if (contentImage && contentImage !== LOGO_URL) {
      chosenImage = contentImage;
    } else {
      const keyForFeatured = news ? primaryKey : (fallbackKey || primaryKey);
      const featuredImage = await fetchFeaturedNewsImage(supabaseUrl, keyForFeatured);
      if (featuredImage && featuredImage !== LOGO_URL) chosenImage = featuredImage;
    }
    
    if (chosenImage) {
      console.log(`[OG] Selected image for "${slug}": ${chosenImage}`);
    } else {
      console.log(`[OG] No custom image found for "${slug}", falling back to Logo.`);
    }
  }

  const ogImage = chosenImage || LOGO_URL;
  let html = loadIndexHtml();
  if (!html) return null;

  html = html.replace(/<title>.*<\/title>/i, `<title>${escapeAttribute(title)} | Hora do Piauí</title>`);
  html = upsertLinkRel(html, 'canonical', canonicalUrl);
  html = upsertMetaProperty(html, 'og:site_name', 'Hora do Piauí');
  html = upsertMetaProperty(html, 'og:locale', 'pt_BR');
  html = upsertMetaProperty(html, 'og:type', 'article');
  html = upsertMetaProperty(html, 'og:url', canonicalUrl);
  html = upsertMetaProperty(html, 'og:title', title);
  html = upsertMetaProperty(html, 'og:description', description);
  html = upsertMetaProperty(html, 'og:image', ogImage);
  html = upsertMetaProperty(html, 'og:image:secure_url', ogImage);
  html = upsertMetaProperty(html, 'og:image:alt', title);
  html = upsertMetaProperty(html, 'og:image:width', '1200');
  html = upsertMetaProperty(html, 'og:image:height', '630');
  html = upsertMetaProperty(html, 'og:image:type', 'image/jpeg');
  html = upsertMetaName(html, 'twitter:card', 'summary_large_image');
  html = upsertMetaName(html, 'twitter:title', title);
  html = upsertMetaName(html, 'twitter:description', description);
  html = upsertMetaName(html, 'twitter:image', ogImage);

  return html;
}

async function fetchAuthUser(supabaseUrl, apikey, accessToken) {
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchProfileRoleById(supabaseUrl, serviceRoleKey, userId) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/horapiaui_profiles?id=eq.${encodeURIComponent(userId)}&select=role,email&limit=1`,
    {
      method: 'GET',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: 'application/json',
      },
    }
  );
  if (!res.ok) return null;
  const rows = await res.json().catch(() => null);
  if (!Array.isArray(rows)) return null;
  return rows[0] || null;
}

async function supabaseAdminCreateUser(supabaseUrl, serviceRoleKey, { email, password, fullName }) {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || '' },
    }),
  });

  const text = await res.text().catch(() => '');
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {}

  if (!res.ok) {
    const msg = data?.msg || data?.message || text || `Supabase error ${res.status}`;
    const err = new Error(msg);
    err.statusCode = res.status;
    err.details = data || text;
    throw err;
  }

  return data;
}

async function supabaseAdminListUsers(supabaseUrl, serviceRoleKey, page = 1, perPage = 200) {
  const res = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?page=${encodeURIComponent(String(page))}&per_page=${encodeURIComponent(String(perPage))}`,
    {
      method: 'GET',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: 'application/json',
      },
    }
  );

  const text = await res.text().catch(() => '');
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {}

  if (!res.ok) {
    const msg = data?.msg || data?.message || text || `Supabase error ${res.status}`;
    const err = new Error(msg);
    err.statusCode = res.status;
    err.details = data || text;
    throw err;
  }

  return data;
}

async function supabaseAdminFindUserByEmail(supabaseUrl, serviceRoleKey, email) {
  // GoTrue doesn't provide direct filter by email, so we scan a few pages (small userbase).
  const target = String(email || '').trim().toLowerCase();
  if (!target) return null;

  const perPage = 200;
  for (let page = 1; page <= 10; page++) {
    const data = await supabaseAdminListUsers(supabaseUrl, serviceRoleKey, page, perPage);
    const users = Array.isArray(data?.users) ? data.users : [];
    const found = users.find((u) => String(u?.email || '').toLowerCase() === target) || null;
    if (found) return found;
    if (users.length < perPage) break; // last page
  }
  return null;
}

async function supabaseAdminUpdateUser(supabaseUrl, serviceRoleKey, userId, { password, fullName }) {
  const payload = {
    ...(password ? { password } : {}),
    user_metadata: { full_name: fullName || '' },
  };

  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => '');
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {}

  if (!res.ok) {
    const msg = data?.msg || data?.message || text || `Supabase error ${res.status}`;
    const err = new Error(msg);
    err.statusCode = res.status;
    err.details = data || text;
    throw err;
  }

  return data;
}

async function supabaseAdminDeleteUser(supabaseUrl, serviceRoleKey, userId) {
  // Best-effort cleanup when profile upsert fails.
  await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: 'application/json',
    },
  }).catch(() => {});
}

async function upsertHorapiauiProfile(supabaseUrl, serviceRoleKey, profile) {
  const res = await fetch(`${supabaseUrl}/rest/v1/horapiaui_profiles?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
      Accept: 'application/json',
    },
    body: JSON.stringify(profile),
  });

  const text = await res.text().catch(() => '');
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {}

  if (!res.ok) {
    const msg = data?.message || text || `Profile upsert error ${res.status}`;
    const err = new Error(msg);
    err.statusCode = res.status;
    err.details = data || text;
    throw err;
  }

  return data;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname || '/';

  // API: Create users from Admin panel (VPS, no Vercel/Next API).
  if (pathname === '/api/admin/create-user') {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return sendJson(res, 500, { error: 'Server misconfiguration: Missing SUPABASE_SERVICE_ROLE_KEY' });
    }

    const authz = String(req.headers['authorization'] || '');
    const token = authz.toLowerCase().startsWith('bearer ') ? authz.slice(7).trim() : '';
    if (!token) return sendJson(res, 401, { error: 'Missing Authorization bearer token' });

    try {
      const apikeyForUser = anonKey || serviceRoleKey;
      const authUser = await fetchAuthUser(supabaseUrl, apikeyForUser, token);
      if (!authUser?.email || !authUser?.id) return sendJson(res, 401, { error: 'Invalid session' });

      const callerEmail = String(authUser.email).toLowerCase();
      const isEmailAdmin = ADMIN_EMAILS.includes(callerEmail);
      const profile = await fetchProfileRoleById(supabaseUrl, serviceRoleKey, authUser.id);
      const role = profile?.role ? String(profile.role) : '';
      const isRoleAdmin = role && ADMIN_ROLES.includes(role);

      if (!isEmailAdmin && !isRoleAdmin) {
        return sendJson(res, 403, { error: 'Forbidden' });
      }

      const body = await readJsonBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '').trim();
      const fullName = String(body.fullName || '').trim();
      const userRole = String(body.role || 'Jornalista').trim() || 'Jornalista';
      const bio = String(body.bio || '').trim();

      if (!email || !password) return sendJson(res, 400, { error: 'Email and password are required' });

      let userId = null;
      let createdNewUser = false;

      try {
        const created = await supabaseAdminCreateUser(supabaseUrl, serviceRoleKey, { email, password, fullName });
        createdNewUser = true;
        // GoTrue admin create-user REST returns the user object at the root (id, email, ...),
        // while supabase-js returns { data: { user } }. Support both shapes defensively.
        const createdUser = created?.user || created?.data?.user || created;
        userId = createdUser?.id || null;
        if (!userId) {
          console.error('Create user response missing id. Keys=', created ? Object.keys(created) : null);
          return sendJson(res, 500, { error: 'User created but missing id' });
        }
      } catch (e) {
        const msg = String(e?.message || '');
        const status = Number(e?.statusCode) || 0;
        const looksLikeAlreadyExists =
          status === 422 ||
          status === 409 ||
          msg.toLowerCase().includes('already registered') ||
          msg.toLowerCase().includes('already exists') ||
          msg.toLowerCase().includes('duplicate');

        if (!looksLikeAlreadyExists) throw e;

        const existing = await supabaseAdminFindUserByEmail(supabaseUrl, serviceRoleKey, email);
        if (!existing?.id) {
          console.error('User exists but could not be found via admin list. email=', email);
          throw e;
        }
        userId = existing.id;
        // Ensure the user can login with the password the admin set and keep name metadata in sync.
        await supabaseAdminUpdateUser(supabaseUrl, serviceRoleKey, userId, { password, fullName });
      }

      try {
        await upsertHorapiauiProfile(supabaseUrl, serviceRoleKey, {
          id: userId,
          email,
          full_name: fullName || null,
          role: userRole,
          bio: bio || '',
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || email)}&background=random`,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Profile upsert failed, cleaning up auth user:', e?.message || e);
        if (createdNewUser) await supabaseAdminDeleteUser(supabaseUrl, serviceRoleKey, userId);
        throw e;
      }

      return sendJson(res, 200, { ok: true, user: { id: userId, email }, message: 'User created successfully' });
    } catch (err) {
      const status = Number(err?.statusCode) || 500;
      console.error('Create user API error:', err);
      return sendJson(res, status, { error: err?.message || 'Server error' });
    }
  }

  const match = pathname.match(/^\/noticia\/(.+)$/);
  // Decode, remove trailing slash, and remove query params if they slipped into pathname regex (unlikely with url.pathname but safe)
  const rawSlug = match ? decodeURIComponent(match[1]).replace(/\/$/, '') : null;
  const slug = rawSlug ? rawSlug.split('?')[0] : null;

  if (req.method !== 'GET' || !slug) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  console.log(`[OG] Request for slug: "${slug}" (IP: ${req.socket.remoteAddress})`);

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const primaryKey = serviceRole || anonKey;
  const fallbackKey = serviceRole ? anonKey : null;

  let html;
  try {
    html = await handleNoticia(slug, supabaseUrl, primaryKey, fallbackKey);
  } catch (err) {
    console.error('OG handle error', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
    return;
  }

  if (!html) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('index.html not found');
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=0, must-revalidate',
  });
  res.end(html);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`OG server listening on http://0.0.0.0:${PORT} (DIST_PATH=${DIST_PATH})`);
});
