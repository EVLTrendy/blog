const { DateTime } = require("luxon");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Require the eleventy-plugin-seo plugin
const pluginSEO = require("eleventy-plugin-seo");
const i18n = require('eleventy-plugin-i18n');
const translations = require('./src/_data/translations.js');

// Custom frontmatter parser to ensure dates remain as strings
const matter = require('gray-matter');

// ========================================
// CRITICAL: Date normalization cascade
// This runs BEFORE Eleventy processes dates
// ========================================



module.exports = function (eleventyConfig) {
    // Passthrough copies
    eleventyConfig.addPassthroughCopy('./src/style.css');
    eleventyConfig.addPassthroughCopy('./src/print.css');
    eleventyConfig.addPassthroughCopy('./src/enhancements.css');
    eleventyConfig.addPassthroughCopy('./src/layout-fixes.css');
    eleventyConfig.addPassthroughCopy('./src/ux-enhancements.css');
    eleventyConfig.addPassthroughCopy('./src/conversion-components.css');
    eleventyConfig.addPassthroughCopy('./src/fonts.css');
    eleventyConfig.addPassthroughCopy('./src/dark-mode.css');
    eleventyConfig.addPassthroughCopy('./src/homepage-fixes.css');
    eleventyConfig.addPassthroughCopy('./src/homepage-carousel.css');
    eleventyConfig.addPassthroughCopy('./src/article-layout.css');
    eleventyConfig.addPassthroughCopy('./src/landing-page.css');
    eleventyConfig.addPassthroughCopy('./src/assets');
    eleventyConfig.addPassthroughCopy('./src/admin');
    eleventyConfig.addPassthroughCopy('./src/.well-known');
    eleventyConfig.addPassthroughCopy('./src/_redirects');
    eleventyConfig.addPassthroughCopy('./src/robots.txt');
    eleventyConfig.addPassthroughCopy('./src/resources');
    eleventyConfig.addPassthroughCopy('./src/manifest.json');
    eleventyConfig.addPassthroughCopy('./src/sw.js');
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

    // i18n Plugin Configuration
    eleventyConfig.addPlugin(i18n, {
        translations,
        fallbackLocales: {
            '*': 'en'
        }
    });

    // Date normalization filter for frontmatter dates
    eleventyConfig.addFilter("normalizeDate", (dateStr) => {
        if (!dateStr) return new Date();
        // Strip extra quotes if present
        if (typeof dateStr === 'string') {
            dateStr = dateStr.replace(/^['"]+|['"]+$/g, '');
        }
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
                dateObj = dateObj.replace(/^['"]+|['"]+$/g, '');
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
            date = date.replace(/^['"]+|['"]+$/g, '');
            return DateTime.fromISO(date).toISO();
        }
        return DateTime.fromJSDate(date).toISO();
    });

    // Add limit filter for array limiting
    eleventyConfig.addFilter("limit", function (arr, limit) {
        return arr.slice(0, limit);
    });

    // Add slice filter for array slicing
    eleventyConfig.addFilter("slice", function (arr, start, end) {
        return arr.slice(start, end);
    });

    // Generic date formatting filter (luxon)
    eleventyConfig.addFilter("date", (value = new Date(), format = "yyyy-LL-dd") => {
        let dateObj;
        if (value === "now") {
            dateObj = new Date();
        } else if (value instanceof Date) {
            dateObj = value;
        } else {
            // Strip quotes
            if (typeof value === 'string') value = value.replace(/^['"]+|['"]+$/g, '');
            dateObj = new Date(value);
        }
        return DateTime.fromJSDate(dateObj).toFormat(format);
    });

    // Content Freshness Filter
    eleventyConfig.addFilter("contentAge", (date, lastModified) => {
        let checkDate = lastModified || date;
        if (!checkDate) return 'unknown';

        if (typeof checkDate === 'string') {
            checkDate = checkDate.replace(/^['"]+|['"]+$/g, '');
            checkDate = new Date(checkDate);
        }

        const now = new Date();
        const monthsOld = (now - checkDate) / (1000 * 60 * 60 * 24 * 30);

        if (monthsOld < 6) return 'fresh';
        if (monthsOld < 12) return 'aging';
        return 'stale';
    });

    // Add dateToRfc3339 filter for RSS
    eleventyConfig.addFilter("dateToRfc3339", (date) => {
        if (typeof date === 'string') {
            date = date.replace(/^['"]+|['"]+$/g, '');
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

    // ========================================
    // CRITICAL: Date normalization for Node 18 + Eleventy v2 compatibility
    // ========================================
    eleventyConfig.addGlobalData("eleventyComputed", {
        date: (data) => {
            // Handle string dates safely for Node 18 compatibility
            if (typeof data.date === "string") {
                try {
                    // Strip extra quotes
                    const cleanDate = data.date.replace(/^['"]+|['"]+$/g, '');
                    // Use Luxon for reliable ISO string parsing
                    const dt = DateTime.fromISO(cleanDate, { zone: "utc" });
                    if (dt.isValid) {
                        const dateObj = dt.toJSDate();
                        console.log(`✅ Normalized string date: ${cleanDate} for ${data.page?.inputPath || 'unknown'}`);
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

    // CloudCannon CMS Configuration
    eleventyConfig.addGlobalData("cloudcannon", {
        app_id: "blog-evolved-lotus"
    });

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
                let dateObj = date;
                if (typeof date === 'string') {
                    dateObj = new Date(date.replace(/^['"]+|['"]+$/g, ''));
                }

                return !isNaN(dateObj.getTime());
            })
            .sort((a, b) => {
                // Safe date comparison
                let dateA = a.data.date;
                let dateB = b.data.date;

                if (typeof dateA === 'string') dateA = new Date(dateA.replace(/^['"]+|['"]+$/g, ''));
                if (typeof dateB === 'string') dateB = new Date(dateB.replace(/^['"]+|['"]+$/g, ''));

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

    // Add filterByCategory filter for filtering collections by tags (blog posts use tags, not category field)
    eleventyConfig.addFilter("filterByCategory", function (collection, category) {
        if (!collection || !category) return [];
        return collection.filter(item => {
            // Check the primary category field first (if it exists)
            const itemCategory = item.data.category;
            if (itemCategory === category) return true;

            // Main check: look in tags array (this is what blog posts actually use)
            const itemTags = item.data.tags || [];

            // Map common category names to their tag equivalents
            const categoryTagMap = {
                'social-media': ['social-media', 'ig', 'twitter', 'tiktok', 'facebook', 'link'],
                'content-creation': ['content-creation', 'misc', 'featured'],
                'seo': ['seo', 'analytics'],
                'strategy': ['strategy', 'digital-strategy'],
                'tools': ['tools', 'automation'],
                'growth': ['growth', 'growth-hacking']
            };

            // Check if any of the mapped tags exist in the item's tags
            const mappedTags = categoryTagMap[category] || [category];
            return itemTags.some(tag => mappedTags.includes(tag));
        });
    });

    // Add reverse filter for reversing arrays
    eleventyConfig.addFilter("reverse", function (array) {
        if (!Array.isArray(array)) return array;
        return [...array].reverse();
    });

    // Add truncate filter for truncating strings
    eleventyConfig.addFilter("truncate", function (str, length = 100) {
        if (!str || typeof str !== 'string') return '';
        if (str.length <= length) return str;
        return str.substring(0, length).trim() + '...';
    });

    // Add dateFormat filter for formatting dates
    eleventyConfig.addFilter("dateFormat", function (date) {
        if (!date) return '';
        let dateObj = date;
        if (typeof date === 'string') {
            dateObj = new Date(date.replace(/^['\"]+|['\"]+$/g, ''));
        }
        if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
            return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
        }
        return '';
    });

    // Add series-related filters for content series navigation
    eleventyConfig.addFilter("filterBySeriesName", function (collection, seriesName) {
        if (!collection || !seriesName) return [];
        return collection.filter(item => {
            return item.data.series === seriesName;
        });
    });

    eleventyConfig.addFilter("sortBySeriesOrder", function (collection) {
        if (!collection) return [];
        return collection.sort((a, b) => {
            const orderA = a.data.seriesOrder || 0;
            const orderB = b.data.seriesOrder || 0;
            return orderA - orderB;
        });
    });

    eleventyConfig.addFilter("findIndexByUrl", function (collection, url) {
        if (!collection || !url) return -1;
        return collection.findIndex(item => item.url === url);
    });

    // Add filter to filter posts by author
    eleventyConfig.addFilter("filterByAuthor", function (collection, authorName) {
        if (!collection || !authorName) return [];
        return collection.filter(item => {
            return item.data.author === authorName;
        });
    });

    // Add filter to find author by name
    eleventyConfig.addFilter("findByName", function (collection, name) {
        if (!collection || !name) return null;
        return collection.find(item => {
            return item.data.name === name;
        });
    });

    // Check if a translation exists for a given URL and language
    eleventyConfig.addFilter("hasTranslation", function (url, lang, collection) {
        if (!url || !lang || !collection) return false;

        // Clean the URL to get the base path (remove existing lang prefix if any)
        let cleanUrl = url;
        if (cleanUrl.startsWith('/es/')) cleanUrl = cleanUrl.substring(3);
        else if (cleanUrl.startsWith('/fr/')) cleanUrl = cleanUrl.substring(3);

        // Construct expected URL
        let targetUrl = (lang === 'en') ? cleanUrl : `/${lang}${cleanUrl}`;

        // Ensure trailing slash consistency
        if (!targetUrl.endsWith('/')) targetUrl += '/';

        // Check if any page in the collection matches this URL
        return collection.some(item => {
            let itemUrl = item.url;
            if (!itemUrl) return false;
            if (!itemUrl.endsWith('/')) itemUrl += '/';
            return itemUrl === targetUrl;
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

    // Create authors collection
    eleventyConfig.addCollection("authors", function (collectionApi) {
        return collectionApi.getFilteredByGlob("src/authors/*.md");
    });

    // Create pages collection
    eleventyConfig.addCollection("pages", function (collectionApi) {
        return collectionApi.getFilteredByGlob("src/pages/*.md");
    });

    // Create tools collection
    eleventyConfig.addCollection("tools", function (collectionApi) {
        return collectionApi.getFilteredByGlob("src/tools/*.md");
    });

    // Create insights collection
    eleventyConfig.addCollection("insights", function (collectionApi) {
        return collectionApi.getFilteredByGlob("src/insights/*.md");
    });

    // What's Hot Collection (Rules-based)
    eleventyConfig.addCollection("whatsHot", function (collectionApi) {
        const posts = collectionApi.getFilteredByTag("post");
        // In a real implementation, this would read src/_data/whats-hot-rules
        // and apply scoring. For now, we simulate this by returning recent posts.
        return posts.slice(0, 5);
    });

    // Set default language
    eleventyConfig.addGlobalData("lang", "en");

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
