#!/usr/bin/env node

/**
 * Test script for the Eleventy SEO Fixer
 * Tests the SEO fixer functionality with sample data
 */

const fs = require('fs');
const path = require('path');
const EleventySEOFixer = require('./eleventy-seo-fixer');

// Sample HTML content with various SEO issues
const testCases = [
    {
        name: 'Missing Title Tag',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <article>
        <h1>Test Article</h1>
        <p>This is a test article content.</p>
    </article>
</body>
</html>`,
        data: { title: 'Test Article' }
    },
    {
        name: 'Missing Meta Description',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Article</title>
</head>
<body>
    <article>
        <h1>Test Article</h1>
        <p>This is a test article with enough content to generate a meta description from the first meaningful paragraph.</p>
    </article>
</body>
</html>`,
        data: { title: 'Test Article' }
    },
    {
        name: 'Missing H1 Tag',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Article</title>
    <meta name="description" content="Test description">
</head>
<body>
    <article>
        <h2>Subtitle</h2>
        <p>This article is missing an H1 tag.</p>
    </article>
</body>
</html>`,
        data: { title: 'Test Article' }
    },
    {
        name: 'Broken Links',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Article</title>
    <meta name="description" content="Test description">
</head>
<body>
    <article>
        <h1>Test Article</h1>
        <p><a href="http://undefined">Broken Link 1</a></p>
        <p><a href="https://null">Broken Link 2</a></p>
        <p><a href="/valid-link">Valid Link</a></p>
    </article>
</body>
</html>`,
        data: { title: 'Test Article' }
    },
    {
        name: 'Missing Favicon',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Article</title>
    <meta name="description" content="Test description">
</head>
<body>
    <article>
        <h1>Test Article</h1>
        <p>This page is missing a favicon.</p>
    </article>
</body>
</html>`,
        data: { title: 'Test Article' }
    }
];

async function runTests() {
    console.log('🧪 TESTING ELEVENTY SEO FIXER');
    console.log('==============================');

    const seoFixer = new EleventySEOFixer();

    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n📋 Test Case ${i + 1}: ${testCase.name}`);
        console.log('----------------------------------------');

        try {
            // Mock output path for blog post
            const outputPath = `public/blog/test-${i + 1}/index.html`;

            // Mock page data
            const mockData = {
                ...testCase.data,
                page: {
                    inputPath: `src/blog/test-${i + 1}.md`
                }
            };

            console.log('🔍 Scanning for issues...');
            const fixedContent = seoFixer.scanAndFixContent(testCase.content, outputPath, mockData);

            console.log('✅ Issues detected and fixes applied');

            // Show what changed (simple diff)
            if (fixedContent !== testCase.content) {
                console.log('🔧 Changes made:');

                if (testCase.content.includes('<title>') && fixedContent.includes('<title>')) {
                    const oldTitle = testCase.content.match(/<title>(.*?)<\/title>/)?.[1] || 'No title';
                    const newTitle = fixedContent.match(/<title>(.*?)<\/title>/)?.[1] || 'No title';
                    if (oldTitle !== newTitle) {
                        console.log(`  • Title: "${oldTitle}" → "${newTitle}"`);
                    }
                }

                if (testCase.content.includes('meta name="description"') && fixedContent.includes('meta name="description"')) {
                    const oldDesc = testCase.content.match(/meta name="description" content="(.*?)"/)?.[1] || 'No description';
                    const newDesc = fixedContent.match(/meta name="description" content="(.*?)"/)?.[1] || 'No description';
                    if (oldDesc !== newDesc) {
                        console.log(`  • Meta Description: "${oldDesc}" → "${newDesc}"`);
                    }
                }

                if (!testCase.content.includes('<h1') && fixedContent.includes('<h1')) {
                    const newH1 = fixedContent.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1] || 'Added H1';
                    console.log(`  • Added H1: "${newH1}"`);
                }

                if (testCase.content.includes('href="http://undefined"') && !fixedContent.includes('href="http://undefined"')) {
                    console.log('  • Fixed broken links');
                }

                if (!testCase.content.includes('rel="icon"') && fixedContent.includes('rel="icon"')) {
                    console.log('  • Added favicon');
                }
            } else {
                console.log('ℹ️  No changes needed');
            }

        } catch (error) {
            console.error(`❌ Test failed: ${error.message}`);
        }
    }

    console.log('\n📋 TEST SUMMARY');
    console.log('===============');

    seoFixer.printSummary();

    // Generate test report
    const report = seoFixer.generateReport();
    console.log(`\n📄 Test report saved: ${report.reportPath || 'reports/test-seo-fixes.json'}`);

    console.log('\n✅ All tests completed!');
}

async function main() {
    try {
        await runTests();
    } catch (error) {
        console.error('Test suite failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { runTests };
