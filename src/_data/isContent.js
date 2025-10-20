// src/_data/isContent.js

module.exports = {
  // Define a computed property for all data objects (pages).
  // This is a safety check for the collections and sorting logic.
  isContent: data => {
    // 1. Check if the file has a common Eleventy content extension.
    // 2. Check if a 'date' property actually exists and is not null/undefined.
    //    We check for the object type because by this point it *should* be a Date object.
    const isMarkdown = data.page && data.page.inputPath && data.page.inputPath.endsWith('.md');
    const hasDateObject = data.date && (data.date instanceof Date);

    // Return true only if it looks like a valid blog post.
    return isMarkdown && hasDateObject;
  }
};
