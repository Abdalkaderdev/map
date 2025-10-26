import { useRef, useCallback } from 'react';

export const useOffscreenCanvas = () => {
  const offscreenRef = useRef<HTMLCanvasElement>();
  const bufferRef = useRef<ImageData>();

  const createOffscreenCanvas = useCallback((width: number, height: number) => {
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas');
    }
    
    offscreenRef.current.width = width;
    offscreenRef.current.height = height;
    
    return offscreenRef.current.getContext('2d');
  }, []);

  const preRenderPlots = useCallback((plots: any[], displayWidth: number, displayHeight: number) => {
    const ctx = createOffscreenCanvas(displayWidth, displayHeight);
    if (!ctx) return null;

    // Pre-render all plots to offscreen canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 8px Arial';

    for (const plot of plots) {
      const x = plot.x * displayWidth;
      const y = plot.y * displayHeight;
      
      ctx.fillStyle = plot.color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      ctx.fillStyle = 'white';
      ctx.fillText(plot.number, x, y);
    }

    // Cache the rendered result
    bufferRef.current = ctx.getImageData(0, 0, displayWidth, displayHeight);
    return bufferRef.current;
  }, [createOffscreenCanvas]);

  const drawFromBuffer = useCallback((targetCtx: CanvasRenderingContext2D, x = 0, y = 0) => {
    if (bufferRef.current) {
      targetCtx.putImageData(bufferRef.current, x, y);
    }
  }, []);

  return { preRenderPlots, drawFromBuffer };
};