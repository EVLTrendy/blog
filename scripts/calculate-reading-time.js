const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Average reading speed: 200 words per minute
const WORDS_PER_MINUTE = 200;

function calculateReadingTime(content) {
    // Remove HTML tags and count words
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / WORDS_PER_MINUTE);
    return minutes;
}

function updateBlogPostsWithReadingTime() {
    const blogDir = path.join(__dirname, '../src/blog');
    const files = fs.readdirSync(blogDir).filter(file => file.endsWith('.md'));

    console.log(`Processing ${files.length} blog posts for reading time...`);

    let updated = 0;
    let skipped = 0;

    for (const file of files) {
        const filePath = path.join(blogDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContent);

        // Calculate reading time
        const readingTime = calculateReadingTime(content);

        // Only update if readingTime doesn't exist or is different
        if (!data.readingTime || data.readingTime !== readingTime) {
            data.readingTime = readingTime;

            // Write back to file
            const newContent = matter.stringify(content, data);
            fs.writeFileSync(filePath, newContent, 'utf8');

            console.log(`✓ Updated ${file}: ${readingTime} min read`);
            updated++;
        } else {
            skipped++;
        }
    }

    console.log(`\nReading time calculation complete!`);
    console.log(`Updated: ${updated} files`);
    console.log(`Skipped: ${skipped} files (already up to date)`);
}

updateBlogPostsWithReadingTime();
