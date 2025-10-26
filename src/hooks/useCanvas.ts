import { useCallback, useRef } from 'react';

interface Plot {
  id: number;
  number: string;
  size: string;
  color: string;
  x: number;
  y: number;
}

export const useCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const drawPlots = useCallback((
    plots: Plot[], 
    highlightedPlot: number | null, 
    showAllPlots: boolean
  ) => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const img = imageRef.current;
    const containerRect = img.parentElement?.getBoundingClientRect();
    if (!containerRect) return;
    
    const scaleX = containerRect.width / img.naturalWidth;
    const scaleY = containerRect.height / img.naturalHeight;
    const displayScale = Math.min(scaleX, scaleY);
    
    const displayWidth = img.naturalWidth * displayScale;
    const displayHeight = img.naturalHeight * displayScale;
    const imgLeft = (containerRect.width - displayWidth) / 2;
    const imgTop = (containerRect.height - displayHeight) / 2;
    
    const plotsToDraw = showAllPlots ? plots : (highlightedPlot !== null ? [plots[highlightedPlot]] : []);
    if (plotsToDraw.length === 0) return;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 8px Arial';
    
    for (const plot of plotsToDraw) {
      const x = imgLeft + (plot.x * displayWidth);
      const y = imgTop + (plot.y * displayHeight);
      
      if (x < -20 || x > canvas.width + 20 || y < -20 || y > canvas.height + 20) continue;
      
      const isHighlighted = highlightedPlot !== null && plots.indexOf(plot) === highlightedPlot;
      
      if (isHighlighted) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.95)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
      
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
  }, []);

  return { canvasRef, imageRef, drawPlots };
};