const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Platform-specific OG image dimensions per outcome.md
const PLATFORM_SIZES = {
    facebook: { width: 1200, height: 630 },
    twitter: { width: 1200, height: 675 },
    linkedin: { width: 1200, height: 627 },
    pinterest: { width: 1000, height: 1500 },
    instagram: { width: 1080, height: 1080 },
    whatsapp: { width: 400, height: 400 },
    default: { width: 1200, height: 630 } // Facebook size as default
};

async function generatePlatformOGImages() {
    const blogDir = path.join(__dirname, '../src/assets/blog');
    const ogDir = path.join(__dirname, '../src/assets/og');

    // Create og directory if it doesn't exist
    if (!fs.existsSync(ogDir)) {
        fs.mkdirSync(ogDir, { recursive: true });
    }

    const files = fs.readdirSync(blogDir).filter(file =>
        /\.(png|jpg|jpeg)$/i.test(file)
    );

    console.log(`Found ${files.length} images to process for platform-specific OG images...`);

    for (const file of files) {
        const inputPath = path.join(blogDir, file);
        const baseName = path.parse(file).name;

        // Generate images for each platform
        for (const [platform, dimensions] of Object.entries(PLATFORM_SIZES)) {
            const outputPath = path.join(ogDir, `${baseName}-${platform}.jpg`);

            // Skip if OG image already exists and is newer than source
            if (fs.existsSync(outputPath)) {
                const sourceStats = fs.statSync(inputPath);
                const ogStats = fs.statSync(outputPath);
                if (ogStats.mtime > sourceStats.mtime) {
                    console.log(`⊘ Skipped ${platform} (already optimized): ${file}`);
                    continue;
                }
            }

            try {
                await sharp(inputPath)
                    .resize(dimensions.width, dimensions.height, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .jpeg({ quality: 90 })
                    .toFile(outputPath);

                console.log(`✓ Generated ${platform} OG image: ${baseName}-${platform}.jpg`);
            } catch (error) {
                console.error(`✗ Failed to process ${file} for ${platform}:`, error.message);
            }
        }
    }

    console.log('Platform-specific OG image generation complete!');
}

generatePlatformOGImages().catch(err => {
    console.error('Failed to generate platform OG images:', err);
    process.exit(1);
});
