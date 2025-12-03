const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BLOG_IMAGES_DIR = path.join(__dirname, '..', 'src', 'assets', 'blog');
const SIZES = [480, 768, 1200];

async function processImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) return;

    // Skip if it's already a resized version
    if (filePath.match(/-\d+w\./)) return;

    const filename = path.basename(filePath, ext);
    const dir = path.dirname(filePath);

    console.log(`Processing ${filename}${ext}...`);

    // Generate responsive sizes
    for (const width of SIZES) {
        const resizedFilename = `${filename}-${width}w${ext}`;
        const resizedPath = path.join(dir, resizedFilename);
        const webpFilename = `${filename}-${width}w.webp`;
        const webpPath = path.join(dir, webpFilename);

        // Resize original format
        if (!fs.existsSync(resizedPath)) {
            try {
                await sharp(filePath)
                    .resize(width, null, { withoutEnlargement: true })
                    .toFile(resizedPath);
                console.log(`  Created ${resizedFilename}`);
            } catch (e) {
                console.error(`  Error creating ${resizedFilename}:`, e.message);
            }
        }

        // Generate WebP for this size
        if (!fs.existsSync(webpPath)) {
            try {
                await sharp(filePath)
                    .resize(width, null, { withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toFile(webpPath);
                console.log(`  Created ${webpFilename}`);
            } catch (e) {
                console.error(`  Error creating ${webpFilename}:`, e.message);
            }
        }
    }

    // Generate main WebP
    const mainWebpPath = path.join(dir, `${filename}.webp`);
    if (!fs.existsSync(mainWebpPath)) {
        try {
            await sharp(filePath)
                .webp({ quality: 80 })
                .toFile(mainWebpPath);
            console.log(`  Created ${filename}.webp`);
        } catch (e) {
            console.error(`  Error creating ${filename}.webp:`, e.message);
        }
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
            await processImage(filePath);
        }
    }
}

(async () => {
    console.log('Starting image optimization...');
    if (fs.existsSync(BLOG_IMAGES_DIR)) {
        await processDirectory(BLOG_IMAGES_DIR);
        console.log('Image optimization complete.');
    } else {
        console.error('Blog images directory not found.');
    }
})();
