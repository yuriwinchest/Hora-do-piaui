/**
 * Verifica og:image na URL pública (sem SSH).
 * node scripts/check_og_public.js [slug]
 */
const slug = process.argv[2] || 'cerimonia-no-palacio-de-karnak-celebra-despedida-e-boas-vindas-a-novos-gestores';
const url = `https://www.horapiaui.com/noticia/${slug}?t=${Date.now()}`;

fetch(url)
  .then((r) => r.text())
  .then((html) => {
    const m = html.match(/property=["']og:image["']\s+content=["']([^"']+)/i);
    console.log('URL:', url);
    console.log('og:image:', m ? m[1] : '(não encontrado)');
    if (html.includes('logo.png')) console.log('>>> Ainda logo');
    if (html.includes('supabase.co/storage')) console.log('>>> Foto da matéria (Supabase)');
  })
  .catch((e) => console.error(e));
