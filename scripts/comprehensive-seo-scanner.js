#!/usr/bin/env node

/**
 * Comprehensive SEO Scanner for 11ty Blog
 * Scans all blog posts for SEO issues and generates detailed reports
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { JSDOM } = require('jsdom');

// Configuration
const BLOG_DIR = 'public/blog';
const REPORT_DIR = 'reports';
const REPORT_FILE = `${REPORT_DIR}/comprehensive-seo-report.json`;

class SEOScanner {
    constructor() {
        this.issues = {
            multipleH1Tags: [],
            missingCanonical: [],
            missingMetaDescription: [],
            duplicateMetaDescriptions: [],
            missingAltText: [],
            missingLangAttribute: [],
            nonAsciiUrls: [],
            excessiveDOMWidth: [],
            missingImageDimensions: [],
            nonDeferredImages: [],
            improperHeadingHierarchy: [],
            missingTableCaptions: [],
            lowWordCount: [],
            noOutgoingLinks: [],
            brokenInternalLinks: []
        };

        this.metaDescriptions = new Set();
    }

    scanForMultipleH1Tags(filePath, dom) {
        const h1Tags = dom.window.document.querySelectorAll('h1');
        if (h1Tags.length > 1) {
            this.issues.multipleH1Tags.push({
                file: filePath,
                count: h1Tags.length,
                tags: Array.from(h1Tags).map(h1 => h1.outerHTML)
            });
        }
    }

    scanCanonicalTags(filePath, dom) {
        const canonical = dom.window.document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            this.issues.missingCanonical.push(filePath);
        }
    }

    scanMetaDescriptions(filePath, dom) {
        const metaDescription = dom.window.document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            this.issues.missingMetaDescription.push(filePath);
        } else {
            const content = metaDescription.getAttribute('content');
            if (this.metaDescriptions.has(content)) {
                this.issues.duplicateMetaDescriptions.push({
                    file: filePath,
                    description: content
                });
            } else {
                this.metaDescriptions.add(content);
            }
        }
    }

    scanAltText(filePath, dom) {
        const images = dom.window.document.querySelectorAll('img');
        const missingAlt = [];

        images.forEach((img, index) => {
            const alt = img.getAttribute('alt');
            if (!alt || alt.trim() === '') {
                missingAlt.push({
                    index: index,
                    src: img.getAttribute('src'),
                    currentAlt: alt || ''
                });
            }
        });

        if (missingAlt.length > 0) {
            this.issues.missingAltText.push({
                file: filePath,
                count: missingAlt.length,
                images: missingAlt
            });
        }
    }

    scanLangAttribute(filePath, dom) {
        const html = dom.window.document.documentElement;
        if (!html.hasAttribute('lang')) {
            this.issues.missingLangAttribute.push(filePath);
        }
    }

    scanUrls(filePath) {
        // Check for non-ASCII characters in URL
        const urlMatch = filePath.match(/\/blog\/([^\/]+)\//);
        if (urlMatch) {
            const urlSlug = urlMatch[1];
            if (/[^\x00-\x7F]/.test(urlSlug)) {
                this.issues.nonAsciiUrls.push({
                    file: filePath,
                    url: urlSlug
                });
            }
        }
    }

    scanDOMWidth(filePath, dom) {
        const body = dom.window.document.body;
        if (body.scrollWidth > 2000) { // Excessive DOM width threshold
            this.issues.excessiveDOMWidth.push({
                file: filePath,
                width: body.scrollWidth
            });
        }
    }

    scanImageDimensions(filePath, dom) {
        const images = dom.window.document.querySelectorAll('img');
        const missingDimensions = [];

        images.forEach((img, index) => {
            if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
                missingDimensions.push({
                    index: index,
                    src: img.getAttribute('src')
                });
            }
        });

        if (missingDimensions.length > 0) {
            this.issues.missingImageDimensions.push({
                file: filePath,
                count: missingDimensions.length,
                images: missingDimensions
            });
        }
    }

    scanWordCount(filePath, dom) {
        const article = dom.window.document.querySelector('article') ||
                       dom.window.document.querySelector('.article_body') ||
                       dom.window.document.body;

        if (article) {
            const text = article.textContent || article.innerText || '';
            const wordCount = text.trim().split(/\s+/).length;

            if (wordCount < 300) { // Minimum word count threshold
                this.issues.lowWordCount.push({
                    file: filePath,
                    wordCount: wordCount
                });
            }
        }
    }

    scanOutgoingLinks(filePath, dom) {
        const currentUrl = filePath.replace('public', 'https://blog.evolvedlotus.com');
        const links = dom.window.document.querySelectorAll('a[href]');
        const outgoingLinks = [];

        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('/') &&
                !href.includes('evolvedlotus.com') && !href.includes('localhost')) {
                outgoingLinks.push(href);
            }
        });

        if (outgoingLinks.length === 0) {
            this.issues.noOutgoingLinks.push(filePath);
        }
    }

    scanInternalLinks(filePath, dom) {
        const links = dom.window.document.querySelectorAll('a[href^="/"], a[href^="https://blog.evolvedlotus.com"]');
        const brokenLinks = [];

        links.forEach((link, index) => {
            const href = link.getAttribute('href');
            // Basic check for potentially broken internal links
            if (href && (href.includes('undefined') || href.includes('null'))) {
                brokenLinks.push({
                    index: index,
                    href: href,
                    text: link.textContent.trim()
                });
            }
        });

        if (brokenLinks.length > 0) {
            this.issues.brokenInternalLinks.push({
                file: filePath,
                count: brokenLinks.length,
                links: brokenLinks
            });
        }
    }

    async scanFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const dom = new JSDOM(content);

            // Run all scans
            this.scanForMultipleH1Tags(filePath, dom);
            this.scanCanonicalTags(filePath, dom);
            this.scanMetaDescriptions(filePath, dom);
            this.scanAltText(filePath, dom);
            this.scanLangAttribute(filePath, dom);
            this.scanUrls(filePath);
            this.scanDOMWidth(filePath, dom);
            this.scanImageDimensions(filePath, dom);
            this.scanWordCount(filePath, dom);
            this.scanOutgoingLinks(filePath, dom);
            this.scanInternalLinks(filePath, dom);

        } catch (error) {
            console.error(`Error scanning ${filePath}:`, error.message);
        }
    }

    async scanAllBlogPosts() {
        console.log('🔍 Starting comprehensive SEO scan...');

        const pattern = `${BLOG_DIR}/**/index.html`;

        return new Promise((resolve, reject) => {
            glob(pattern, async (error, files) => {
                if (error) {
                    reject(error);
                    return;
                }

                console.log(`📂 Found ${files.length} blog posts to scan`);

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    process.stdout.write(`\r📊 Scanning: ${Math.round((i + 1) / files.length * 100)}%`);

                    await this.scanFile(file);
                }

                console.log('\n✅ Scan complete!');
                resolve();
            });
        });
    }

    generateReport() {
        const report = {
            scanDate: new Date().toISOString(),
            summary: {
                totalFilesScanned: Object.values(this.issues).reduce((total, issue) => total + issue.length, 0),
                totalIssues: Object.values(this.issues).reduce((total, issue) => total + issue.length, 0)
            },
            issues: this.issues
        };

        // Ensure reports directory exists
        if (!fs.existsSync(REPORT_DIR)) {
            fs.mkdirSync(REPORT_DIR, { recursive: true });
        }

        fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
        console.log(`📋 Report saved to: ${REPORT_FILE}`);

        return report;
    }

    printSummary() {
        console.log('\n📋 SCAN SUMMARY');
        console.log('================');

        Object.entries(this.issues).forEach(([issueType, issues]) => {
            if (issues.length > 0) {
                console.log(`❌ ${issueType}: ${issues.length} issues`);
            } else {
                console.log(`✅ ${issueType}: No issues`);
            }
        });
    }
}

async function main() {
    try {
        const scanner = new SEOScanner();

        await scanner.scanAllBlogPosts();
        const report = scanner.generateReport();
        scanner.printSummary();

        // Print detailed findings
        console.log('\n📋 DETAILED FINDINGS');
        console.log('====================');

        if (report.issues.multipleH1Tags.length > 0) {
            console.log(`\n❌ Multiple H1 Tags (${report.issues.multipleH1Tags.length} files):`);
            report.issues.multipleH1Tags.forEach(issue => {
                console.log(`  - ${issue.file} (${issue.count} H1 tags)`);
            });
        }

        if (report.issues.missingCanonical.length > 0) {
            console.log(`\n❌ Missing Canonical Tags (${report.issues.missingCanonical.length} files):`);
            report.issues.missingCanonical.forEach(file => {
                console.log(`  - ${file}`);
            });
        }

        if (report.issues.missingMetaDescription.length > 0) {
            console.log(`\n❌ Missing Meta Descriptions (${report.issues.missingMetaDescription.length} files):`);
            report.issues.missingMetaDescription.forEach(file => {
                console.log(`  - ${file}`);
            });
        }

        if (report.issues.missingAltText.length > 0) {
            console.log(`\n❌ Missing Alt Text (${report.issues.missingAltText.length} files):`);
            report.issues.missingAltText.forEach(issue => {
                console.log(`  - ${issue.file} (${issue.count} images)`);
            });
        }

        console.log(`\n🎯 Total Issues Found: ${report.summary.totalIssues}`);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = SEOScanner;
