#!/usr/bin/env node

/**
 * Script to fix non-ASCII characters in blog post URLs
 * Replaces special characters with ASCII equivalents for better SEO
 */

const fs = require('fs');
const path = require('path');

// Non-ASCII character mappings
const ASCII_MAPPINGS = {
    '\u2013': '-',      // Em dash to hyphen
    '\u2014': '-',      // Em dash (alternative) to hyphen
    '\u2019': '\'',     // Right single quotation mark to apostrophe
    '\u201C': '"',      // Left double quotation mark to quote
    '\u201D': '"',      // Right double quotation mark to quote
    '\u2018': '\'',     // Left single quotation mark to apostrophe
    '\u2019': '\'',     // Right single quotation mark (alternative) to apostrophe
    '\uD835\uDD57': 'X', // Special X character to regular X
    '\u2019': '\'',     // Curly apostrophe to straight apostrophe
    '\u201C': '"',      // Curly quote to straight quote
    '\u2026': '...',    // Ellipsis to three dots
    '\u2032': '\'',     // Prime to apostrophe
    '\u2033': '"',      // Double prime to quote
    '\u2039': '<',      // Single left-pointing angle quotation mark
    '\u203A': '>',      // Single right-pointing angle quotation mark
    '\u00AB': '<<',     // Left-pointing double angle quotation mark
    '\u00BB': '>>',     // Right-pointing double angle quotation mark
    '\u00BF': '?',      // Inverted question mark
    '\u00A1': '!',      // Inverted exclamation mark
    '\u00A7': 'SS',     // Section sign
    '\u00B6': 'P',      // Pilcrow sign
    '\u2020': '+',      // Dagger
    '\u2021': '++',     // Double dagger
    '\u2022': '*',      // Bullet
    '\u2030': '%',      // Per mille sign
    '\u2032': '\'',     // Minute sign
    '\u2033': '"',      // Second sign
};

function sanitizeUrlSlug(urlSlug) {
    let sanitized = urlSlug;

    // Replace all non-ASCII characters
    Object.entries(ASCII_MAPPINGS).forEach(([nonAscii, ascii]) => {
        sanitized = sanitized.replace(new RegExp(nonAscii, 'g'), ascii);
    });

    // Remove any remaining non-ASCII characters
    sanitized = sanitized.replace(/[^\x00-\x7F]/g, '');

    // Clean up multiple consecutive hyphens
    sanitized = sanitized.replace(/-+/g, '-');

    // Remove leading/trailing hyphens
    sanitized = sanitized.replace(/^-+|-+$/g, '');

    return sanitized;
}

function findBlogPostByUrl(urlSlug) {
    // This would need to be implemented based on how URLs map to files
    // For now, we'll work with the URL slugs directly
    return null;
}

function generateReport(nonAsciiIssues) {
    const report = {
        scanDate: new Date().toISOString(),
        totalIssues: nonAsciiIssues.length,
        issues: nonAsciiIssues.map(issue => ({
            originalUrl: issue.url,
            sanitizedUrl: sanitizeUrlSlug(issue.url),
            file: issue.file,
            characters: [...new Set(issue.url.match(/[^\x00-\x7F]/g) || [])]
        }))
    };

    const reportDir = 'reports';
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(
        `${reportDir}/non-ascii-url-report.json`,
        JSON.stringify(report, null, 2)
    );

    return report;
}

function printReport(report) {
    console.log('\n📋 NON-ASCII URL REPORT');
    console.log('=======================');
    console.log(`Total issues: ${report.totalIssues}`);

    if (report.totalIssues > 0) {
        console.log('\n🔧 URL Sanitization Suggestions:');
        report.issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue.originalUrl}`);
            console.log(`   → ${issue.sanitizedUrl}`);
            console.log(`   Characters: ${issue.characters.join(', ')}`);
            console.log('');
        });
    }
}

function main() {
    try {
        // Read the comprehensive SEO report
        const reportPath = 'reports/comprehensive-seo-report.json';
        if (!fs.existsSync(reportPath)) {
            console.error('❌ Comprehensive SEO report not found. Run the scanner first.');
            return;
        }

        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        const nonAsciiIssues = report.issues.nonAsciiUrls;

        if (nonAsciiIssues.length === 0) {
            console.log('✅ No non-ASCII URL issues found!');
            return;
        }

        console.log(`🔍 Found ${nonAsciiIssues.length} URLs with non-ASCII characters`);

        const sanitizedReport = generateReport(nonAsciiIssues);
        printReport(sanitizedReport);

        console.log('\n📋 REPORT GENERATED');
        console.log('==================');
        console.log('📄 reports/non-ascii-url-report.json');
        console.log('\n💡 To fix these URLs, you would need to:');
        console.log('1. Update the source markdown files with sanitized URLs');
        console.log('2. Regenerate the site with Eleventy');
        console.log('3. Set up proper redirects from old URLs to new ones');

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
    sanitizeUrlSlug,
    generateReport,
    ASCII_MAPPINGS
};
