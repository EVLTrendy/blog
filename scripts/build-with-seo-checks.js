#!/usr/bin/env node

/**
 * Complete Build Script with SEO Checks
 * Runs Eleventy build with integrated SEO fixing and reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class BuildWithSEOChecks {
    constructor() {
        this.startTime = Date.now();
        this.logs = [];
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        this.logs.push(logMessage);
        console.log(logMessage);
    }

    runCommand(command, description) {
        this.log(`🚀 ${description}...`);

        try {
            const output = execSync(command, {
                encoding: 'utf8',
                cwd: process.cwd(),
                stdio: 'pipe'
            });

            this.log(`✅ ${description} completed successfully`);
            return { success: true, output: output.trim() };
        } catch (error) {
            this.log(`❌ ${description} failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    checkPrerequisites() {
        this.log('🔍 Checking prerequisites...');

        const prerequisites = [
            { name: 'Node.js', command: 'node --version' },
            { name: 'Eleventy', command: 'npx @11ty/eleventy --version' },
            { name: 'SEO Fixer Script', check: () => fs.existsSync('./scripts/eleventy-seo-fixer.js') }
        ];

        const results = {};

        prerequisites.forEach(prereq => {
            if (prereq.command) {
                const result = this.runCommand(prereq.command, `Checking ${prereq.name}`);
                results[prereq.name] = result.success;
            } else if (prereq.check) {
                const exists = prereq.check();
                results[prereq.name] = exists;
                this.log(`${prereq.name}: ${exists ? '✅ Found' : '❌ Missing'}`);
            }
        });

        return results;
    }

    runSEOPreChecks() {
        this.log('🔍 Running SEO pre-checks...');

        // Run comprehensive SEO scan
        const scanResult = this.runCommand(
            'node scripts/comprehensive-seo-scanner.js',
            'Running comprehensive SEO scan'
        );

        if (scanResult.success) {
            this.log('📋 Pre-build SEO scan completed');
        }

        return scanResult;
    }

    runBuild() {
        this.log('🏗️  Starting Eleventy build with SEO fixes...');

        const buildResult = this.runCommand(
            'npm run build',
            'Building site with OG image generation and SEO fixes'
        );

        if (buildResult.success) {
            this.log('🎉 Build completed successfully with SEO fixes applied');
        }

        return buildResult;
    }

    runSEOPostChecks() {
        this.log('🔍 Running SEO post-checks...');

        // Run comprehensive SEO scan again to verify fixes
        const scanResult = this.runCommand(
            'node scripts/comprehensive-seo-scanner.js',
            'Running post-build SEO verification'
        );

        if (scanResult.success) {
            this.log('📋 Post-build SEO verification completed');
        }

        return scanResult;
    }

    generateBuildReport(results) {
        const endTime = Date.now();
        const duration = endTime - this.startTime;

        const report = {
            buildDate: new Date().toISOString(),
            duration: `${duration}ms`,
            results: results,
            logs: this.logs,
            summary: {
                prerequisites: results.prerequisites.Node.js && results.prerequisites.Eleventy && results.prerequisites['SEO Fixer Script'],
                preCheck: results.preCheck.success,
                build: results.build.success,
                postCheck: results.postCheck.success,
                overallSuccess: results.prerequisites.Node.js &&
                              results.prerequisites.Eleventy &&
                              results.prerequisites['SEO Fixer Script'] &&
                              results.preCheck.success &&
                              results.build.success &&
                              results.postCheck.success
            }
        };

        const reportDir = 'reports';
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const reportPath = `${reportDir}/build-with-seo-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        return report;
    }

    printSummary(report) {
        console.log('\n📋 BUILD WITH SEO CHECKS SUMMARY');
        console.log('=================================');
        console.log(`⏱️  Duration: ${report.duration}`);
        console.log(`🔧 Prerequisites: ${report.summary.prerequisites ? '✅ OK' : '❌ Issues'}`);
        console.log(`🔍 Pre-check: ${report.summary.preCheck ? '✅ OK' : '❌ Issues'}`);
        console.log(`🏗️  Build: ${report.summary.build ? '✅ OK' : '❌ Issues'}`);
        console.log(`🔍 Post-check: ${report.summary.postCheck ? '✅ OK' : '❌ Issues'}`);
        console.log(`🎯 Overall: ${report.summary.overallSuccess ? '✅ SUCCESS' : '❌ ISSUES'}`);

        if (report.summary.overallSuccess) {
            console.log('\n🎉 Build completed successfully!');
            console.log('📋 All SEO issues have been automatically detected and fixed.');
            console.log('📄 Detailed reports available in the reports/ directory.');
        } else {
            console.log('\n⚠️  Build completed with some issues.');
            console.log('📋 Check the logs above for details.');
        }
    }

    async run() {
        this.log('🚀 Starting complete build with SEO checks...');

        // Check prerequisites
        const prerequisites = this.checkPrerequisites();

        // Run pre-build SEO checks
        const preCheck = this.runSEOPreChecks();

        // Run build with integrated SEO fixes
        const build = this.runBuild();

        // Run post-build SEO verification
        const postCheck = this.runSEOPostChecks();

        // Generate comprehensive report
        const results = {
            prerequisites,
            preCheck,
            build,
            postCheck
        };

        const report = this.generateBuildReport(results);
        this.printSummary(report);

        return report;
    }
}

async function main() {
    try {
        const builder = new BuildWithSEOChecks();
        await builder.run();
    } catch (error) {
        console.error('❌ Build process failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = BuildWithSEOChecks;
