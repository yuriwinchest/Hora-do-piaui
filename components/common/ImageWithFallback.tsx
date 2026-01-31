import { useState, useEffect } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
}

const DEFAULT_FALLBACK = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTc1IDEzNUgxODBWMTQwSDE3NVYxMzVaIiBmaWxsPSIjOUI5Q0ExIi8+PHBhdGggZD0iTTE3MCAxNDVIMjMwVjE1MEgxNzBWMTQ1WiIgZmlsbD0iIzlCOUNBMSIvPjxwYXRoIGQ9Ik0xODUgMTU1SDIxNVYxNjBIMTg1VjE1NVoiIGZpbGw9IiM5QjlDQTEiLz48L3N2Zz4=';

export const ImageWithFallback = ({
  src,
  alt,
  className = '',
  fallbackSrc = DEFAULT_FALLBACK,
  loading = 'lazy'
}: ImageWithFallbackProps) => {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={imgSrc}
        alt={alt}
        loading={loading}
        referrerPolicy="no-referrer"
        onError={handleError}
        onLoad={handleLoad}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
};

export default ImageWithFallback;
