import React from 'react';
import { Link } from 'react-router-dom';
import { NewsItem } from '../types';

interface NewsListItemProps {
  item: NewsItem;
  className?: string;
}

const NewsListItem: React.FC<NewsListItemProps> = ({ item, className }) => {
  return (
    <Link to={`/noticia/${item.id}`} className={`group block ${className ?? ''}`}>
      <article className="flex gap-3 cursor-pointer py-3 items-center h-full">
        <img
          src={item.image}
          alt={item.title}
          className="w-28 h-20 object-cover rounded bg-gray-200 flex-shrink-0 shadow-sm"
        />
        <div className="flex-1">
          <h3 className="text-lg font-bold font-serif leading-tight group-hover:text-primary transition-colors">
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
