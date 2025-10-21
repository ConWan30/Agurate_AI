import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}

export function ProgressiveImage({ 
  src, 
  alt, 
  className,
  placeholderClassName 
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');

  useEffect(() => {
    // Create a tiny placeholder (blur effect)
    const placeholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Crect width='400' height='300' fill='%23866b35' filter='url(%23b)'/%3E%3C/svg%3E`;
    
    setCurrentSrc(placeholder);

    // Load the actual image
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setLoaded(true);
    };
  }, [src]);

  return (
    <div className="relative overflow-hidden">
      <img
        src={currentSrc}
        alt={alt}
        className={cn(
          'transition-all duration-500',
          loaded ? 'blur-0 scale-100' : 'blur-lg scale-105',
          className
        )}
      />
      {!loaded && (
        <div className={cn(
          'absolute inset-0 animate-shimmer',
          placeholderClassName
        )} />
      )}
    </div>
  );
}
