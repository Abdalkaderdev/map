import React, { useState, useEffect, useRef, useCallback } from 'react';
import './InteractiveMap.css';

interface Plot {
  id: number;
  number: string;
  size: string;
  color: string;
  x: number;
  y: number;
}

interface MapData {
  map: {
    width: number;
    height: number;
    source: string;
  };
  plots: Plot[];
}

const InteractiveMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedPlot, setHighlightedPlot] = useState<number | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showAllPlots, setShowAllPlots] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Load plot data
  useEffect(() => {
    const loadPlots = async () => {
      try {
        console.log('Loading plot data...');
        const response = await fetch('/plots-for-editing.json');
        const data = await response.json();
        console.log('Loaded data:', data);
        setMapData(data);
        
        // Keep normalized coordinates (0-1) - we'll convert to canvas coordinates in redraw
        const normalizedPlots = data.plots.map((plot: any, index: number) => ({
          id: Date.now() + index,
          number: plot.number,
          size: plot.size || '',
          color: plot.color || '#ff6b6b',
          x: plot.x, // Keep as normalized (0-1)
          y: plot.y  // Keep as normalized (0-1)
        }));
        
        console.log('Normalized plots:', normalizedPlots.slice(0, 5)); // Log first 5 plots
        setPlots(normalizedPlots);
      } catch (error) {
        console.error('Error loading plots:', error);
      }
    };

    loadPlots();
  }, []);

  // Handle image load
  const handleImageLoad = () => {
    setIsImageLoaded(true);
    if (imageRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      
      // Set canvas size to match container
      const container = img.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
      
      // Reset view
      setOffsetX(0);
      setOffsetY(0);
      setScale(1);
      
      // Apply initial transform to image
      updateImageTransform();
      
      // Redraw after a short delay to ensure image is fully rendered
      setTimeout(() => {
        redraw();
      }, 100);
    }
  };

  // Update image transform based on scale and offset
  const updateImageTransform = () => {
    if (imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
      
      img.style.transform = transform;
      img.style.transformOrigin = 'center center';
      
      // Apply the same transform to the canvas
      canvas.style.transform = transform;
      canvas.style.transformOrigin = 'center center';
    }
  };

  // Redraw canvas
  const redraw = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas efficiently
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get the original image dimensions (before any transforms)
    const img = imageRef.current;
    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;
    
    // Get the container dimensions
    const containerRect = img.parentElement?.getBoundingClientRect();
    if (!containerRect) return;
    
    // Calculate the image's display size (maintaining aspect ratio)
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const scaleX = containerWidth / originalWidth;
    const scaleY = containerHeight / originalHeight;
    const displayScale = Math.min(scaleX, scaleY);
    
    const displayWidth = originalWidth * displayScale;
    const displayHeight = originalHeight * displayScale;
    
    // Center the image in the container
    const imgLeft = (containerWidth - displayWidth) / 2;
    const imgTop = (containerHeight - displayHeight) / 2;
    
    // Only draw plots if we're showing all plots or if there's a highlighted plot
    const plotsToDraw = showAllPlots ? plots : (highlightedPlot !== null ? [plots[highlightedPlot]] : []);
    
    // Early return if no plots to draw
    if (plotsToDraw.length === 0) return;
    
    // Set common styles once for performance
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 8px Arial';
    
    // Draw plots with optimized rendering
    for (let i = 0; i < plotsToDraw.length; i++) {
      const plot = plotsToDraw[i];
      
      // Convert normalized coordinates (0-1) to canvas coordinates
      const x = imgLeft + (plot.x * displayWidth);
      const y = imgTop + (plot.y * displayHeight);
      
      // Skip if outside visible area (with smaller margin for performance)
      if (x < -20 || x > canvas.width + 20 || y < -20 || y > canvas.height + 20) {
        continue;
      }
      
      const isHighlighted = highlightedPlot !== null && plots.indexOf(plot) === highlightedPlot;
      
      // Draw highlight ring first if needed
      if (isHighlighted) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.95)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Draw plot circle
      ctx.fillStyle = plot.color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw white border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Draw plot number
      ctx.fillStyle = 'white';
      ctx.fillText(plot.number, x, y);
    }
  }, [plots, highlightedPlot, showAllPlots]);

  // Update image transform when scale or offset changes
  useEffect(() => {
    updateImageTransform();
    // Use requestAnimationFrame for smoother performance
    requestAnimationFrame(() => {
      redraw();
    });
  }, [scale, offsetX, offsetY, redraw]);

  // Redraw when plots or scale changes
  useEffect(() => {
    redraw();
  }, [redraw]);


  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setDragStart({
      x: e.clientX - offsetX,
      y: e.clientY - offsetY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsDragging(true);
      setOffsetX(e.clientX - dragStart.x);
      setOffsetY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, scale * factor));
    setScale(newScale);
  };

  // Search functionality
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    console.log('Searching for:', searchQuery);
    console.log('Total plots available:', plots.length);
    
    const query = searchQuery.toLowerCase().trim();
    
    // Try different search patterns
    let plotIndex = plots.findIndex(plot => {
      const plotNumber = plot.number.toLowerCase();
      console.log('Checking plot:', plotNumber, 'against query:', query);
      return plotNumber === query;
    });
    
    // If not found, try without "plot" prefix
    if (plotIndex === -1) {
      plotIndex = plots.findIndex(plot => {
        const plotNumber = plot.number.toLowerCase().replace('plot ', '');
        console.log('Checking plot (no prefix):', plotNumber, 'against query:', query);
        return plotNumber === query;
      });
    }
    
    // If still not found, try partial match
    if (plotIndex === -1) {
      plotIndex = plots.findIndex(plot => {
        const plotNumber = plot.number.toLowerCase();
        console.log('Checking plot (partial):', plotNumber, 'against query:', query);
        return plotNumber.includes(query);
      });
    }
    
    console.log('Search result:', plotIndex);
    
    if (plotIndex !== -1) {
      setHighlightedPlot(plotIndex);
      setShowAllPlots(false); // Only show the searched plot
      console.log('Found plot:', plots[plotIndex]);
    } else {
      console.log('No plot found');
      alert('No plot found with that number.');
    }
  };

  const clearHighlight = () => {
    setHighlightedPlot(null);
    setShowAllPlots(false);
  };

  const toggleAllPlots = () => {
    setShowAllPlots(!showAllPlots);
    if (showAllPlots) {
      setHighlightedPlot(null);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(5, prev * 1.2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.1, prev * 0.8));
  };

  const resetView = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  return (
    <div className="interactive-map-container">
      {/* Control Panel */}
      <div className="control-panel">
        <h3>Interactive Plot Map</h3>
        
        <div className="search-section">
          <h4>Search</h4>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by number (e.g., 1, 2, 3...)"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Search</button>
          <button onClick={clearHighlight}>Clear</button>
        </div>

        <div className="zoom-controls">
          <h4>Zoom & Pan</h4>
          <button onClick={zoomIn}>Zoom In</button>
          <button onClick={zoomOut}>Zoom Out</button>
          <button onClick={resetView}>Reset View</button>
        </div>

        <div className="plot-info">
          <h4>Plots ({plots.length})</h4>
          <button onClick={toggleAllPlots}>
            {showAllPlots ? 'Hide All Plots' : 'Show All Plots'}
          </button>
          <p>Click and drag to pan, scroll to zoom</p>
        </div>
      </div>

      {/* Map Container */}
      <div className="map-container">
        <div className="image-container">
          <img
            ref={imageRef}
            src="/xaritakark 2.jpg"
            alt="Base Map"
            onLoad={handleImageLoad}
            style={{ display: isImageLoaded ? 'block' : 'none' }}
          />
          <canvas
            ref={canvasRef}
            className="overlay-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          />
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
