export type NewsStatus = 'draft' | 'published';

export interface NewsItem {
  id: string;
  title: string;
  image: string;
  description?: string;
  content?: string;
  date?: string;
  time?: string;
  category?: string;
  section?: string;
  isLarge?: boolean;
  status?: NewsStatus;
  authorName?: string;
  authorAvatar?: string;
  authorBio?: string;
  videoUrl?: string; // YouTube URL
  instagramUrl?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  thumbnail?: string; // Standardizing name
  image: string;
  tag?: string;
  tagColor?: string;
  url?: string;
  duration?: string;
}

export interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
  icon?: any;
}

export interface HomeLayoutConfig {
  mainHeadline: string;
  heroMainId: string;
  heroTopIds: string[]; // [top1, top2]
  heroSideIds: string[]; // [side1, side SIDE2, side3]
  marianoMainId: string;
  marianoListIds: string[]; // [card1, card2, card3, card4]
}
