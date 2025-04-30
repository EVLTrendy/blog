const { DateTime } = require("luxon");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = function (eleventyConfig) {
    // Passthrough copies
    eleventyConfig.addPassthroughCopy('./src/style.css');
    eleventyConfig.addPassthroughCopy('./src/fonts.css');
    eleventyConfig.addPassthroughCopy('./src/assets');
    eleventyConfig.addPassthroughCopy('./src/admin');
    eleventyConfig.addPassthroughCopy('./src/.well-known');
    eleventyConfig.addPassthroughCopy('./src/_redirects');
    eleventyConfig.addPassthroughCopy('./src/robots.txt');

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

    // Add absoluteUrl filter
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

    // Add custom filter to find blog posts by slug
    eleventyConfig.addFilter('findBySlug', function(collection, slug) {
        return collection.find(item => item.fileSlug === slug);
    });

    return {
        dir: {
            input: "src",
            output: "public",
        },
    };
};
