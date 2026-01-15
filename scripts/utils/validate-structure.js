#!/usr/bin/env node

/**
 * Validate Project Structure
 * 
 * This script checks that files are in the correct directories
 * and follows the project's organization standards.
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

// Check for CSS files in wrong location
const srcFiles = fs.readdirSync('src');
const cssFilesInRoot = srcFiles.filter(file => file.endsWith('.css'));

if (cssFilesInRoot.length > 0) {
    errors.push(`❌ CSS files found in src/ root. Move to src/assets/css/:`);
    cssFilesInRoot.forEach(file => {
        errors.push(`   - ${file}`);
    });
}

// Check for pages with x- prefix in topics
if (fs.existsSync('src/topics')) {
    const topicFiles = fs.readdirSync('src/topics');
    const oldNamingFiles = topicFiles.filter(file => file.startsWith('x-'));

    if (oldNamingFiles.length > 0) {
        warnings.push(`⚠️  Old naming convention found in src/topics/:`);
        oldNamingFiles.forEach(file => {
            warnings.push(`   - ${file} (should use full platform name)`);
        });
    }
}

// Check for utility files in src root
const utilityFiles = ['feed.njk', 'sitemap.xml.njk', 'hub-feeds.njk'];
const utilsInRoot = srcFiles.filter(file => utilityFiles.includes(file));

if (utilsInRoot.length > 0) {
    errors.push(`❌ Utility files found in src/ root. Move to src/utils/:`);
    utilsInRoot.forEach(file => {
        errors.push(`   - ${file}`);
    });
}

// Check for log files in root
const rootFiles = fs.readdirSync('.');
const logFiles = rootFiles.filter(file => file.endsWith('.log'));

if (logFiles.length > 0) {
    warnings.push(`⚠️  Log files found in root (should be in logs/ and gitignored):`);
    logFiles.forEach(file => {
        warnings.push(`   - ${file}`);
    });
}

// Check for report files in root
const reportFiles = rootFiles.filter(file =>
    file.endsWith('.json') &&
    (file.includes('report') || file.includes('scan') || file === 'outcome.txt')
);

if (reportFiles.length > 0) {
    warnings.push(`⚠️  Report files found in root (should be in reports/):`);
    reportFiles.forEach(file => {
        warnings.push(`   - ${file}`);
    });
}

// Check for pages without permalinks
const checkPermalinks = (dir) => {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            checkPermalinks(filePath);
        } else if (file.endsWith('.njk') && !file.startsWith('_')) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (!content.includes('permalink:')) {
                warnings.push(`⚠️  Missing permalink in: ${filePath}`);
            }
        }
    });
};

checkPermalinks('src/pages');

// Print results
console.log('\n🔍 Project Structure Validation\n');

if (errors.length > 0) {
    console.log('ERRORS:\n');
    errors.forEach(err => console.log(err));
    console.log('');
}

if (warnings.length > 0) {
    console.log('WARNINGS:\n');
    warnings.forEach(warn => console.log(warn));
    console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All structure checks passed!\n');
    process.exit(0);
} else {
    console.log(`\n📊 Summary: ${errors.length} errors, ${warnings.length} warnings\n`);

    if (errors.length > 0) {
        console.log('Please fix errors before committing.\n');
        process.exit(1);
    } else {
        console.log('Consider addressing warnings to maintain code quality.\n');
        process.exit(0);
    }
}
