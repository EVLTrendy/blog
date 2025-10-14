#!/usr/bin/env node

/**
 * Script to scan and fix multiple H1 tags in blog posts
 * This addresses SEO issues where pages have more than one H1 tag
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const BLOG_DIR = 'public/blog';
const REPORT_FILE = 'reports/multiple-h1-issues.json';

function scanForMultipleH1Tags(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const h1Matches = content.match(/<h1[^>]*>.*?<\/h1>/gi) || [];

        if (h1Matches.length > 1) {
            return {
                file: filePath,
                h1Count: h1Matches.length,
                h1Tags: h1Matches,
                needsFix: true
            };
        }

        return null;
    } catch (error) {
        console.error(`Error scanning ${filePath}:`, error.message);
        return null;
    }
}

function fixMultipleH1Tags(filePath, issues) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Skip the first H1 (main title) and convert others to H2
        const h1Matches = content.match(/<h1[^>]*>.*?<\/h1>/gi) || [];

        if (h1Matches.length > 1) {
            // Replace all H1 tags with H2, except the first one
            let h1Count = 0;
            content = content.replace(/<h1([^>]*)>(.*?)<\/h1>/gi, (match, attrs, innerContent) => {
                h1Count++;
                if (h1Count === 1) {
                    return match; // Keep the first H1
                } else {
                    modified = true;
                    return `<h2${attrs}>${innerContent}</h2>`;
                }
            });
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Fixed ${filePath} (${h1Matches.length - 1} H1 tags converted to H2)`);
            return true;
        }

        return false;
    } catch (error) {
        console.error(`Error fixing ${filePath}:`, error.message);
        return false;
    }
}

async function scanAllBlogPosts() {
    console.log('🔍 Scanning all blog posts for multiple H1 tags...');

    const pattern = `${BLOG_DIR}/**/index.html`;

    return new Promise((resolve, reject) => {
        glob(pattern, (error, files) => {
            if (error) {
                reject(error);
                return;
            }

            const issues = [];

            files.forEach(file => {
                const issue = scanForMultipleH1Tags(file);
                if (issue) {
                    issues.push(issue);
                }
            });

            resolve(issues);
        });
    });
}

async function fixAllIssues(issues) {
    console.log(`🔧 Fixing ${issues.length} files with multiple H1 tags...`);

    let fixed = 0;
    for (const issue of issues) {
        if (fixMultipleH1Tags(issue.file, issue)) {
            fixed++;
        }
    }

    return fixed;
}

async function main() {
    try {
        // Ensure reports directory exists
        const reportsDir = path.dirname(REPORT_FILE);
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        // Scan for issues
        const issues = await scanAllBlogPosts();

        if (issues.length === 0) {
            console.log('✅ No multiple H1 tag issues found!');
            return;
        }

        console.log(`❌ Found ${issues.length} files with multiple H1 tags:`);
        issues.forEach(issue => {
            console.log(`  - ${issue.file} (${issue.h1Count} H1 tags)`);
        });

        // Save report
        const report = {
            scanDate: new Date().toISOString(),
            totalIssues: issues.length,
            issues: issues
        };
        fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

        // Fix issues
        const fixed = await fixAllIssues(issues);

        console.log(`\n🎉 Fixed ${fixed} out of ${issues.length} files`);
        console.log(`📋 Report saved to: ${REPORT_FILE}`);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    scanForMultipleH1Tags,
    fixMultipleH1Tags,
    scanAllBlogPosts,
    fixAllIssues
};
