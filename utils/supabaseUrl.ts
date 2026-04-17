const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

// Known legacy Supabase project hosts that may still exist in old DB rows.
// If an image URL points to one of these, we rewrite to the current project host.
const LEGACY_SUPABASE_HOSTS = new Set<string>([
  'pxyekqpcgjwaztummzvh.supabase.co',
]);

function getCurrentSupabaseOrigin(): string | null {
  if (!SUPABASE_URL) return null;
  try {
    return new URL(SUPABASE_URL).origin;
  } catch {
    return null;
  }
}

export function rewriteLegacySupabaseUrl(value?: string | null): string | null {
  const v = (value ?? '').trim();
  if (!v) return null;

  // Only rewrite absolute URLs.
  if (!v.startsWith('http://') && !v.startsWith('https://')) return v;

  const targetOrigin = getCurrentSupabaseOrigin();
  if (!targetOrigin) return v;

  try {
    const u = new URL(v);
    if (!LEGACY_SUPABASE_HOSTS.has(u.host)) return v;
    if (import.meta.env.DEV) {
      console.warn('[Supabase] Rewriting legacy host:', u.host);
    }
    const t = new URL(targetOrigin);
    u.protocol = t.protocol;
    u.host = t.host;
    return u.toString();
  } catch {
    return v;
  }
}
