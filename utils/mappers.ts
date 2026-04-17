import { NewsItem } from '../types';
import { formatDateBR, formatTimeBR } from './dateTime';
import { rewriteLegacySupabaseUrl } from './supabaseUrl';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const PUBLIC_IMAGES_BUCKET = 'images';

const encodePath = (p: string) =>
    p
        .split('/')
        .map((seg) => encodeURIComponent(seg))
        .join('/');

// Some older records store only the filename (e.g. "12345-abc.jpg") instead of the full public URL.
// Normalize so the frontend always requests a real image, not the SPA fallback (HTML).
export const normalizePublicImageUrl = (value?: string | null): string | null => {
    const v = (value ?? '').trim();
    if (!v) return null;
    if (v.startsWith('http://') || v.startsWith('https://')) return rewriteLegacySupabaseUrl(v);
    if (v.startsWith('data:') || v.startsWith('blob:')) return v;
    if (v.startsWith('/')) return v; // local asset
    if (!SUPABASE_URL) return v; // best-effort fallback

    return `${SUPABASE_URL}/storage/v1/object/public/${PUBLIC_IMAGES_BUCKET}/${encodePath(v)}`;
};

export const mapNewsFromDb = (n: any): NewsItem => ({
    id: n.id,
    title: n.title,
    image: normalizePublicImageUrl(n.image ?? n.image_url),
    description: n.description,
    content: n.content,
    category: n.category,
    section: n.section,
    date: n.date || (n.created_at ? formatDateBR(n.created_at) : ''),
    time: n.time || (n.created_at ? formatTimeBR(n.created_at) : ''),
    isLarge: n.is_large,
    isUrgent: n.is_urgent,
    status: n.status,
    authorName: n.author_name,
    authorAvatar: normalizePublicImageUrl(n.author_avatar) || n.author_avatar,
    authorBio: n.author_bio, // New field mapping
    authorRole: n.author_role,
    videoUrl: n.video_url, // YouTube URL
    instagramUrl: n.instagram_url,
    imageDescription: n.image_description,
    slug: n.slug,
    views: n.views || 0,
});

export const normalizeText = (value: string) =>
    value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

