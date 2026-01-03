import React from 'react';
import { Play } from 'lucide-react';
import { VideoItem } from '../types';

interface VideoCardProps {
  item: VideoItem;
}

const VideoCard: React.FC<VideoCardProps> = ({ item }) => {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-[3/4] lg:aspect-square overflow-hidden rounded-lg mb-2 shadow-sm">
        <img 
          src={item.image} 
          alt={item.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="bg-white/90 rounded-full p-2 shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 text-primary fill-current" />
          </div>
        </div>
        {item.tag && (
          <div className={`absolute ${item.tag === 'WIRECUTTER' ? 'bottom-2 left-2' : 'top-2 left-2'} ${item.tagColor || 'bg-red-600'} text-white text-[10px] font-bold px-2 py-0.5 rounded shadow`}>
            {item.tag}
          </div>
        )}
      </div>
      <p className="text-xs font-bold leading-tight line-clamp-2 text-gray-800">
        {item.title}
      </p>
    </div>
  );
};

export default VideoCard;