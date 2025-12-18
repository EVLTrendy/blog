const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OPTIMAL_RATIOS = {
  og: { width: 1200, height: 630 }
};

const DEFAULT_IMAGE = 'default-og.png';

async function generateOGImages() {
  const blogDir = path.join(__dirname, '../src/assets/blog');
  const ogDir = path.join(__dirname, '../src/assets/og');

  if (!fs.existsSync(ogDir)) {
    fs.mkdirSync(ogDir, { recursive: true });
  }

  // Ensure default OG image exists in destination
  const defaultSource = path.join(blogDir, DEFAULT_IMAGE);
  const defaultOutput = path.join(ogDir, DEFAULT_IMAGE);
  if (fs.existsSync(defaultSource)) {
    await sharp(defaultSource)
      .resize(OPTIMAL_RATIOS.og.width, OPTIMAL_RATIOS.og.height, { fit: 'cover' })
      .png()
      .toFile(defaultOutput);
  }

  const files = fs.readdirSync(blogDir).filter(file =>
    /\.(png|jpg|jpeg|webp)$/i.test(file) && file !== DEFAULT_IMAGE
  );

  console.log(`🚀 Processing ${files.length} images for OG optimization...`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const inputPath = path.join(blogDir, file);
    // Change extension to .png in output
    const outputName = file.replace(/\.[^/.]+$/, "") + ".png";
    const outputPath = path.join(ogDir, outputName);

    if (fs.existsSync(outputPath)) {
      const sourceStats = fs.statSync(inputPath);
      const ogStats = fs.statSync(outputPath);
      if (ogStats.mtime > sourceStats.mtime) {
        skipCount++;
        continue;
      }
    }

    try {
      await sharp(inputPath)
        .resize(OPTIMAL_RATIOS.og.width, OPTIMAL_RATIOS.og.height, {
          fit: 'cover',
          position: 'center'
        })
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(outputPath);

      successCount++;
      console.log(`  ✓ Generated: ${outputName}`);
    } catch (error) {
      errorCount++;
      console.error(`  ✗ Failed ${file}:`, error.message);
    }
  }

  console.log(`\n✨ OG image generation complete!`);
  console.log(`  Total: ${files.length}`);
  console.log(`  Generated: ${successCount}`);
  // eslint-disable-next-line no-irregular-whitespace
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Errors: ${errorCount}`);
}

if (require.main === module) {
  generateOGImages().catch(err => {
    console.error('Fatal error in OG generation:', err);
    process.exit(1);
  });
}

module.exports = generateOGImages;

