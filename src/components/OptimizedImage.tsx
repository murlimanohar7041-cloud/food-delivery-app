import React, { useState, useEffect, useRef, memo } from 'react';
import { getFallbackImage } from '../utils/fallbackImage';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackId?: number | string;
  priority?: boolean;
  aspectRatio?: string;
  onClick?: () => void;
}

// Global in-memory cache of resolved image URLs for zero-latency instant display
const cachedImagesSet = new Set<string>();

/**
 * Utility to prefetch an image URL into browser cache during idle time
 */
export function prefetchImage(src: string) {
  if (!src || cachedImagesSet.has(src)) return;
  const img = new Image();
  img.src = src;
  img.onload = () => cachedImagesSet.add(src);
}

/**
 * Batch prefetch array of images
 */
export function prefetchImages(srcList: string[]) {
  if (typeof window === 'undefined') return;
  const prefetchTask = () => {
    srcList.forEach((src) => {
      if (src && !cachedImagesSet.has(src)) {
        const img = new Image();
        img.src = src;
        img.onload = () => cachedImagesSet.add(src);
      }
    });
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(prefetchTask, { timeout: 2000 });
  } else {
    setTimeout(prefetchTask, 100);
  }
}

const OptimizedImageComponent: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackId,
  priority = false,
  aspectRatio,
  onClick,
}) => {
  const [hasError, setHasError] = useState(false);
  const finalSrc = hasError ? getFallbackImage(fallbackId) : src;
  const isAlreadyCached = cachedImagesSet.has(finalSrc);

  const [isLoaded, setIsLoaded] = useState<boolean>(() => isAlreadyCached || priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if image is already completed in browser cache on mount
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      cachedImagesSet.add(finalSrc);
      setIsLoaded(true);
    }
  }, [finalSrc]);

  const handleLoad = () => {
    cachedImagesSet.add(finalSrc);
    setIsLoaded(true);
  };

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
    }
    setIsLoaded(true);
  };

  return (
    <div
      onClick={onClick}
      style={aspectRatio ? { aspectRatio } : undefined}
      className={`relative overflow-hidden bg-gray-100 dark:bg-[#181818] ${className}`}
    >
      {/* Skeleton Shimmer only shown when not yet cached/loaded */}
      {!isLoaded && !isAlreadyCached && (
        <div 
          className="absolute inset-0 skeleton" 
          aria-hidden="true" 
        />
      )}

      <img
        ref={imgRef}
        src={finalSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-200 ease-out ${
          isLoaded || isAlreadyCached ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export const OptimizedImage = memo(OptimizedImageComponent);
export default OptimizedImage;
