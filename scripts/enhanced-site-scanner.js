const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const SiteVerificationTracker = require('./site-verification-tracker');

// Configuration
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SCAN_LOG = path.join(__dirname, '..', 'scan-progress.log');

// Safe fixes that can be applied automatically
const SAFE_FIXES = [
  'fixMissingAltText',
  'fixImageDimensions',
  'fixMissingCanonical',
  'fixMissingLangAttribute',
  'fixInlineStyles',
  'fixHeadingHierarchy'
];

// Critical issues that should prevent publishing
const CRITICAL_ISSUES = [
  'Multiple H1 tags',
  'Missing canonical tag',
  'Multiple meta descriptions',
  'Broken heading hierarchy'
];

class EnhancedSiteScanner {
  constructor() {
    this.tracker = new SiteVerificationTracker();
    this.scanResults = {
      scanned: 0,
      verified: 0,
      failed: 0,
      fixed: 0,
      errors: []
    };
  }

  // Main scanning function
  async scanSite(options = {}) {
    console.log('🚀 Starting Enhanced Site Scan...');

    const pagesToScan = this.tracker.getPagesToScan();
    console.log(`📋 Found ${pagesToScan.length} pages to scan`);

    if (pagesToScan.length === 0) {
      console.log('✅ All pages are up to date!');
      return;
    }

    for (const page of pagesToScan) {
      try {
        console.log(`\n🔍 Scanning: ${page.relativePath} (${page.reason})`);

        const result = await this.scanPage(page.path, options);

        if (result.success) {
          this.scanResults.scanned++;

          if (result.fixed) {
            this.scanResults.fixed++;
          }

          if (result.verified) {
            this.scanResults.verified++;
          }
        } else {
          this.scanResults.failed++;
          this.scanResults.errors.push({
            file: page.relativePath,
            error: result.error
          });
        }

      } catch (error) {
        console.error(`❌ Error scanning ${page.relativePath}:`, error.message);
        this.scanResults.errors.push({
          file: page.relativePath,
          error: error.message
        });
      }
    }

    this.logProgress();
    this.generateSummaryReport();
  }

  // Scan individual page
  async scanPage(filePath, options = {}) {
    const html = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    const fixes = [];

    // Run comprehensive checks
    const checks = [
      { name: 'mobileFriendly', check: this.checkMobileFriendly },
      { name: 'links', check: this.checkLinks },
      { name: 'indexability', check: this.checkIndexability },
      { name: 'contentRelevance', check: this.checkContentRelevance },
      { name: 'duplicateContent', check: this.checkDuplicateContent },
      { name: 'pageSpeed', check: this.checkPageSpeed },
      { name: 'socialMedia', check: this.checkSocialMedia },
      { name: 'codeValidation', check: this.checkCodeValidation }
    ];

    for (const { name, check } of checks) {
      try {
        const pageIssues = check.call(this, html, filePath);
        issues.push(...pageIssues);
      } catch (error) {
        console.error(`Error in ${name} check:`, error.message);
      }
    }

    // Apply safe fixes if enabled
    if (options.autoFix !== false) {
      const fixResult = await this.applySafeFixes(html, filePath, issues);
      if (fixResult.fixed) {
        fixes.push(...fixResult.appliedFixes);

        // Re-scan after fixes to verify
        const updatedHtml = fs.readFileSync(filePath, 'utf8');
        const recheckIssues = [];

        for (const { name, check } of checks) {
          try {
            const pageIssues = check.call(this, updatedHtml, filePath);
            recheckIssues.push(...pageIssues);
          } catch (error) {
            console.error(`Error in ${name} recheck:`, error.message);
          }
        }

        issues.length = 0;
        issues.push(...recheckIssues);
      }
    }

    // Determine if page should be verified or failed
    const criticalIssues = issues.filter(issue =>
      CRITICAL_ISSUES.some(critical => issue.issue.includes(critical))
    );

    if (criticalIssues.length > 0) {
      console.log(`🚫 Page failed verification: ${criticalIssues.length} critical issues`);
      this.tracker.markFailed(filePath, 'Critical issues found', criticalIssues);
      return { success: false, error: 'Critical issues prevent publishing' };
    }

    // Mark as verified
    this.tracker.markVerified(filePath, issues, fixes);
    console.log(`✅ Page verified: ${issues.length} issues, ${fixes.length} fixes applied`);

    return { success: true, verified: true, fixed: fixes.length > 0, issues, fixes };
  }

  // Check for mobile-friendly issues
  checkMobileFriendly(html, filePath) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const issues = [];

    const viewportTags = document.querySelectorAll('meta[name="viewport"]');
    if (viewportTags.length === 0) {
      issues.push({
        file: filePath,
        issue: 'Missing viewport tag',
        details: 'No viewport meta tag found',
        severity: 'high'
      });
    }

    return issues;
  }

  // Check for link issues
  checkLinks(html, filePath) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const issues = [];

    const links = document.querySelectorAll('a');
    const hrefs = new Set();

    links.forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent.trim();

      if (href === '#') {
        issues.push({
          file: filePath,
          issue: 'Empty anchor link',
          details: 'Link with href="#" found',
          severity: 'medium'
        });
      }

      if (!text || text.length < 3) {
        issues.push({
          file: filePath,
          issue: 'Missing anchor text',
          details: `Link text too short: "${text}"`,
          severity: 'medium'
        });
      }

      // Check for followed internal linking (more than one internal link)
      if (href && href.startsWith('/') && !href.startsWith('//')) {
        hrefs.add(href);
      }
    });

    if (hrefs.size <= 1) {
      issues.push({
        file: filePath,
        issue: 'Insufficient internal linking',
        details: `Only ${hrefs.size} internal links found`,
        severity: 'low'
      });
    }

    return issues;
  }

  // Check for indexability issues
  checkIndexability(html, filePath) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const issues = [];

    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      issues.push({
        file: filePath,
        issue: 'Missing canonical tag',
        details: 'No canonical link found',
        severity: 'high'
      });
    }

    const robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      issues.push({
        file: filePath,
        issue: 'Missing robots meta tag',
        details: 'No robots meta tag found',
        severity: 'medium'
      });
    }

    return issues;
  }

  // Check for content relevance issues
  checkContentRelevance(html, filePath) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const issues = [];

    const h1Tags = document.querySelectorAll('h1');
    if (h1Tags.length === 0) {
      issues.push({
        file: filePath,
        issue: 'Missing H1 tag',
        details: 'No H1 heading found',
        severity: 'high'
      });
    } else if (h1Tags.length > 1) {
      issues.push({
        file: filePath,
        issue: 'Multiple H1 tags',
        details: `${h1Tags.length} H1 tags found`,
        severity: 'high'
      });
    }

    const h2Tags = document.querySelectorAll('h2');
    if (h2Tags.length === 0) {
      issues.push({
        file: filePath,
        issue: 'Missing H2 tags',
        details: 'No H2 headings found',
        severity: 'medium'
      });
    }

    const descriptions = document.querySelectorAll('meta[name="description"]');
    if (descriptions.length > 1) {
      issues.push({
        file: filePath,
        issue: 'Multiple meta descriptions',
        details: `${descriptions.length} description meta tags found`,
        severity: 'high'
      });
    }

    const images = document.querySelectorAll('img');
    images.forEach(img => {
      const alt = img.getAttribute('alt');
      if (!alt || alt.trim() === '') {
        issues.push({
          file: filePath,
          issue: 'Missing alt text',
          details: `Image src: ${img.getAttribute('src')}`,
          severity: 'medium'
        });
      }
    });

    const htmlTag = document.querySelector('html');
    if (!htmlTag || !htmlTag.getAttribute('lang')) {
      issues.push({
        file: filePath,
        issue: 'Missing HTML lang attribute',
        details: 'HTML tag missing lang attribute',
        severity: 'medium'
      });
    }

    // Check word count
    const textContent = document.body.textContent.trim();
    const wordCount = textContent.split(/\s+/).length;
    if (wordCount < 300) {
      issues.push({
        file: filePath,
        issue: 'Low word count',
        details: `${wordCount} words (minimum: 300)`,
        severity: 'low'
      });
    }

    return issues;
  }

  // Check for duplicate content issues
  checkDuplicateContent(html, filePath) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const issues = [];

    const title = document.querySelector('title');
    const h1 = document.querySelector('h1');

    if (title && h1) {
      if (title.textContent.trim() === h1.textContent.trim()) {
        issues.push({
          file: filePath,
          issue: 'H1 matches title tag',
          details: 'H1 and title tag are identical',
          severity: 'low'
        });
      }
    }

    return issues;
  }

  // Check for page speed issues
  checkPageSpeed(html, filePath) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const issues = [];

    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.getAttribute('width') || !img.getAttribute('height')) {
        issues.push({
          file: filePath,
          issue: 'Missing image dimensions',
          details: `Image src: ${img.getAttribute('src')}`,
          severity: 'medium'
        });
      }
    });

    return issues;
  }

  // Check for social media issues
  checkSocialMedia(html, filePath) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const issues = [];

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');

    if (!ogTitle) {
      issues.push({
        file: filePath,
        issue: 'Missing Open Graph title',
        details: 'No og:title meta tag found',
        severity: 'medium'
      });
    }

    if (!ogDescription) {
      issues.push({
        file: filePath,
        issue: 'Missing Open Graph description',
        details: 'No og:description meta tag found',
        severity: 'medium'
      });
    }

    if (!ogImage) {
      issues.push({
        file: filePath,
        issue: 'Missing Open Graph image',
        details: 'No og:image meta tag found',
        severity: 'medium'
      });
    }

    return issues;
  }

  // Check for code validation issues
  checkCodeValidation(html, filePath) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const issues = [];

    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    headings.forEach(heading => {
      const currentLevel = parseInt(heading.tagName.charAt(1));

      if (currentLevel > previousLevel + 1 && previousLevel !== 0) {
        issues.push({
          file: filePath,
          issue: 'Broken heading hierarchy',
          details: `Skipped from H${previousLevel} to H${currentLevel}`,
          severity: 'high'
        });
      }

      previousLevel = currentLevel;
    });

    return issues;
  }

  // Apply safe fixes
  async applySafeFixes(html, filePath, issues) {
    let modifiedHtml = html;
    const appliedFixes = [];

    for (const fixName of SAFE_FIXES) {
      try {
        const fixFunction = this[`fix${fixName.charAt(0).toUpperCase()}${fixName.slice(1)}`];
        if (fixFunction) {
          const result = await fixFunction.call(this, modifiedHtml, filePath);
          if (result.fixed) {
            modifiedHtml = result.html;
            appliedFixes.push(fixName);
          }
        }
      } catch (error) {
        console.error(`Error applying fix ${fixName}:`, error.message);
      }
    }

    // Save if any fixes were applied
    if (appliedFixes.length > 0) {
      fs.writeFileSync(filePath, modifiedHtml, 'utf8');
      return { fixed: true, appliedFixes };
    }

    return { fixed: false, appliedFixes: [] };
  }

  // Fix missing alt text
  async fixMissingAltText(html, filePath) {
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
          } else {
            img.setAttribute('alt', 'Image');
          }
          fixed = true;
        }
      }
    });

    if (fixed) {
      return { fixed: true, html: dom.serialize() };
    }
    return { fixed: false, html };
  }

  // Fix missing image dimensions
  async fixImageDimensions(html, filePath) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const images = document.querySelectorAll('img');

    let fixed = false;
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && !img.getAttribute('width') && !img.getAttribute('height')) {
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
      return { fixed: true, html: dom.serialize() };
    }
    return { fixed: false, html };
  }

  // Fix missing canonical tag
  async fixMissingCanonical(html, filePath) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      const relativePath = path.relative(PUBLIC_DIR, filePath);
      const canonicalUrl = `https://blog.evolvedlotus.com/${relativePath.replace(/\\/g, '/').replace('index.html', '').replace(/\/$/, '')}`;

      const head = document.querySelector('head');
      if (head) {
        const canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        canonicalLink.href = canonicalUrl;
        head.appendChild(canonicalLink);
        return { fixed: true, html: dom.serialize() };
      }
    }

    return { fixed: false, html };
  }

  // Fix missing lang attribute
  async fixMissingLangAttribute(html, filePath) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const htmlTag = document.querySelector('html');
    if (htmlTag && !htmlTag.getAttribute('lang')) {
      htmlTag.setAttribute('lang', 'en');
      return { fixed: true, html: dom.serialize() };
    }

    return { fixed: false, html };
  }

  // Fix inline styles
  async fixInlineStyles(html, filePath) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const elementsWithStyle = document.querySelectorAll('[style]');
    let fixed = false;

    elementsWithStyle.forEach(element => {
      const style = element.getAttribute('style');
      if (style) {
        const styleHash = Buffer.from(style).toString('base64').replace(/[+/=]/g, '').substring(0, 8);
        const className = `style-${styleHash}`;

        element.classList.add(className);
        element.removeAttribute('style');
        fixed = true;

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
      return { fixed: true, html: dom.serialize() };
    }
    return { fixed: false, html };
  }

  // Fix heading hierarchy
  async fixHeadingHierarchy(html, filePath) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    let fixed = false;
    let previousLevel = 0;

    headings.forEach(heading => {
      const currentLevel = parseInt(heading.tagName.charAt(1));

      if (currentLevel > previousLevel + 1 && previousLevel !== 0) {
        const newLevel = Math.min(previousLevel + 1, 6);
        const newHeading = document.createElement(`h${newLevel}`);
        newHeading.innerHTML = heading.innerHTML;
        heading.parentNode.replaceChild(newHeading, heading);
        fixed = true;
      }

      previousLevel = parseInt(heading.tagName.charAt(1));
    });

    if (fixed) {
      return { fixed: true, html: dom.serialize() };
    }
    return { fixed: false, html };
  }

  // Log progress
  logProgress() {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...this.scanResults
    };

    fs.appendFileSync(SCAN_LOG, JSON.stringify(logEntry) + '\n');
  }

  // Generate summary report
  generateSummaryReport() {
    console.log('\n📊 SCAN SUMMARY');
    console.log('==============');
    console.log(`🔍 Pages scanned: ${this.scanResults.scanned}`);
    console.log(`✅ Pages verified: ${this.scanResults.verified}`);
    console.log(`🔧 Issues fixed: ${this.scanResults.fixed}`);
    console.log(`❌ Pages failed: ${this.scanResults.failed}`);

    if (this.scanResults.errors.length > 0) {
      console.log('\n🚨 Errors encountered:');
      this.scanResults.errors.forEach(error => {
        console.log(`  ${error.file}: ${error.error}`);
      });
    }

    const trackerReport = this.tracker.generateReport();
    console.log('\n📈 VERIFICATION STATS');
    console.log('====================');
    console.log(`📊 Total pages: ${trackerReport.stats.totalPages}`);
    console.log(`✅ Verified: ${trackerReport.stats.verified}`);
    console.log(`❌ Failed: ${trackerReport.stats.failed}`);
    console.log(`⏳ Pending: ${trackerReport.stats.pending}`);
  }
}

// CLI usage
if (require.main === module) {
  const scanner = new EnhancedSiteScanner();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {};

  if (args.includes('--no-fix')) {
    options.autoFix = false;
  }

  if (args.includes('--force')) {
    // Force scan all pages
    scanner.tracker.initializeVerificationLog();
  }

  scanner.scanSite(options).catch(console.error);
}

module.exports = EnhancedSiteScanner;
