// Script to apply systematic corrections to plot positions
const fs = require('fs');
const path = require('path');

// Read the current plot data
const plotsPath = path.join(__dirname, '../public/plots-for-editing.json');
const plotsData = JSON.parse(fs.readFileSync(plotsPath, 'utf8'));

// Apply a general correction based on observed misalignment
// Adjust these values based on how much the plots need to shift
const correction = {
  offsetX: -0.015,  // Shift left slightly
  offsetY: -0.020,  // Shift up slightly
  scaleX: 0.98,     // Compress horizontally slightly
  scaleY: 1.02      // Expand vertically slightly
};

// Apply correction to all plots
plotsData.plots = plotsData.plots.map(plot => ({
  ...plot,
  x: Math.max(0, Math.min(1, (plot.x * correction.scaleX) + correction.offsetX)),
  y: Math.max(0, Math.min(1, (plot.y * correction.scaleY) + correction.offsetY))
}));

// Write the corrected data back
fs.writeFileSync(plotsPath, JSON.stringify(plotsData, null, 2));
console.log('Plot positions corrected successfully!');
console.log(`Applied correction: offsetX=${correction.offsetX}, offsetY=${correction.offsetY}, scaleX=${correction.scaleX}, scaleY=${correction.scaleY}`);