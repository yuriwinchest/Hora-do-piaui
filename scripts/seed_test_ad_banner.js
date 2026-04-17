/**
 * Seed a single "test" advertising banner so the site doesn't show broken 404 ad images.
 *
 * What it does:
 * - (default) disables any existing active rows in `advertising_banners`
 * - inserts one active banner pointing to a stable image hosted by your site
 *
 * Env (required):
 * - SUPABASE_URL (or VITE_SUPABASE_URL)
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * Env (optional):
 * - SITE_BASE_URL (default: https://horapiaui.com)
 * - TEST_AD_IMAGE_URL (overrides the default image)
 * - TEST_AD_LINK_URL (optional click-through link)
 *
 * Usage:
 * - node scripts/seed_test_ad_banner.js
 * - node scripts/seed_test_ad_banner.js --keep-existing
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

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

async function main() {
  const supabaseUrl = requireEnv('SUPABASE_URL/VITE_SUPABASE_URL', process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);

  const baseUrl = String(process.env.SITE_BASE_URL || process.env.BASE_URL || 'https://horapiaui.com').trim();
  const defaultImg = `${baseUrl.replace(/\/+$/, '')}/assets/image.png`;
  const imageUrl = String(process.env.TEST_AD_IMAGE_URL || defaultImg).trim();
  const linkUrl = String(process.env.TEST_AD_LINK_URL || '').trim() || null;

  const keepExisting = hasFlag('--keep-existing');

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (!keepExisting) {
    const { error: disableErr } = await supabase
      .from('advertising_banners')
      .update({ is_active: false })
      .eq('is_active', true);
    if (disableErr) throw new Error(`Failed disabling existing active banners: ${disableErr.message}`);
  }

  const { data, error } = await supabase
    .from('advertising_banners')
    .insert([
      {
        image_url: imageUrl,
        link_url: linkUrl,
        display_order: 0,
        is_active: true,
      },
    ])
    .select('id,image_url,is_active,created_at')
    .single();

  if (error) throw new Error(`Insert failed: ${error.message}`);

  console.log('Seeded test banner:', {
    id: data.id,
    image_url: data.image_url,
    is_active: data.is_active,
    created_at: data.created_at,
  });
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});

