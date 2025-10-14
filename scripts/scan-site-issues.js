const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configuration
const SITE_URL = 'https://blog.evolvedlotus.com';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Issues tracking
const issues = {
  mobileFriendly: [],
  links: [],
  indexability: [],
  contentRelevance: [],
  duplicateContent: [],
  security: [],
  siteLevel: [],
  pageSpeed: [],
  socialMedia: [],
  codeValidation: []
};

// Utility functions
function getAllHtmlFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (item.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function extractTextContent(html) {
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent.trim();
}

function checkMobileFriendly(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const viewportTags = document.querySelectorAll('meta[name="viewport"]');

  if (viewportTags.length > 1) {
    issues.mobileFriendly.push({
      file: filePath,
      issue: 'Multiple viewport tags found',
      details: `${viewportTags.length} viewport tags detected`
    });
  }

  if (viewportTags.length === 0) {
    issues.mobileFriendly.push({
      file: filePath,
      issue: 'Missing viewport tag',
      details: 'No viewport meta tag found'
    });
  }

  // Check viewport content
  viewportTags.forEach(tag => {
    const content = tag.getAttribute('content');
    if (!content || !content.includes('width=device-width')) {
      issues.mobileFriendly.push({
        file: filePath,
        issue: 'Invalid viewport content',
        details: `Viewport content: ${content}`
      });
    }
  });
}

function checkLinks(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const links = document.querySelectorAll('a');

  links.forEach(link => {
    const href = link.getAttribute('href');
    const text = link.textContent.trim();

    // Check for empty links
    if (href === '#') {
      issues.links.push({
        file: filePath,
        issue: 'Empty anchor link',
        details: 'Link with href="#" found'
      });
    }

    // Check for missing anchor text
    if (!text || text.length < 3) {
      issues.links.push({
        file: filePath,
        issue: 'Missing or insufficient anchor text',
        details: `Link text: "${text}"`
      });
    }

    // Check for HTTP links that should be HTTPS
    if (href && href.startsWith('http://') && !href.includes('localhost')) {
      issues.siteLevel.push({
        file: filePath,
        issue: 'HTTP link should be HTTPS',
        details: `Link: ${href}`
      });
    }

    // Check for orphan URLs (links to non-existent pages)
    if (href && href.startsWith('/') && !href.startsWith('//')) {
      const fullPath = href.endsWith('/') ? href + 'index.html' : href + '/index.html';
      const localPath = path.join(PUBLIC_DIR, fullPath.replace(/^\//, ''));

      if (!fs.existsSync(localPath) && !fs.existsSync(path.join(PUBLIC_DIR, href.replace(/^\//, '')))) {
        issues.links.push({
          file: filePath,
          issue: 'Orphan URL - links to non-existent page',
          details: `Link: ${href}`
        });
      }
    }
  });
}

function checkIndexability(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Check for duplicate closing tags
  const bodyTags = document.querySelectorAll('body');
  const headTags = document.querySelectorAll('head');
  const htmlTags = document.querySelectorAll('html');

  if (bodyTags.length > 1) {
    issues.indexability.push({
      file: filePath,
      issue: 'Multiple body tags',
      details: `${bodyTags.length} body tags found`
    });
  }

  if (headTags.length > 1) {
    issues.indexability.push({
      file: filePath,
      issue: 'Multiple head tags',
      details: `${headTags.length} head tags found`
    });
  }

  if (htmlTags.length > 1) {
    issues.indexability.push({
      file: filePath,
      issue: 'Multiple html tags',
      details: `${htmlTags.length} html tags found`
    });
  }

  // Check for canonical tag
  const canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    issues.indexability.push({
      file: filePath,
      issue: 'Missing canonical tag',
      details: 'No canonical link found'
    });
  }

  // Check for robots meta tag
  const robots = document.querySelector('meta[name="robots"]');
  if (!robots) {
    issues.indexability.push({
      file: filePath,
      issue: 'Missing robots meta tag',
      details: 'No robots meta tag found'
    });
  }
}

function checkContentRelevance(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Check for H1 tag
  const h1Tags = document.querySelectorAll('h1');
  if (h1Tags.length === 0) {
    issues.contentRelevance.push({
      file: filePath,
      issue: 'Missing H1 tag',
      details: 'No H1 heading found'
    });
  } else if (h1Tags.length > 1) {
    issues.contentRelevance.push({
      file: filePath,
      issue: 'Multiple H1 tags',
      details: `${h1Tags.length} H1 tags found`
    });
  }

  // Check for H2 tags
  const h2Tags = document.querySelectorAll('h2');
  if (h2Tags.length === 0) {
    issues.contentRelevance.push({
      file: filePath,
      issue: 'Missing H2 tags',
      details: 'No H2 headings found'
    });
  }

  // Check for meta description
  const descriptions = document.querySelectorAll('meta[name="description"]');
  if (descriptions.length > 1) {
    issues.contentRelevance.push({
      file: filePath,
      issue: 'Multiple meta descriptions',
      details: `${descriptions.length} description meta tags found`
    });
  }

  if (descriptions.length === 1) {
    const content = descriptions[0].getAttribute('content');
    if (!content || content.length < 120 || content.length > 160) {
      issues.contentRelevance.push({
        file: filePath,
        issue: 'Suboptimal meta description length',
        details: `Description length: ${content ? content.length : 0} characters (optimal: 120-160)`
      });
    }
  }

  // Check for missing alt text
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    const alt = img.getAttribute('alt');
    if (!alt || alt.trim() === '') {
      issues.contentRelevance.push({
        file: filePath,
        issue: 'Missing alt text',
        details: `Image src: ${img.getAttribute('src')}`
      });
    }
  });

  // Check for HTML lang attribute
  const htmlTag = document.querySelector('html');
  if (!htmlTag || !htmlTag.getAttribute('lang')) {
    issues.contentRelevance.push({
      file: filePath,
      issue: 'Missing HTML lang attribute',
      details: 'HTML tag missing lang attribute'
    });
  }
}

function checkDuplicateContent(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const title = document.querySelector('title');
  const h1 = document.querySelector('h1');
  const metaDescription = document.querySelector('meta[name="description"]');

  if (title && h1) {
    if (title.textContent.trim() === h1.textContent.trim()) {
      issues.duplicateContent.push({
        file: filePath,
        issue: 'H1 matches title tag',
        details: `Title: "${title.textContent.trim()}" | H1: "${h1.textContent.trim()}"`
      });
    }
  }

  // Check for duplicate alt text
  const images = document.querySelectorAll('img');
  const altTexts = new Set();

  images.forEach(img => {
    const alt = img.getAttribute('alt');
    if (alt && altTexts.has(alt.trim())) {
      issues.duplicateContent.push({
        file: filePath,
        issue: 'Duplicate alt text',
        details: `Duplicate alt text: "${alt}"`
      });
    }
    if (alt) altTexts.add(alt.trim());
  });
}

function checkSecurity(html, filePath) {
  // Basic XSS protection checks
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi
  ];

  dangerousPatterns.forEach(pattern => {
    if (pattern.test(html)) {
      issues.security.push({
        file: filePath,
        issue: 'Potential XSS vulnerability',
        details: `Found pattern: ${pattern.source}`
      });
    }
  });
}

function checkPageSpeed(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Check for missing image dimensions
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.getAttribute('width') || !img.getAttribute('height')) {
      issues.pageSpeed.push({
        file: filePath,
        issue: 'Missing image dimensions',
        details: `Image src: ${img.getAttribute('src')}`
      });
    }
  });

  // Check for non-optimized image formats
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src && (src.includes('.png') || src.includes('.jpg') || src.includes('.jpeg'))) {
      // Could be optimized to WebP or AVIF
      issues.pageSpeed.push({
        file: filePath,
        issue: 'Non-optimized image format',
        details: `Image could be converted to WebP/AVIF: ${src}`
      });
    }
  });
}

function checkSocialMedia(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Check for Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');

  if (!ogTitle) {
    issues.socialMedia.push({
      file: filePath,
      issue: 'Missing Open Graph title',
      details: 'No og:title meta tag found'
    });
  }

  if (!ogDescription) {
    issues.socialMedia.push({
      file: filePath,
      issue: 'Missing Open Graph description',
      details: 'No og:description meta tag found'
    });
  }

  if (!ogImage) {
    issues.socialMedia.push({
      file: filePath,
      issue: 'Missing Open Graph image',
      details: 'No og:image meta tag found'
    });
  }

  // Check for Twitter Card tags
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  const twitterImage = document.querySelector('meta[name="twitter:image"]');

  if (!twitterTitle) {
    issues.socialMedia.push({
      file: filePath,
      issue: 'Missing Twitter Card title',
      details: 'No twitter:title meta tag found'
    });
  }

  if (!twitterDescription) {
    issues.socialMedia.push({
      file: filePath,
      issue: 'Missing Twitter Card description',
      details: 'No twitter:description meta tag found'
    });
  }

  if (!twitterImage) {
    issues.socialMedia.push({
      file: filePath,
      issue: 'Missing Twitter Card image',
      details: 'No twitter:image meta tag found'
    });
  }
}

function checkCodeValidation(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Check heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;

  headings.forEach(heading => {
    const currentLevel = parseInt(heading.tagName.charAt(1));

    if (currentLevel > previousLevel + 1 && previousLevel !== 0) {
      issues.codeValidation.push({
        file: filePath,
        issue: 'Broken heading hierarchy',
        details: `Skipped from H${previousLevel} to H${currentLevel}`
      });
    }

    previousLevel = currentLevel;
  });

  // Check for inline styles
  const inlineStyles = document.querySelectorAll('[style]');
  if (inlineStyles.length > 0) {
    issues.codeValidation.push({
      file: filePath,
      issue: 'Inline styles found',
      details: `${inlineStyles.length} elements with inline styles`
    });
  }

  // Check for tables without captions
  const tables = document.querySelectorAll('table');
  tables.forEach(table => {
    const caption = table.querySelector('caption');
    if (!caption) {
      issues.codeValidation.push({
        file: filePath,
        issue: 'Table missing caption',
        details: 'Table found without caption element'
      });
    }
  });
}

// Main scanning function
async function scanSite() {
  console.log('🔍 Starting site scan...');

  const htmlFiles = getAllHtmlFiles(PUBLIC_DIR);
  console.log(`📄 Found ${htmlFiles.length} HTML files to scan`);

  for (const filePath of htmlFiles) {
    try {
      const html = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(PUBLIC_DIR, filePath);

      console.log(`🔎 Scanning: ${relativePath}`);

      // Run all checks
      checkMobileFriendly(html, relativePath);
      checkLinks(html, relativePath);
      checkIndexability(html, relativePath);
      checkContentRelevance(html, relativePath);
      checkDuplicateContent(html, relativePath);
      checkSecurity(html, relativePath);
      checkPageSpeed(html, relativePath);
      checkSocialMedia(html, relativePath);
      checkCodeValidation(html, relativePath);

    } catch (error) {
      console.error(`❌ Error scanning ${filePath}:`, error.message);
    }
  }

  // Generate report
  generateReport();
}

function generateReport() {
  console.log('\n📊 SITE SCAN REPORT');
  console.log('==================');

  const totalIssues = Object.values(issues).reduce((total, category) => total + category.length, 0);

  if (totalIssues === 0) {
    console.log('✅ No issues found! Site is clean.');
    return;
  }

  // Display issues by category
  Object.entries(issues).forEach(([category, categoryIssues]) => {
    if (categoryIssues.length > 0) {
      console.log(`\n❌ ${category.toUpperCase()}: ${categoryIssues.length} issues`);

      categoryIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.file}`);
        console.log(`     ${issue.issue}: ${issue.details}`);
      });
    }
  });

  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'site-scan-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  console.log(`🔢 Total issues found: ${totalIssues}`);
}

// Fix functions for automated issue resolution
async function fixImageDimensions(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const images = document.querySelectorAll('img');

  let fixed = false;
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src && !img.getAttribute('width') && !img.getAttribute('height')) {
      // Add default dimensions for common image types
      if (src.includes('sigpfp.png') || src.includes('profile')) {
        img.setAttribute('width', '100');
        img.setAttribute('height', '100');
      } else if (src.includes('blog') && (src.includes('.png') || src.includes('.jpg'))) {
        img.setAttribute('width', '800');
        img.setAttribute('height', '400');
      } else {
        img.setAttribute('width', '300');
        img.setAttribute('height', '200');
      }
      fixed = true;
    }
  });

  if (fixed) {
    console.log(`✅ Fixed image dimensions in: ${filePath}`);
    return dom.serialize();
  }
  return html;
}

async function fixEmptyAnchorLinks(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const links = document.querySelectorAll('a');

  let fixed = false;
  links.forEach(link => {
    const href = link.getAttribute('href');

    if (href === '#') {
      // Replace empty anchor with a meaningful section or remove
      const parentSection = link.closest('section, div, article');
      if (parentSection) {
        const sectionId = parentSection.id || `section-${Math.random().toString(36).substr(2, 9)}`;
        parentSection.id = sectionId;
        link.setAttribute('href', `#${sectionId}`);
        link.textContent = link.textContent || 'Learn more';
        fixed = true;
      }
    }
  });

  if (fixed) {
    console.log(`✅ Fixed empty anchor links in: ${filePath}`);
    return dom.serialize();
  }
  return html;
}

async function fixMissingCanonical(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    // Create canonical URL based on file path
    const relativePath = path.relative(PUBLIC_DIR, filePath);
    const canonicalUrl = `${SITE_URL}/${relativePath.replace(/\\/g, '/').replace('index.html', '').replace(/\/$/, '')}`;

    const head = document.querySelector('head');
    if (head) {
      const canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      canonicalLink.href = canonicalUrl;
      head.appendChild(canonicalLink);
      console.log(`✅ Added canonical tag in: ${filePath}`);
      return dom.serialize();
    }
  }

  return html;
}

async function fixMissingH1(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const h1Tags = document.querySelectorAll('h1');
  if (h1Tags.length === 0) {
    // Get title or create a meaningful H1
    const title = document.querySelector('title');
    const titleText = title ? title.textContent.trim() : 'Page Title';

    // Find main content area or body
    const mainContent = document.querySelector('main, article, .content') || document.body;

    const h1 = document.createElement('h1');
    h1.textContent = titleText;
    mainContent.insertBefore(h1, mainContent.firstChild);

    console.log(`✅ Added missing H1 tag in: ${filePath}`);
    return dom.serialize();
  }

  return html;
}

async function fixMissingH2(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const h2Tags = document.querySelectorAll('h2');
  if (h2Tags.length === 0) {
    // Find main content area
    const mainContent = document.querySelector('main, article, .content') || document.body;

    const h2 = document.createElement('h2');
    h2.textContent = 'Overview';
    mainContent.appendChild(h2);

    console.log(`✅ Added missing H2 tag in: ${filePath}`);
    return dom.serialize();
  }

  return html;
}

async function fixMetaDescription(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const descriptions = document.querySelectorAll('meta[name="description"]');

  if (descriptions.length > 1) {
    // Remove extra descriptions, keep the first one
    for (let i = 1; i < descriptions.length; i++) {
      descriptions[i].remove();
    }
    console.log(`✅ Removed duplicate meta descriptions in: ${filePath}`);
    return dom.serialize();
  }

  if (descriptions.length === 1) {
    const content = descriptions[0].getAttribute('content');
    if (!content || content.length < 120 || content.length > 160) {
      // Generate a better description from content
      const textContent = extractTextContent(html);
      const words = textContent.split(/\s+/).slice(0, 25).join(' ');
      const newDescription = words.length > 120 ? words.substring(0, 157) + '...' : words;

      descriptions[0].setAttribute('content', newDescription);
      console.log(`✅ Fixed meta description length in: ${filePath}`);
      return dom.serialize();
    }
  }

  return html;
}

async function fixMissingLangAttribute(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const htmlTag = document.querySelector('html');
  if (htmlTag && !htmlTag.getAttribute('lang')) {
    htmlTag.setAttribute('lang', 'en');
    console.log(`✅ Added HTML lang attribute in: ${filePath}`);
    return dom.serialize();
  }

  return html;
}

async function fixInlineStyles(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Move inline styles to classes where possible
  const elementsWithStyle = document.querySelectorAll('[style]');
  let fixed = false;

  elementsWithStyle.forEach(element => {
    const style = element.getAttribute('style');
    if (style) {
      // Create a class name based on the styles
      const styleHash = Buffer.from(style).toString('base64').replace(/[+/=]/g, '').substring(0, 8);
      const className = `style-${styleHash}`;

      element.classList.add(className);
      element.removeAttribute('style');
      fixed = true;

      // Add CSS to head if it doesn't exist
      const head = document.querySelector('head');
      if (head) {
        let styleTag = document.querySelector(`style[data-styles="${className}"]`);
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.setAttribute('data-styles', className);
          styleTag.textContent = `.${className} { ${style} }`;
          head.appendChild(styleTag);
        }
      }
    }
  });

  if (fixed) {
    console.log(`✅ Moved inline styles to classes in: ${filePath}`);
    return dom.serialize();
  }
  return html;
}

async function fixMissingAnchorText(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const links = document.querySelectorAll('a');

  let fixed = false;
  links.forEach(link => {
    const href = link.getAttribute('href');
    const text = link.textContent.trim();

    if (!text || text.length < 3) {
      if (href === '#') {
        link.textContent = 'Learn more';
      } else if (href && href.startsWith('http')) {
        try {
          const url = new URL(href);
          link.textContent = url.hostname || 'External link';
        } catch {
          link.textContent = 'Link';
        }
      } else if (href && href.includes('about')) {
        link.textContent = 'About Us';
      } else if (href && href.includes('contact')) {
        link.textContent = 'Contact';
      } else if (href && href.includes('blog')) {
        link.textContent = 'Blog Post';
      } else {
        link.textContent = 'Read more';
      }
      fixed = true;
    }
  });

  if (fixed) {
    console.log(`✅ Fixed anchor text in: ${filePath}`);
    return dom.serialize();
  }
  return html;
}



async function fixHeadingHierarchy(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

  let fixed = false;
  let previousLevel = 0;

  headings.forEach(heading => {
    const currentLevel = parseInt(heading.tagName.charAt(1));

    if (currentLevel > previousLevel + 1 && previousLevel !== 0) {
      // Fix broken hierarchy by adjusting the heading level
      const newLevel = Math.min(previousLevel + 1, 6);
      const newHeading = document.createElement(`h${newLevel}`);
      newHeading.innerHTML = heading.innerHTML;
      heading.parentNode.replaceChild(newHeading, heading);
      fixed = true;
    }

    previousLevel = parseInt(heading.tagName.charAt(1));
  });

  if (fixed) {
    console.log(`✅ Fixed heading hierarchy in: ${filePath}`);
    return dom.serialize();
  }
  return html;
}

async function fixMissingAltText(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const images = document.querySelectorAll('img');

  let fixed = false;
  images.forEach(img => {
    const alt = img.getAttribute('alt');
    const src = img.getAttribute('src');

    if (!alt || alt.trim() === '') {
      if (src) {
        if (src.includes('sigpfp.png') || src.includes('profile')) {
          img.setAttribute('alt', 'Profile picture');
        } else if (src.includes('blog') && src.includes('.png')) {
          img.setAttribute('alt', 'Blog post featured image');
        } else if (src.includes('github.com')) {
          img.setAttribute('alt', 'External image');
        } else {
          img.setAttribute('alt', 'Image');
        }
        fixed = true;
      }
    }
  });

  if (fixed) {
    console.log(`✅ Added missing alt text in: ${filePath}`);
    return dom.serialize();
  }
  return html;
}

// Main fixing function
async function fixSiteIssues() {
  console.log('🔧 Starting comprehensive issue fixes...');

  const htmlFiles = getAllHtmlFiles(PUBLIC_DIR);
  console.log(`📄 Found ${htmlFiles.length} HTML files to fix`);

  for (const filePath of htmlFiles) {
    try {
      const html = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(PUBLIC_DIR, filePath);

      console.log(`🔧 Fixing: ${relativePath}`);

      let fixedHtml = html;

      // Apply all fixes in order of priority
      fixedHtml = await fixImageDimensions(fixedHtml, relativePath);
      fixedHtml = await fixEmptyAnchorLinks(fixedHtml, relativePath);
      fixedHtml = await fixMissingCanonical(fixedHtml, relativePath);
      fixedHtml = await fixMissingH1(fixedHtml, relativePath);
      fixedHtml = await fixMissingH2(fixedHtml, relativePath);
      fixedHtml = await fixMetaDescription(fixedHtml, relativePath);
      fixedHtml = await fixMissingLangAttribute(fixedHtml, relativePath);
      fixedHtml = await fixMissingAnchorText(fixedHtml, relativePath);
      fixedHtml = await fixInlineStyles(fixedHtml, relativePath);
      fixedHtml = await fixHeadingHierarchy(fixedHtml, relativePath);
      fixedHtml = await fixMissingAltText(fixedHtml, relativePath);

      // Only write if changes were made
      if (fixedHtml !== html) {
        fs.writeFileSync(filePath, fixedHtml, 'utf8');
        console.log(`💾 Saved fixes to: ${relativePath}`);
      }

    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
  }

  console.log('🎉 Comprehensive site fixes completed!');
}

// Export functions for use in other scripts
module.exports = {
  scanSite,
  fixSiteIssues,
  fixImageDimensions,
  fixEmptyAnchorLinks,
  fixMissingCanonical,
  fixMissingH1,
  fixMissingH2,
  fixMetaDescription,
  fixMissingLangAttribute,
  fixMissingAnchorText,
  fixInlineStyles,
  fixHeadingHierarchy,
  fixMissingAltText
};

// Run the fixes if this script is called directly
if (require.main === module) {
  fixSiteIssues().catch(console.error);
}

// Run the scan
scanSite().catch(console.error);
