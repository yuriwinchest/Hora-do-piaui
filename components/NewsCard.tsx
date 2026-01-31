import React from 'react';
import { Link } from 'react-router-dom';
import { NewsItem } from '../types';

interface NewsCardProps {
  item: NewsItem;
  variant?: 'vertical' | 'horizontal' | 'compact';
  showDescription?: boolean;
  imageClassName?: string;
}

const NewsCard: React.FC<NewsCardProps> = ({ item, variant = 'vertical', showDescription = false, imageClassName }) => {
  if (variant === 'compact') {
    return (
      <Link to={`/noticia/${item.slug || item.id}`} className="group block">
        <article className="flex gap-4 cursor-pointer items-start">
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="w-32 h-24 object-cover rounded bg-gray-200 flex-shrink-0 shadow-sm"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <div className="w-32 h-24 rounded bg-[#16a34a] flex-shrink-0 shadow-sm flex items-center justify-center p-2 text-center">
              <span className="text-white font-black text-xs uppercase tracking-wider">{item.category || 'HP'}</span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg text-black font-black font-serif leading-snug mb-2 group-hover:text-primary transition-colors">
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
    <Link to={`/noticia/${item.slug || item.id}`} className="group block h-full">
      <article className="cursor-pointer h-full flex flex-col">
        {item.image ? (
          <>
            <div className={`overflow-hidden rounded-lg mb-3 bg-gray-100 shadow-md relative ${imageClassName ?? 'aspect-[16/9] md:aspect-[4/3]'}`}>
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 filter brightness-105 contrast-105 absolute inset-0"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>
            <h2 className="text-xl text-black font-black font-serif leading-snug group-hover:text-primary transition-colors">
              {item.title}
            </h2>
          </>
        ) : (
          <div className={`relative p-0 flex flex-col justify-start items-start text-left h-auto`}>
            <h2 className="text-base md:text-lg text-white font-bold font-serif leading-snug">
              <span className="bg-[#16a34a] px-1 box-decoration-clone leading-normal py-0.5 rounded-sm">
                {item.title}
              </span>
            </h2>
          </div>
        )}
      </article>
    </Link>
  );
};

export default NewsCard;
