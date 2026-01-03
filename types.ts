export interface NewsItem {
  id: string;
  title: string;
  image: string;
  description?: string;
  date?: string;
  time?: string;
  category?: string;
  section?: string;
  isLarge?: boolean;
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
