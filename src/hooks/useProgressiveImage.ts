import { useState, useEffect } from 'react';

// Create a tiny base64 placeholder for instant display
const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TG9hZGluZy4uLjwvdGV4dD48L3N2Zz4=';

export const useProgressiveImage = (lowQualitySrc: string, highQualitySrc: string) => {
  const [src, setSrc] = useState(PLACEHOLDER);
  const [loading, setLoading] = useState(true);
  const [highQualityLoaded, setHighQualityLoaded] = useState(false);

  useEffect(() => {
    // Start with low quality
    setSrc(lowQualitySrc);
    setLoading(true);
    
    // Load low quality image
    const lowImg = new Image();
    lowImg.onload = () => {
      setLoading(false);
      
      // Immediately start loading high quality
      const highImg = new Image();
      highImg.onload = () => {
        setSrc(highQualitySrc);
        setHighQualityLoaded(true);
      };
      highImg.src = highQualitySrc;
    };
    
    lowImg.onerror = () => {
      // Fallback to high quality if low quality fails
      setSrc(highQualitySrc);
      setLoading(false);
    };
    
    lowImg.src = lowQualitySrc;
  }, [lowQualitySrc, highQualitySrc]);

  return { src, loading: loading && !highQualityLoaded };
};