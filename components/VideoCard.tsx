import React, { useState, useEffect } from 'react';
import { Play, Instagram, ExternalLink, X } from 'lucide-react';
import { VideoItem } from '../types';

interface VideoCardProps {
  item: VideoItem;
}

const getYouTubeId = (url: string | undefined): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};

const openInstagramPopup = (url: string) => {
  const width = 480;
  const height = 750;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  window.open(
    url,
    'instagram_video',
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
  );
};

const VideoCard: React.FC<VideoCardProps> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isInstagram = item.url?.includes('instagram.com');
  const youtubeId = getYouTubeId(item.url);

  // Fechar modal com ESC (apenas YouTube)
  useEffect(() => {
    if (!isExpanded) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isExpanded]);

  // Bloquear scroll do body quando modal aberto (apenas YouTube)
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isExpanded]);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isInstagram && item.url) {
      // Instagram bloqueia embeds de Reels - abrir em popup centralizada
      openInstagramPopup(item.url);
    } else {
      setIsExpanded(true);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  return (
    <>
      <div className="group flex flex-col gap-2">
        <div
          className="relative aspect-square overflow-hidden rounded-lg shadow-sm bg-black cursor-pointer"
          onClick={handlePlay}
        >
          <img
            src={item.image || 'https://placehold.co/600x600?text=Video'}
            alt={item.title}
            className="w-full h-full object-cover object-[center_25%] group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/600x600?text=No+Image';
            }}
          />

          {/* Overlay Play Button */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
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
        </div>

        {/* Title and External Link */}
        <div className="flex justify-between items-start gap-2">
          <p className="text-xs font-bold leading-tight line-clamp-2 text-gray-800 flex-1 group-hover:text-primary transition-colors cursor-pointer" onClick={handlePlay}>
            {item.title}
          </p>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-600 transition-colors flex-shrink-0"
              title={isInstagram ? "Ver no Instagram" : "Ver no YouTube"}
              onClick={(e) => e.stopPropagation()}
            >
              {isInstagram ? <Instagram size={14} /> : <ExternalLink size={14} />}
            </a>
          )}
        </div>
      </div>

      {/* Modal apenas para YouTube */}
      {isExpanded && youtubeId && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div
            className="relative rounded-xl overflow-hidden shadow-2xl w-full max-w-4xl max-h-[90vh] aspect-video bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              aria-label="Fechar vídeo"
              title="Fechar vídeo"
              onClick={handleClose}
              className="absolute -top-2 -right-2 z-20 bg-white hover:bg-gray-100 text-gray-800 p-2 rounded-full shadow-lg transition-colors"
            >
              <X size={20} />
            </button>

            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
              title={item.title}
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
};

export default VideoCard;
