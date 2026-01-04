import { NewsItem } from '../types';

export const mapNewsFromDb = (n: any): NewsItem => ({
    id: n.id,
    title: n.title,
    image: n.image,
    description: n.description,
    content: n.content,
    category: n.category,
    section: n.section,
    date: n.date,
    time: n.time,
    isLarge: n.is_large,
    status: n.status,
    authorName: n.author_name,
    authorAvatar: n.author_avatar,
    authorBio: n.author_bio, // New field mapping
    authorRole: n.author_role,
    videoUrl: n.video_url, // YouTube URL
    instagramUrl: n.instagram_url,
});

export const normalizeText = (value: string) =>
    value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

