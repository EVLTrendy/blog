const fs = require('fs');
const path = require('path');
const SiteVerificationTracker = require('./site-verification-tracker');
const { LinkValidationGuard } = require('./link-validation-guard');

// Configuration
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const CRITICAL_ISSUES = [
  'Multiple H1 tags',
  'Missing canonical tag',
  'Multiple meta descriptions',
  'Broken heading hierarchy'
];

class PublishingGuard {
  constructor() {
    this.tracker = new SiteVerificationTracker();
  }

  // Check if site is ready for publishing
  async checkPublishingReadiness() {
    console.log('🔒 Checking publishing readiness...');

    const unverifiedPages = this.tracker.getPagesToScan();
    const failedPages = Array.from(this.tracker.verifiedPages.entries())
      .filter(([file, data]) => data.status === 'failed')
      .map(([file, data]) => ({ file, ...data }));

    // Check link validation issues
    const linkIssues = await this.checkLinkValidation();

    const issues = [];

    if (unverifiedPages.length > 0) {
      issues.push({
        type: 'unverified',
        count: unverifiedPages.length,
        pages: unverifiedPages.map(p => p.relativePath)
      });
    }

    if (failedPages.length > 0) {
      issues.push({
        type: 'failed',
        count: failedPages.length,
        pages: failedPages.map(p => p.file)
      });
    }

    if (linkIssues.errors.length > 0) {
      issues.push({
        type: 'link-errors',
        count: linkIssues.errors.length,
        pages: linkIssues.errors.map(issue => issue.file)
      });
    }

    return {
      ready: issues.length === 0,
      issues,
      unverifiedCount: unverifiedPages.length,
      failedCount: failedPages.length,
      linkErrors: linkIssues.errors.length,
      linkWarnings: linkIssues.warnings.length
    };
  }

  // Check link validation issues
  async checkLinkValidation() {
    console.log('🔗 Checking link validation...');

    const linkValidator = new LinkValidationGuard();
    const sourceFiles = [
      'src/blog.njk',
      'src/_includes/base.njk',
      'src/_includes/article.njk',
      'src/admin/index.html'
    ];

    const allIssues = [];

    for (const file of sourceFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const issues = await linkValidator.validateContent(filePath, content);
          allIssues.push(...issues);
        } catch (error) {
          console.warn(`Warning: Could not validate ${file}: ${error.message}`);
        }
      }
    }

    const errors = allIssues.filter(issue => issue.severity === 'error');
    const warnings = allIssues.filter(issue => issue.severity === 'warning');

    console.log(`   Found ${errors.length} link errors and ${warnings.length} warnings`);

    return {
      errors,
      warnings,
      total: allIssues.length
    };
  }

  // Prevent publishing if not ready
  async preventPublishing() {
    const readiness = await this.checkPublishingReadiness();

    if (!readiness.ready) {
      console.log('🚫 PUBLISHING BLOCKED');
      console.log('====================');

      readiness.issues.forEach(issue => {
        console.log(`\n❌ ${issue.type.toUpperCase()}: ${issue.count} pages`);
        issue.pages.forEach(page => {
          console.log(`  - ${page}`);
        });
      });

      console.log('\n🔧 To fix these issues, run:');
      console.log('  node scripts/enhanced-site-scanner.js');

      process.exit(1);
    } else {
      console.log('✅ Publishing allowed - all checks passed');
    }
  }

  // Generate publishing report
  generatePublishingReport() {
    const readiness = this.checkPublishingReadiness();
    const stats = this.tracker.getStats();

    return {
      timestamp: new Date().toISOString(),
      readiness,
      stats,
      canPublish: readiness.ready
    };
  }
}

// CLI usage
if (require.main === module) {
  const guard = new PublishingGuard();

  if (process.argv.includes('--check')) {
    guard.checkPublishingReadiness().then(readiness => {
      console.log('🔒 PUBLISHING READINESS REPORT');
      console.log('=============================');
      console.log(`Ready for publishing: ${readiness.ready ? '✅ YES' : '❌ NO'}`);
      console.log(`Unverified pages: ${readiness.unverifiedCount}`);
      console.log(`Failed pages: ${readiness.failedCount}`);
      console.log(`Link errors: ${readiness.linkErrors}`);
      console.log(`Link warnings: ${readiness.linkWarnings}`);

      if (!readiness.ready) {
        console.log('\nIssues found:');
        readiness.issues.forEach(issue => {
          console.log(`  ${issue.type}: ${issue.count} pages`);
        });
      }
    }).catch(console.error);
  } else {
    guard.preventPublishing().catch(console.error);
  }
}

module.exports = PublishingGuard;
