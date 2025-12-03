// WebP Image Converter
// Converts all JPG/PNG images in src/assets/blog/ to WebP format
// Keeps originals as fallback for older browsers

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BLOG_IMAGES_DIR = path.join(__dirname, '..', 'src', 'assets', 'blog');
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png'];

async function convertToWebP(imagePath) {
    const ext = path.extname(imagePath).toLowerCase();

    if (!SUPPORTED_FORMATS.includes(ext)) {
        return;
    }

    const webpPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

    // Skip if WebP already exists
    if (fs.existsSync(webpPath)) {
        console.log(`⏭️  Skipping ${path.basename(imagePath)} (WebP exists)`);
        return;
    }

    try {
        const stats = fs.statSync(imagePath);
        const originalSize = stats.size;

        await sharp(imagePath)
            .webp({ quality: 85 })
            .toFile(webpPath);

        const webpStats = fs.statSync(webpPath);
        const webpSize = webpStats.size;
        const savings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);

        console.log(`✅ Converted ${path.basename(imagePath)}`);
        console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB → WebP: ${(webpSize / 1024).toFixed(1)}KB (${savings}% smaller)`);
    } catch (error) {
        console.error(`❌ Error converting ${path.basename(imagePath)}:`, error.message);
    }
}

async function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            await processDirectory(filePath);
        } else {
            await convertToWebP(filePath);
        }
    }
}

async function main() {
    console.log('🖼️  Starting WebP conversion...\n');

    if (!fs.existsSync(BLOG_IMAGES_DIR)) {
        console.error(`❌ Blog images directory not found: ${BLOG_IMAGES_DIR}`);
        process.exit(1);
    }

    await processDirectory(BLOG_IMAGES_DIR);

    console.log('\n✨ WebP conversion complete!');
    console.log('💡 Next steps:');
    console.log('   1. Update markdown to use <picture> elements');
    console.log('   2. Add WebP images to git');
    console.log('   3. Deploy to see performance improvements');
}

main().catch(console.error);
