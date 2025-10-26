const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
  const inputPath = path.join(__dirname, '../public/xaritakark 2.jpg');
  const outputDir = path.join(__dirname, '../public');
  
  if (!fs.existsSync(inputPath)) {
    console.log('Original image not found');
    return;
  }

  try {
    // Create low quality preview (instant load)
    await sharp(inputPath)
      .resize(800, null, { withoutEnlargement: true })
      .webp({ quality: 30, effort: 6 })
      .toFile(path.join(outputDir, 'map-preview.webp'));
    
    // Create high quality WebP (90% quality, minimal loss)
    await sharp(inputPath)
      .webp({ quality: 90, effort: 6 })
      .toFile(path.join(outputDir, 'map-high.webp'));
    
    // Create fallback JPEG (optimized)
    await sharp(inputPath)
      .jpeg({ quality: 85, progressive: true })
      .toFile(path.join(outputDir, 'map-optimized.jpg'));
    
    console.log('✅ Images optimized successfully!');
    
  } catch (error) {
    console.error('Error optimizing images:', error);
  }
}

optimizeImages();