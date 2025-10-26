// Utility functions for plot position calibration

export interface PlotCalibration {
  plotNumber: string;
  x: number;
  y: number;
}

export interface Plot {
  id: number;
  number: string;
  size: string;
  color: string;
  x: number;
  y: number;
}

/**
 * Apply calibration data to update plot positions
 */
export const applyCalibration = (plots: Plot[], calibrationData: PlotCalibration[]): Plot[] => {
  const calibrationMap = new Map<string, PlotCalibration>();
  calibrationData.forEach(cal => {
    calibrationMap.set(cal.plotNumber.toLowerCase(), cal);
    calibrationMap.set(`plot ${cal.plotNumber}`.toLowerCase(), cal);
  });

  return plots.map(plot => {
    const calibration = calibrationMap.get(plot.number.toLowerCase());
    if (calibration) {
      return {
        ...plot,
        x: calibration.x,
        y: calibration.y
      };
    }
    return plot;
  });
};

/**
 * Generate corrected coordinates based on a transformation pattern
 * This applies a general correction to all plots based on observed shifts
 */
export const applyGlobalCorrection = (plots: Plot[], correction: {
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
}): Plot[] => {
  return plots.map(plot => ({
    ...plot,
    x: (plot.x * correction.scaleX) + correction.offsetX,
    y: (plot.y * correction.scaleY) + correction.offsetY
  }));
};

/**
 * Interpolate positions for plots between known calibration points
 */
export const interpolatePositions = (plots: Plot[], knownPoints: PlotCalibration[]): Plot[] => {
  if (knownPoints.length < 2) return plots;

  // Sort known points by plot number for interpolation
  const sortedKnown = knownPoints.sort((a, b) => 
    parseInt(a.plotNumber.replace('Plot ', '')) - parseInt(b.plotNumber.replace('Plot ', ''))
  );

  return plots.map(plot => {
    const plotNum = parseInt(plot.number.replace('Plot ', ''));
    
    // Find the two closest known points
    let before: PlotCalibration | null = null;
    let after: PlotCalibration | null = null;
    
    for (let i = 0; i < sortedKnown.length; i++) {
      const knownNum = parseInt(sortedKnown[i].plotNumber.replace('Plot ', ''));
      if (knownNum <= plotNum) {
        before = sortedKnown[i];
      }
      if (knownNum >= plotNum && !after) {
        after = sortedKnown[i];
      }
    }

    // If we have exact match, use it
    const exact = sortedKnown.find(k => k.plotNumber === plot.number);
    if (exact) {
      return { ...plot, x: exact.x, y: exact.y };
    }

    // If we have both before and after points, interpolate
    if (before && after && before !== after) {
      const beforeNum = parseInt(before.plotNumber.replace('Plot ', ''));
      const afterNum = parseInt(after.plotNumber.replace('Plot ', ''));
      const ratio = (plotNum - beforeNum) / (afterNum - beforeNum);
      
      const interpolatedX = before.x + (after.x - before.x) * ratio;
      const interpolatedY = before.y + (after.y - before.y) * ratio;
      
      return { ...plot, x: interpolatedX, y: interpolatedY };
    }

    // Otherwise, return original position
    return plot;
  });
};

/**
 * Export plot data as JSON for saving
 */
export const exportPlotData = (plots: Plot[], mapData: any) => {
  const exportData = {
    map: mapData?.map || {
      width: 9283,
      height: 14028,
      source: "xaritakark 2.jpg"
    },
    plots: plots.map(plot => ({
      number: plot.number,
      size: plot.size,
      color: plot.color,
      x: plot.x,
      y: plot.y
    }))
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plots-for-editing-corrected.json';
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Common correction patterns for different map sections
 */
export const CORRECTION_PRESETS = {
  // Shift all plots slightly up and left (common correction)
  GENERAL_SHIFT: {
    offsetX: -0.02,
    offsetY: -0.02,
    scaleX: 1.0,
    scaleY: 1.0
  },
  
  // Compress horizontally, expand vertically
  ASPECT_CORRECTION: {
    offsetX: 0,
    offsetY: 0,
    scaleX: 0.95,
    scaleY: 1.05
  },
  
  // Major repositioning (if map layout changed significantly)
  MAJOR_SHIFT: {
    offsetX: -0.05,
    offsetY: -0.03,
    scaleX: 0.98,
    scaleY: 1.02
  }
};