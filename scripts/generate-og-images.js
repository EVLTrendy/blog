const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OPTIMAL_RATIOS = {
  og: { width: 1200, height: 630 }, // 1.91:1 ratio for Open Graph
  twitter: { width: 1200, height: 600 } // 2:1 ratio for Twitter
};

async function generateOGImages() {
  const blogDir = path.join(__dirname, '../src/assets/blog');
  const ogDir = path.join(__dirname, '../src/assets/og');

  // Create og directory if it doesn't exist
  if (!fs.existsSync(ogDir)) {
    fs.mkdirSync(ogDir, { recursive: true });
  }

  const files = fs.readdirSync(blogDir).filter(file =>
    /\.(png|jpg|jpeg)$/i.test(file)
  );

  console.log(`Found ${files.length} images to process...`);

  for (const file of files) {
    const inputPath = path.join(blogDir, file);
    const outputPath = path.join(ogDir, file);

    // Skip if OG image already exists and is newer than source
    if (fs.existsSync(outputPath)) {
      const sourceStats = fs.statSync(inputPath);
      const ogStats = fs.statSync(outputPath);
      if (ogStats.mtime > sourceStats.mtime) {
        console.log(`⊘ Skipped (already optimized): ${file}`);
        continue;
      }
    }

    try {
      // Generate Open Graph version (1200x630)
      await sharp(inputPath)
        .resize(OPTIMAL_RATIOS.og.width, OPTIMAL_RATIOS.og.height, {
          fit: 'cover',
          position: 'center'
        })
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(outputPath);

      console.log(`✓ Generated OG image: ${file}`);
    } catch (error) {
      console.error(`✗ Failed to process ${file}:`, error.message);
    }
  }

  console.log('OG image generation complete!');
}

generateOGImages().catch(err => {
  console.error('Failed to generate OG images:', err);
  process.exit(1);
});
