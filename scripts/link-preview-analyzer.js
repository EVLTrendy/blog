#!/usr/bin/env node

/**
 * Link Preview Analyzer
 * Checks if link previews (Open Graph, Twitter Cards, etc.) work across major platforms
 * for both main URLs and short URLs.
 *
 * Usage: node scripts/link-preview-analyzer.js [url] [short-url]
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const { JSDOM } = require('jsdom');

// Platform-specific meta tag requirements
const PLATFORM_REQUIREMENTS = {
  'Open Graph': {
    required: ['og:title', 'og:description', 'og:image', 'og:url'],
    recommended: ['og:type', 'og:site_name', 'og:locale'],
    optional: ['og:image:width', 'og:image:height', 'og:image:alt']
  },
  'Twitter Cards': {
    required: ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'],
    recommended: ['twitter:site', 'twitter:creator'],
    optional: ['twitter:image:alt']
  },
  'Facebook': {
    required: ['og:title', 'og:description', 'og:image'],
    recommended: ['og:url', 'og:type'],
    optional: ['fb:app_id']
  },
  'LinkedIn': {
    required: ['og:title', 'og:description', 'og:image'],
    recommended: ['og:url'],
    optional: ['linkedin:owner', 'linkedin:page']
  },
  'WhatsApp': {
    required: ['og:title', 'og:description', 'og:image'],
    recommended: ['og:url'],
    optional: ['whatsapp:image', 'whatsapp:title', 'whatsapp:description']
  },
  'Telegram': {
    required: ['og:title', 'og:description', 'og:image'],
    recommended: ['og:url'],
    optional: ['telegram:image', 'telegram:title', 'telegram:description']
  },
  'Discord': {
    required: ['og:title', 'og:description', 'og:image'],
    recommended: ['og:url'],
    optional: ['discord:embed', 'discord:embed:title', 'discord:embed:description', 'discord:embed:image']
  },
  'Pinterest': {
    required: ['og:image'],
    recommended: ['og:title', 'og:description'],
    optional: ['pinterest-rich-pin']
  },
  'Reddit': {
    required: ['og:title', 'og:description'],
    recommended: ['og:image', 'og:url'],
    optional: ['reddit:card']
  }
};

/**
 * Fetches HTML content from a URL
 */
function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching: ${url}`));
    });
  });
}

/**
 * Extracts meta tags from HTML content
 */
function extractMetaTags(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const metaTags = {};

  // Extract all meta tags
  const metaElements = document.querySelectorAll('meta');

  metaElements.forEach(meta => {
    let property = meta.getAttribute('property') || meta.getAttribute('name');
    let content = meta.getAttribute('content');

    if (property && content) {
      // Handle both og: and twitter: prefixed tags
      if (property.startsWith('og:') || property.startsWith('twitter:') ||
          property.startsWith('fb:') || property.startsWith('linkedin:') ||
          property.startsWith('whatsapp:') || property.startsWith('telegram:') ||
          property.startsWith('discord:') || property.startsWith('pinterest:') ||
          property.startsWith('reddit:')) {
        metaTags[property] = content;
      }
    }
  });

  // Also extract title tag
  const titleElement = document.querySelector('title');
  if (titleElement) {
    metaTags['title'] = titleElement.textContent.trim();
  }

  // Extract canonical URL
  const canonicalElement = document.querySelector('link[rel="canonical"]');
  if (canonicalElement) {
    metaTags['canonical'] = canonicalElement.getAttribute('href');
  }

  return metaTags;
}

/**
 * Validates meta tags for a specific platform
 */
function validatePlatform(metaTags, platform) {
  const requirements = PLATFORM_REQUIREMENTS[platform];
  if (!requirements) {
    return { valid: false, error: `Unknown platform: ${platform}` };
  }

  const results = {
    platform,
    valid: true,
    present: [],
    missing: [],
    warnings: []
  };

  // Check required tags
  requirements.required.forEach(tag => {
    if (metaTags[tag]) {
      results.present.push(tag);
    } else {
      results.missing.push(tag);
      results.valid = false;
    }
  });

  // Check recommended tags
  requirements.recommended.forEach(tag => {
    if (!metaTags[tag]) {
      results.warnings.push(`Recommended tag missing: ${tag}`);
    } else {
      results.present.push(tag);
    }
  });

  // Check optional tags (just for completeness)
  requirements.optional.forEach(tag => {
    if (metaTags[tag]) {
      results.present.push(tag);
    }
  });

  return results;
}

/**
 * Analyzes link preview compatibility for all platforms
 */
function analyzeLinkPreview(metaTags) {
  const results = {};

  Object.keys(PLATFORM_REQUIREMENTS).forEach(platform => {
    results[platform] = validatePlatform(metaTags, platform);
  });

  return results;
}

/**
 * Formats analysis results in the required format
 */
function formatResults(analysis, url) {
  console.log(`\n🔍 Link Preview Analysis for: ${url}`);
  console.log('=' .repeat(60));

  Object.entries(analysis).forEach(([platform, result]) => {
    const status = result.valid ? '✅ yes' : '❌ no';
    console.log(`${platform}: ${status}`);

    if (!result.valid && result.missing.length > 0) {
      console.log(`  Missing required tags: ${result.missing.join(', ')}`);
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        console.log(`  ⚠️  ${warning}`);
      });
    }
  });

  // Summary
  const validPlatforms = Object.values(analysis).filter(r => r.valid).length;
  const totalPlatforms = Object.keys(analysis).length;

  console.log('\n📊 Summary:');
  console.log(`Valid platforms: ${validPlatforms}/${totalPlatforms}`);
  console.log(`Success rate: ${Math.round((validPlatforms / totalPlatforms) * 100)}%`);

  return analysis;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/link-preview-analyzer.js [url] [short-url]');
    console.log('Example: node scripts/link-preview-analyzer.js https://example.com https://bit.ly/abc123');
    process.exit(1);
  }

  const mainUrl = args[0];
  const shortUrl = args[1];

  try {
    // Validate URLs
    try {
      new URL(mainUrl);
    } catch (e) {
      throw new Error(`Invalid main URL: ${mainUrl}`);
    }

    if (shortUrl) {
      try {
        new URL(shortUrl);
      } catch (e) {
        throw new Error(`Invalid short URL: ${shortUrl}`);
      }
    }

    // Analyze main URL
    console.log('\n🚀 Analyzing main URL...');
    const mainHTML = await fetchHTML(mainUrl);
    const mainMetaTags = extractMetaTags(mainHTML);
    const mainAnalysis = analyzeLinkPreview(mainMetaTags);
    formatResults(mainAnalysis, mainUrl);

    // Analyze short URL if provided
    if (shortUrl) {
      console.log('\n🔗 Analyzing short URL...');
      const shortHTML = await fetchHTML(shortUrl);
      const shortMetaTags = extractMetaTags(shortHTML);
      const shortAnalysis = analyzeLinkPreview(shortMetaTags);
      formatResults(shortAnalysis, shortUrl);

      // Compare results
      console.log('\n🔄 Comparison:');
      Object.keys(PLATFORM_REQUIREMENTS).forEach(platform => {
        const mainValid = mainAnalysis[platform].valid;
        const shortValid = shortAnalysis[platform].valid;

        if (mainValid && !shortValid) {
          console.log(`⚠️  ${platform}: Main URL ✅, Short URL ❌`);
        } else if (!mainValid && shortValid) {
          console.log(`⚠️  ${platform}: Main URL ❌, Short URL ✅`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments and execute
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  fetchHTML,
  extractMetaTags,
  validatePlatform,
  analyzeLinkPreview,
  formatResults,
  PLATFORM_REQUIREMENTS
};
