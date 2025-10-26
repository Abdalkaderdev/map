import { useState, useEffect } from 'react';

// Preload critical images immediately
const preloadImage = (src: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  (link as any).fetchPriority = 'high';
  document.head.appendChild(link);
};

// Preload the map image immediately when module loads
if (typeof window !== 'undefined') {
  preloadImage('/xaritakark 2.jpg');
}

export const useImagePreloader = (src: string) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const img = new Image();
    
    // Add high priority and preload hints
    (img as any).fetchPriority = 'high';
    (img as any).decoding = 'async';
    
    img.onload = () => {
      setLoaded(true);
      setError(false);
      setProgress(100);
    };
    
    img.onerror = () => {
      setError(true);
      setLoaded(false);
    };
    
    // Start loading immediately
    img.src = src;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { loaded, error, progress };
};