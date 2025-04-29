const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
    // Passthrough copies
    eleventyConfig.addPassthroughCopy('./src/style.css');
    eleventyConfig.addPassthroughCopy('./src/fonts.css');
    eleventyConfig.addPassthroughCopy('./src/assets');
    eleventyConfig.addPassthroughCopy('./src/admin');
    eleventyConfig.addPassthroughCopy('./src/.well-known');
    eleventyConfig.addPassthroughCopy('./src/_redirects');

    // Date filter
    eleventyConfig.addFilter("postDate", (dateObj) => {
        // Check if dateObj is a Date object
        if (!(dateObj instanceof Date)) {
            console.error("Invalid date object:", dateObj);
            return "Invalid Date";
        }

        // Format the date using Luxon
        return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
    });

    return {
        dir: {
            input: "src",
            output: "public",
        },
    };
};
