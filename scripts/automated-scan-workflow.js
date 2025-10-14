const EnhancedSiteScanner = require('./enhanced-site-scanner');
const PublishingGuard = require('./publishing-guard');
const fs = require('fs');
const path = require('path');

class AutomatedScanWorkflow {
  constructor() {
    this.logFile = path.join(__dirname, '..', 'automated-scan.log');
  }

  // Main workflow
  async runWorkflow(options = {}) {
    const startTime = new Date();
    console.log('🤖 Starting Automated Scan Workflow...');
    console.log(`⏰ Started at: ${startTime.toISOString()}`);

    const results = {
      startTime,
      endTime: null,
      steps: [],
      success: true,
      errors: []
    };

    try {
      // Step 1: Check publishing readiness
      console.log('\n📋 Step 1: Checking publishing readiness...');
      const guard = new PublishingGuard();
      const readiness = await guard.checkPublishingReadiness();

      results.steps.push({
        step: 'publishing_check',
        success: true,
        data: readiness
      });

      if (!readiness.ready) {
        console.log('⚠️  Publishing not ready - running fixes...');

        // Step 2: Run enhanced scan with fixes
        console.log('\n🔍 Step 2: Running enhanced scan with fixes...');
        const scanner = new EnhancedSiteScanner();
        await scanner.scanSite({ autoFix: true });

        results.steps.push({
          step: 'enhanced_scan',
          success: true,
          data: scanner.scanResults
        });

        // Step 3: Re-check publishing readiness
        console.log('\n🔄 Step 3: Re-checking publishing readiness...');
        const recheckReadiness = await guard.checkPublishingReadiness();

        results.steps.push({
          step: 'recheck_readiness',
          success: true,
          data: recheckReadiness
        });

        if (!recheckReadiness.ready) {
          console.log('❌ Publishing still blocked after fixes');
          results.success = false;
          results.blockingIssues = recheckReadiness.issues;
        } else {
          console.log('✅ Publishing now ready after fixes');
        }
      } else {
        console.log('✅ Publishing already ready - no fixes needed');
      }

      // Step 4: Generate comprehensive report
      console.log('\n📊 Step 4: Generating comprehensive report...');
      const report = this.generateComprehensiveReport(results);

      results.steps.push({
        step: 'report_generation',
        success: true,
        data: report
      });

      results.endTime = new Date();
      console.log(`\n⏰ Completed at: ${results.endTime.toISOString()}`);
      console.log(`⏱️  Duration: ${results.endTime - startTime}ms`);

      this.logWorkflow(results);
      return results;

    } catch (error) {
      console.error('❌ Workflow failed:', error);
      results.success = false;
      results.errors.push(error.message);
      results.endTime = new Date();

      this.logWorkflow(results);
      throw error;
    }
  }

  // Generate comprehensive report
  generateComprehensiveReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      workflow: {
        success: results.success,
        duration: results.endTime ? results.endTime - results.startTime : 0,
        steps: results.steps.length
      },
      summary: {
        totalIssues: 0,
        fixedIssues: 0,
        remainingIssues: 0
      },
      details: results
    };

    // Calculate summary statistics
    results.steps.forEach(step => {
      if (step.data && step.data.issues) {
        report.summary.totalIssues += step.data.issues.length;
      }
      if (step.data && step.data.fixed) {
        report.summary.fixedIssues += step.data.fixed;
      }
    });

    return report;
  }

  // Log workflow execution
  logWorkflow(results) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      success: results.success,
      duration: results.endTime ? results.endTime - results.startTime : 0,
      steps: results.steps.length,
      errors: results.errors.length
    };

    try {
      fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to write log:', error.message);
    }
  }

  // Get workflow history
  getWorkflowHistory() {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const logs = fs.readFileSync(this.logFile, 'utf8')
        .trim()
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      return logs;
    } catch (error) {
      console.error('Failed to read workflow history:', error.message);
      return [];
    }
  }
}

// CLI usage
if (require.main === module) {
  const workflow = new AutomatedScanWorkflow();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {};

  if (args.includes('--dry-run')) {
    options.dryRun = true;
  }

  if (args.includes('--force')) {
    options.force = true;
  }

  workflow.runWorkflow(options).then(results => {
    console.log('\n🎉 Workflow completed!');
    if (results.success) {
      console.log('✅ All checks passed');
    } else {
      console.log('❌ Some issues require attention');
      process.exit(1);
    }
  }).catch(error => {
    console.error('💥 Workflow failed:', error);
    process.exit(1);
  });
}

module.exports = AutomatedScanWorkflow;
