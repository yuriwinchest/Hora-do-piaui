import React, { useState } from 'react';
import { Play, Instagram, ExternalLink } from 'lucide-react';
import { VideoItem } from '../types';

interface VideoCardProps {
  item: VideoItem;
}

const getEmbedUrl = (url: string | undefined): string | null => {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  }

  // Instagram
  if (url.includes('instagram.com')) {
    // Ensure /embed is attached
    const cleanUrl = url.split('?')[0]; // Remove query params like ?igsh=...
    return cleanUrl.endsWith('/') ? `${cleanUrl}embed` : `${cleanUrl}/embed`;
  }

  return null;
};

const VideoCard: React.FC<VideoCardProps> = ({ item }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const embedUrl = getEmbedUrl(item.url);
  const isInstagram = item.url?.includes('instagram.com');

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (embedUrl) {
      setIsPlaying(true);
    } else if (item.url) {
      window.open(item.url, '_blank');
    }
  };

  return (
    <div className="group flex flex-col gap-2">
      <div
        className="relative aspect-[3/4] lg:aspect-square overflow-hidden rounded-lg shadow-sm bg-black"
        onClick={!isPlaying ? handlePlay : undefined}
      >
        {isPlaying && embedUrl ? (
          <iframe
            src={embedUrl}
            title={item.title}
            className="w-full h-full absolute inset-0 border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {/* Thumbnail */}
            <img
              src={item.image || (isInstagram ? '/assets/instagram-placeholder.png' : 'https://placehold.co/600x600?text=Video')}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
              onError={(e) => {
                // Fallback
                (e.target as HTMLImageElement).src = 'https://placehold.co/600x600?text=No+Image';
              }}
            />

            {/* Overlay Play Button */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center cursor-pointer">
              <div className="bg-white/90 rounded-full p-4 shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-primary fill-current ml-0.5" />
              </div>
            </div>

            {/* Tag */}
            {item.tag && (
              <div className={`absolute ${item.tag === 'WIRECUTTER' ? 'bottom-2 left-2' : 'top-2 left-2'} ${item.tagColor || 'bg-red-600'} text-white text-[10px] font-bold px-2 py-0.5 rounded shadow z-10`}>
                {item.tag}
              </div>
            )}
          </>
        )}
      </div>

      {/* Title and External Link */}
      <div className="flex justify-between items-start gap-2">
        <p className="text-xs font-bold leading-tight line-clamp-2 text-gray-800 flex-1 group-hover:text-primary transition-colors cursor-pointer" onClick={handlePlay}>
          {item.title}
        </p>

        {/* External Link Button */}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-pink-600 transition-colors"
            title={isInstagram ? "Ver no Instagram" : "Ver no YouTube"}
            onClick={(e) => e.stopPropagation()}
          >
            {isInstagram ? <Instagram size={14} /> : <ExternalLink size={14} />}
          </a>
        )}
      </div>
    </div>
  );
};

export default VideoCard;