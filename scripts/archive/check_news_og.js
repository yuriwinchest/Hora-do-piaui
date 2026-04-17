/**
 * Verifica no Supabase uma notícia por slug: título, image, slug.
 * Uso: node scripts/check_news_og.js "cerimonia-no-palacio-de-karnak-celebra-despedida-e-boas-vindas-a-novos-gestores"
 */
import dotenv from 'dotenv';

dotenv.config();

const slug = process.argv[2] || 'cerimonia-no-palacio-de-karnak-celebra-despedida-e-boas-vindas-a-novos-gestores';
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Falta VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY no .env');
  process.exit(1);
}

// Busca exata por slug (lowercase)
const urlExact = `${supabaseUrl}/rest/v1/horapiaui_news?slug=eq.${encodeURIComponent(slug)}&select=id,title,slug,image&limit=1`;
// Busca case-insensitive (ilike)
const urlIlike = `${supabaseUrl}/rest/v1/horapiaui_news?slug=ilike.${encodeURIComponent(slug)}&select=id,title,slug,image&limit=1`;

async function check() {
  console.log('Slug buscado:', slug);
  console.log('');

  const resExact = await fetch(urlExact, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  const exact = await resExact.json();
  console.log('Por slug=eq (exato):', Array.isArray(exact) ? exact.length : 0, 'linha(s)');
  if (exact && exact[0]) {
    console.log('  title:', exact[0].title);
    console.log('  slug:', exact[0].slug);
    console.log('  image:', exact[0].image ? exact[0].image.substring(0, 80) + '...' : '(vazio ou null)');
  }

  const resIlike = await fetch(urlIlike, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  const ilike = await resIlike.json();
  console.log('');
  console.log('Por slug=ilike (case-insensitive):', Array.isArray(ilike) ? ilike.length : 0, 'linha(s)');
  if (ilike && ilike[0]) {
    console.log('  title:', ilike[0].title);
    console.log('  slug:', ilike[0].slug);
    console.log('  image:', ilike[0].image ? ilike[0].image.substring(0, 120) + (ilike[0].image.length > 120 ? '...' : '') : '(vazio ou null)');
  }
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
