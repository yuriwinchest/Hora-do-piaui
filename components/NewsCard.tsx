import React from 'react';
import { Link } from 'react-router-dom';
import { NewsItem } from '../types';

interface NewsCardProps {
  item: NewsItem;
  variant?: 'vertical' | 'horizontal' | 'compact';
  showDescription?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ item, variant = 'vertical', showDescription = false }) => {
  if (variant === 'compact') {
    return (
      <Link to={`/noticia/${item.id}`} className="group block">
        <article className="flex gap-4 cursor-pointer items-start">
          <img
            src={item.image}
            alt={item.title}
            className="w-24 h-24 object-cover rounded bg-gray-200 flex-shrink-0 shadow-sm"
          />
          <div className="flex-1">
            <h3 className="text-lg font-bold font-serif leading-snug mb-2 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            {showDescription && item.description && (
              <p className="text-xs text-gray-500 line-clamp-3 mb-1 font-sans">
                {item.description}
              </p>
            )}
            {item.time && (
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">{item.time}</span>
            )}
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link to={`/noticia/${item.id}`} className="group block h-full">
      <article className="cursor-pointer h-full flex flex-col">
        <div className="overflow-hidden rounded-lg mb-3 bg-gray-100 shadow-md relative aspect-[16/9] md:aspect-[4/3]">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 filter brightness-105 contrast-105 absolute inset-0"
          />
        </div>
        <h2 className="text-xl font-bold font-serif leading-snug group-hover:text-primary transition-colors">
          {item.title}
        </h2>
      </article>
    </Link>
  );
};

export default NewsCard;
