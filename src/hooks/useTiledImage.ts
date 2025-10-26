import { useState, useEffect, useRef } from 'react';

export const useTiledImage = (src: string, tileSize = 512) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadTiledImage = async () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image in tiles for progressive loading
        const tilesX = Math.ceil(img.width / tileSize);
        const tilesY = Math.ceil(img.height / tileSize);
        let tilesLoaded = 0;
        const totalTiles = tilesX * tilesY;
        
        for (let y = 0; y < tilesY; y++) {
          for (let x = 0; x < tilesX; x++) {
            setTimeout(() => {
              const sx = x * tileSize;
              const sy = y * tileSize;
              const sw = Math.min(tileSize, img.width - sx);
              const sh = Math.min(tileSize, img.height - sy);
              
              ctx.drawImage(img, sx, sy, sw, sh, sx, sy, sw, sh);
              
              tilesLoaded++;
              setProgress((tilesLoaded / totalTiles) * 100);
              
              if (tilesLoaded === totalTiles) {
                setLoaded(true);
              }
            }, (y * tilesX + x) * 50); // 50ms delay between tiles
          }
        }
      };
      
      img.src = src;
    };
    
    loadTiledImage();
  }, [src, tileSize]);

  return { canvasRef, loaded, progress };
};