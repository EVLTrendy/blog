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
        description: "Blog for EvolvedLotus - Tech, Tutorials, and More.", // Default site description for SEO
        author: "EvolvedLotus", // Your blog's author or organization name
        twitter: "evolvedlotus", // Your Twitter handle without the @ (e.g., "myhandle" if your handle is @myhandle)
        // Optional: Uncomment and set a default image for social sharing if you have one
        // This image will be used if a specific post doesn't have its own 'image' in front matter
        // image: "/assets/images/default-social-share.jpg", // Example path: ensure this image exists in your /src/assets/images/ folder
        // lang: "en", // Default language for your content
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

    // Add blog collection
    eleventyConfig.addCollection("blog", function(collectionApi) {
        return collectionApi.getFilteredByGlob("src/blog/*.md").sort((a, b) => {
            return b.date - a.date;
        });
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

    return {
        dir: {
            input: "src",
            output: "public", // Your output directory is 'public'
        },
    };
};