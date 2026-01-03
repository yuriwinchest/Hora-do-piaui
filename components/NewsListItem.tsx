import React from 'react';
import { NewsItem } from '../types';

interface NewsListItemProps {
  item: NewsItem;
}

const NewsListItem: React.FC<NewsListItemProps> = ({ item }) => {
  return (
    <article className="flex gap-2 group cursor-pointer border-b border-gray-100 pb-1 last:border-0 last:pb-0">
      <img
        src={item.image}
        alt={item.title}
        className="w-28 h-20 object-cover rounded bg-gray-200 flex-shrink-0 shadow-sm"
      />
      <div>
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
  );
};

export default NewsListItem;
