import React from 'react';
import { Link } from 'react-router-dom';
import { NewsItem } from '../types';

interface NewsListItemProps {
  item: NewsItem;
  className?: string;
}

const NewsListItem: React.FC<NewsListItemProps> = ({ item, className }) => {
  return (
    <Link to={`/noticia/${item.slug || item.id}`} className={`group block ${className ?? ''}`}>
      <article className="flex gap-3 cursor-pointer py-0.5 items-center h-full">
        <img
          src={item.image}
          alt={item.title}
          className="w-32 h-24 object-cover object-[center_25%] rounded bg-gray-200 flex-shrink-0 shadow-sm"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="flex-1">
          <h3 className="text-lg text-black font-black font-serif leading-tight group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          {item.time && (
            <p className="text-xs text-gray-500 font-sans">
              {item.time}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
};

export default NewsListItem;
