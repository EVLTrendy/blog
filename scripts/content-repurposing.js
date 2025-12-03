// Content Repurposing System
// Converts top-performing blog posts into multiple formats: YouTube videos, TikTok series, Instagram carousels, Email newsletters, Podcast episodes

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const CONFIG = {
    contentDir: path.join(__dirname, '../src/blog'),
    outputDir: path.join(__dirname, '../reports'),
    repurposingDir: path.join(__dirname, '../content-repurposing'),
    minPerformanceScore: 70, // Minimum score to consider for repurposing
    platforms: ['youtube', 'tiktok', 'instagram', 'email', 'podcast']
};

// Ensure directories exist
[CONFIG.outputDir, CONFIG.repurposingDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

class ContentRepurposer {
    constructor() {
        this.posts = [];
        this.repurposingPlans = [];
        this.performanceData = this.loadPerformanceData();
    }

    // Load performance data (simulated - would come from analytics)
    loadPerformanceData() {
        const perfFile = path.join(CONFIG.outputDir, 'content-performance.json');

        if (fs.existsSync(perfFile)) {
            return JSON.parse(fs.readFileSync(perfFile, 'utf-8'));
        }

        // Default performance data structure
        return {
            lastUpdated: new Date().toISOString(),
            posts: {}
        };
    }

    // Load all blog posts
    loadPosts() {
        const files = fs.readdirSync(CONFIG.contentDir)
            .filter(file => file.endsWith('.md'));

        this.posts = files.map(file => {
            const filePath = path.join(CONFIG.contentDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const { data, content: body } = matter(content);

            const performanceScore = this.calculatePerformanceScore(file, data, body);

            return {
                filename: file,
                title: data.title || 'Untitled',
                description: data.description || '',
                date: data.date ? new Date(data.date) : null,
                hub: data.hub || 'uncategorized',
                tags: data.tags || [],
                author: data.author || 'Unknown',
                readingTime: data.readingTime || this.estimateReadingTime(body),
                wordCount: this.countWords(body),
                body,
                performanceScore,
                repurposingPotential: this.assessRepurposingPotential(data, body, performanceScore)
            };
        }).filter(post => post.date);

        console.log(`✅ Loaded ${this.posts.length} posts`);
    }

    // Calculate performance score (0-100)
    calculatePerformanceScore(filename, frontmatter, body) {
        // If we have actual performance data, use it
        if (this.performanceData.posts[filename]) {
            return this.performanceData.posts[filename].score;
        }

        // Otherwise, estimate based on content quality indicators
        let score = 50; // Base score

        // Word count bonus (longer = more comprehensive)
        const wordCount = this.countWords(body);
        if (wordCount > 2000) score += 15;
        else if (wordCount > 1500) score += 10;
        else if (wordCount > 1000) score += 5;

        // Has images
        if (frontmatter.image) score += 10;

        // Has good SEO
        if (frontmatter.seo?.focusKeyword) score += 5;

        // Recent content bonus
        if (frontmatter.date) {
            const monthsOld = (Date.now() - new Date(frontmatter.date)) / (1000 * 60 * 60 * 24 * 30);
            if (monthsOld < 3) score += 10;
            else if (monthsOld < 6) score += 5;
        }

        // Has structured content (headings)
        const headingCount = (body.match(/^#{2,3}\s/gm) || []).length;
        if (headingCount >= 5) score += 10;

        return Math.min(100, score);
    }

    // Assess repurposing potential for each platform
    assessRepurposingPotential(frontmatter, body, performanceScore) {
        const potential = {};

        // YouTube Video potential
        potential.youtube = {
            score: this.calculateYouTubePotential(frontmatter, body, performanceScore),
            format: 'Long-form tutorial video (8-15 min)',
            effort: 'high',
            estimatedViews: this.estimateViews('youtube', performanceScore)
        };

        // TikTok Series potential
        potential.tiktok = {
            score: this.calculateTikTokPotential(frontmatter, body, performanceScore),
            format: '3-5 part series (60 sec each)',
            effort: 'medium',
            estimatedViews: this.estimateViews('tiktok', performanceScore)
        };

        // Instagram Carousel potential
        potential.instagram = {
            score: this.calculateInstagramPotential(frontmatter, body, performanceScore),
            format: '10-slide carousel',
            effort: 'medium',
            estimatedViews: this.estimateViews('instagram', performanceScore)
        };

        // Email Newsletter potential
        potential.email = {
            score: this.calculateEmailPotential(frontmatter, body, performanceScore),
            format: 'Newsletter feature or series',
            effort: 'low',
            estimatedOpens: this.estimateOpens(performanceScore)
        };

        // Podcast Episode potential
        potential.podcast = {
            score: this.calculatePodcastPotential(frontmatter, body, performanceScore),
            format: '15-25 min episode',
            effort: 'high',
            estimatedListens: this.estimateListens(performanceScore)
        };

        return potential;
    }

    // Calculate YouTube potential
    calculateYouTubePotential(frontmatter, body, baseScore) {
        let score = baseScore * 0.7; // Start with 70% of base score

        // Tutorial/how-to content is great for YouTube
        if (this.containsKeywords(frontmatter.title + ' ' + body, ['how to', 'tutorial', 'guide', 'step by step'])) {
            score += 15;
        }

        // Visual content indicators
        if (this.containsKeywords(body, ['screenshot', 'image', 'example', 'demo'])) {
            score += 10;
        }

        // Good for hubs
        if (['tiktok', 'youtube', 'instagram'].includes(frontmatter.hub)) {
            score += 10;
        }

        return Math.min(100, Math.round(score));
    }

    // Calculate TikTok potential
    calculateTikTokPotential(frontmatter, body, baseScore) {
        let score = baseScore * 0.6;

        // Quick tips work well
        const tipCount = (body.match(/^[-*]\s/gm) || []).length;
        if (tipCount >= 5) score += 20;

        // Trending topics
        if (frontmatter.hub === 'tiktok') score += 15;

        // Actionable content
        if (this.containsKeywords(body, ['tip', 'hack', 'trick', 'secret', 'mistake'])) {
            score += 10;
        }

        return Math.min(100, Math.round(score));
    }

    // Calculate Instagram potential
    calculateInstagramPotential(frontmatter, body, baseScore) {
        let score = baseScore * 0.65;

        // Visual/aesthetic content
        if (['instagram', 'tiktok'].includes(frontmatter.hub)) score += 15;

        // List-based content (perfect for carousels)
        const listCount = (body.match(/^#{2,3}\s/gm) || []).length;
        if (listCount >= 5) score += 15;

        // Quotable content
        if (this.containsKeywords(body, ['quote', 'stat', 'fact', 'data'])) {
            score += 10;
        }

        return Math.min(100, Math.round(score));
    }

    // Calculate Email potential
    calculateEmailPotential(frontmatter, body, baseScore) {
        let score = baseScore * 0.8; // Email is easier to repurpose

        // Comprehensive guides work well
        if (this.countWords(body) > 1500) score += 15;

        // Actionable content
        if (this.containsKeywords(body, ['checklist', 'template', 'resource', 'download'])) {
            score += 10;
        }

        return Math.min(100, Math.round(score));
    }

    // Calculate Podcast potential
    calculatePodcastPotential(frontmatter, body, baseScore) {
        let score = baseScore * 0.5; // Podcasts require most adaptation

        // Story-driven or opinion content
        if (this.containsKeywords(body, ['story', 'experience', 'opinion', 'trend', 'future'])) {
            score += 20;
        }

        // Interview-style content
        if (this.containsKeywords(body, ['expert', 'interview', 'case study'])) {
            score += 15;
        }

        return Math.min(100, Math.round(score));
    }

    // Helper: Check if text contains keywords
    containsKeywords(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
    }

    // Helper: Count words
    countWords(text) {
        return text.split(/\s+/).filter(word => word.length > 0).length;
    }

    // Helper: Estimate reading time
    estimateReadingTime(text) {
        const words = this.countWords(text);
        return Math.ceil(words / 200); // 200 words per minute
    }

    // Estimate views for platform
    estimateViews(platform, performanceScore) {
        const multipliers = {
            youtube: 500,
            tiktok: 2000,
            instagram: 1000
        };

        const baseViews = (performanceScore / 100) * multipliers[platform];
        return Math.round(baseViews);
    }

    // Estimate email opens
    estimateOpens(performanceScore) {
        const baseOpens = (performanceScore / 100) * 300; // Assuming 1000 subscriber list with 30% open rate
        return Math.round(baseOpens);
    }

    // Estimate podcast listens
    estimateListens(performanceScore) {
        const baseListens = (performanceScore / 100) * 200;
        return Math.round(baseListens);
    }

    // Generate repurposing plans
    generateRepurposingPlans() {
        // Get top-performing posts
        const topPosts = this.posts
            .filter(post => post.performanceScore >= CONFIG.minPerformanceScore)
            .sort((a, b) => b.performanceScore - a.performanceScore);

        console.log(`📊 Found ${topPosts.length} high-performing posts for repurposing`);

        topPosts.forEach(post => {
            const plans = [];

            // Evaluate each platform
            CONFIG.platforms.forEach(platform => {
                const potential = post.repurposingPotential[platform];

                if (potential && potential.score >= 60) {
                    plans.push({
                        platform,
                        score: potential.score,
                        format: potential.format,
                        effort: potential.effort,
                        estimatedReach: potential.estimatedViews || potential.estimatedOpens || potential.estimatedListens,
                        priority: this.calculatePriority(potential.score, potential.effort),
                        outline: this.generateOutline(post, platform)
                    });
                }
            });

            if (plans.length > 0) {
                this.repurposingPlans.push({
                    post: {
                        filename: post.filename,
                        title: post.title,
                        hub: post.hub,
                        performanceScore: post.performanceScore,
                        wordCount: post.wordCount
                    },
                    platforms: plans.sort((a, b) => {
                        const priorityOrder = { high: 0, medium: 1, low: 2 };
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                    })
                });
            }
        });

        console.log(`✅ Generated ${this.repurposingPlans.length} repurposing plans`);
    }

    // Calculate priority based on score and effort
    calculatePriority(score, effort) {
        if (score >= 80 && effort !== 'high') return 'high';
        if (score >= 70 || effort === 'low') return 'medium';
        return 'low';
    }

    // Generate content outline for platform
    generateOutline(post, platform) {
        const outlines = {
            youtube: this.generateYouTubeOutline(post),
            tiktok: this.generateTikTokOutline(post),
            instagram: this.generateInstagramOutline(post),
            email: this.generateEmailOutline(post),
            podcast: this.generatePodcastOutline(post)
        };

        return outlines[platform] || [];
    }

    // Generate YouTube outline
    generateYouTubeOutline(post) {
        return [
            { section: 'Hook', duration: '0:00-0:30', content: `Attention-grabbing intro about ${post.title}` },
            { section: 'Introduction', duration: '0:30-1:30', content: 'What viewers will learn and why it matters' },
            { section: 'Main Content', duration: '1:30-10:00', content: 'Step-by-step walkthrough with screen recordings' },
            { section: 'Examples', duration: '10:00-12:00', content: 'Real-world examples and demonstrations' },
            { section: 'Call to Action', duration: '12:00-13:00', content: 'Subscribe, download resources, visit blog' }
        ];
    }

    // Generate TikTok outline
    generateTikTokOutline(post) {
        return [
            { part: 1, hook: 'Surprising stat or question', content: 'Introduce the problem' },
            { part: 2, hook: 'Reference part 1', content: 'First 2-3 tips' },
            { part: 3, hook: 'Reference series', content: 'Next 2-3 tips' },
            { part: 4, hook: 'Final tips', content: 'Last tips + bonus' },
            { part: 5, hook: 'Recap series', content: 'Summary + CTA to blog' }
        ];
    }

    // Generate Instagram outline
    generateInstagramOutline(post) {
        return [
            { slide: 1, type: 'Cover', content: `Eye-catching title: "${post.title}"` },
            { slide: 2, type: 'Problem', content: 'Identify the pain point' },
            { slide: 3 - 7, type: 'Tips', content: 'One tip per slide with visual' },
            { slide: 8, type: 'Bonus', content: 'Extra tip or resource' },
            { slide: 9, type: 'Summary', content: 'Quick recap' },
            { slide: 10, type: 'CTA', content: 'Link in bio to full blog post' }
        ];
    }

    // Generate Email outline
    generateEmailOutline(post) {
        return [
            { section: 'Subject Line', content: `Compelling subject based on ${post.title}` },
            { section: 'Preview Text', content: 'Teaser of main benefit' },
            { section: 'Opening', content: 'Personal greeting + hook' },
            { section: 'Main Content', content: 'Condensed version of blog post' },
            { section: 'Resources', content: 'Link to full post + downloadables' },
            { section: 'CTA', content: 'Read more on blog' },
            { section: 'PS', content: 'Additional tip or upcoming content teaser' }
        ];
    }

    // Generate Podcast outline
    generatePodcastOutline(post) {
        return [
            { segment: 'Intro', duration: '0-2 min', content: 'Podcast intro + episode topic' },
            { segment: 'Context', duration: '2-5 min', content: 'Why this topic matters now' },
            { segment: 'Deep Dive', duration: '5-15 min', content: 'Discuss main points conversationally' },
            { segment: 'Stories', duration: '15-20 min', content: 'Personal experiences or case studies' },
            { segment: 'Takeaways', duration: '20-23 min', content: 'Key actionable insights' },
            { segment: 'Outro', duration: '23-25 min', content: 'CTA to blog, subscribe, next episode' }
        ];
    }

    // Generate detailed repurposing guides
    generateRepurposingGuides() {
        this.repurposingPlans.forEach(plan => {
            const guideDir = path.join(CONFIG.repurposingDir, plan.post.filename.replace('.md', ''));

            if (!fs.existsSync(guideDir)) {
                fs.mkdirSync(guideDir, { recursive: true });
            }

            plan.platforms.forEach(platform => {
                const guidePath = path.join(guideDir, `${platform.platform}-guide.md`);
                const guide = this.formatPlatformGuide(plan.post, platform);
                fs.writeFileSync(guidePath, guide);
            });
        });

        console.log(`✅ Generated repurposing guides in ${CONFIG.repurposingDir}`);
    }

    // Format platform-specific guide
    formatPlatformGuide(post, platform) {
        let guide = `# ${platform.platform.toUpperCase()} Repurposing Guide\n\n`;
        guide += `**Original Post:** ${post.title}\n`;
        guide += `**Performance Score:** ${post.performanceScore}/100\n`;
        guide += `**Repurposing Score:** ${platform.score}/100\n`;
        guide += `**Priority:** ${platform.priority}\n`;
        guide += `**Effort Level:** ${platform.effort}\n`;
        guide += `**Estimated Reach:** ${platform.estimatedReach}\n\n`;

        guide += `## Format\n\n${platform.format}\n\n`;

        guide += `## Content Outline\n\n`;
        platform.outline.forEach((item, i) => {
            guide += `### ${i + 1}. `;
            if (item.section) guide += `${item.section}\n`;
            else if (item.part) guide += `Part ${item.part}\n`;
            else if (item.slide) guide += `Slide ${item.slide}\n`;
            else if (item.segment) guide += `${item.segment}\n`;

            Object.entries(item).forEach(([key, value]) => {
                if (key !== 'section' && key !== 'part' && key !== 'slide' && key !== 'segment') {
                    guide += `- **${key}:** ${value}\n`;
                }
            });
            guide += `\n`;
        });

        guide += `## Production Checklist\n\n`;
        guide += this.generateProductionChecklist(platform.platform);

        guide += `\n## Performance Tracking\n\n`;
        guide += `- [ ] Content created\n`;
        guide += `- [ ] Published on ${platform.platform}\n`;
        guide += `- [ ] Track views/engagement after 7 days\n`;
        guide += `- [ ] Track views/engagement after 30 days\n`;
        guide += `- [ ] Compare to estimates\n\n`;

        return guide;
    }

    // Generate production checklist
    generateProductionChecklist(platform) {
        const checklists = {
            youtube: `- [ ] Write script based on outline\n- [ ] Record screen capture/footage\n- [ ] Edit video\n- [ ] Create thumbnail\n- [ ] Write description with blog link\n- [ ] Add timestamps\n- [ ] Upload and schedule\n`,
            tiktok: `- [ ] Break content into 5 parts\n- [ ] Write hooks for each part\n- [ ] Film all parts\n- [ ] Edit with trending sounds\n- [ ] Add captions\n- [ ] Schedule series\n`,
            instagram: `- [ ] Design 10 slides in Canva\n- [ ] Write caption with storytelling\n- [ ] Add link in bio\n- [ ] Create Stories teaser\n- [ ] Schedule post\n`,
            email: `- [ ] Write email copy\n- [ ] Design email template\n- [ ] Add blog link\n- [ ] Test on mobile\n- [ ] Schedule send\n`,
            podcast: `- [ ] Write talking points\n- [ ] Record episode\n- [ ] Edit audio\n- [ ] Write show notes\n- [ ] Create episode artwork\n- [ ] Upload to podcast host\n`
        };

        return checklists[platform] || '- [ ] Create content\n- [ ] Publish\n';
    }

    // Generate comprehensive report
    generateReport() {
        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalPosts: this.posts.length,
                highPerformingPosts: this.posts.filter(p => p.performanceScore >= CONFIG.minPerformanceScore).length,
                repurposingPlans: this.repurposingPlans.length,
                totalOpportunities: this.repurposingPlans.reduce((sum, plan) => sum + plan.platforms.length, 0),
                platformBreakdown: this.getPlatformBreakdown()
            },
            topOpportunities: this.repurposingPlans.slice(0, 10),
            allPlans: this.repurposingPlans
        };

        // Save JSON report
        const jsonPath = path.join(CONFIG.outputDir, 'content-repurposing-report.json');
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

        // Save readable report
        const readablePath = path.join(CONFIG.outputDir, 'content-repurposing-report.md');
        fs.writeFileSync(readablePath, this.formatReadableReport(report));

        console.log(`✅ Generated reports:`);
        console.log(`   - ${jsonPath}`);
        console.log(`   - ${readablePath}`);

        return report;
    }

    // Get platform breakdown
    getPlatformBreakdown() {
        const breakdown = {};

        CONFIG.platforms.forEach(platform => {
            breakdown[platform] = {
                total: 0,
                highPriority: 0,
                estimatedReach: 0
            };
        });

        this.repurposingPlans.forEach(plan => {
            plan.platforms.forEach(p => {
                breakdown[p.platform].total++;
                if (p.priority === 'high') breakdown[p.platform].highPriority++;
                breakdown[p.platform].estimatedReach += p.estimatedReach;
            });
        });

        return breakdown;
    }

    // Format readable report
    formatReadableReport(report) {
        let output = `# Content Repurposing Report\n\n`;
        output += `Generated: ${new Date(report.generatedAt).toLocaleString()}\n\n`;

        // Summary
        output += `## 📊 Summary\n\n`;
        output += `- **Total Posts Analyzed:** ${report.summary.totalPosts}\n`;
        output += `- **High-Performing Posts:** ${report.summary.highPerformingPosts}\n`;
        output += `- **Repurposing Plans Created:** ${report.summary.repurposingPlans}\n`;
        output += `- **Total Opportunities:** ${report.summary.totalOpportunities}\n\n`;

        // Platform breakdown
        output += `## 📱 Platform Breakdown\n\n`;
        output += `| Platform | Total Opportunities | High Priority | Est. Total Reach |\n`;
        output += `|----------|-------------------|---------------|------------------|\n`;
        Object.entries(report.summary.platformBreakdown).forEach(([platform, data]) => {
            output += `| ${platform.charAt(0).toUpperCase() + platform.slice(1)} | ${data.total} | ${data.highPriority} | ${data.estimatedReach.toLocaleString()} |\n`;
        });
        output += `\n`;

        // Top opportunities
        output += `## 🔥 Top Repurposing Opportunities\n\n`;
        report.topOpportunities.forEach((plan, i) => {
            output += `### ${i + 1}. ${plan.post.title}\n\n`;
            output += `**Performance Score:** ${plan.post.performanceScore}/100 | **Hub:** ${plan.post.hub}\n\n`;

            plan.platforms.forEach(platform => {
                const emoji = platform.priority === 'high' ? '🔴' : platform.priority === 'medium' ? '🟡' : '🟢';
                output += `${emoji} **${platform.platform.toUpperCase()}** (Score: ${platform.score}/100)\n`;
                output += `- Format: ${platform.format}\n`;
                output += `- Effort: ${platform.effort}\n`;
                output += `- Est. Reach: ${platform.estimatedReach.toLocaleString()}\n`;
                output += `- Guide: \`content-repurposing/${plan.post.filename.replace('.md', '')}/${platform.platform}-guide.md\`\n\n`;
            });
        });

        output += `---\n\n`;
        output += `*Detailed repurposing guides available in \`${CONFIG.repurposingDir}\`*\n`;

        return output;
    }

    // Run full analysis
    run() {
        console.log('🚀 Starting Content Repurposing Analysis...\n');

        this.loadPosts();
        this.generateRepurposingPlans();
        this.generateRepurposingGuides();
        const report = this.generateReport();

        console.log('\n✅ Content Repurposing Analysis Complete!');
        console.log(`\n📋 Next Steps:`);
        console.log(`   1. Review ${CONFIG.outputDir}/content-repurposing-report.md`);
        console.log(`   2. Check repurposing guides in ${CONFIG.repurposingDir}`);
        console.log(`   3. Start with ${report.summary.platformBreakdown.youtube?.highPriority || 0} high-priority YouTube opportunities`);

        return report;
    }
}

// Run if called directly
if (require.main === module) {
    const repurposer = new ContentRepurposer();
    repurposer.run();
}

module.exports = ContentRepurposer;
