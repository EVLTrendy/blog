const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const blogPostsDir = path.join(__dirname, '..', 'src', 'blog');
const defaultImage = '/assets/blog/default-social-share.png';
const defaultAuthor = 'EvolvedLotus';
const defaultImageAlt = 'EvolvedLotus Blog - Content Creation and Social Media Marketing';

async function enhanceBlogPostSEO() {
    console.log(`Starting SEO enhancement for blog posts in: ${blogPostsDir}`);
    console.log("-------------------------------------------------");

    const files = fs.readdirSync(blogPostsDir).filter(file => file.endsWith('.md'));

    if (files.length === 0) {
        console.log("No Markdown files found in the blog directory.");
        return;
    }

    let enhancedCount = 0;

    for (const file of files) {
        const filePath = path.join(blogPostsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContent);

        let frontMatterModified = false;

        // Check and add missing SEO fields
        if (!data.image) {
            data.image = defaultImage;
            console.log(`- Added default image to "${file}"`);
            frontMatterModified = true;
        }

        if (!data.imageAlt) {
            data.imageAlt = data.title ? `${data.title} - EvolvedLotus Blog` : defaultImageAlt;
            console.log(`- Added imageAlt to "${file}"`);
            frontMatterModified = true;
        }

        if (!data.author) {
            data.author = defaultAuthor;
            console.log(`- Added default author to "${file}"`);
            frontMatterModified = true;
        }

        if (!data.description) {
            // Extract first meaningful paragraph from content
            const firstParagraph = content.match(/^(?!#+\s)(.+?)(?:\n\n|\r\n\r\n|$)/m);
            if (firstParagraph && firstParagraph[1]) {
                let description = firstParagraph[1].trim();
                if (description.length > 160) {
                    description = description.substring(0, 157) + '...';
                }
                data.description = description;
                console.log(`- Added description to "${file}"`);
                frontMatterModified = true;
            }
        }

        // Add SEO-optimized keywords if missing
        if (!data.keywords) {
            const keywords = generateKeywords(data.title, data.tags);
            if (keywords.length > 0) {
                data.keywords = keywords.join(', ');
                console.log(`- Added keywords to "${file}"`);
                frontMatterModified = true;
            }
        }

        // Add schema type for better structured data
        if (!data.schema_type) {
            data.schema_type = 'Article';
            console.log(`- Added schema_type to "${file}"`);
            frontMatterModified = true;
        }

        // Add og_type for better social media sharing
        if (!data.og_type) {
            data.og_type = 'article';
            console.log(`- Added og_type to "${file}"`);
            frontMatterModified = true;
        }

        // Check for H2 tags with nested HTML in content and fix them
        const h2Regex = /##\s*\*\*(.*?)\*\*/g;
        if (h2Regex.test(content)) {
            const fixedContent = content.replace(h2Regex, '## $1');
            fs.writeFileSync(filePath, matter.stringify(fixedContent, data), 'utf8');
            console.log(`- Fixed H2 tags with nested HTML in "${file}"`);
            frontMatterModified = true;
        }

        if (frontMatterModified) {
            const newContent = matter.stringify(content, data);
            fs.writeFileSync(filePath, newContent, 'utf8');
            enhancedCount++;
            console.log(`  ✅ Successfully enhanced ${file}`);
        } else {
            console.log(`- No changes needed for ${file}`);
        }
    }

    console.log("-------------------------------------------------");
    console.log(`SEO enhancement complete. ${enhancedCount} blog posts enhanced.`);
    console.log("\n📝 NEXT STEPS:");
    console.log("1. Create a 1200x630 PNG image at: src/assets/blog/default-social-share.png");
    console.log("2. Rebuild your Eleventy site: npm run build");
    console.log("3. Test social media previews using: https://developers.facebook.com/tools/debug/");
    console.log("4. Submit sitemap to Google Search Console for better indexing");
}

function generateKeywords(title, tags = []) {
    const baseKeywords = [
        'content creation', 'social media', 'digital marketing', 'blogging',
        'SEO', 'content strategy', 'social media marketing', 'online marketing'
    ];

    const titleKeywords = title ? title.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(' ')
        .filter(word => word.length > 3)
        .slice(0, 3) : [];

    const allKeywords = [...new Set([...baseKeywords, ...titleKeywords, ...tags])];
    return allKeywords.slice(0, 8); // Limit to 8 keywords max
}

// Run the enhancement
enhanceBlogPostSEO().catch(console.error);
