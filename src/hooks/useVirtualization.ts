import { useMemo } from 'react';

interface Plot {
  id: number;
  number: string;
  size: string;
  color: string;
  x: number;
  y: number;
}

export const useVirtualization = (
  plots: Plot[],
  scale: number,
  offsetX: number,
  offsetY: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  const visiblePlots = useMemo(() => {
    if (!plots.length || !canvasWidth || !canvasHeight) return [];

    const margin = 100; // Extra margin for smooth scrolling
    const viewportLeft = -offsetX - margin;
    const viewportRight = -offsetX + canvasWidth + margin;
    const viewportTop = -offsetY - margin;
    const viewportBottom = -offsetY + canvasHeight + margin;

    return plots.filter(plot => {
      const plotX = plot.x * canvasWidth;
      const plotY = plot.y * canvasHeight;
      
      return plotX >= viewportLeft && 
             plotX <= viewportRight && 
             plotY >= viewportTop && 
             plotY <= viewportBottom;
    });
  }, [plots, scale, offsetX, offsetY, canvasWidth, canvasHeight]);

  return visiblePlots;
};