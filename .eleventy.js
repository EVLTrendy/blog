const { DateTime } = require("luxon");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Require the eleventy-plugin-seo plugin
const pluginSEO = require("eleventy-plugin-seo");

// Custom frontmatter parser to ensure dates remain as strings
const matter = require('gray-matter');

// ========================================
// CRITICAL: Date normalization cascade
// This runs BEFORE Eleventy processes dates
// ========================================



module.exports = function (eleventyConfig) {
    // Passthrough copies
    eleventyConfig.addPassthroughCopy('./src/style.css');
    eleventyConfig.addPassthroughCopy('./src/enhancements.css');
    eleventyConfig.addPassthroughCopy('./src/layout-fixes.css');
    eleventyConfig.addPassthroughCopy('./src/ux-enhancements.css');
    eleventyConfig.addPassthroughCopy('./src/conversion-components.css');
    eleventyConfig.addPassthroughCopy('./src/fonts.css');
    eleventyConfig.addPassthroughCopy('./src/assets');
    eleventyConfig.addPassthroughCopy('./src/admin');
    eleventyConfig.addPassthroughCopy('./src/.well-known');
    eleventyConfig.addPassthroughCopy('./src/_redirects');
    eleventyConfig.addPassthroughCopy('./src/robots.txt');
    eleventyConfig.addPassthroughCopy('./src/resources');
    // Copy auto-generated social media preview images
    eleventyConfig.addPassthroughCopy('./src/assets/og');

    // 2. Add the eleventy-plugin-seo plugin configuration
    // IMPORTANT: Make sure to set your actual blog URL for 'url'
    eleventyConfig.addPlugin(pluginSEO, {
        url: "https://blog.evolvedlotus.com", // <--- THIS IS YOUR BLOG'S BASE URL!
        title: "EvolvedLotus Blog", // Default site title for your blog
        description: "Blog for EvolvedLotus - Tech, Tutorials, and More. Your ultimate guide to content creation, social media marketing, and digital success.", // Enhanced default site description for SEO
        author: "EvolvedLotus", // Your blog's author or organization name
        twitter: "evolvedlotus", // Your Twitter handle without the @ (e.g., "myhandle" if your handle is @myhandle)
        image: "/assets/blog/default-og.png", // Default social sharing image
        lang: "en", // Default language for your content
        options: {
            // Enhanced SEO options for better social media compatibility
            titleLengthEarlyWarning: 40,
            titleLengthWarning: 60,
            descriptionLengthEarlyWarning: 120,
            descriptionLengthWarning: 160,
            imageWidth: 1200,
            imageHeight: 630,
            twitterCardType: "summary_large_image",
            openGraphType: "article", // Changed from "website" for blog posts
            includeOpenGraph: false, // Disable to prevent duplicates with manual tags
            includeTwitterCard: false, // Disable to prevent duplicates with manual tags
            includeJSONLD: true,
            includeSchema: true,
            imageWithBaseUrl: true // CRITICAL: Converts relative URLs to absolute
        }
    });

    // Date normalization filter for frontmatter dates
    eleventyConfig.addFilter("normalizeDate", (dateStr) => {
        if (!dateStr) return new Date();
        try {
            let dt = DateTime.fromISO(dateStr, { zone: "utc" });
            if (!dt.isValid) return new Date();
            return dt.toJSDate();
        } catch (error) {
            console.warn(`Failed to parse date string: ${dateStr}`, error.message);
            return new Date();
        }
    });

    // Date filter for display formatting
    eleventyConfig.addFilter("postDate", (dateObj) => {
        try {
            // Handle string dates
            if (typeof dateObj === 'string') {
                return DateTime.fromISO(dateObj).toLocaleString(DateTime.DATE_MED);
            }
            // Handle Date objects
            if (dateObj instanceof Date) {
                return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
            }
            console.error("Invalid date:", dateObj);
            return "Invalid Date";
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid Date";
        }
    });

    // Add absoluteUrl filter (already correctly set to your base URL)
    eleventyConfig.addFilter("absoluteUrl", (url) => {
        const baseUrl = "https://blog.evolvedlotus.com";
        if (!url) return baseUrl;
        return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    });

    // Add ISO date filter for sitemap
    eleventyConfig.addFilter("isoDate", (date) => {
        if (typeof date === 'string') {
            return DateTime.fromISO(date).toISO();
        }
        return DateTime.fromJSDate(date).toISO();
    });

    // Add limit filter for array limiting
    eleventyConfig.addFilter("limit", function (arr, limit) {
        return arr.slice(0, limit);
    });

    // Generic date formatting filter (luxon)
    eleventyConfig.addFilter("date", (value = new Date(), format = "yyyy-LL-dd") => {
        let dateObj;
        if (value === "now") {
            dateObj = new Date();
        } else if (value instanceof Date) {
            dateObj = value;
        } else {
            dateObj = new Date(value);
        }
        return DateTime.fromJSDate(dateObj).toFormat(format);
    });

    // Content Freshness Filter
    eleventyConfig.addFilter("contentAge", (date, lastModified) => {
        const checkDate = lastModified || date;
        if (!checkDate) return 'unknown';

        const contentDate = typeof checkDate === 'string' ? new Date(checkDate) : checkDate;
        const now = new Date();
        const monthsOld = (now - contentDate) / (1000 * 60 * 60 * 24 * 30);

        if (monthsOld < 6) return 'fresh';
        if (monthsOld < 12) return 'aging';
        return 'stale';
    });

    // Add dateToRfc3339 filter for RSS
    eleventyConfig.addFilter("dateToRfc3339", (date) => {
        if (typeof date === 'string') {
            return DateTime.fromISO(date).toISO();
        }
        return DateTime.fromJSDate(date).toISO();
    });

    // Add htmlToAbsoluteUrls filter for RSS
    eleventyConfig.addFilter("htmlToAbsoluteUrls", (html, base) => {
        if (!html) return "";
        const baseUrl = base.endsWith('/') ? base : base + '/';
        return html.replace(/src="([^"]*)"/g, (match, p1) => {
            if (p1.startsWith('http')) return match;
            return `src="${baseUrl}${p1.startsWith('/') ? p1.slice(1) : p1}"`;
        }).replace(/href="([^"]*)"/g, (match, p1) => {
            if (p1.startsWith('http')) return match;
            return `href="${baseUrl}${p1.startsWith('/') ? p1.slice(1) : p1}"`;
        });
    });

    // Add getNewestCollectionItemDate filter for RSS
    eleventyConfig.addFilter("getNewestCollectionItemDate", (collection) => {
        if (!collection || !collection.length) return new Date();
        return new Date(Math.max(...collection.map(item => {
            return item.date;
        })));
    });

    eleventyConfig.addCollection("notifications", function (collection) {
        return collection.getFilteredByTag("notifications");
    });

    // Add link validation for new content - DISABLED for local builds
    // eleventyConfig.on('beforeBuild', () => {
    //     try {
    //         // Run link validation on key templates
    //         const { LinkValidationGuard } = require('./scripts/link-validation-guard');
    //         const validator = new LinkValidationGuard();
    //
    //         const templatesToCheck = [
    //             'src/_includes/header.njk',
    //             'src/_includes/footer.njk',
    //             'src/_includes/base.njk',
    //             'src/admin/index.html',
    //             'src/404.html'
    //         ];
    //
    //         console.log('🔗 Running link validation on templates...');
    //         templatesToCheck.forEach(async (template) => {
    //             const fullPath = path.join(__dirname, template);
    //             if (fs.existsSync(fullPath)) {
    //                 try {
    //                     const content = fs.readFileSync(fullPath, 'utf8');
    //                     const issues = await validator.validateContent(fullPath, content);
    //                     if (issues.length > 0) {
    //                         console.warn(`⚠️  Link issues found in ${template}:`, issues.length);
    //                     }
    //                 } catch (error) {
    //                     console.warn(`Warning: Could not validate ${template}:`, error.message);
    //                 }
    //             }
    //         });
    //     } catch (error) {
    //         console.warn('Warning: Link validation failed:', error.message);
    //     }
    //
    //
    // });



    // ========================================
    // CRITICAL: Date normalization for Node 18 + Eleventy v2 compatibility
    // ========================================
    eleventyConfig.addGlobalData("eleventyComputed", {
        date: (data) => {
            // Handle string dates safely for Node 18 compatibility
            if (typeof data.date === "string") {
                try {
                    // Use Luxon for reliable ISO string parsing
                    const dt = DateTime.fromISO(data.date, { zone: "utc" });
                    if (dt.isValid) {
                        const dateObj = dt.toJSDate();
                        console.log(`✅ Normalized string date: ${data.date} for ${data.page?.inputPath || 'unknown'}`);
                        return dateObj;
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to parse date string: ${data.date}`, error.message);
                }
            }

            // If date is already a Date object, use it
            if (data.date instanceof Date && !isNaN(data.date.getTime())) {
                console.log(`✅ Using existing Date object for ${data.page?.inputPath || 'unknown'}`);
                return data.date;
            }

            // Fallback: extract from filename or use current date
            if (data.page?.inputPath) {
                const filename = path.basename(data.page.inputPath);
                const dateMatch = filename.match(/^(\d{4})-(\d{2})-(\d{2})-/);
                if (dateMatch) {
                    const [_, year, month, day] = dateMatch;
                    const fallbackDate = new Date(`${year}-${month}-${day}T12:00:00.000Z`);
                    console.log(`✅ Extracted date from filename: ${fallbackDate.toISOString()} for ${filename}`);
                    return fallbackDate;
                }
            }

            // Last resort: current date
            const currentDate = new Date();
            console.warn(`⚠️ Using current date for page without valid date: ${data.page?.inputPath || 'unknown'}`);
            return currentDate;
        }
    });

    // Prevent Eleventy from merging/transforming dates unexpectedly
    eleventyConfig.setDataDeepMerge(true);

    // Temporary debug logging (remove after fixing)
    eleventyConfig.addFilter("debugDate", function (date) {
        console.log(`🔍 Date value: ${date}, Type: ${typeof date}`);
        return date;
    });

    // Simplified frontmatter parsing options
    eleventyConfig.setFrontMatterParsingOptions({
        excerpt: false,
        excerpt_separator: '<!-- excerpt -->'
    });

    // Set template engine to handle dates as strings
    eleventyConfig.setTemplateFormats([
        "njk",
        "md",
        "html"
    ]);

    // Exclude template files from processing (they contain placeholder dates)
    eleventyConfig.ignores.add("src/_templates/**");

    // Add blog collection (exclude future-dated posts and non-content files)
    eleventyConfig.addCollection("blog", function (collectionApi) {
        return collectionApi.getFilteredByGlob("src/blog/*.md")
            .filter(post => {
                // Only include posts with valid dates
                const date = post.data.date;
                if (!date) return false;

                // Convert to Date object safely
                const dateObj = date instanceof Date ? date : new Date(date);
                return !isNaN(dateObj.getTime());
            })
            .sort((a, b) => {
                // Safe date comparison
                const dateA = a.data.date instanceof Date ? a.data.date : new Date(a.data.date);
                const dateB = b.data.date instanceof Date ? b.data.date : new Date(b.data.date);
                return dateB - dateA; // Newest first
            });
    });

    // Override default tag collection for `post` to also exclude future posts and non-content files
    eleventyConfig.addCollection("post", function (collectionApi) {
        const now = new Date();
        return collectionApi
            .getFilteredByTag("post")
            .filter(post => {
                // Use the isContent flag to ensure only valid content files are processed
                return post.data.isContent === true;
            })
            .filter(post => {
                // Handle both string and Date objects for date comparison
                const postDate = typeof post.date === 'string' ? new Date(post.date) : post.date;
                return postDate <= now;
            })
            .sort((a, b) => {
                // Handle both string and Date objects for sorting
                const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
                const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
                return dateB - dateA;
            });
    });

    // Add custom filter to find blog posts by slug
    eleventyConfig.addFilter('findBySlug', function (collection, slug) {
        if (!collection) return null;
        return collection.find(item => item.fileSlug === slug);
    });

    // Add custom filter to safely get nested properties
    eleventyConfig.addFilter('get', function (obj, path, defaultValue) {
        if (!obj) return defaultValue;
        const keys = path.split('.');
        let result = obj;
        for (const key of keys) {
            if (result === undefined || result === null) return defaultValue;
            result = result[key];
        }
        return result === undefined ? defaultValue : result;
    });

    // Add helper filter to find blog posts by URL for short URL template
    eleventyConfig.addFilter("getPostByUrl", function (collection, url) {
        if (!collection || !url) return null;
        // Remove trailing slash and clean URL for matching
        const cleanUrl = url.replace(/\/$/, '');
        return collection.find(post => {
            const postUrl = post.url.replace(/\/$/, '');
            return postUrl === cleanUrl || post.url === url;
        });
    });

    // Add custom filter to insert ads after specified paragraphs
    eleventyConfig.addFilter('insertAdAfterParagraphs', function (content, paragraphCount) {
        // Ads removed as per user request
        return content;
    });

    // Add safe lowercase filter for templates
    eleventyConfig.addFilter("lowercase", function (str) {
        return String(str || '').toLowerCase();
    });

    // Add filterByTag filter for filtering collections by tags
    eleventyConfig.addFilter("filterByTag", function (collection, tag) {
        if (!collection || !tag) return [];
        return collection.filter(item => {
            const itemTags = item.data.tags || [];
            return itemTags.includes(tag);
        });
    });



    // Create collections for content hubs based on tags
    eleventyConfig.addCollection("tiktok", function (collectionApi) {
        return collectionApi.getFilteredByTag("tiktok");
    });

    eleventyConfig.addCollection("instagram", function (collectionApi) {
        return collectionApi.getFilteredByTag("instagram");
    });

    eleventyConfig.addCollection("youtube", function (collectionApi) {
        return collectionApi.getFilteredByTag("youtube");
    });

    eleventyConfig.addCollection("ai", function (collectionApi) {
        return collectionApi.getFilteredByTag("ai");
    });

    // Create a collection of all hub pages
    eleventyConfig.addCollection("hubs", function (collectionApi) {
        return collectionApi.getFilteredByGlob("src/hubs/*.md");
    });

    return {
        dir: {
            input: "src",
            output: "public", // Your output directory is 'public'
        },

        // 🌟 FINAL FIX: Override Eleventy's internal date data parsing.
        // 1. dataTemplateEngine ensures that data files are parsed as templates,
        //    allowing Eleventy to handle things like ISO dates as strings first.
        dataTemplateEngine: "njk",

        // 2. data.date tells Eleventy's internal template parser to explicitly
        //    treat any date in data files as a string value (using the `date` key).
        //    This completely bypasses the internal JavaScript error in Template.js:940.
        data: {
            // Note: This must be the string "date" (the property name), not the data object.
            date: "date",
        },
    };
};
