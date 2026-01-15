const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const blogPostsDir = path.join(__dirname, 'src', 'blog'); // Path to your blog posts
const defaultSiteDescription = "Blog for EvolvedLotus - Tech, Tutorials, and More."; // Your site's default description
const defaultSiteAuthor = "EvolvedLotus"; // Your site's default author

async function processBlogPosts() {
    console.log(`Starting to process blog posts in: ${blogPostsDir}`);
    console.log("-------------------------------------------------");

    const files = fs.readdirSync(blogPostsDir).filter(file => file.endsWith('.md'));

    if (files.length === 0) {
        console.log("No Markdown files found in the blog directory.");
        return;
    }

    let modifiedCount = 0;

    for (const file of files) {
        const filePath = path.join(blogPostsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContent); // 'data' is front matter, 'content' is Markdown body

        let frontMatterModified = false;

        // --- Check and Add Title ---
        if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
            // Try to infer title from filename if no title is present
            let inferredTitle = path.basename(file, '.md')
                                  .replace(/[-_]/g, ' ') // Replace hyphens/underscores with spaces
                                  .split(' ') // Split by words
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
                                  .join(' ');

            data.title = inferredTitle;
            console.log(`- Added missing title to "${file}": "${data.title}"`);
            frontMatterModified = true;
        }

        // --- Check and Add Description ---
        if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
            // Option 1: Extract first sentence from content (more specific)
            let inferredDescription = '';
            const firstParagraphMatch = content.match(/^(?!#+\s)(.+?)\./m); // Match content until first period, not starting with #
            if (firstParagraphMatch && firstParagraphMatch[1]) {
                inferredDescription = firstParagraphMatch[1].trim();
                // Limit length for SEO best practice (e.g., 150-160 chars)
                if (inferredDescription.length > 155) {
                    inferredDescription = inferredDescription.substring(0, 152) + '...';
                }
            } else {
                // Fallback to default site description if no suitable sentence found
                inferredDescription = defaultSiteDescription;
            }

            data.description = inferredDescription;
            console.log(`- Added missing description to "${file}": "${data.description}"`);
            frontMatterModified = true;
        }

        // --- Check and Add Author (Optional) ---
        if (!data.author || typeof data.author !== 'string' || data.author.trim() === '') {
            data.author = defaultSiteAuthor;
            console.log(`- Added missing author to "${file}": "${data.author}"`);
            frontMatterModified = true;
        }


        if (frontMatterModified) {
            const newContent = matter.stringify(content, data); // Re-stringifies content with updated front matter
            fs.writeFileSync(filePath, newContent, 'utf8');
            modifiedCount++;
            console.log(`  => Successfully updated ${file}`);
        } else {
            console.log(`- No changes needed for ${file}`);
        }
    }

    console.log("-------------------------------------------------");
    console.log(`Processing complete. ${modifiedCount} blog posts modified.`);
    console.log("Remember to rebuild your Eleventy site after running this script!");
}

// Ensure you have a backup of your 'src/blog' folder before running!
processBlogPosts().catch(console.error);