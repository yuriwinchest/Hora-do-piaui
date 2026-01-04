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
}

export interface VideoItem {
  id: string;
  title: string;
  image: string;
  tag?: string;
  tagColor?: string;
}

export interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
}
