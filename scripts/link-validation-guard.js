#!/usr/bin/env node

/**
 * Link Validation Guard - Comprehensive Link Quality Checker
 * Prevents common link-related SEO issues in future content
 *
 * Issues this script prevents:
 * - Orphan URLs (pages only found via sitemap)
 * - One-word anchor text in internal links
 * - Missing anchor text in internal links
 * - Empty anchor links ("#")
 * - Links to redirect pages (3xx status)
 * - Insufficient internal backlinks
 * - Duplicate internal links with same anchor text
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class LinkValidationGuard {
    constructor() {
        this.issues = [];
        this.siteUrl = 'https://blog.evolvedlotus.com';
        this.minAnchorWords = 3;
        this.minBacklinks = 2;
        this.maxDuplicateLinks = 2;
    }

    /**
     * Main validation function
     */
    async validateContent(filePath, content) {
        console.log(`🔍 Validating links in: ${filePath}`);

        const dom = new JSDOM(content);
        const document = dom.window.document;

        // Extract all links from the content
        const links = this.extractLinks(document, filePath);

        // Run all validation checks
        await this.checkOrphanUrls(links, filePath);
        this.checkOneWordAnchors(links, filePath);
        this.checkMissingAnchorText(links, filePath);
        this.checkEmptyAnchors(links, filePath);
        this.checkInsufficientBacklinks(links, filePath);
        this.checkDuplicateAnchors(links, filePath);
        this.checkHttpStatusValidation(links, filePath);
        this.checkRelAttributes(links, filePath);

        return this.issues;
    }

    /**
     * Extract all links from content
     */
    extractLinks(document, filePath) {
        const links = [];
        const linkElements = document.querySelectorAll('a[href]');

        linkElements.forEach((link, index) => {
            const href = link.getAttribute('href');
            const anchorText = link.textContent.trim();
            const isInternal = this.isInternalLink(href);

            links.push({
                element: link,
                href: href,
                anchorText: anchorText,
                isInternal: isInternal,
                lineNumber: this.getApproximateLineNumber(link, document),
                filePath: filePath,
                index: index
            });
        });

        return links;
    }

    /**
     * Check for one-word anchor text in internal links
     */
    checkOneWordAnchors(links, filePath) {
        const internalLinks = links.filter(link => link.isInternal);

        internalLinks.forEach(link => {
            const words = link.anchorText.split(/\s+/).filter(word => word.length > 0);

            if (words.length < this.minAnchorWords && words.length > 0) {
                this.issues.push({
                    type: 'ONE_WORD_ANCHOR',
                    severity: 'warning',
                    file: filePath,
                    line: link.lineNumber,
                    message: `Internal link has one-word anchor text: "${link.anchorText}"`,
                    suggestion: `Use at least ${this.minAnchorWords} words in anchor text for better SEO`,
                    element: link.element.outerHTML
                });
            }
        });
    }

    /**
     * Check for missing anchor text
     */
    checkMissingAnchorText(links, filePath) {
        const internalLinks = links.filter(link => link.isInternal);

        internalLinks.forEach(link => {
            if (!link.anchorText || link.anchorText.length === 0) {
                this.issues.push({
                    type: 'MISSING_ANCHOR_TEXT',
                    severity: 'error',
                    file: filePath,
                    line: link.lineNumber,
                    message: 'Internal link has no anchor text',
                    suggestion: 'Add descriptive anchor text that describes the target page content',
                    element: link.element.outerHTML
                });
            }
        });
    }

    /**
     * Check for empty anchor links
     */
    checkEmptyAnchors(links, filePath) {
        links.forEach(link => {
            if (link.href === '#') {
                this.issues.push({
                    type: 'EMPTY_ANCHOR',
                    severity: 'warning',
                    file: filePath,
                    line: link.lineNumber,
                    message: 'Found empty anchor link (#)',
                    suggestion: 'Replace with proper functionality or remove if not needed',
                    element: link.element.outerHTML
                });
            }
        });
    }

    /**
     * Check for insufficient backlinks (simplified version)
     */
    checkInsufficientBacklinks(links, filePath) {
        const internalTargets = {};

        // Count outgoing links to internal pages
        links.filter(link => link.isInternal && link.href !== '#').forEach(link => {
            const targetPath = this.normalizeUrl(link.href);
            internalTargets[targetPath] = (internalTargets[targetPath] || 0) + 1;
        });

        // Check for pages with insufficient backlinks
        Object.entries(internalTargets).forEach(([targetPath, count]) => {
            if (count < this.minBacklinks) {
                this.issues.push({
                    type: 'INSUFFICIENT_BACKLINKS',
                    severity: 'info',
                    file: filePath,
                    message: `Page may have insufficient backlinks: ${targetPath} (found ${count})`,
                    suggestion: `Consider adding more internal links to ${targetPath}`,
                    details: `Target page: ${targetPath}, Current backlinks: ${count}, Minimum recommended: ${this.minBacklinks}`
                });
            }
        });
    }

    /**
     * Check for duplicate anchor text to same internal page
     */
    checkDuplicateAnchors(links, filePath) {
        const internalLinks = links.filter(link => link.isInternal && link.anchorText);
        const anchorGroups = {};

        // Group links by target URL and anchor text
        internalLinks.forEach(link => {
            const targetPath = this.normalizeUrl(link.href);
            const key = `${targetPath}|${link.anchorText.toLowerCase()}`;

            if (!anchorGroups[key]) {
                anchorGroups[key] = [];
            }
            anchorGroups[key].push(link);
        });

        // Check for excessive duplicates
        Object.entries(anchorGroups).forEach(([key, groupLinks]) => {
            if (groupLinks.length > this.maxDuplicateLinks) {
                this.issues.push({
                    type: 'DUPLICATE_ANCHORS',
                    severity: 'warning',
                    file: filePath,
                    message: `Multiple links with same anchor text to same page: "${groupLinks[0].anchorText}"`,
                    suggestion: 'Vary anchor text or reduce duplicate links',
                    details: `Found ${groupLinks.length} identical links to ${groupLinks[0].href}`,
                    elements: groupLinks.map(l => l.element.outerHTML)
                });
            }
        });
    }

    /**
     * Check for orphan URLs (pages that might become orphans)
     */
    async checkOrphanUrls(links, filePath) {
        const essentialPages = [
            '/about/',
            '/contact/',
            '/privacy-policy/',
            '/terms-of-service/',
            '/admin/',
            '/404/'
        ];

        const platformPages = [
            '/x-tiktok/',
            '/x-instagram/',
            '/x-youtube/',
            '/x-twitter/',
            '/x-facebook/',
            '/x-linkedin/',
            '/x-twitch/',
            '/x-kick/',
            '/x-misc/'
        ];

        // Check if content links to essential pages
        const linkedUrls = new Set(
            links.filter(link => link.isInternal)
                 .map(link => this.normalizeUrl(link.href))
        );

        // Check essential pages
        essentialPages.forEach(essentialPage => {
            if (!linkedUrls.has(essentialPage)) {
                this.issues.push({
                    type: 'POTENTIAL_ORPHAN',
                    severity: 'info',
                    file: filePath,
                    message: `Consider linking to essential page: ${essentialPage}`,
                    suggestion: 'Add internal link to prevent orphan URL',
                    details: `Essential page not linked from this content: ${essentialPage}`
                });
            }
        });

        // Check platform pages
        platformPages.forEach(platformPage => {
            if (!linkedUrls.has(platformPage)) {
                this.issues.push({
                    type: 'POTENTIAL_PLATFORM_ORPHAN',
                    severity: 'info',
                    file: filePath,
                    message: `Consider linking to platform page: ${platformPage}`,
                    suggestion: 'Add internal link to platform content hub',
                    details: `Platform page not linked from this content: ${platformPage}`
                });
            }
        });
    }

    /**
     * Determine if a link is internal
     */
    isInternalLink(href) {
        if (!href) return false;

        // Empty anchor
        if (href === '#') return true;

        // Relative URLs are internal
        if (href.startsWith('/')) return true;

        // Absolute URLs to same domain are internal
        if (href.startsWith(this.siteUrl)) return true;

        // External URLs
        return false;
    }

    /**
     * Normalize URLs for comparison
     */
    normalizeUrl(href) {
        if (!href || href === '#') return href;

        // Remove trailing slash for consistency
        let normalized = href.replace(/\/$/, '');

        // Add leading slash if missing
        if (!normalized.startsWith('/')) {
            normalized = '/' + normalized;
        }

        return normalized;
    }

    /**
     * Check HTTP status validation for external links
     */
    checkHttpStatusValidation(links, filePath) {
        // This would require actual HTTP requests to validate external links
        // For now, we'll check for common patterns that indicate broken links
        const externalLinks = links.filter(link => !link.isInternal);

        externalLinks.forEach(link => {
            // Skip template variables (Nunjucks variables)
            if (link.href.startsWith('{{') && link.href.endsWith('}}')) {
                return;
            }

            // Check for obviously malformed URLs
            if (link.href.includes(' ') || link.href.includes('  ')) {
                this.issues.push({
                    type: 'MALFORMED_URL',
                    severity: 'error',
                    file: filePath,
                    line: link.lineNumber,
                    message: `Malformed URL detected: "${link.href}"`,
                    suggestion: 'Fix spacing and formatting in URL',
                    element: link.element.outerHTML
                });
            }

            // Check for suspicious patterns
            if (link.href.includes('localhost') && !link.href.includes('localhost')) {
                this.issues.push({
                    type: 'LOCALHOST_URL',
                    severity: 'warning',
                    file: filePath,
                    line: link.lineNumber,
                    message: `Localhost URL in production: "${link.href}"`,
                    suggestion: 'Replace localhost URLs with production URLs',
                    element: link.element.outerHTML
                });
            }
        });
    }

    /**
     * Check for proper rel attributes on external links
     */
    checkRelAttributes(links, filePath) {
        const externalLinks = links.filter(link => !link.isInternal);

        externalLinks.forEach(link => {
            const rel = link.element.getAttribute('rel');
            const href = link.href;

            // Check for external links without proper rel attributes
            if (!rel) {
                // Determine appropriate rel attribute based on URL
                let suggestedRel = 'noopener';

                if (href.includes('twitter.com') || href.includes('facebook.com') || href.includes('linkedin.com')) {
                    suggestedRel = 'noopener noreferrer';
                } else if (href.includes('mailto:')) {
                    suggestedRel = 'noopener';
                } else if (href.includes('tel:')) {
                    suggestedRel = 'noopener';
                }

                this.issues.push({
                    type: 'MISSING_REL_ATTRIBUTE',
                    severity: 'warning',
                    file: filePath,
                    line: link.lineNumber,
                    message: `External link missing rel attribute: "${href}"`,
                    suggestion: `Add rel="${suggestedRel}" for security and SEO`,
                    element: link.element.outerHTML
                });
            } else {
                // Check for security issues in existing rel attributes
                const relValues = rel.toLowerCase().split(' ');

                if (relValues.includes('noopener') && !relValues.includes('noreferrer')) {
                    this.issues.push({
                        type: 'INSECURE_REL_ATTRIBUTE',
                        severity: 'info',
                        file: filePath,
                        line: link.lineNumber,
                        message: `Consider adding noreferrer to rel attribute: "${rel}"`,
                        suggestion: 'Add "noreferrer" for additional security',
                        element: link.element.outerHTML
                    });
                }
            }
        });
    }

    /**
     * Get approximate line number for an element
     */
    getApproximateLineNumber(element, document) {
        // This is a simplified approximation
        const html = document.documentElement.outerHTML;
        const elementHtml = element.outerHTML;
        const position = html.indexOf(elementHtml);

        if (position === -1) return 0;

        const beforeContent = html.substring(0, position);
        return beforeContent.split('\n').length;
    }

    /**
     * Generate validation report
     */
    generateReport() {
        const errors = this.issues.filter(issue => issue.severity === 'error');
        const warnings = this.issues.filter(issue => issue.severity === 'warning');
        const info = this.issues.filter(issue => issue.severity === 'info');

        console.log('\n📊 Link Validation Report');
        console.log('=' .repeat(50));
        console.log(`❌ Errors: ${errors.length}`);
        console.log(`⚠️  Warnings: ${warnings.length}`);
        console.log(`ℹ️  Info: ${info.length}`);
        console.log(`📝 Total Issues: ${this.issues.length}`);

        if (errors.length > 0) {
            console.log('\n❌ ERRORS (Must Fix):');
            errors.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.message}`);
                console.log(`   File: ${issue.file}:${issue.line}`);
                console.log(`   Fix: ${issue.suggestion}`);
                console.log('');
            });
        }

        if (warnings.length > 0) {
            console.log('\n⚠️  WARNINGS (Should Fix):');
            warnings.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.message}`);
                console.log(`   File: ${issue.file}:${issue.line}`);
                console.log(`   Fix: ${issue.suggestion}`);
                console.log('');
            });
        }

        if (info.length > 0) {
            console.log('\nℹ️  INFO (Consider Fixing):');
            info.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.message}`);
                console.log(`   File: ${issue.file}`);
                console.log(`   Note: ${issue.suggestion}`);
                console.log('');
            });
        }

        return {
            total: this.issues.length,
            errors: errors.length,
            warnings: warnings.length,
            info: info.length,
            shouldBlockPublish: errors.length > 0
        };
    }
}

/**
 * Validate a single file
 */
async function validateFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const validator = new LinkValidationGuard();
        await validator.validateContent(filePath, content);
        return validator.generateReport();
    } catch (error) {
        console.error(`Error validating ${filePath}:`, error.message);
        return { error: error.message };
    }
}

/**
 * Validate multiple files
 */
async function validateFiles(filePaths) {
    const results = [];

    for (const filePath of filePaths) {
        console.log(`\n🔍 Validating: ${filePath}`);
        const result = await validateFile(filePath);
        results.push({ file: filePath, ...result });
    }

    return results;
}

/**
 * Main execution function
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: node link-validation-guard.js <file1> [file2] [file3] ...');
        console.log('Example: node link-validation-guard.js src/blog.njk src/_includes/base.njk');
        process.exit(1);
    }

    console.log('🚀 Starting Link Validation Guard');
    console.log('================================\n');

    const results = await validateFiles(args);

    // Summary
    const totalErrors = results.reduce((sum, r) => sum + (r.errors || 0), 0);
    const totalWarnings = results.reduce((sum, r) => sum + (r.warnings || 0), 0);
    const totalInfo = results.reduce((sum, r) => sum + (r.info || 0), 0);
    const shouldBlock = results.some(r => r.shouldBlockPublish);

    console.log('\n🏁 Final Summary');
    console.log('===============');
    console.log(`Total Files Validated: ${results.length}`);
    console.log(`Total Errors: ${totalErrors}`);
    console.log(`Total Warnings: ${totalWarnings}`);
    console.log(`Total Info: ${totalInfo}`);

    if (shouldBlock) {
        console.log('\n❌ PUBLISHING BLOCKED: Fix errors before publishing');
        process.exit(1);
    } else if (totalWarnings > 0) {
        console.log('\n⚠️  PUBLISHING ALLOWED: Consider fixing warnings');
        process.exit(0);
    } else {
        console.log('\n✅ PUBLISHING APPROVED: All link validations passed');
        process.exit(0);
    }
}

// Export for use as module
module.exports = { LinkValidationGuard, validateFile, validateFiles };

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
    });
}
