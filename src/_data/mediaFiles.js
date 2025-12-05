const fs = require('fs');
const path = require('path');

module.exports = function () {
    const assetsDir = path.join(__dirname, '../assets/blog');

    if (!fs.existsSync(assetsDir)) {
        return [];
    }

    try {
        const files = fs.readdirSync(assetsDir);
        return files
            .filter(file => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file))
            .map(file => ({
                name: file,
                path: `/assets/blog/${file}`,
                size: fs.statSync(path.join(assetsDir, file)).size
            }));
    } catch (e) {
        console.error("Error reading media files:", e);
        return [];
    }
};
