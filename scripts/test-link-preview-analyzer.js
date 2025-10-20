#!/usr/bin/env node

/**
 * Test script for Link Preview Analyzer
 * Tests the analyzer with various scenarios including missing meta tags
 */

const {
  fetchHTML,
  extractMetaTags,
  validatePlatform,
  analyzeLinkPreview,
  formatResults,
  PLATFORM_REQUIREMENTS
} = require('./link-preview-analyzer.js');

/**
 * Creates a test HTML with missing meta tags
 */
function createTestHTML(missingTags = []) {
  const allTags = {
    'og:title': 'Test Article Title',
    'og:description': 'This is a test description for the article',
    'og:image': 'https://example.com/image.jpg',
    'og:url': 'https://example.com/article',
    'og:type': 'article',
    'og:site_name': 'Test Site',
    'twitter:card': 'summary_large_image',
    'twitter:title': 'Test Article Title',
    'twitter:description': 'This is a test description for the article',
    'twitter:image': 'https://example.com/image.jpg',
    'twitter:site': '@testsite'
  };

  // Remove specified missing tags
  missingTags.forEach(tag => delete allTags[tag]);

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Article Title</title>`;

  // Add meta tags that are present
  Object.entries(allTags).forEach(([property, content]) => {
    html += `\n    <meta property="${property}" content="${content}">`;
    if (property.startsWith('twitter:') || property.startsWith('og:')) {
      html += `\n    <meta name="${property}" content="${content}">`;
    }
  });

  html += `
</head>
<body>
    <h1>Test Article</h1>
    <p>This is test content</p>
</body>
</html>`;

  return html;
}

/**
 * Test with missing meta tags
 */
async function testMissingTags() {
  console.log('\n🧪 Testing with missing meta tags...\n');

  // Test 1: Missing og:image
  const test1HTML = createTestHTML(['og:image', 'twitter:image']);
  const test1MetaTags = extractMetaTags(test1HTML);
  const test1Analysis = analyzeLinkPreview(test1MetaTags);
  formatResults(test1Analysis, 'Test URL (missing og:image)');

  // Test 2: Missing og:title and og:description
  const test2HTML = createTestHTML(['og:title', 'og:description', 'twitter:title', 'twitter:description']);
  const test2MetaTags = extractMetaTags(test2HTML);
  const test2Analysis = analyzeLinkPreview(test2MetaTags);
  formatResults(test2Analysis, 'Test URL (missing titles and descriptions)');

  // Test 3: Missing twitter:card
  const test3HTML = createTestHTML(['twitter:card']);
  const test3MetaTags = extractMetaTags(test3HTML);
  const test3Analysis = analyzeLinkPreview(test3MetaTags);
  formatResults(test3Analysis, 'Test URL (missing twitter:card)');
}

/**
 * Test with real URLs that might have issues
 */
async function testRealURLs() {
  const testUrls = [
    'https://example.com', // Should fail - basic HTML site
    'https://httpbin.org/html', // Should have basic meta tags
  ];

  for (const url of testUrls) {
    try {
      console.log(`\n🌐 Testing real URL: ${url}`);
      const html = await fetchHTML(url);
      const metaTags = extractMetaTags(html);
      const analysis = analyzeLinkPreview(metaTags);
      formatResults(analysis, url);
    } catch (error) {
      console.log(`❌ Failed to test ${url}: ${error.message}`);
    }
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🧪 Link Preview Analyzer - Test Suite');
  console.log('=' .repeat(50));

  // Test with simulated missing tags
  await testMissingTags();

  // Test with real URLs
  await testRealURLs();

  console.log('\n✅ Test suite completed!');
}

// Run tests if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createTestHTML,
  testMissingTags,
  testRealURLs
};
