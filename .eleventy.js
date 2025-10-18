const { DateTime } = require("luxon");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Require the eleventy-plugin-seo plugin
const pluginSEO = require("eleventy-plugin-seo");



module.exports = function (eleventyConfig) {
    // Passthrough copies
    eleventyConfig.addPassthroughCopy('./src/style.css');
    eleventyConfig.addPassthroughCopy('./src/fonts.css');
    eleventyConfig.addPassthroughCopy('./src/assets');
    eleventyConfig.addPassthroughCopy('./src/admin');
    eleventyConfig.addPassthroughCopy('./src/.well-known');
    eleventyConfig.addPassthroughCopy('./src/_redirects');
    eleventyConfig.addPassthroughCopy('./src/robots.txt');

    // 2. Add the eleventy-plugin-seo plugin configuration
    // IMPORTANT: Make sure to set your actual blog URL for 'url'
    eleventyConfig.addPlugin(pluginSEO, {
        url: "https://blog.evolvedlotus.com", // <--- THIS IS YOUR BLOG'S BASE URL!
        title: "EvolvedLotus Blog", // Default site title for your blog
        description: "Blog for EvolvedLotus - Tech, Tutorials, and More. Your ultimate guide to content creation, social media marketing, and digital success.", // Enhanced default site description for SEO
        author: "EvolvedLotus", // Your blog's author or organization name
        twitter: "evolvedlotus", // Your Twitter handle without the @ (e.g., "myhandle" if your handle is @myhandle)
        // Enhanced default image for social sharing - will be used if a specific post doesn't have its own 'image' in front matter
        image: "/assets/blog/default-social-share.png", // Default social sharing image
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
            openGraphType: "website",
            includeOpenGraph: true,
            includeTwitterCard: true,
            includeJSONLD: true,
            includeSchema: true
        }
    });

    // Date filter
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

    eleventyConfig.addCollection("notifications", function(collection) {
        return collection.getFilteredByTag("notifications");
    });

    // Add short URL generation for new posts
    eleventyConfig.on('beforeBuild', () => {
        try {
            // Run the short URL generator script
            require('./scripts/generate-short-urls.js');
        } catch (error) {
            console.warn('Warning: Short URL generation failed:', error.message);
            // Continue build even if short URL generation fails
        }
    });

    // Add short URL collection
    eleventyConfig.addCollection('shortUrls', function(collectionApi) {
        try {
            const shortUrlsData = require('./src/_data/shortUrls.json');
            return shortUrlsData;
        } catch (error) {
            console.warn('Warning: Could not load shortUrls.json:', error.message);
            return {};
        }
    });

    // Add short URL redirect template
    eleventyConfig.addPassthroughCopy({
        'src/_includes/short-url-preview.njk': 'r/:shortUrl/index.html'
    });

    // Add blog collection (exclude future-dated posts)
    eleventyConfig.addCollection("blog", function(collectionApi) {
        const now = new Date();
        return collectionApi
            .getFilteredByGlob("src/blog/*.md")
            .filter(post => post.date <= now)
            .sort((a, b) => b.date - a.date);
    });

    // Override default tag collection for `post` to also exclude future posts
    eleventyConfig.addCollection("post", function(collectionApi) {
        const now = new Date();
        return collectionApi
            .getFilteredByTag("post")
            .filter(post => post.date <= now)
            .sort((a, b) => b.date - a.date);
    });

    // Add custom filter to find blog posts by slug
    eleventyConfig.addFilter('findBySlug', function(collection, slug) {
        if (!collection) return null;
        return collection.find(item => item.fileSlug === slug);
    });

    // Add custom filter to safely get nested properties
    eleventyConfig.addFilter('get', function(obj, path, defaultValue) {
        if (!obj) return defaultValue;
        const keys = path.split('.');
        let result = obj;
        for (const key of keys) {
            if (result === undefined || result === null) return defaultValue;
            result = result[key];
        }
        return result === undefined ? defaultValue : result;
    });

    // Add custom filter to insert ads after specified paragraphs
    eleventyConfig.addFilter('insertAdAfterParagraphs', function(content, paragraphCount) {
        if (!content || typeof content !== 'string') return content;

        // Split content by paragraph tags
        const paragraphs = content.split(/(<\/p>)/i);

        if (paragraphs.length < paragraphCount * 2) {
            return content; // Not enough paragraphs
        }

        // Insert ad after specified paragraph count
        const insertPoint = paragraphCount * 2; // Each paragraph has opening and closing tags
        const adContainer = `
        <div class="ad-container in-content-ad">
            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7311583434347173"
             crossorigin="anonymous"></script>
            <ins class="adsbygoogle"
                 style="display:block; text-align:center;"
                 data-ad-layout="in-article"
                 data-ad-format="fluid"
                 data-ad-client="ca-pub-7311583434347173"
                 data-ad-slot="8410078957"></ins>
            <script>
                 (adsbygoogle = window.adsbygoogle || []).push({});
            </script>
        </div>`;

        paragraphs.splice(insertPoint, 0, adContainer);

        return paragraphs.join('');
    });



    return {
        dir: {
            input: "src",
            output: "public", // Your output directory is 'public'
        },
    };
};
