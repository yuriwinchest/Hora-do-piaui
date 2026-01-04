import React, { useState } from 'react';
import { Play, Instagram, ExternalLink, Maximize2, X } from 'lucide-react';
import { VideoItem } from '../types';

interface VideoCardProps {
  item: VideoItem;
}

const getEmbedUrl = (url: string | undefined): string | null => {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
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
  const [isExpanded, setIsExpanded] = useState(false);
  const embedUrl = getEmbedUrl(item.url);
  const isInstagram = item.url?.includes('instagram.com');

  // Para Instagram, se não tiver imagem definida manualmente, mostramos o iframe direto
  // pois o iframe do Instagram já serve como thumbnail/preview.
  // Para YouTube, preferimos a imagem estática leve primeiro.
  const showIframeImmediately = isInstagram && !item.image;
  const shouldRenderIframe = isPlaying || showIframeImmediately;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Toggle expansion logic
    if (isExpanded) {
      setIsExpanded(false);
      setIsPlaying(false);
    } else {
      setIsExpanded(true);
      if (embedUrl) {
        setIsPlaying(true);
      } else if (item.url) {
        window.open(item.url, '_blank');
      }
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
    setIsPlaying(false);
  };

  return (
    <>
      <div className="group flex flex-col gap-2">
        <div
          className="relative aspect-[3/4] lg:aspect-square overflow-hidden rounded-lg shadow-sm bg-black cursor-pointer"
          onClick={handlePlay}
        >
          {/* Normal Mode (Thumbnail or Iframe if not expanded) */}
          {/* We only show iframe here if NOT expanded and it's instagram/playing inline (optional, but requested behavior implies expansion on click) */}
          {/* Actually, if expanded, we show the modal. Here we keep the thumbnail. */}

          <img
            src={item.image || (isInstagram ? '/assets/instagram-placeholder.png' : 'https://placehold.co/600x600?text=Video')}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/600x600?text=No+Image';
            }}
          />

          {/* Overlay Play Button */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <div className="bg-white/90 rounded-full p-4 shadow-lg group-hover:scale-110 transition-transform relative">
              <Play className="w-6 h-6 text-primary fill-current ml-0.5" />
            </div>
          </div>

          {/* Expansion Indicator */}
          <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 size={16} />
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

      {/* Expanded Modal Overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={handleClose}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>

            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={item.title}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white gap-4">
                <p>Este vídeo não pode ser reproduzido aqui.</p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#16a34a] px-6 py-2 rounded-lg font-bold hover:bg-[#15803d] transition-colors"
                >
                  Assistir no {isInstagram ? 'Instagram' : 'YouTube'}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default VideoCard;