const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const VERIFICATION_LOG = path.join(__dirname, '..', 'verification-log.json');
const SCAN_REPORT = path.join(__dirname, '..', 'site-scan-report.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Verification tracking system
class SiteVerificationTracker {
  constructor() {
    this.verifiedPages = new Map();
    this.scanHistory = [];
    this.loadVerificationLog();
  }

  // Load existing verification data
  loadVerificationLog() {
    try {
      if (fs.existsSync(VERIFICATION_LOG)) {
        const data = JSON.parse(fs.readFileSync(VERIFICATION_LOG, 'utf8'));
        this.verifiedPages = new Map(data.verifiedPages || []);
        this.scanHistory = data.scanHistory || [];
      }
    } catch (error) {
      console.log('Creating new verification log...');
      this.initializeVerificationLog();
    }
  }

  // Save verification data
  saveVerificationLog() {
    const data = {
      verifiedPages: Array.from(this.verifiedPages.entries()),
      scanHistory: this.scanHistory,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(VERIFICATION_LOG, JSON.stringify(data, null, 2));
  }

  // Initialize verification log
  initializeVerificationLog() {
    this.verifiedPages = new Map();
    this.scanHistory = [];
    this.saveVerificationLog();
  }

  // Calculate file hash for change detection
  calculateFileHash(filePath) {
    try {
      const content = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      return null;
    }
  }

  // Check if page needs verification
  needsVerification(filePath) {
    const relativePath = path.relative(PUBLIC_DIR, filePath);
    const currentHash = this.calculateFileHash(filePath);
    const storedData = this.verifiedPages.get(relativePath);

    if (!storedData) {
      return { needed: true, reason: 'Never verified' };
    }

    if (storedData.hash !== currentHash) {
      return { needed: true, reason: 'File modified' };
    }

    // Check if verification is older than 24 hours
    const verificationAge = Date.now() - storedData.lastVerified;
    const oneDay = 24 * 60 * 60 * 1000;

    if (verificationAge > oneDay) {
      return { needed: true, reason: 'Verification expired' };
    }

    return { needed: false, reason: 'Already verified' };
  }

  // Mark page as verified
  markVerified(filePath, issues = [], fixes = []) {
    const relativePath = path.relative(PUBLIC_DIR, filePath);
    const hash = this.calculateFileHash(filePath);

    this.verifiedPages.set(relativePath, {
      hash,
      lastVerified: Date.now(),
      issues: issues,
      fixes: fixes,
      verificationDate: new Date().toISOString()
    });

    this.scanHistory.push({
      file: relativePath,
      action: 'verified',
      timestamp: new Date().toISOString(),
      issues: issues.length,
      fixes: fixes.length
    });

    this.saveVerificationLog();
  }

  // Mark page as failed verification
  markFailed(filePath, reason, issues = []) {
    const relativePath = path.relative(PUBLIC_DIR, filePath);

    this.verifiedPages.set(relativePath, {
      lastVerified: Date.now(),
      status: 'failed',
      reason,
      issues: issues,
      verificationDate: new Date().toISOString()
    });

    this.scanHistory.push({
      file: relativePath,
      action: 'failed',
      reason,
      timestamp: new Date().toISOString(),
      issues: issues.length
    });

    this.saveVerificationLog();
  }

  // Get pages that need scanning
  getPagesToScan() {
    const htmlFiles = this.getAllHtmlFiles(PUBLIC_DIR);
    const toScan = [];

    for (const filePath of htmlFiles) {
      const needsVerification = this.needsVerification(filePath);
      if (needsVerification.needed) {
        toScan.push({
          path: filePath,
          relativePath: path.relative(PUBLIC_DIR, filePath),
          reason: needsVerification.reason
        });
      }
    }

    return toScan;
  }

  // Get all HTML files recursively
  getAllHtmlFiles(dir) {
    const files = [];

    function traverse(currentDir) {
      if (!fs.existsSync(currentDir)) return;

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

  // Get verification statistics
  getStats() {
    const totalPages = this.verifiedPages.size;
    const verified = Array.from(this.verifiedPages.values()).filter(p => p.status !== 'failed').length;
    const failed = Array.from(this.verifiedPages.values()).filter(p => p.status === 'failed').length;
    const pending = this.getPagesToScan().length;

    return {
      totalPages,
      verified,
      failed,
      pending,
      lastScan: this.scanHistory.length > 0 ? this.scanHistory[this.scanHistory.length - 1].timestamp : null
    };
  }

  // Generate verification report
  generateReport() {
    const stats = this.getStats();
    const recentActivity = this.scanHistory.slice(-10);

    return {
      stats,
      recentActivity,
      verifiedPages: Array.from(this.verifiedPages.entries()).map(([file, data]) => ({
        file,
        ...data
      }))
    };
  }
}

// Export for use in other scripts
module.exports = SiteVerificationTracker;

// CLI usage
if (require.main === module) {
  const tracker = new SiteVerificationTracker();
  const report = tracker.generateReport();

  console.log('🔍 SITE VERIFICATION TRACKER REPORT');
  console.log('==================================');
  console.log(`📊 Total pages: ${report.stats.totalPages}`);
  console.log(`✅ Verified: ${report.stats.verified}`);
  console.log(`❌ Failed: ${report.stats.failed}`);
  console.log(`⏳ Pending: ${report.stats.pending}`);
  console.log(`🕐 Last scan: ${report.stats.lastScan || 'Never'}`);

  if (report.recentActivity.length > 0) {
    console.log('\n📋 Recent Activity:');
    report.recentActivity.forEach(activity => {
      console.log(`  ${activity.timestamp}: ${activity.action} - ${activity.file}`);
    });
  }
}
