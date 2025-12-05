const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get the root directory (one level up from netlify/functions)
    const rootDir = path.join(__dirname, '../../');

    // Scan media directories
    const assetsDir = path.join(rootDir, 'src/assets');
    const publicAssetsDir = path.join(rootDir, 'public/assets');

    const assetsFiles = await scanMediaDirectory(assetsDir, '/assets');
    const publicAssetsFiles = await scanMediaDirectory(publicAssetsDir, '/assets');

    // Combine and deduplicate
    const allMedia = [...assetsFiles, ...publicAssetsFiles];
    const uniqueMedia = allMedia.filter((item, index, self) =>
      self.findIndex(m => m.path === item.path) === index
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ media: uniqueMedia }),
    };

  } catch (error) {
    console.error('Error generating media data:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to load media data', details: error.message }),
    };
  }
};

// Helper function to scan media directory
async function scanMediaDirectory(baseDir, baseUrl) {
  const mediaFiles = [];

  async function scanDir(dir, urlPrefix) {
    try {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        const relativePath = path.relative(baseDir, fullPath);
        const urlPath = baseUrl + '/' + relativePath.replace(/\\/g, '/');

        if (stat.isDirectory()) {
          // Recursively scan subdirectories
          await scanDir(fullPath, urlPath);
        } else if (stat.isFile()) {
          // Check if it's a media file
          const ext = path.extname(item).toLowerCase();
          const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.mp4', '.webm', '.mp3', '.wav'];

          if (mediaExtensions.includes(ext)) {
            const sizeInKb = Math.round(stat.size / 1024);

            mediaFiles.push({
              name: item,
              path: urlPath,
              size: sizeInKb,
              type: ext.slice(1).toUpperCase(),
              uploaded: stat.mtime.toISOString(),
              fullPath: relativePath
            });
          }
        }
      }
    } catch (e) {
      console.warn('Error scanning directory:', dir, e);
    }
  }

  await scanDir(baseDir, baseUrl);
  return mediaFiles;
}
