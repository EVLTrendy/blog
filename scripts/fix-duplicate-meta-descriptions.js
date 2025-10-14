#!/usr/bin/env node

/**
 * Script to fix duplicate meta descriptions in blog posts
 * Generates unique, relevant meta descriptions based on post content
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { JSDOM } = require('jsdom');

// Configuration
const BLOG_DIR = 'public/blog';
const REPORT_DIR = 'reports';

class MetaDescriptionFixer {
    constructor() {
        this.fixed = [];
        this.errors = [];
    }

    extractContentPreview(content) {
        // Remove HTML tags and get first meaningful paragraph
        const text = content
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Find first meaningful sentence/paragraph
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 50);

        if (sentences.length > 0) {
            let preview = sentences[0].trim();
            // Limit to ~150 characters for meta description
            if (preview.length > 150) {
                preview = preview.substring(0, 147) + '...';
            }
            return preview;
        }

        return '';
    }

    generateMetaDescription(filePath, dom) {
        try {
            // Try to get description from existing meta tag first
            const existingMeta = dom.window.document.querySelector('meta[name="description"]');
            if (existingMeta) {
                const currentDesc = existingMeta.getAttribute('content');
                // Check if it's the problematic default description
                if (currentDesc.includes('Home Contact Us Tools Shop Blog header')) {
                    // Generate new description from content
                    const article = dom.window.document.querySelector('.article_body') ||
                                 dom.window.document.querySelector('main') ||
                                 dom.window.document.body;

                    if (article) {
                        const content = article.textContent || article.innerText || '';
                        const preview = this.extractContentPreview(content);

                        if (preview) {
                            return preview;
                        }
                    }

                    // Fallback: extract from title or first heading
                    const title = dom.window.document.querySelector('title');
                    if (title) {
                        const titleText = title.textContent.replace(' | EvolvedLotus Blog', '').trim();
                        return `${titleText} - Insights and strategies for content creators and digital marketers.`;
                    }
                }
            }

            return null; // No fix needed or possible
        } catch (error) {
            console.error(`Error generating meta description for ${filePath}:`, error.message);
            return null;
        }
    }

    fixMetaDescription(filePath, newDescription) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Replace the problematic meta description
            const updatedContent = content.replace(
                /(<meta name="description" content=")[^"]*(">)/,
                `$1${newDescription}$2`
            );

            if (updatedContent !== content) {
                fs.writeFileSync(filePath, updatedContent, 'utf8');
                this.fixed.push({ file: filePath, newDescription });
                console.log(`✅ Fixed meta description: ${filePath}`);
                return true;
            }

            return false;
        } catch (error) {
            this.errors.push({ file: filePath, error: error.message });
            console.error(`❌ Error fixing ${filePath}:`, error.message);
            return false;
        }
    }

    async processAllIssues() {
        console.log('🔍 Reading comprehensive SEO report...');

        const reportPath = `${REPORT_DIR}/comprehensive-seo-report.json`;
        if (!fs.existsSync(reportPath)) {
            console.error('❌ Comprehensive SEO report not found. Run the scanner first.');
            return;
        }

        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        const duplicateIssues = report.issues.duplicateMetaDescriptions;

        if (duplicateIssues.length === 0) {
            console.log('✅ No duplicate meta descriptions to fix!');
            return;
        }

        console.log(`🔧 Processing ${duplicateIssues.length} files with duplicate meta descriptions...`);

        for (let i = 0; i < duplicateIssues.length; i++) {
            const issue = duplicateIssues[i];
            process.stdout.write(`\r📊 Progress: ${Math.round((i + 1) / duplicateIssues.length * 100)}%`);

            try {
                const content = fs.readFileSync(issue.file, 'utf8');
                const dom = new JSDOM(content);

                const newDescription = this.generateMetaDescription(issue.file, dom);

                if (newDescription) {
                    this.fixMetaDescription(issue.file, newDescription);
                } else {
                    console.log(`⚠️  Could not generate meta description for: ${issue.file}`);
                }
            } catch (error) {
                this.errors.push({ file: issue.file, error: error.message });
                console.error(`❌ Error processing ${issue.file}:`, error.message);
            }
        }

        console.log('\n✅ Meta description fixes complete!');
    }

    printSummary() {
        console.log('\n📋 META DESCRIPTION FIX SUMMARY');
        console.log('==============================');
        console.log(`✅ Files fixed: ${this.fixed.length}`);
        console.log(`❌ Errors: ${this.errors.length}`);

        if (this.fixed.length > 0) {
            console.log('\n✅ Fixed files:');
            this.fixed.forEach(item => {
                console.log(`  - ${item.file}`);
                console.log(`    "${item.newDescription}"`);
            });
        }

        if (this.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.errors.forEach(item => {
                console.log(`  - ${item.file}: ${item.error}`);
            });
        }
    }
}

async function main() {
    try {
        const fixer = new MetaDescriptionFixer();
        await fixer.processAllIssues();
        fixer.printSummary();

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = MetaDescriptionFixer;
