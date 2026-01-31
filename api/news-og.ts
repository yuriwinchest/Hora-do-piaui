import type { NewsItem } from '../types';

export const config = {
  runtime: 'edge',
};

type NewsRow = Pick<NewsItem, 'id' | 'title' | 'description' | 'image' | 'content'>;

const BASE_URL = 'https://www.horapiaui.com';
const LOGO_URL = `${BASE_URL}/assets/logo.png`;
const FAVICON_URL = `${BASE_URL}/favicon.png`;

function normalizeAbsoluteUrl(url: string | null | undefined) {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function extractFirstImageFromContent(content: string | null | undefined) {
  if (!content) return undefined;
  const match = content.match(/<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
  return match?.[1];
}

function getPngSize(bytes: Uint8Array) {
  if (bytes.length < 24) return null;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  if (!isPng) return null;
  const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  return { width, height };
}

function getGifSize(bytes: Uint8Array) {
  if (bytes.length < 10) return null;
  const header = String.fromCharCode(...bytes.slice(0, 6));
  if (header !== 'GIF87a' && header !== 'GIF89a') return null;
  const width = bytes[6] | (bytes[7] << 8);
  const height = bytes[8] | (bytes[9] << 8);
  return { width, height };
}

function getWebpSize(bytes: Uint8Array) {
  if (bytes.length < 30) return null;
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff !== 'RIFF' || webp !== 'WEBP') return null;
  const format = String.fromCharCode(...bytes.slice(12, 16));
  if (format === 'VP8 ') {
    if (bytes.length < 30) return null;
    const width = (bytes[26] | (bytes[27] << 8)) & 0x3fff;
    const height = (bytes[28] | (bytes[29] << 8)) & 0x3fff;
    return { width, height };
  }
  if (format === 'VP8L') {
    if (bytes.length < 25) return null;
    const b0 = bytes[21];
    const b1 = bytes[22];
    const b2 = bytes[23];
    const b3 = bytes[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  }
  if (format === 'VP8X') {
    if (bytes.length < 30) return null;
    const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
    const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
    return { width, height };
  }
  return null;
}

function getJpegSize(bytes: Uint8Array) {
  if (bytes.length < 4) return null;
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    offset += 2;

    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 1 >= bytes.length) break;

    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2) return null;

    const isSof =
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf;

    if (isSof) {
      if (offset + 7 >= bytes.length) return null;
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      return { width, height };
    }

    offset += length;
  }
  return null;
}

async function getImageSize(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        Range: 'bytes=0-65535',
      },
    });
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    return getPngSize(bytes) ?? getJpegSize(bytes) ?? getWebpSize(bytes) ?? getGifSize(bytes);
  } catch {
    return null;
  }
}

async function isLargeEnoughForShare(url: string) {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower === LOGO_URL.toLowerCase()) return false;
  if (lower.endsWith('/favicon.png') || lower.endsWith('/favicon.ico')) return false;

  const size = await getImageSize(url);
  if (!size) return true;
  return size.width >= 600 && size.height >= 315;
}

function upsertMetaProperty(html: string, property: string, content: string) {
  const safe = escapeAttribute(content);
  const regex = new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["'][^"']*["']\\s*/?>`, 'i');
  // Remove existing tag if it exists to clean up
  const cleanHtml = html.replace(regex, '');
  // Always prepend to <head> to ensure it's at the very top for WhatsApp
  return cleanHtml.replace('<head>', `<head>\n  <meta property="${property}" content="${safe}">`);
}

function upsertMetaName(html: string, name: string, content: string) {
  const safe = escapeAttribute(content);
  const regex = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["'][^"']*["']\\s*/?>`, 'i');
  const cleanHtml = html.replace(regex, '');
  return cleanHtml.replace('<head>', `<head>\n  <meta name="${name}" content="${safe}">`);
}

function upsertLinkRel(html: string, rel: string, href: string) {
  const safe = escapeAttribute(href);
  const regex = new RegExp(`<link\\s+rel=["']${rel}["'][^>]*>`, 'i');
  const cleanHtml = html.replace(regex, '');
  return cleanHtml.replace('<head>', `<head>\n  <link rel="${rel}" href="${safe}">`);
}

async function fetchSupabaseJson<T>(path: string, supabaseUrl: string, supabaseKey: string) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

async function fetchNewsById(idOrSlug: string, supabaseUrl: string, supabaseKey: string) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const column = isUUID ? 'id' : 'slug';

  const rows = await fetchSupabaseJson<NewsRow[]>(
    `/rest/v1/horapiaui_news?${column}=eq.${encodeURIComponent(idOrSlug)}&select=id,title,description,image,content&limit=1`,
    supabaseUrl,
    supabaseKey
  );
  return rows?.[0] ?? null;
}

async function fetchFeaturedNewsImage(supabaseUrl: string, supabaseKey: string) {
  const rows = await fetchSupabaseJson<Array<{ hero_main_id: string | null }>>(
    `/rest/v1/horapiaui_home_layout?id=eq.1&select=hero_main_id&limit=1`,
    supabaseUrl,
    supabaseKey
  );
  const heroMainId = rows?.[0]?.hero_main_id;
  if (!heroMainId) return undefined;
  const featured = await fetchNewsById(heroMainId, supabaseUrl, supabaseKey);
  return normalizeAbsoluteUrl(featured?.image);
}

function buildDynamicOgImageUrl(title: string, imageUrl?: string) {
  const params = new URLSearchParams();
  if (title) params.set('title', title);
  if (imageUrl) params.set('image', imageUrl);
  return `${BASE_URL}/api/og?${params.toString()}`;
}

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const rawSlug = url.searchParams.get('slug')?.trim();
  const slug = rawSlug // Keep casing for UUID check initially, though UUIDs are case insensitive mostly.

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawSlug || '');

  // If it's NOT a UUID, force lowercase for slug lookup to match DB normalization.
  // If it IS a UUID, keep it as is (though DB handles it).
  const lookupValue = isUUID ? rawSlug : rawSlug?.toLowerCase();

  const canonicalUrl = `${BASE_URL}/noticia/${rawSlug || ''}`;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let title = 'Hora do Piauí';
  let description = 'O seu portal de notícias do Piauí e do Brasil.';

  let chosenImage: string | undefined;

  if (supabaseUrl && supabaseKey && rawSlug && lookupValue) {
    const news = await fetchNewsById(lookupValue, supabaseUrl, supabaseKey);
    if (news?.title) title = news.title;
    if (news?.description) description = news.description;

    const mainImage = normalizeAbsoluteUrl(news?.image);
    const contentImage = normalizeAbsoluteUrl(extractFirstImageFromContent(news?.content));

    // Simplification: Trust the main image if it exists. 
    // The previous size check might be failing due to network/runtime restrictions.
    if (mainImage && mainImage !== LOGO_URL && !mainImage.endsWith('favicon.png')) {
      chosenImage = mainImage;
    } else if (contentImage && contentImage !== LOGO_URL) {
      chosenImage = contentImage;
    } else {
      const featuredImage = await fetchFeaturedNewsImage(supabaseUrl, supabaseKey);
      if (featuredImage && featuredImage !== LOGO_URL) {
        chosenImage = featuredImage;
      }
    }
  }

  const fallbackOrder = [
    chosenImage,
    LOGO_URL,
    FAVICON_URL,
  ].filter(Boolean) as string[];

  const selectedForOg = fallbackOrder[0] ?? LOGO_URL;

  // Use the raw image directly for max reliability. 
  // Dynamic generation can be fragile (timeouts, url length).
  // If no image is found, fall back to Logo.
  const ogImage = chosenImage || LOGO_URL;

  const indexResponse = await fetch(new URL('/index.html', request.url));
  const indexHtml = await indexResponse.text();

  let html = indexHtml;
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

  // Remove fixed dimensions since we are using raw images which vary
  html = html.replace(/<meta\s+property=["']og:image:width["'][^>]*>/i, '');
  html = html.replace(/<meta\s+property=["']og:image:height["'][^>]*>/i, '');

  html = upsertMetaName(html, 'twitter:card', 'summary_large_image');
  html = upsertMetaName(html, 'twitter:title', title);
  html = upsertMetaName(html, 'twitter:description', description);
  html = upsertMetaName(html, 'twitter:image', ogImage);

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}

