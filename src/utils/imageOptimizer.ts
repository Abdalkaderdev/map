// Client-side image optimization utilities
export const createLowQualityDataURL = (img: HTMLImageElement, quality = 0.1): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Reduce size for low quality
  const scale = 0.2;
  canvas.width = img.naturalWidth * scale;
  canvas.height = img.naturalHeight * scale;
  
  // Disable smoothing for faster rendering
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  return canvas.toDataURL('image/jpeg', quality);
};

export const preloadWithBlur = (src: string): Promise<{ lowQuality: string; original: HTMLImageElement }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const lowQuality = createLowQualityDataURL(img, 0.3);
      resolve({ lowQuality, original: img });
    };
    
    img.onerror = reject;
    img.src = src;
  });
};

export const enableHardwareAcceleration = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Enable hardware acceleration hints
    (ctx as any).imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;
    (ctx as any).msImageSmoothingEnabled = false;
    
    // Force GPU layer
    canvas.style.transform = 'translateZ(0)';
    canvas.style.willChange = 'transform';
  }
};