const fs = require('fs');
const path = require('path');

function setupScanSystem() {
  console.log('🔧 Setting up Site Scanning System...\n');

  // Create necessary directories
  const dirs = [
    path.join(__dirname, '..', 'logs'),
    path.join(__dirname, '..', 'reports')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });

  // Initialize verification log if it doesn't exist
  const verificationLog = path.join(__dirname, '..', 'verification-log.json');
  if (!fs.existsSync(verificationLog)) {
    const initialData = {
      verifiedPages: [],
      scanHistory: [],
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(verificationLog, JSON.stringify(initialData, null, 2));
    console.log('📋 Initialized verification log');
  }

  // Create scan progress log if it doesn't exist
  const scanLog = path.join(__dirname, '..', 'scan-progress.log');
  if (!fs.existsSync(scanLog)) {
    fs.writeFileSync(scanLog, '');
    console.log('📜 Created scan progress log');
  }

  // Create automated scan log if it doesn't exist
  const automatedLog = path.join(__dirname, '..', 'automated-scan.log');
  if (!fs.existsSync(automatedLog)) {
    fs.writeFileSync(automatedLog, '');
    console.log('🤖 Created automated scan log');
  }

  console.log('\n✅ Site Scanning System setup complete!');
  console.log('\n🚀 You can now run:');
  console.log('  node scripts/enhanced-site-scanner.js    # Run enhanced scan');
  console.log('  node scripts/publishing-guard.js --check # Check publishing readiness');
  console.log('  node scripts/automated-scan-workflow.js  # Run complete workflow');
}

// Run setup if called directly
if (require.main === module) {
  setupScanSystem();
}

module.exports = setupScanSystem;
