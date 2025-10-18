#!/usr/bin/env node

/**
 * Eleventy SEO Fixer Plugin
 * Automatically detects and fixes SEO issues during build time
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class EleventySEOFixer {
    constructor() {
        this.issues = {
            titleIssues: [],
            metaDescriptionIssues: [],
            h1Issues: [],
            brokenLinks: [],
            missingFavicon: []
        };

        this.fixes = {
            titleFixes: [],
            metaDescriptionFixes: [],
            h1Fixes: [],
            linkFixes: [],
            faviconFixes: []
        };

        this.faviconAdded = false;
    }

    generateSEOTitle(data) {
        // Try frontmatter title first
        if (data.title) {
            return `${data.title} | EvolvedLotus Blog`;
        }

        // Fallback to filename-based title
        if (data.page && data.page.inputPath) {
            const filename = path.basename(data.page.inputPath, path.extname(data.page.inputPath));
            const cleanFilename = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `${cleanFilename} | EvolvedLotus Blog`;
        }

        return 'EvolvedLotus Blog';
    }

    generateMetaDescription(data) {
        // Try frontmatter description first
        if (data.description) {
            return data.description;
        }

        // Try excerpt
        if (data.excerpt) {
            return data.excerpt;
        }

        // Generate from content (first meaningful paragraph)
        if (data.content) {
            const text = data.content
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 50);
            if (sentences.length > 0) {
                let desc = sentences[0].trim();
                if (desc.length > 155) {
                    desc = desc.substring(0, 152) + '...';
                }
                return desc;
            }
        }

        return 'Insights and strategies for content creators and digital marketers.';
    }

    generateH1Tag(data) {
        if (data.title) {
            return `<h1 class="article_title">${data.title}</h1>`;
        }

        if (data.page && data.page.inputPath) {
            const filename = path.basename(data.page.inputPath, path.extname(data.page.inputPath));
            const cleanTitle = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `<h1 class="article_title">${cleanTitle}</h1>`;
        }

        return '<h1 class="article_title">Blog Post</h1>';
    }

    detectTitleIssues(content, outputPath, data) {
        try {
            const dom = new JSDOM(content);
            const doc = dom.window.document;

            const titleTag = doc.querySelector('title');
            const issues = [];

            if (!titleTag) {
                issues.push({
                    type: 'missing',
                    file: outputPath,
                    currentTitle: null,
                    suggestedTitle: this.generateSEOTitle(data)
                });
            } else {
                const titleText = titleTag.textContent.trim();
                if (titleText.length < 10) {
                    issues.push({
                        type: 'too-short',
                        file: outputPath,
                        currentTitle: titleText,
                        suggestedTitle: this.generateSEOTitle(data)
                    });
                }
            }

            return issues;
        } catch (error) {
            console.warn(`Warning: Error detecting title issues in ${outputPath}:`, error.message);
            return [];
        }
    }

    detectMetaDescriptionIssues(content, outputPath, data) {
        try {
            const dom = new JSDOM(content);
            const doc = dom.window.document;

            const metaDescriptions = doc.querySelectorAll('meta[name="description"]');
            const issues = [];

            if (metaDescriptions.length === 0) {
                issues.push({
                    type: 'missing',
                    file: outputPath,
                    currentDescription: null,
                    suggestedDescription: this.generateMetaDescription(data)
                });
            } else if (metaDescriptions.length > 1) {
                issues.push({
                    type: 'multiple',
                    file: outputPath,
                    count: metaDescriptions.length,
                    descriptions: Array.from(metaDescriptions).map(meta => meta.getAttribute('content'))
                });
            }

            return issues;
        } catch (error) {
            console.warn(`Warning: Error detecting meta description issues in ${outputPath}:`, error.message);
            return [];
        }
    }

    detectH1Issues(content, outputPath, data) {
        try {
            const dom = new JSDOM(content);
            const doc = dom.window.document;

            const h1Tags = doc.querySelectorAll('h1');
            const issues = [];

            if (h1Tags.length === 0) {
                issues.push({
                    type: 'missing',
                    file: outputPath,
                    suggestedH1: this.generateH1Tag(data)
                });
            } else if (h1Tags.length > 1) {
                issues.push({
                    type: 'multiple',
                    file: outputPath,
                    count: h1Tags.length,
                    tags: Array.from(h1Tags).map(h1 => h1.outerHTML)
                });
            }

            return issues;
        } catch (error) {
            console.warn(`Warning: Error detecting H1 issues in ${outputPath}:`, error.message);
            return [];
        }
    }

    detectBrokenLinks(content, outputPath) {
        try {
            const dom = new JSDOM(content);
            const doc = dom.window.document;

            const links = doc.querySelectorAll('a[href]');
            const brokenLinks = [];

            links.forEach((link, index) => {
                const href = link.getAttribute('href');

                // Check for obviously broken links
                if (href && (
                    href.includes('undefined') ||
                    href.includes('null') ||
                    href === '' ||
                    href.startsWith('http://undefined') ||
                    href.startsWith('https://undefined')
                )) {
                    brokenLinks.push({
                        index: index,
                        href: href,
                        text: link.textContent.trim(),
                        file: outputPath
                    });
                }
            });

            return brokenLinks;
        } catch (error) {
            console.warn(`Warning: Error detecting broken links in ${outputPath}:`, error.message);
            return [];
        }
    }

    detectMissingFavicon(content, outputPath) {
        try {
            const dom = new JSDOM(content);
            const doc = dom.window.document;

            const favicon = doc.querySelector('link[rel="icon"]') ||
                           doc.querySelector('link[rel="shortcut icon"]');

            if (!favicon) {
                return {
                    file: outputPath,
                    missing: true
                };
            }

            return null;
        } catch (error) {
            console.warn(`Warning: Error detecting missing favicon in ${outputPath}:`, error.message);
            return null;
        }
    }

    fixTitleIssues(content, issues) {
        let fixedContent = content;

        issues.forEach(issue => {
            if (issue.type === 'missing' || issue.type === 'too-short') {
                // Add or replace title tag
                const newTitle = issue.suggestedTitle;
                if (fixedContent.includes('<title>')) {
                    fixedContent = fixedContent.replace(
                        /<title>.*?<\/title>/,
                        `<title>${newTitle}</title>`
                    );
                } else {
                    // Insert title in head
                    fixedContent = fixedContent.replace(
                        /(<head[^>]*>)/,
                        `$1\n    <title>${newTitle}</title>`
                    );
                }

                this.fixes.titleFixes.push({
                    file: issue.file,
                    oldTitle: issue.currentTitle,
                    newTitle: newTitle
                });
            }
        });

        return fixedContent;
    }

    fixMetaDescriptionIssues(content, issues) {
        let fixedContent = content;

        issues.forEach(issue => {
            if (issue.type === 'missing') {
                // Add meta description
                const newDescription = issue.suggestedDescription;
                fixedContent = fixedContent.replace(
                    /(<head[^>]*>)/,
                    `$1\n    <meta name="description" content="${newDescription}">`
                );

                this.fixes.metaDescriptionFixes.push({
                    file: issue.file,
                    newDescription: newDescription
                });
            } else if (issue.type === 'multiple') {
                // Keep first description, remove others
                const descriptions = issue.descriptions;
                const keepDescription = descriptions[0];

                // Remove all meta descriptions
                fixedContent = fixedContent.replace(/<meta name="description"[^>]*>/g, '');

                // Add back the first one
                fixedContent = fixedContent.replace(
                    /(<head[^>]*>)/,
                    `$1\n    <meta name="description" content="${keepDescription}">`
                );

                this.fixes.metaDescriptionFixes.push({
                    file: issue.file,
                    removedCount: descriptions.length - 1,
                    keptDescription: keepDescription
                });
            }
        });

        return fixedContent;
    }

    fixH1Issues(content, issues) {
        let fixedContent = content;

        issues.forEach(issue => {
            if (issue.type === 'missing') {
                // Add H1 tag after the image div if it exists, otherwise after opening section
                const h1Tag = issue.suggestedH1;

                if (fixedContent.includes('<div class="imagediv">')) {
                    fixedContent = fixedContent.replace(
                        /(<div class="imagediv">[^<]*<\/div>\s*)/,
                        `$1\n  ${h1Tag}`
                    );
                } else {
                    fixedContent = fixedContent.replace(
                        /(<section class="articlesection">[^<]*)/,
                        `$1\n  ${h1Tag}`
                    );
                }

                this.fixes.h1Fixes.push({
                    file: issue.file,
                    addedH1: h1Tag
                });
            }
        });

        return fixedContent;
    }

    fixBrokenLinks(content, brokenLinks) {
        let fixedContent = content;

        brokenLinks.forEach(link => {
            // Mark broken links as disabled/marked
            fixedContent = fixedContent.replace(
                `href="${link.href}"`,
                `href="#" data-broken-link="true" title="Broken link: ${link.href}"`
            );

            this.fixes.linkFixes.push({
                file: link.file,
                brokenHref: link.href,
                linkText: link.text
            });
        });

        return fixedContent;
    }

    addFavicon(content) {
        if (this.faviconAdded || content.includes('rel="icon"') || content.includes('rel="shortcut icon"')) {
            return content;
        }

        // Add favicon link
        const faviconLink = '    <link rel="icon" type="image/x-icon" href="/favicon.ico">';
        const fixedContent = content.replace(
            /(<head[^>]*>)/,
            `$1\n${faviconLink}`
        );

        this.faviconAdded = true;
        return fixedContent;
    }

    scanAndFixContent(content, outputPath, data) {
        try {
            let fixedContent = content;

            // Detect issues
            const titleIssues = this.detectTitleIssues(content, outputPath, data);
            const metaDescIssues = this.detectMetaDescriptionIssues(content, outputPath, data);
            const h1Issues = this.detectH1Issues(content, outputPath, data);
            const brokenLinks = this.detectBrokenLinks(content, outputPath);
            const missingFavicon = this.detectMissingFavicon(content, outputPath);

            // Apply fixes
            if (titleIssues.length > 0) {
                fixedContent = this.fixTitleIssues(fixedContent, titleIssues);
                this.issues.titleIssues.push(...titleIssues);
            }

            if (metaDescIssues.length > 0) {
                fixedContent = this.fixMetaDescriptionIssues(fixedContent, metaDescIssues);
                this.issues.metaDescriptionIssues.push(...metaDescIssues);
            }

            if (h1Issues.length > 0) {
                fixedContent = this.fixH1Issues(fixedContent, h1Issues);
                this.issues.h1Issues.push(...h1Issues);
            }

            if (brokenLinks.length > 0) {
                fixedContent = this.fixBrokenLinks(fixedContent, brokenLinks);
                this.issues.brokenLinks.push(...brokenLinks);
            }

            if (missingFavicon) {
                fixedContent = this.addFavicon(fixedContent);
                this.issues.missingFavicon.push(missingFavicon);
            }

            return fixedContent;
        } catch (error) {
            console.warn(`Warning: Error in scanAndFixContent for ${outputPath}:`, error.message);
            return content; // Return original content if any error occurs
        }
    }

    generateReport() {
        const report = {
            scanDate: new Date().toISOString(),
            summary: {
                totalIssues: Object.values(this.issues).reduce((total, arr) => total + arr.length, 0),
                totalFixes: Object.values(this.fixes).reduce((total, arr) => total + arr.length, 0)
            },
            issues: this.issues,
            fixes: this.fixes
        };

        const reportDir = 'reports';
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const reportPath = `${reportDir}/eleventy-seo-fixes-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        return report;
    }

    printSummary() {
        console.log('\n📋 ELEVENTY SEO FIXER SUMMARY');
        console.log('==============================');

        Object.entries(this.issues).forEach(([issueType, issues]) => {
            if (issues.length > 0) {
                console.log(`❌ ${issueType}: ${issues.length} issues`);
            }
        });

        Object.entries(this.fixes).forEach(([fixType, fixes]) => {
            if (fixes.length > 0) {
                console.log(`✅ ${fixType}: ${fixes.length} fixes`);
            }
        });
    }
}

module.exports = EleventySEOFixer;
