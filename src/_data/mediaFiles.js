const fs = require('fs');
const path = require('path');

// Recursively scan directory for media files
function scanDirectory(dir, baseDir = dir) {
    let files = [];

    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dir, item.name);

            if (item.isDirectory()) {
                // Recursively scan subdirectories
                files = files.concat(scanDirectory(fullPath, baseDir));
            } else if (item.isFile()) {
                // Check if it's a media file
                const ext = path.extname(item.name).toLowerCase();
                const mediaExtensions = [
                    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
                    '.mp4', '.webm', '.mov', '.avi',
                    '.mp3', '.wav', '.ogg',
                    '.pdf', '.zip'
                ];

                if (mediaExtensions.includes(ext)) {
                    const stats = fs.statSync(fullPath);
                    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
                    const webPath = '/assets/' + relativePath;

                    files.push({
                        name: item.name,
                        path: webPath,
                        size: stats.size,
                        type: getFileType(ext),
                        extension: ext,
                        modified: stats.mtime.toISOString()
                    });
                }
            }
        }
    } catch (error) {
        console.error(`Error scanning directory ${dir}:`, error.message);
    }

    return files;
}

function getFileType(ext) {
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];
    const videoExts = ['.mp4', '.webm', '.mov', '.avi'];
    const audioExts = ['.mp3', '.wav', '.ogg'];

    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    return 'document';
}

module.exports = function () {
    const assetsDir = path.join(__dirname, '../assets');

    if (!fs.existsSync(assetsDir)) {
        console.warn('Assets directory not found:', assetsDir);
        return [];
    }

    const mediaFiles = scanDirectory(assetsDir, assetsDir);

    // Sort by name
    mediaFiles.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`📁 Found ${mediaFiles.length} media files in /assets/`);

    return mediaFiles;
};
