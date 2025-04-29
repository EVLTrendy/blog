const fs = require('fs');
const path = require('path');
const { NetlifyKV } = require('@netlify/functions');

const kv = new NetlifyKV('blog-short-urls');

// Function to generate a short ID from a blog post filename
function generateShortId(filename) {
  // Remove date and extension, take first 3 words and join with hyphens
  const words = filename
    .replace(/^\d{4}-\d{2}-\d{2}-/, '') // Remove date
    .replace(/\.md$/, '') // Remove .md extension
    .split('-')
    .slice(0, 3)
    .join('-');
  return words.toLowerCase();
}

async function initializeShortUrls() {
  const blogDir = 'C:/Users/xmarc/Documents/GitHub/blog/src/blog';
  
  try {
    const files = fs.readdirSync(blogDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const shortId = generateShortId(file);
        const postUrl = `https://blog.evolvedlotus.com/blog/${file.replace('.md', '')}`;
        await kv.set(shortId, postUrl);
        console.log(`Added short URL: ${shortId} -> ${postUrl}`);
      }
    }
    console.log('All blog posts have been added to the KV store!');
  } catch (error) {
    console.error('Error initializing short URLs:', error);
  }
}

initializeShortUrls(); 