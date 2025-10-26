import { useEffect, useRef } from 'react';

export const useWebWorker = () => {
  const workerRef = useRef<Worker>();

  useEffect(() => {
    const workerCode = `
      self.onmessage = function(e) {
        const { plots, viewport } = e.data;
        
        // Filter plots in viewport (offload from main thread)
        const visiblePlots = plots.filter(plot => {
          const x = plot.x * viewport.width;
          const y = plot.y * viewport.height;
          return x >= viewport.left && x <= viewport.right && 
                 y >= viewport.top && y <= viewport.bottom;
        });
        
        self.postMessage({ visiblePlots });
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    workerRef.current = new Worker(URL.createObjectURL(blob));
    
    return () => {
      workerRef.current?.terminate();
      URL.revokeObjectURL(blob);
    };
  }, []);

  const filterPlots = (plots: any[], viewport: any) => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        resolve(plots);
        return;
      }
      
      workerRef.current.onmessage = (e) => {
        resolve(e.data.visiblePlots);
      };
      
      workerRef.current.postMessage({ plots, viewport });
    });
  };

  return { filterPlots };
};