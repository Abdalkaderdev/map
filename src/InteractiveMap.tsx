import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCanvas } from './hooks/useCanvas';
import { useImagePreloader } from './hooks/useImagePreloader';
import { throttle } from './utils/performance';
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
  const { canvasRef, imageRef, drawPlots } = useCanvas();
  const { loaded: imagePreloaded } = useImagePreloader('/xaritakark 2.jpg');
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
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [imageError, setImageError] = useState(false);

  // Progressive loading with chunks
  useEffect(() => {
    const loadPlots = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/plots-for-editing.json');
        if (!response.ok) throw new Error('Failed to load plot data');
        const data = await response.json();
        setMapData(data);
        
        // Load plots in optimized chunks
        const chunkSize = 500;
        const allPlots = data.plots.map((plot: any, index: number) => ({
          id: Date.now() + index,
          number: plot.number,
          size: plot.size || '',
          color: plot.color || '#ff6b6b',
          x: plot.x,
          y: plot.y
        }));
        
        // Load first chunk immediately
        setPlots(allPlots.slice(0, chunkSize));
        setIsLoading(false);
        
        // Load remaining chunks with requestIdleCallback for better performance
        const loadChunk = (startIndex: number) => {
          if (startIndex >= allPlots.length) return;
          
          const chunk = allPlots.slice(startIndex, startIndex + chunkSize);
          setPlots(prev => [...prev, ...chunk]);
          
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => loadChunk(startIndex + chunkSize));
          } else {
            setTimeout(() => loadChunk(startIndex + chunkSize), 16);
          }
        };
        
        loadChunk(chunkSize);
      } catch (error) {
        console.error('Error loading plots:', error);
        setIsLoading(false);
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

  // Redraw canvas using custom hook
  const redraw = useCallback(() => {
    drawPlots(plots, highlightedPlot, showAllPlots);
  }, [plots, highlightedPlot, showAllPlots, drawPlots]);

  // Debounced transform updates
  useEffect(() => {
    updateImageTransform();
    const rafId = requestAnimationFrame(() => redraw());
    return () => cancelAnimationFrame(rafId);
  }, [scale, offsetX, offsetY, redraw]);

  // Throttled redraw for better performance
  useEffect(() => {
    const timeoutId = setTimeout(() => redraw(), 16);
    return () => clearTimeout(timeoutId);
  }, [redraw]);


  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setDragStart({
      x: e.clientX - offsetX,
      y: e.clientY - offsetY
    });
  };

  const handleMouseMove = useCallback(
    throttle((e: React.MouseEvent) => {
      if (isPanning) {
        setIsDragging(true);
        setOffsetX(e.clientX - dragStart.x);
        setOffsetY(e.clientY - dragStart.y);
      }
    }, 16),
    [isPanning, dragStart]
  );

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDragging(false);
  };

  const handleWheel = useCallback(
    throttle((e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(5, scale * factor));
      setScale(newScale);
      setCurrentZoom(newScale);
    }, 16),
    [scale]
  );

  // Memoized search functionality
  const searchIndex = useMemo(() => {
    const index = new Map<string, number>();
    plots.forEach((plot, i) => {
      const key = plot.number.toLowerCase();
      index.set(key, i);
      index.set(key.replace('plot ', ''), i);
    });
    return index;
  }, [plots]);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    console.log('Searching for:', searchQuery);
    console.log('Total plots available:', plots.length);
    
    const query = searchQuery.toLowerCase().trim();
    let plotIndex = searchIndex.get(query) ?? -1;
    
    // Fallback to partial match if exact not found
    if (plotIndex === -1) {
      plotIndex = plots.findIndex(plot => 
        plot.number.toLowerCase().includes(query)
      );
    }
    
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
    const newScale = Math.min(5, scale * 1.2);
    setScale(newScale);
    setCurrentZoom(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(0.1, scale * 0.8);
    setScale(newScale);
    setCurrentZoom(newScale);
  };

  const resetView = () => {
    setScale(1);
    setCurrentZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setOffsetY(prev => prev + 50);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setOffsetY(prev => prev - 50);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setOffsetX(prev => prev + 50);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setOffsetX(prev => prev - 50);
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetView();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scale]);

  // Plot click handler
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const containerRect = img.parentElement?.getBoundingClientRect();
    if (!containerRect) return;

    const scaleX = containerRect.width / img.naturalWidth;
    const scaleY = containerRect.height / img.naturalHeight;
    const displayScale = Math.min(scaleX, scaleY);
    
    const displayWidth = img.naturalWidth * displayScale;
    const displayHeight = img.naturalHeight * displayScale;
    const imgLeft = (containerRect.width - displayWidth) / 2;
    const imgTop = (containerRect.height - displayHeight) / 2;

    // Find clicked plot
    for (let i = 0; i < plots.length; i++) {
      const plot = plots[i];
      const plotX = imgLeft + (plot.x * displayWidth);
      const plotY = imgTop + (plot.y * displayHeight);
      
      const distance = Math.sqrt((clickX - plotX) ** 2 + (clickY - plotY) ** 2);
      if (distance <= 12) {
        setSelectedPlot(i);
        setHighlightedPlot(i);
        setShowAllPlots(false);
        return;
      }
    }
    
    // Clear selection if clicked elsewhere
    setSelectedPlot(null);
    setHighlightedPlot(null);
  };

  return (
    <div className="interactive-map-container">
      {/* Control Panel */}
      <div className="control-panel">
        <div className="header-section">
          <img src="/logo-realhouse.png" alt="RealHouse" className="company-logo" onError={(e) => e.currentTarget.style.display = 'none'} />
          <h3>Interactive Plot Map</h3>
        </div>
        
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
          <div className="zoom-info">
            <p>Zoom: {Math.round(currentZoom * 100)}%</p>
          </div>
          <p>Click and drag to pan, scroll to zoom</p>
          <p>Use arrow keys, +/- for navigation</p>
          {selectedPlot !== null && (
            <div className="selected-plot">
              <h5>Selected Plot</h5>
              <p><strong>Number:</strong> {plots[selectedPlot]?.number}</p>
              <p><strong>Size:</strong> {plots[selectedPlot]?.size || 'N/A'}</p>
              <button onClick={() => {
                const newNumber = prompt('Enter new plot number:', plots[selectedPlot]?.number);
                if (newNumber && newNumber !== plots[selectedPlot]?.number) {
                  const updatedPlots = [...plots];
                  updatedPlots[selectedPlot] = { ...updatedPlots[selectedPlot], number: newNumber };
                  setPlots(updatedPlots);
                }
              }}>Edit Number</button>
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="map-container">
        {(isLoading || !imagePreloaded) && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>{!imagePreloaded ? 'Loading map image...' : `Loading plots... (${plots.length} loaded)`}</p>
          </div>
        )}
        <div className="image-container">
          <img
            ref={imageRef}
            src="/xaritakark 2.jpg"
            alt="Base Map"
            onLoad={handleImageLoad}
            onError={() => setImageError(true)}
            loading="eager"
            decoding="async"
            fetchpriority="high"
            style={{ 
              display: isImageLoaded && !imageError ? 'block' : 'none',
              imageRendering: 'optimizeSpeed'
            }}
          />
          {imageError && (
            <div className="image-error">
              <p>Failed to load map image</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="overlay-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onClick={handleCanvasClick}
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          />
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
